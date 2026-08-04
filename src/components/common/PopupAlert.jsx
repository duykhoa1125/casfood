import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, HelpCircle, X } from 'lucide-react';

export default function PopupAlert({
  isOpen,
  type = 'warning', // 'warning' | 'error' | 'success' | 'info' | 'confirm'
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm' || !!cancelText;

  let icon = <AlertTriangle size={32} style={{ color: '#f59e0b' }} />;
  let badgeBg = 'rgba(245, 158, 11, 0.15)';
  let borderColor = 'rgba(245, 158, 11, 0.3)';
  let defaultTitle = 'Thông báo';

  if (type === 'error') {
    icon = <XCircle size={32} style={{ color: '#ef4444' }} />;
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    defaultTitle = 'Có lỗi xảy ra';
  } else if (type === 'success') {
    icon = <CheckCircle size={32} style={{ color: '#10b981' }} />;
    badgeBg = 'rgba(16, 185, 129, 0.15)';
    borderColor = 'rgba(16, 185, 129, 0.3)';
    defaultTitle = 'Thành công!';
  } else if (type === 'info') {
    icon = <Info size={32} style={{ color: '#3b82f6' }} />;
    badgeBg = 'rgba(59, 130, 246, 0.15)';
    borderColor = 'rgba(59, 130, 246, 0.3)';
    defaultTitle = 'Thông báo';
  } else if (type === 'confirm') {
    icon = <HelpCircle size={32} style={{ color: '#8b5cf6' }} />;
    badgeBg = 'rgba(139, 92, 246, 0.15)';
    borderColor = 'rgba(139, 92, 246, 0.3)';
    defaultTitle = 'Xác nhận hành động';
  } else if (type === 'warning') {
    defaultTitle = 'Cảnh báo';
  }

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-card" onClick={e => e.stopPropagation()}>
        <button className="popup-close-btn" onClick={onClose} aria-label="Đóng">
          <X size={16} />
        </button>

        <div className="popup-icon-container" style={{ background: badgeBg, border: `1px solid ${borderColor}` }}>
          {icon}
        </div>

        <h3 className="popup-title">{title || defaultTitle}</h3>
        {message && <div className="popup-message">{message}</div>}

        <div className="popup-actions">
          {isConfirm && (
            <button className="btn btn-outline" style={{ flex: 1, padding: '8px 12px' }} onClick={onClose}>
              {cancelText || 'Hủy'}
            </button>
          )}
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, padding: '8px 12px' }} 
            onClick={() => {
              if (onConfirm) onConfirm();
              if (onClose) onClose();
            }}
            autoFocus
          >
            {confirmText || (isConfirm ? 'Đồng ý' : 'Đã hiểu')}
          </button>
        </div>
      </div>
    </div>
  );
}
