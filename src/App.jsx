import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import Header from './components/common/Header';
import UserView from './components/user/UserView';
import OrderDashboard from './components/admin/OrderDashboard';
import MenuScanner from './components/admin/MenuScanner';
import AdminBankModal from './components/admin/AdminBankModal';
import ReportExporter from './components/admin/ReportExporter';
import LandingPage from './pages/LandingPage';
import { fetchSessions, fetchOrders, fetchSession } from './services/api';

// ─────────────────────────────────────────────
// Admin Panel — only accessible via secret slug
// ─────────────────────────────────────────────
function AdminPanel() {
  const { adminSlug } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Verify that the slug matches what was stored on this device
  useEffect(() => {
    const storedSlug = localStorage.getItem('casfood_admin_slug');
    if (storedSlug && storedSlug === adminSlug) {
      setAuthorized(true);
    } else {
      // Wrong / no slug → redirect to landing
      navigate('/', { replace: true });
    }
  }, [adminSlug, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const sessionRes = await fetchSessions(adminSlug);
      if (sessionRes.success && sessionRes.sessions && sessionRes.sessions.length > 0) {
        const activeSess = sessionRes.sessions[0];
        const detailRes = await fetchSession(activeSess.id);
        if (detailRes.success) {
          setSession(detailRes.session);
          setSettings(detailRes.settings);
          const ordersRes = await fetchOrders(activeSess.id);
          if (ordersRes.success) setOrders(ordersRes.orders);
        }
      } else {
        setSession(null);
        setOrders([]);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authorized) return;
    loadData();
    const interval = setInterval(() => {
      if (session?.id) {
        fetchOrders(session.id)
          .then(res => { if (res.success) setOrders(res.orders); })
          .catch(console.error);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [authorized, session?.id]);

  const handleSessionCreated = (newSession) => {
    setSession(newSession);
    setOrders([]);
  };

  const handleResetSession = () => {
    setSession(null);
    setOrders([]);
  };

  if (!authorized) return null;

  return (
    <div className="app-container">
      <Header
        session={session}
        isAdminView={true}
        adminSlug={adminSlug}
        onOpenBankModal={() => setShowBankModal(true)}
      />

      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
          Đang tải dữ liệu phiên gom đơn...
        </div>
      ) : (
        <main>
          <div className="admin-grid">
            {/* Left: Menu Paste + Report Copy */}
            <div>
              <MenuScanner
                session={session}
                onSessionCreated={handleSessionCreated}
                onSessionUpdated={(updatedSession) => setSession(updatedSession)}
                settings={settings}
              />
              {session && <ReportExporter session={session} orders={orders} />}
            </div>

            {/* Right: Order Table */}
            <div>
              {session ? (
                <OrderDashboard
                  session={session}
                  orders={orders}
                  onRefresh={loadData}
                  onResetSession={handleResetSession}
                />
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Chưa có phiên gom đơn nào đang mở.<br />
                  Hãy dán menu ở khung bên trái để bắt đầu!
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {showBankModal && (
        <AdminBankModal
          settings={settings}
          onClose={() => setShowBankModal(false)}
          onSaveSuccess={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// User Order View — accessible via shared link
// ─────────────────────────────────────────────
function OrderPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await fetchSession(sessionId);
      if (res.success) {
        setSession(res.session);
        setSettings(res.settings);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="app-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', marginTop: '40px' }}>
          Đang tải thực đơn...
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app-container">
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', marginTop: '40px' }}>
          <p style={{ fontSize: '24px', marginBottom: '8px' }}>😕</p>
          <p style={{ fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>Không tìm thấy phiên đặt món</p>
          <p style={{ fontSize: '12px' }}>Link có thể đã hết hạn hoặc không tồn tại. Liên hệ người gom đơn để lấy link mới.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header
        session={session}
        isAdminView={false}
        adminSlug={null}
      />
      <main>
        <UserView
          session={session}
          settings={settings}
          onOrderPlaced={loadData}
        />
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// Root App
// ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing page — role selector */}
        <Route path="/" element={<LandingPage />} />

        {/* Secret admin panel, only visible if you know your slug */}
        <Route path="/panel/:adminSlug" element={<AdminPanel />} />

        {/* Order page — shared with colleagues */}
        <Route path="/order/:sessionId" element={<OrderPage />} />

        {/* Legacy /admin redirect → landing */}
        <Route path="/admin" element={<Navigate to="/" replace />} />

        {/* Catch-all → landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
