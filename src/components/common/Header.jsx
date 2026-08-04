import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, QrCode, Settings, Share2, Sun, Moon, LogOut } from 'lucide-react';
import PopupAlert from './PopupAlert';

export default function Header({ session, isAdminView, adminSlug, onOpenBankModal }) {
  const navigate = useNavigate();
  const isClosed = session?.status === 'CLOSED';

  // Dark / Light Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('casfood_theme') || 'dark');

  // Popup Alert State
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
  const showPopup = (opts) => setPopup({ isOpen: true, type: 'info', ...opts });
  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('casfood_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const copySessionLink = () => {
    const sessionId = session?.id;
    if (!sessionId) {
      showPopup({
        type: 'warning',
        title: 'Chưa có phiên gom đơn',
        message: 'Hãy dán menu để mở phiên trước khi gửi link nhé!'
      });
      return;
    }
    const url = `${window.location.origin}/order/${sessionId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    showPopup({
      type: 'success',
      title: 'Đã sao chép đường link!',
      message: `Đường link đặt món cho đồng nghiệp:\n${url}`
    });
  };

  const handleLogout = () => {
    showPopup({
      type: 'confirm',
      title: 'Đổi người gom đơn?',
      message: 'Xóa phiên đăng nhập hiện tại để người khác có thể tạo phòng mới từ trang chủ?',
      confirmText: 'Đồng ý',
      cancelText: 'Hủy',
      onConfirm: () => {
        localStorage.removeItem('casfood_admin_slug');
        localStorage.removeItem('casfood_admin_name');
        navigate('/', { replace: true });
      }
    });
  };

  return (
    <header className="header">
      <div
        className="logo cursor-pointer"
        onClick={() => {
          if (isAdminView) {
            navigate(`/panel/${adminSlug}`);
          } else {
            navigate('/');
          }
        }}
      >
        <Utensils size={20} style={{ color: 'var(--text-main)' }} />
        <span>CasFood</span>
        <span className="logo-badge">{isAdminView ? 'GOM ĐƠN' : 'ĐẶT MÓN'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {session && (
          <span className={`status-badge ${isClosed ? 'status-closed' : 'status-open'}`}>
            {isClosed ? '🔴 Đã đóng' : '🟢 Đang nhận đơn'}
          </span>
        )}

        <button
          className="btn btn-outline btn-sm"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {isAdminView && onOpenBankModal && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenBankModal}
            title="Cài đặt QR Ngân Hàng nhận tiền"
          >
            <Settings size={14} />
            <QrCode size={14} />
          </button>
        )}

        <button
          className="btn btn-primary btn-sm"
          onClick={copySessionLink}
          title="Sao chép link đặt món cho đồng nghiệp"
        >
          <Share2 size={14} />
          <span className="hide-mobile">Gửi Link</span>
        </button>

        {isAdminView && (
          <button
            className="btn btn-outline btn-sm"
            onClick={handleLogout}
            title="Về trang chọn vai trò"
          >
            <LogOut size={14} />
          </button>
        )}
      </div>

      <PopupAlert {...popup} onClose={closePopup} />
    </header>
  );
}
