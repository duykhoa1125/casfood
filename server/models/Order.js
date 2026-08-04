import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userName: { type: String, required: true },
  items: { type: Array, required: true },
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, default: "PENDING" },
  notes: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
