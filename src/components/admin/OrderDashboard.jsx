import React, { useState } from 'react';
import { Lock, LockOpen, ShoppingBag, Trash, ArrowsClockwise, PlusCircle, MagnifyingGlass, CurrencyCircleDollar, CheckCircle, Clock } from '@phosphor-icons/react';
import { toggleSessionStatus, toggleOrderPayment, deleteOrder, deleteSession } from '../../services/api';
import PopupAlert from '../common/PopupAlert';

export default function OrderDashboard({ session, orders, onRefresh, onResetSession }) {
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
  const [searchTerm, setSearchTerm] = useState('');

  const showPopup = (opts) => setPopup({ isOpen: true, type: 'info', ...opts });
  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  if (!session) return null;

  const isClosed = session.status === 'CLOSED';

  const handleToggleSession = async () => {
    try {
      const newStatus = isClosed ? 'OPEN' : 'CLOSED';
      const res = await toggleSessionStatus(session.id, newStatus);
      if (res.success) {
        onRefresh();
      }
    } catch (err) {
      showPopup({ type: 'error', title: 'Lỗi đổi trạng thái', message: err.message });
    }
  };

  const handleTogglePayment = async (orderId, currentStatus) => {
    try {
      const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
      await toggleOrderPayment(orderId, nextStatus);
      onRefresh();
    } catch (err) {
      showPopup({ type: 'error', title: 'Lỗi cập nhật thanh toán', message: err.message });
    }
  };

  const handleDeleteOrder = (orderId, userName) => {
    showPopup({
      type: 'confirm',
      title: 'Xóa đơn đặt món',
      message: `Bạn có chắc chắn muốn xóa đơn đặt món của "${userName}" không?`,
      confirmText: 'Xóa đơn',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          const res = await deleteOrder(orderId);
          if (res.success) {
            onRefresh();
          } else {
            showPopup({ type: 'error', title: 'Lỗi xóa đơn', message: res.message });
          }
        } catch (err) {
          showPopup({ type: 'error', title: 'Lỗi xóa đơn', message: err.message });
        }
      }
    });
  };

  const handleResetNewSession = () => {
    showPopup({
      type: 'confirm',
      title: 'Xác nhận tạo phiên mới',
      message: 'Bạn có chắc chắn muốn kết thúc phiên đặt cơm hôm nay để TẠO PHIÊN MỚI không?\n\nToàn bộ danh sách đơn đặt món cũ sẽ được làm sạch.',
      confirmText: 'Kết thúc & Tạo mới',
      cancelText: 'Hủy',
      onConfirm: async () => {
        try {
          await deleteSession(session.id);
          showPopup({
            type: 'success',
            title: 'Tạo phiên mới thành công',
            message: 'Đã làm sạch phiên cũ! Bây giờ bạn có thể dán menu mới để mở phiên gom đơn tiếp theo.'
          });
          if (onResetSession) onResetSession();
        } catch (err) {
          showPopup({ type: 'error', title: 'Lỗi tạo phiên mới', message: err.message });
        }
      }
    });
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const paidAmount = orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingAmount = totalRevenue - paidAmount;
  const paidCount = orders.filter(o => o.paymentStatus === 'PAID').length;

  const filteredOrders = orders.filter(o => 
    o.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      {/* Session Title & Action Bar */}
      <div className="glass-card" style={{ marginBottom: '12px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '16px', fontWeight: '800' }}>
              {session.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              📍 {session.restaurantName} • Mã phiên: <code style={{ color: 'var(--text-main)' }}>{session.id}</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={onRefresh}>
              <ArrowsClockwise size={14} weight="bold" /> Làm mới
            </button>

            <button 
              className={`btn btn-sm ${isClosed ? 'btn-success' : 'btn-outline'}`}
              onClick={handleToggleSession}
            >
              {isClosed ? <LockOpen size={14} weight="bold" /> : <Lock size={14} weight="bold" />}
              {isClosed ? 'Mở Nhận Đơn' : 'Đóng Phiên'}
            </button>

            <button className="btn btn-primary btn-sm" onClick={handleResetNewSession} title="Tạo phiên mới hoàn toàn">
              <PlusCircle size={14} weight="bold" />
              Tạo Phiên Mới
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <div style={{ background: 'var(--input-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CurrencyCircleDollar size={14} weight="bold" /> Tổng tiền cơm
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {totalRevenue.toLocaleString('vi-VN')}đ
            </div>
          </div>

          <div style={{ background: 'var(--input-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} weight="bold" /> Đã thu ({paidCount})
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '2px' }}>
              {paidAmount.toLocaleString('vi-VN')}đ
            </div>
          </div>

          <div style={{ background: 'var(--input-bg)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--accent-orange)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} weight="bold" /> Còn thiếu ({orders.length - paidCount})
            </div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-orange)', marginTop: '2px' }}>
              {pendingAmount.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card">
        <div className="flex-between" style={{ marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '14px', fontWeight: '700' }}>
            Bảng Đơn Hàng ({orders.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass size={14} weight="bold" style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text"
                className="input-field"
                placeholder="Tìm tên đồng nghiệp..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '28px', fontSize: '11px', width: '160px' }}
              />
            </div>
            <span className="status-badge status-open">
              {paidCount}/{orders.length} Đã CK
            </span>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
            <ShoppingBag size={40} weight="duotone" style={{ opacity: 0.3, marginBottom: '6px' }} />
            <p style={{ fontSize: '13px', fontWeight: '600' }}>Chưa có đơn hàng phù hợp</p>
            <p style={{ fontSize: '11px', marginTop: '2px' }}>Chia sẻ link cho đồng nghiệp để nhận đơn mới nhé!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', height: '34px' }}>
                  <th style={{ padding: '6px 8px', width: '36px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '6px 8px' }}>Đồng Nghiệp</th>
                  <th style={{ padding: '6px 8px' }}>Món Đặt</th>
                  <th style={{ padding: '6px 8px' }}>Tổng Tiền</th>
                  <th style={{ padding: '6px 8px' }}>Trạng Thái</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, index) => (
                  <tr key={o.id} className="table-row">
                    <td style={{ padding: '6px 8px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {o.userName}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {o.items.map((it, idx) => (
                        <div key={idx} style={{ fontSize: '12px', color: 'var(--text-main)', marginBottom: '2px' }}>
                          <span style={{ fontWeight: '700' }}>{it.quantity}x</span> {it.name}
                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
                              ({it.selectedOptions.map(op => op.choice).join(', ')})
                            </span>
                          )}
                          {it.notes && it.notes.trim() && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic', paddingLeft: '12px' }}>
                              📝 {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: '800', color: 'var(--accent-green)' }}>
                      {o.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      <span className={`status-badge ${o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                        {o.paymentStatus === 'PAID' ? 'Đã CK' : 'Chưa CK'}
                      </span>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <button 
                          className={`btn btn-sm ${o.paymentStatus === 'PAID' ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleTogglePayment(o.id, o.paymentStatus)}
                        >
                          {o.paymentStatus === 'PAID' ? 'Sửa Chưa CK' : 'Đã CK'}
                        </button>
                        <button 
                          className="btn btn-outline btn-sm text-red"
                          onClick={() => handleDeleteOrder(o.id, o.userName)}
                          title="Xóa đơn này"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
