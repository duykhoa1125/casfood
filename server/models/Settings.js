import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'admin_settings', unique: true },
  qrImage: { type: String, default: "" },
  deepseekApiKey: { type: String, default: "" }
}, {
  timestamps: true
});

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
