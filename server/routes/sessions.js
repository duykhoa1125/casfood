import express from 'express';
import Session from '../models/Session.js';
import Settings from '../models/Settings.js';
import Order from '../models/Order.js';

const router = express.Router();

// GET all sessions or filter by adminSlug
router.get('/', async (req, res) => {
  try {
    const { adminSlug } = req.query;
    const filter = adminSlug ? { adminSlug } : {};
    const sessions = await Session.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách phiên: ' + err.message });
  }
});

// GET single session by ID (Public for order participants)
router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id }).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên đặt hàng" });
    }
    let settings = await Settings.findOne({ key: 'admin_settings' }).lean();
    if (!settings) {
      settings = { qrImage: "", deepseekApiKey: "" };
    }
    const { adminSlug, ...publicSession } = session;
    res.json({ success: true, session: publicSession, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tải chi tiết phiên: ' + err.message });
  }
});

// CREATE new session
router.post('/', async (req, res) => {
  try {
    const { title, restaurantName, menuData, attachedImages, adminSlug, adminName } = req.body;
    
    const newSession = {
      id: 'lunch-' + Math.random().toString(36).substring(2, 8),
      adminSlug: adminSlug || null,
      adminName: adminName || null,
      title: title || "Gom Đơn Đặt Trưa",
      restaurantName: restaurantName || "Nhà hàng / Quán ăn",
      status: "OPEN",
      createdAt: new Date(),
      menuData: menuData || [],
      attachedImages: attachedImages || []
    };

    const createdSession = await Session.create(newSession);
    res.json({ success: true, session: createdSession });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo phiên đặt hàng: ' + err.message });
  }
});

// UPDATE session (menu items, title, status, attachedImages)
router.put('/:id', async (req, res) => {
  try {
    const { id, _id, ...updateFields } = req.body;
    
    const updatedSession = await Session.findOneAndUpdate(
      { id: req.params.id },
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!updatedSession) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên" });
    }

    res.json({ success: true, session: updatedSession });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật phiên: ' + err.message });
  }
});

// TOGGLE status (OPEN / CLOSED)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const session = await Session.findOne({ id: req.params.id });

    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên" });
    }

    session.status = status || (session.status === 'OPEN' ? 'CLOSED' : 'OPEN');
    await session.save();

    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi chuyển trạng thái: ' + err.message });
  }
});

// DELETE session
router.delete('/:id', async (req, res) => {
  try {
    await Session.deleteOne({ id: req.params.id });
    await Order.deleteMany({ sessionId: req.params.id });
    res.json({ success: true, message: "Đã xóa phiên thành công" });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi xóa phiên: ' + err.message });
  }
});

export default router;
