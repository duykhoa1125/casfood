import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Utensils, QrCode, Settings, Share2, Shield, Sun, Moon, LogOut } from 'lucide-react';

export default function Header({ session, isAdminView, adminSlug, onOpenBankModal }) {
  const navigate = useNavigate();
  const isClosed = session?.status === 'CLOSED';

  // Dark / Light Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('casfood_theme') || 'dark');

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
      alert('Chưa có phiên gom đơn nào. Hãy tạo phiên trước!');
      return;
    }
    const url = `${window.location.origin}/order/${sessionId}`;
    navigator.clipboard.writeText(url).catch(() => {});
    alert('✅ Đã sao chép link đặt món cho đồng nghiệp:\n' + url);
  };

  const handleLogout = () => {
    const choice = confirm('Đổi người gom đơn?\n\n→ Bấm OK: Xóa phiên hiện tại, người khác có thể tạo phòng mới từ trang chủ.\n→ Bấm Hủy: Giữ nguyên.');
    if (choice) {
      localStorage.removeItem('casfood_admin_slug');
      localStorage.removeItem('casfood_admin_name');
      navigate('/', { replace: true });
    }
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
    </header>
  );
}
