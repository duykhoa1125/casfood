import express from 'express';
import { readDb, writeDb } from '../store/db.js';

const router = express.Router();

// GET all sessions or filter by adminSlug
router.get('/', (req, res) => {
  const db = readDb();
  const { adminSlug } = req.query;
  let sessions = db.sessions || [];
  
  if (adminSlug) {
    sessions = sessions.filter(s => s.adminSlug === adminSlug);
  }
  
  res.json({ success: true, sessions });
});

// GET single session by ID (Public for order participants)
router.get('/:id', (req, res) => {
  const db = readDb();
  const session = db.sessions.find(s => s.id === req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, message: "Không tìm thấy phiên đặt hàng" });
  }
  // Strip secret adminSlug so users cannot inspect F12 Network to find admin panel
  const { adminSlug, ...publicSession } = session;
  res.json({ success: true, session: publicSession, settings: db.settings });
});

// CREATE new session
router.post('/', (req, res) => {
  const { title, restaurantName, menuData, attachedImages, adminSlug, adminName } = req.body;
  const db = readDb();
  
  const newSession = {
    id: 'lunch-' + Math.random().toString(36).substring(2, 8),
    adminSlug: adminSlug || null,
    adminName: adminName || null,
    title: title || "Gom Đơn Đặt Trưa",
    restaurantName: restaurantName || "Nhà hàng / Quán ăn",
    status: "OPEN",
    createdAt: new Date().toISOString(),
    menuData: menuData || [],
    attachedImages: attachedImages || []
  };

  db.sessions.unshift(newSession);
  writeDb(db);

  res.json({ success: true, session: newSession });
});

// UPDATE session (menu items, title, status, attachedImages)
router.put('/:id', (req, res) => {
  const db = readDb();
  const index = db.sessions.findIndex(s => s.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: "Không tìm thấy phiên" });
  }

  const updatedSession = {
    ...db.sessions[index],
    ...req.body,
    id: db.sessions[index].idPreserve // Preserve ID
  };

  db.sessions[index] = updatedSession;
  writeDb(db);

  res.json({ success: true, session: updatedSession });
});

// TOGGLE status (OPEN / CLOSED)
router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const db = readDb();
  const session = db.sessions.find(s => s.id === req.params.id);

  if (!session) {
    return res.status(404).json({ success: false, message: "Không tìm thấy phiên" });
  }

  session.status = status || (session.status === 'OPEN' ? 'CLOSED' : 'OPEN');
  writeDb(db);

  res.json({ success: true, session });
});

// DELETE session
router.delete('/:id', (req, res) => {
  const db = readDb();
  db.sessions = db.sessions.filter(s => s.id !== req.params.id);
  db.orders = db.orders.filter(o => o.sessionId !== req.params.id);
  writeDb(db);
  res.json({ success: true, message: "Đã xóa phiên thành công" });
});

export default router;
