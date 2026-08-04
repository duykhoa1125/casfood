import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShieldCheck, Users, ChevronRight, LogIn, ArrowLeft } from 'lucide-react';

function generateAdminSlug() {
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('role'); // 'role' | 'name' | 'join'
  const [adminName, setAdminName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  // If user already has a stored admin slug → redirect straight to their panel
  useEffect(() => {
    const storedSlug = localStorage.getItem('casfood_admin_slug');
    if (storedSlug) {
      navigate(`/panel/${storedSlug}`, { replace: true });
    }
  }, [navigate]);

  const handleSelectAdmin = () => {
    setStep('name');
  };

  const handleConfirmAdmin = () => {
    if (!adminName.trim()) return;

    const slug = generateAdminSlug();
    localStorage.setItem('casfood_admin_slug', slug);
    localStorage.setItem('casfood_admin_name', adminName.trim());

    navigate(`/panel/${slug}`);
  };

  const handleJoinOrder = () => {
    if (!joinCode.trim()) return;

    // Smartly extract session ID if user pasted a full URL (e.g. http://domain.com/order/lunch-12345)
    let code = joinCode.trim();
    if (code.includes('/order/')) {
      code = code.split('/order/')[1].split('?')[0].split('/')[0];
    }

    if (code) {
      navigate(`/order/${code}`);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-dark)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Utensils size={28} style={{ color: 'var(--text-main)' }} />
            <span style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>CasFood</span>
            <span style={{
              background: 'var(--badge-bg)',
              color: 'var(--text-main)',
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>LUNCH</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Hệ thống gom đặt cơm trưa văn phòng</p>
        </div>

        {/* Role Selection */}
        {step === 'role' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <h2 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', marginBottom: '6px', textAlign: 'center' }}>
              Bạn là ai hôm nay?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', marginBottom: '20px' }}>
              Chọn vai trò để bắt đầu
            </p>

            {/* Admin Role */}
            <button
              onClick={handleSelectAdmin}
              style={{
                width: '100%',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                border: '1px solid var(--btn-primary-bg)',
                borderRadius: '6px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                marginBottom: '10px',
                transition: 'opacity 0.15s ease',
                boxSizing: 'border-box'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <ShieldCheck size={22} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px' }}>Tôi là người gom đơn hôm nay</div>
                <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>Tạo phòng mới, dán menu, chia link</div>
              </div>
              <ChevronRight size={16} />
            </button>

            {/* Colleague Role - Interactive */}
            <button
              onClick={() => setStep('join')}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '14px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                boxSizing: 'border-box',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'var(--bg-card-hover)';
                e.currentTarget.style.borderColor = 'var(--text-muted)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'var(--bg-card)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <Users size={22} style={{ color: 'var(--text-main)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>Tôi là người đặt món</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Nhập mã phòng hoặc dán link gom đơn để đặt
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        )}

        {/* Admin Name Input */}
        {step === 'name' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <button
              onClick={() => setStep('role')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={13} /> Quay lại
            </button>

            <h2 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
              Nhập tên của bạn
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '16px' }}>
              Tên này sẽ hiển thị với đồng nghiệp khi họ thấy ai là người gom đơn.
            </p>

            <div className="form-group">
              <label className="form-label">Tên người gom đơn</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: Nguyễn Minh Khoa"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmAdmin()}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '8px' }}
              onClick={handleConfirmAdmin}
              disabled={!adminName.trim()}
            >
              <ShieldCheck size={14} /> Tạo Phòng Gom Đơn Mới
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', marginTop: '12px' }}>
              🔒 Trang quản lý của bạn sẽ có địa chỉ ngẫu nhiên, chỉ bạn biết.
            </p>
          </div>
        )}

        {/* User Join Order Input */}
        {step === 'join' && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <button
              onClick={() => setStep('role')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={13} /> Quay lại
            </button>

            <h2 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
              Vào phòng đặt món
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '16px' }}>
              Nhập <strong>Mã phòng</strong> (Ví dụ: <code>demo-lunch</code>) hoặc dán toàn bộ đường link do người gom đơn chia sẻ.
            </p>

            <div className="form-group">
              <label className="form-label">Mã phòng / Đường link gom đơn</label>
              <input
                type="text"
                className="input-field"
                placeholder="Nhập mã phòng hoặc dán link vào đây..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinOrder()}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '8px' }}
              onClick={handleJoinOrder}
              disabled={!joinCode.trim()}
            >
              <LogIn size={14} /> Vào Phòng Đặt Món
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', marginTop: '12px' }}>
              💡 Mẹo: Bạn có thể nhấp trực tiếp vào đường link mà đồng nghiệp gửi trong Zalo/Teams để vào nhanh hơn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

