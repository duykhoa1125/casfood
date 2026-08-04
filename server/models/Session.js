import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  adminSlug: { type: String, default: null, index: true },
  adminName: { type: String, default: null },
  title: { type: String, default: "Gom Đơn Đặt Trưa" },
  restaurantName: { type: String, default: "Nhà hàng / Quán ăn" },
  status: { type: String, default: "OPEN" },
  isMixMenu: { type: Boolean, default: false },
  mixRules: { type: Object, default: null },
  menuData: { type: Array, default: [] },
  attachedImages: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
