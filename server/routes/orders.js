import express from 'express';
import Order from '../models/Order.js';
import Session from '../models/Session.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// GET all orders for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const sessionOrders = await Order.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, orders: sessionOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn: ' + err.message });
  }
});

// SUBMIT new order by a colleague
router.post('/session/:sessionId', async (req, res) => {
  try {
    const { userName, items, notes } = req.body;
    const { sessionId } = req.params;

    if (!userName || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên và chọn ít nhất 1 món" });
    }

    const session = await Session.findOne({ id: sessionId }).lean();

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
      createdAt: new Date()
    };

    const createdOrder = await Order.create(newOrder);

    let settings = await Settings.findOne({ key: 'admin_settings' }).lean();
    if (!settings) {
      settings = { qrImage: "", deepseekApiKey: "" };
    }

    res.json({
      success: true,
      order: createdOrder,
      adminBank: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi gửi đơn đặt món: ' + err.message });
  }
});

// TOGGLE payment status manually by Admin
router.patch('/:orderId/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findOne({ id: req.params.orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    order.paymentStatus = paymentStatus || (order.paymentStatus === 'PAID' ? 'PENDING' : 'PAID');
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật thanh toán: ' + err.message });
  }
});

// DELETE an order
router.delete('/:orderId', async (req, res) => {
  try {
    await Order.deleteOne({ id: req.params.orderId });
    res.json({ success: true, message: "Đã xóa đơn thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa đơn: ' + err.message });
  }
});

// UPDATE Admin Settings (Mã QR nhận tiền Admin & DeepSeek Key)
router.post('/admin/settings', async (req, res) => {
  try {
    const { qrImage, deepseekApiKey } = req.body;
    let settings = await Settings.findOne({ key: 'admin_settings' });

    if (!settings) {
      settings = new Settings({ key: 'admin_settings' });
    }

    if (qrImage !== undefined) settings.qrImage = qrImage;
    if (deepseekApiKey !== undefined) settings.deepseekApiKey = deepseekApiKey;

    await settings.save();
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi lưu cài đặt Admin: ' + err.message });
  }
});

export default router;
