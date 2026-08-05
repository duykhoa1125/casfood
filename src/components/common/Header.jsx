import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, QrCode, Share2, Sun, Moon, LogOut, Check } from 'lucide-react';
import PopupAlert from './PopupAlert';

export default function Header({ session, isAdminView, adminSlug, onOpenBankModal }) {
  const navigate = useNavigate();
  const isClosed = session?.status === 'CLOSED';
  const [copied, setCopied] = useState(false);

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
        message: 'Hãy dán menu để mở phiên gom đơn trước khi gửi link cho đồng nghiệp nhé!'
      });
      return;
    }
    const url = `${window.location.origin}/order/${sessionId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});

    showPopup({
      type: 'success',
      title: 'Đã sao chép đường link!',
      message: `Link đặt món cho đồng nghiệp:\n${url}`
    });
  };

  const handleLogout = () => {
    showPopup({
      type: 'confirm',
      title: 'Đổi người gom đơn?',
      message: 'Xóa phiên làm việc hiện tại để trở về trang chọn vai trò?',
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
        className="logo"
        onClick={() => {
          if (isAdminView) {
            navigate(`/panel/${adminSlug}`);
          } else {
            navigate('/');
          }
        }}
      >
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: 'var(--radius-xs)',
          background: 'var(--btn-primary-bg)',
          color: 'var(--btn-primary-text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Utensils size={16} />
        </div>
        <span style={{ fontWeight: '800', letterSpacing: '-0.3px' }}>CasFood</span>
        <span className="logo-badge">{isAdminView ? 'QUẢN LÝ' : 'ĐẶT MÓN'}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {session && (
          <span className={`status-badge ${isClosed ? 'status-closed' : 'status-open'}`}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isClosed ? '#ef4444' : 'var(--accent-green)' }}></span>
            {isClosed ? 'Đã chốt đơn' : 'Đang nhận đơn'}
          </span>
        )}

        {/* Theme Toggle Button */}
        <button
          className="btn btn-outline btn-sm btn-icon-only"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Chuyển giao diện Sáng' : 'Chuyển giao diện Tối'}
          style={{ borderRadius: 'var(--radius-sm)' }}
        >
          {theme === 'dark' ? <Sun size={15} style={{ color: 'var(--accent-orange)' }} /> : <Moon size={15} style={{ color: 'var(--accent-color)' }} />}
        </button>

        {/* QR Bank Settings (Admin) */}
        {isAdminView && onOpenBankModal && (
          <button
            className="btn btn-outline btn-sm"
            onClick={onOpenBankModal}
            title="Cài đặt QR Chuyển Khoản Ngân Hàng"
            style={{ gap: '5px' }}
          >
            <QrCode size={15} />
            <span className="hide-mobile" style={{ fontSize: '11px' }}>QR Ngân Hàng</span>
          </button>
        )}

        {/* Share Link Button */}
        <button
          className="btn btn-primary btn-sm"
          onClick={copySessionLink}
          title="Sao chép link gửi đồng nghiệp"
          style={{ gap: '5px' }}
        >
          {copied ? <Check size={15} /> : <Share2 size={15} />}
          <span style={{ fontSize: '11px', fontWeight: '700' }}>
            {copied ? 'Đã sao chép' : 'Gửi Link'}
          </span>
        </button>

        {/* Logout (Admin) */}
        {isAdminView && (
          <button
            className="btn btn-ghost btn-sm btn-icon-only"
            onClick={handleLogout}
            title="Đổi vai trò người gom đơn"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>

      <PopupAlert {...popup} onClose={closePopup} />
    </header>
  );
}
