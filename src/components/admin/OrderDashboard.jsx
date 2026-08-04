import React, { useState } from 'react';
import { Lock, Unlock, ShoppingBag, Trash2, RefreshCw, PlusCircle } from 'lucide-react';
import { toggleSessionStatus, toggleOrderPayment, deleteOrder, deleteSession } from '../../services/api';
import PopupAlert from '../common/PopupAlert';

export default function OrderDashboard({ session, orders, onRefresh, onResetSession }) {
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
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

  return (
    <div>
      {/* Session Title & Action Bar */}
      <div className="glass-card" style={{ marginBottom: '8px', padding: '8px 12px' }}>
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '15px', fontWeight: '700' }}>
              {session.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1px' }}>
              📍 {session.restaurantName} | Mã phiên: <code>{session.id}</code>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={onRefresh} style={{ padding: '3px 6px' }}>
              <RefreshCw size={12} /> Làm mới
            </button>

            <button 
              className={`btn btn-sm ${isClosed ? 'btn-success' : 'btn-outline'}`}
              onClick={handleToggleSession}
              style={{ padding: '3px 6px' }}
            >
              {isClosed ? <Unlock size={12} /> : <Lock size={12} />}
              {isClosed ? 'Mở Nhận Đơn' : 'Đóng Phiên'}
            </button>

            <button className="btn btn-primary btn-sm" onClick={handleResetNewSession} title="Tạo phiên mới hoàn toàn" style={{ padding: '3px 6px' }}>
              <PlusCircle size={12} />
              Tạo Phiên Mới
            </button>
          </div>
        </div>
      </div>

      {/* Integrated Unified Orders & Payment Table */}
      <div className="glass-card">
        <div className="flex-between" style={{ marginBottom: '8px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '13px', fontWeight: '700' }}>
            Bảng Đơn Hàng & Thu Tiền Đồng Nghiệp ({orders.length})
          </h3>

          <span className="status-badge status-open">
            {paidCount}/{orders.length} Đã CK
          </span>
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
            <ShoppingBag size={32} style={{ opacity: 0.4, marginBottom: '6px' }} />
            <p style={{ fontSize: '12px' }}>Chưa có đồng nghiệp nào đặt món trong phiên này.</p>
            <p style={{ fontSize: '11px', marginTop: '2px' }}>Hãy sao chép đường link gửi vào nhóm Zalo/Slack văn phòng!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', height: '30px' }}>
                  <th style={{ padding: '4px 6px', width: '32px', textAlign: 'center' }}>STT</th>
                  <th style={{ padding: '4px 6px' }}>Đồng Nghiệp</th>
                  <th style={{ padding: '4px 6px' }}>Món Đặt</th>
                  <th style={{ padding: '4px 6px' }}>Ghi Chú</th>
                  <th style={{ padding: '4px 6px' }}>Tổng Tiền</th>
                  <th style={{ padding: '4px 6px' }}>Trạng Thái</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, index) => (
                  <tr key={o.id} className="table-row" style={{ height: '40px' }}>
                    <td style={{ padding: '4px 6px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ padding: '4px 6px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {o.userName}
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      {o.items.map((it, idx) => (
                        <div key={idx} style={{ fontSize: '11px', color: 'var(--text-main)', marginBottom: '2px' }}>
                          <span style={{ fontWeight: '700' }}>{it.quantity}x</span> {it.name}
                          {it.selectedOptions && it.selectedOptions.length > 0 && (
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px', marginLeft: '3px' }}>
                              ({it.selectedOptions.map(op => op.choice).join(', ')})
                            </span>
                          )}
                          {it.notes && it.notes.trim() && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '10px', fontStyle: 'italic', paddingLeft: '14px' }}>
                              📝 {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '4px 6px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '11px' }}>
                      {o.notes && o.notes.trim() ? o.notes : '-'}
                    </td>
                    <td style={{ padding: '4px 6px', fontWeight: '700', color: 'var(--text-main)' }}>
                      {o.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td style={{ padding: '4px 6px' }}>
                      <span className={`status-badge ${o.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`} style={{ padding: '1px 5px' }}>
                        {o.paymentStatus === 'PAID' ? 'Đã CK' : 'Chưa CK'}
                      </span>
                    </td>
                    <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                        <button 
                          className={`btn btn-sm ${o.paymentStatus === 'PAID' ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleTogglePayment(o.id, o.paymentStatus)}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          {o.paymentStatus === 'PAID' ? 'Sửa Chưa CK' : 'Đã CK'}
                        </button>
                        <button 
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--text-main)', borderColor: 'var(--border-color)', padding: '2px 4px' }}
                          onClick={() => handleDeleteOrder(o.id, o.userName)}
                          title="Xóa đơn này"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Integrated Table Footer Summary */}
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border-color)', background: 'var(--input-bg)', fontWeight: '700', fontSize: '12px' }}>
                  <td colSpan={4} style={{ padding: '8px 10px', color: 'var(--text-main)' }}>
                    📊 TỔNG CỘNG TIỀN PHIÊN ({orders.length} Đơn)
                  </td>
                  <td style={{ padding: '8px 6px', color: 'var(--text-main)', fontSize: '13px' }}>
                    {totalRevenue.toLocaleString('vi-VN')}đ
                  </td>
                  <td colSpan={2} style={{ padding: '8px 10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    ✅ Đã thu: <strong style={{ color: 'var(--text-main)' }}>{paidAmount.toLocaleString('vi-VN')}đ</strong> | ⏳ Còn thu: <strong style={{ color: 'var(--text-main)' }}>{pendingAmount.toLocaleString('vi-VN')}đ</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
