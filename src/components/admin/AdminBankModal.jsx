import React, { useState } from 'react';
import { X, QrCode, CheckCircle2, Trash2 } from 'lucide-react';
import { updateAdminSettings } from '../../services/api';
import PopupAlert from '../common/PopupAlert';

export default function AdminBankModal({ settings, onClose, onSaveSuccess }) {
  const [qrImage, setQrImage] = useState(settings?.qrImage || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Popup Alert State
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
  const showPopup = (opts) => setPopup({ isOpen: true, type: 'info', ...opts });
  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showPopup({
        type: 'warning',
        title: 'Ảnh quá lớn (> 5MB)',
        message: 'Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn nhé!'
      });
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
      showPopup({
        type: 'error',
        title: 'Lỗi lưu cài đặt',
        message: err.message
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom: '14px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>
            <QrCode size={20} style={{ color: 'var(--accent-green)' }} />
            Mã QR Ngân Hàng Admin
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>
          Đồng nghiệp sẽ thấy mã QR này ngay sau khi bấm chốt đơn để quét chuyển khoản trả tiền cho Admin.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Tải Ảnh QR Chuyển Khoản (Chụp từ App Ngân Hàng)</label>
            <input 
              type="file" 
              accept="image/*" 
              className="input-field" 
              onChange={handleImageUpload}
            />
          </div>

          {/* QR Image Preview */}
          {qrImage ? (
            <div style={{ textAlign: 'center', margin: '14px 0', background: 'var(--input-bg)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Preview Mã QR Nhận Tiền
              </span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img 
                  src={qrImage} 
                  alt="Ảnh QR Admin" 
                  style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#ffffff', padding: '6px' }}
                />
                <button
                  type="button"
                  onClick={() => setQrImage('')}
                  style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Xóa ảnh QR này"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 10px', background: 'var(--input-bg)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', margin: '14px 0', color: 'var(--text-muted)' }}>
              <QrCode size={36} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ fontSize: '12px' }}>Chưa có mã QR ngân hàng</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button 
              type="button" 
              className="btn btn-outline" 
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ flex: 1 }}
              disabled={saving}
            >
              {savedSuccess ? <CheckCircle2 size={14} style={{ color: 'var(--accent-green)' }} /> : null}
              {saving ? 'Đang lưu...' : savedSuccess ? 'Đã lưu!' : 'Lưu Mã QR'}
            </button>
          </div>
        </form>
      </div>

      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
