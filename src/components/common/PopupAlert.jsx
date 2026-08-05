import React from 'react';
import ReactDOM from 'react-dom';
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

  let icon = <AlertTriangle size={28} style={{ color: 'var(--accent-orange)' }} />;
  let badgeBg = 'rgba(249, 115, 22, 0.15)';
  let borderColor = 'rgba(249, 115, 22, 0.3)';
  let defaultTitle = 'Thông báo';

  if (type === 'error') {
    icon = <XCircle size={28} style={{ color: '#ef4444' }} />;
    badgeBg = 'rgba(239, 68, 68, 0.15)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
    defaultTitle = 'Có lỗi xảy ra';
  } else if (type === 'success') {
    icon = <CheckCircle size={28} style={{ color: 'var(--accent-green)' }} />;
    badgeBg = 'rgba(34, 197, 94, 0.15)';
    borderColor = 'rgba(34, 197, 94, 0.3)';
    defaultTitle = 'Thành công!';
  } else if (type === 'info') {
    icon = <Info size={28} style={{ color: 'var(--accent-color)' }} />;
    badgeBg = 'rgba(56, 189, 248, 0.15)';
    borderColor = 'rgba(56, 189, 248, 0.3)';
    defaultTitle = 'Thông báo';
  } else if (type === 'confirm') {
    icon = <HelpCircle size={28} style={{ color: 'var(--accent-purple)' }} />;
    badgeBg = 'rgba(168, 85, 247, 0.15)';
    borderColor = 'rgba(168, 85, 247, 0.3)';
    defaultTitle = 'Xác nhận hành động';
  } else if (type === 'warning') {
    defaultTitle = 'Cảnh báo';
  }

  const popupContent = (
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
            <button className="btn btn-outline btn-lg" style={{ flex: 1 }} onClick={onClose}>
              {cancelText || 'Hủy'}
            </button>
          )}
          <button 
            className="btn btn-primary btn-lg" 
            style={{ flex: 1 }} 
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

  return ReactDOM.createPortal(popupContent, document.body);
}
