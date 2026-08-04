import express from 'express';
import { readDb, writeDb } from '../store/db.js';

const router = express.Router();

// GET all orders for a session
router.get('/session/:sessionId', (req, res) => {
  const db = readDb();
  const sessionOrders = db.orders.filter(o => o.sessionId === req.params.sessionId);
  res.json({ success: true, orders: sessionOrders });
});

// SUBMIT new order by a colleague
router.post('/session/:sessionId', (req, res) => {
  const { userName, items, notes } = req.body;
  const { sessionId } = req.params;

  if (!userName || !items || !items.length) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tên và chọn ít nhất 1 món" });
  }

  const db = readDb();
  const session = db.sessions.find(s => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ success: false, message: "Phiên đặt hàng không tồn tại" });
  }

  if (session.status === 'CLOSED') {
    return res.status(400).json({ success: false, message: "Phiên đặt hàng này đã đóng!" });
  }

  // Calculate order total
  const totalAmount = items.reduce((sum, item) => sum + (item.itemTotal || (item.price * item.quantity)), 0);

  const newOrder = {
    id: 'ord_' + Math.random().toString(36).substring(2, 9),
    sessionId,
    userName: userName.trim(),
    items,
    totalAmount,
    paymentStatus: "PENDING",
    notes: notes || "",
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  writeDb(db);

  res.json({
    success: true,
    order: newOrder,
    adminBank: db.settings
  });
});

// TOGGLE payment status manually by Admin
router.patch('/:orderId/payment', (req, res) => {
  const { paymentStatus } = req.body;
  const db = readDb();
  const order = db.orders.find(o => o.id === req.params.orderId);

  if (!order) {
    return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
  }

  order.paymentStatus = paymentStatus || (order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID');
  writeDb(db);

  res.json({ success: true, order });
});

// DELETE an order
router.delete('/:orderId', (req, res) => {
  const db = readDb();
  db.orders = db.orders.filter(o => o.id !== req.params.orderId);
  writeDb(db);
  res.json({ success: true, message: "Đã xóa đơn thành công" });
});

// UPDATE Admin Settings (Mã QR nhận tiền Admin & DeepSeek Key)
router.post('/admin/settings', (req, res) => {
  const { qrImage, deepseekApiKey } = req.body;
  const db = readDb();
  
  db.settings = {
    ...db.settings,
    qrImage: qrImage !== undefined ? qrImage : db.settings.qrImage,
    deepseekApiKey: deepseekApiKey !== undefined ? deepseekApiKey : db.settings.deepseekApiKey
  };

  writeDb(db);
  res.json({ success: true, settings: db.settings });
});

export default router;
