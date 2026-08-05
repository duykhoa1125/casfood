import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, ShieldCheck, Users, ChevronRight, LogIn, ArrowLeft, Sparkles } from 'lucide-react';

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
      padding: '24px 16px'
    }}>
      <div style={{ width: '100%', maxWidth: '400px', animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Utensils size={22} />
            </div>
            <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>CasFood</span>
            <span className="logo-badge">LUNCH AI</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>
            Hệ thống gom đơn đặt cơm trưa văn phòng thông minh
          </p>
        </div>

        {/* Role Selection */}
        {step === 'role' && (
          <div className="glass-card" style={{ padding: '24px 20px' }}>
            <h2 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '4px', textAlign: 'center' }}>
              Bạn là ai hôm nay?
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>
              Chọn vai trò để tiếp tục sử dụng ứng dụng
            </p>

            {/* Admin Role */}
            <button
              onClick={handleSelectAdmin}
              style={{
                width: '100%',
                background: 'var(--btn-primary-bg)',
                color: 'var(--btn-primary-text)',
                border: '1px solid var(--btn-primary-bg)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
                marginBottom: '12px',
                transition: 'all var(--transition-fast)',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.92'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShieldCheck size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Tôi là người gom đơn</div>
                <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Tạo phòng mới, dán menu AI, chia sẻ link</div>
              </div>
              <ChevronRight size={18} />
            </button>

            {/* Colleague Role */}
            <button
              onClick={() => setStep('join')}
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                textAlign: 'left',
                transition: 'all var(--transition-fast)'
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
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Users size={20} style={{ color: 'var(--text-main)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>Tôi là người đặt món</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Nhập mã phòng hoặc dán link gom đơn
                </div>
              </div>
              <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        )}

        {/* Admin Name Input Step */}
        {step === 'name' && (
          <div className="glass-card" style={{ padding: '24px 20px', animation: 'slideUpFade 0.25s ease' }}>
            <button
              onClick={() => setStep('role')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
            >
              <ArrowLeft size={14} /> Quay lại
            </button>

            <h2 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              Nhập tên người gom đơn
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Tên này giúp đồng nghiệp dễ dàng nhận biết ai đang chủ trì phiên gom trưa nay.
            </p>

            <div className="form-group">
              <label className="form-label">Tên của bạn</label>
              <input
                type="text"
                className="input-field"
                placeholder="Ví dụ: Minh Khoa"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirmAdmin()}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={handleConfirmAdmin}
              disabled={!adminName.trim()}
            >
              <ShieldCheck size={16} /> Tạo Phòng Gom Đơn Mới
            </button>

            <p style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <Sparkles size={13} style={{ color: 'var(--accent-orange)' }} /> Link quản lý riêng tư sẽ tự động được cấp cho bạn
            </p>
          </div>
        )}

        {/* User Join Order Step */}
        {step === 'join' && (
          <div className="glass-card" style={{ padding: '24px 20px', animation: 'slideUpFade 0.25s ease' }}>
            <button
              onClick={() => setStep('role')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
            >
              <ArrowLeft size={14} /> Quay lại
            </button>

            <h2 style={{ color: 'var(--text-main)', fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>
              Vào phòng đặt món
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>
              Nhập mã phiên hoặc dán toàn bộ đường link do người gom đơn chia sẻ.
            </p>

            <div className="form-group">
              <label className="form-label">Mã phiên / Link gom đơn</label>
              <input
                type="text"
                className="input-field"
                placeholder="Dán link hoặc mã phiên..."
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinOrder()}
                autoFocus
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={handleJoinOrder}
              disabled={!joinCode.trim()}
            >
              <LogIn size={16} /> Vào Phòng Đặt Món
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
