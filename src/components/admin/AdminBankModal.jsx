import React, { useState } from 'react';
import { X, QrCode, CheckCircle, Upload, Trash2 } from 'lucide-react';
import { updateAdminSettings } from '../../services/api';

export default function AdminBankModal({ settings, onClose, onSaveSuccess }) {
  const [qrImage, setQrImage] = useState(settings?.qrImage || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateAdminSettings({
        qrImage
      });
      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          onSaveSuccess(res.settings);
          onClose();
        }, 1000);
      }
    } catch (err) {
      alert('Lỗi lưu cài đặt: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: '16px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <QrCode className="text-emerald" size={20} />
            Tải Ảnh Mã QR Nhận Tiền Của Admin
          </h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
          Đồng nghiệp sẽ thấy trực tiếp hình ảnh mã QR ngân hàng này sau khi bấm chốt đơn để quét chuyển tiền trả cho Admin.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tải Ảnh Chụp Mã QR Ngân Hàng (Từ App Ngân Hàng)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="input-field" 
              onChange={handleImageUpload}
            />
          </div>

          {/* QR Image Preview */}
          {qrImage ? (
            <div style={{ textAlign: 'center', margin: '16px 0', background: 'var(--input-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Preview Mã QR Nhận Tiền
              </span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={qrImage} 
                  alt="Ảnh QR Admin" 
                  style={{ width: '180px', height: '180px', objectFit: 'contain', background: '#ffffff', padding: '6px', borderRadius: '6px' }} 
                />
                <button 
                  type="button"
                  className="btn btn-sm" 
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#000000', color: '#ffffff', borderRadius: '50%', padding: '4px', border: '1px solid #ffffff' }}
                  onClick={() => setQrImage('')}
                  title="Xóa ảnh QR này"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 10px', background: 'var(--input-bg)', borderRadius: '6px', border: '2px dashed var(--border-color)', margin: '12px 0', color: 'var(--text-muted)' }}>
              <Upload size={30} style={{ opacity: 0.5, marginBottom: '6px' }} />
              <p style={{ fontSize: '12px' }}>Chưa chọn ảnh QR. Hãy chọn ảnh chụp QR từ điện thoại.</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {savedSuccess ? <CheckCircle size={14} /> : null}
              {saving ? 'Đang lưu...' : savedSuccess ? 'Đã lưu!' : 'Lưu Ảnh QR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
