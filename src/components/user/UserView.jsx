import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Check, Edit2, AlertTriangle, X, Copy, Image, QrCode, Maximize2, ChevronDown, ChevronUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitOrder, fetchSession } from '../../services/api';

export default function UserView({ session: propSession, settings: propSettings, onOrderPlaced }) {
  const { sessionId: routeSessionId } = useParams();
  const [session, setSession] = useState(propSession);
  const [settings, setSettings] = useState(propSettings);

  // Saved User Name in LocalStorage
  const [userName, setUserName] = useState(() => localStorage.getItem('lunch_user_name') || '');
  const [isEditingName, setIsEditingName] = useState(!localStorage.getItem('lunch_user_name'));

  // Cart State
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Option Customization Modal
  const [activeItem, setActiveItem] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalOptions, setModalOptions] = useState({});
  const [modalNotes, setModalNotes] = useState('');

  // Payment QR Success Popup Modal
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  // Lightbox Modal for Attached Images
  const [previewImage, setPreviewImage] = useState(null);
  const [showAdminQrSection, setShowAdminQrSection] = useState(false);

  useEffect(() => {
    if (routeSessionId && routeSessionId !== propSession?.id) {
      fetchSession(routeSessionId).then(res => {
        if (res.success) {
          setSession(res.session);
          setSettings(res.settings);
        }
      }).catch(err => console.error(err));
    } else {
      setSession(propSession);
      setSettings(propSettings);
    }
  }, [routeSessionId, propSession, propSettings]);

  useEffect(() => {
    if (userName) {
      localStorage.setItem('lunch_user_name', userName);
    }
  }, [userName]);

  if (!session) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
        <h2>Đang tải thông tin phiên đặt hàng...</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '11px' }}>Vui lòng đợi trong giây lát.</p>
      </div>
    );
  }

  const isClosed = session.status === 'CLOSED';
  const menuData = session.menuData || [];
  const attachedImages = session.attachedImages || [];
  const qrImage = settings?.qrImage || '';

  // Open item customization modal
  const handleOpenItemModal = (item) => {
    if (isClosed) return;
    setActiveItem(item);
    setModalQuantity(1);
    setModalNotes('');

    const initialOptions = {};
    if (item.options) {
      item.options.forEach(opt => {
        if (opt.choices && opt.choices.length > 0) {
          initialOptions[opt.title] = opt.choices[0];
        }
      });
    }
    setModalOptions(initialOptions);
  };

  // Add item to cart
  const handleAddToCart = () => {
    if (!activeItem) return;

    let optionsPrice = 0;
    const optionSummaries = [];

    Object.entries(modalOptions).forEach(([optTitle, choice]) => {
      if (choice) {
        optionsPrice += (choice.price || 0);
        optionSummaries.push({
          title: optTitle,
          choice: choice.name,
          price: choice.price || 0
        });
      }
    });

    const unitPrice = activeItem.price + optionsPrice;
    const itemTotal = unitPrice * modalQuantity;

    const cartItem = {
      cartId: `cart_${Date.now()}_${Math.random()}`,
      id: activeItem.id,
      name: activeItem.name,
      price: activeItem.price,
      quantity: modalQuantity,
      selectedOptions: optionSummaries,
      notes: modalNotes,
      itemTotal
    };

    setCart([...cart, cartItem]);
    setActiveItem(null);
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (!userName.trim()) {
      alert('Vui lòng nhập tên của bạn để đặt món!');
      setIsEditingName(true);
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng trống! Vui lòng chọn ít nhất 1 món ăn.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitOrder(session.id, {
        userName: userName.trim(),
        items: cart,
        notes: ''
      });

      if (res.success) {
        setPlacedOrder(res.order);
        setCart([]);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        if (onOrderPlaced) onOrderPlaced();
      } else {
        alert('Lỗi đặt món: ' + res.message);
      }
    } catch (err) {
      alert('Không thể gửi đơn đặt món: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = ['ALL', ...menuData.map(c => c.category)];
  const filteredCategories = selectedCategory === 'ALL' 
    ? menuData 
    : menuData.filter(c => c.category === selectedCategory);

  const transferNote = placedOrder ? `LUNCH ${placedOrder.userName}`.toUpperCase() : '';

  return (
    <div>
      {/* Single Unified Card Container */}
      <div className="glass-card">
        {/* Session Header Strip */}
        <div className="flex-between" style={{ marginBottom: '6px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '15px', fontWeight: '700' }}>
              {session.title}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '1px' }}>
              📍 {session.restaurantName}
            </p>
            {session.adminName && (
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                👤 Người gom đơn: <strong style={{ color: 'var(--text-main)' }}>{session.adminName}</strong>
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {qrImage && (
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => setShowAdminQrSection(!showAdminQrSection)}
                style={{ padding: '2px 6px', fontSize: '10px' }}
                title="Xem mã QR Ngân Hàng nhận tiền của Admin"
              >
                <QrCode size={12} /> {showAdminQrSection ? 'Ẩn QR Admin' : '💳 QR Chuyển Tiền Admin'}
              </button>
            )}

            {attachedImages.length > 0 && (
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setPreviewImage(attachedImages[0])}
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                <Image size={12} /> Ảnh Menu ({attachedImages.length})
              </button>
            )}
          </div>
        </div>

        {/* DEDICATED SEPARATE SECTION: Admin Payment QR Code */}
        {qrImage && showAdminQrSection && (
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px', margin: '6px 0 8px', textAlign: 'center' }}>
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <QrCode size={14} className="text-emerald" /> Mã QR Ngân Hàng Nhận Tiền Của Admin
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAdminQrSection(false)} style={{ padding: '1px 5px', fontSize: '10px' }}>
                <X size={12} /> Ẩn QR
              </button>
            </div>

            <div className="qr-container" style={{ margin: '4px 0' }}>
              <img src={qrImage} alt="Mã QR Chuyển Khoản Admin" className="qr-img" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Quét mã QR bằng App Ngân Hàng bất kỳ để chuyển khoản trả tiền cơm trưa cho Admin.
            </p>
          </div>
        )}

        {/* SEPARATE SECTION: Menu Photos Gallery Only */}
        {attachedImages.length > 0 && (
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px', margin: '6px 0 8px' }}>
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Image size={13} /> Ảnh Menu & Quán Ăn ({attachedImages.length}):
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Chạm ảnh để xem phóng to</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {attachedImages.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setPreviewImage(img)}
                  style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                >
                  <img 
                    src={img} 
                    alt={`Attached Menu ${idx + 1}`} 
                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                  />
                  <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#ffffff', padding: '2px 4px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Maximize2 size={10} /> Xem
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* User Identity Input Bar */}
        <div style={{ margin: '6px 0 8px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
          {isEditingName ? (
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text"
                className="input-field"
                placeholder="Nhập tên của bạn (Ví dụ: Nguyễn Văn A)..."
                value={userName}
                onChange={e => setUserName(e.target.value)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
                autoFocus
              />
              <button className="btn btn-primary btn-sm" onClick={() => setIsEditingName(false)} disabled={!userName.trim()}>
                Lưu
              </button>
            </div>
          ) : (
            <div className="flex-between">
              <span style={{ color: 'var(--text-main)', fontSize: '12px' }}>
                👋 Bạn: <strong style={{ fontWeight: '700' }}>{userName}</strong>
              </span>
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditingName(true)} style={{ padding: '2px 6px', fontSize: '10px' }}>
                <Edit2 size={11} /> Sửa tên
              </button>
            </div>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '8px' }}>
          {categoriesList.map(cat => (
            <button 
              key={cat}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ whiteSpace: 'nowrap', padding: '3px 8px', fontSize: '11px' }}
            >
              {cat === 'ALL' ? 'Tất Cả Món' : cat}
            </button>
          ))}
        </div>

        {/* 2-Column Food Grid Layout */}
        <div>
          {filteredCategories.map((catGroup, catIdx) => (
            <div key={catIdx} className="menu-category-section">
              <div className="category-header-title">
                {catGroup.category}
              </div>

              <div className="food-grid-2col">
                {catGroup.items.map(item => (
                  <div key={item.id} className="food-cell">
                    <div className="food-cell-info">
                      <div className="food-cell-name">{item.name}</div>
                      <div className="food-cell-price">{item.price.toLocaleString('vi-VN')}đ</div>
                    </div>

                    <button 
                      className="btn btn-primary btn-icon-only"
                      onClick={() => handleOpenItemModal(item)}
                      disabled={isClosed}
                      title="Chọn món này"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '-30px', right: '0', background: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
              <X size={14} /> Đóng
            </button>
            <img 
              src={previewImage} 
              alt="Full size menu" 
              style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
            />
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {activeItem && (
        <div className="modal-overlay" onClick={() => setActiveItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <h3 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '15px' }}>{activeItem.name}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveItem(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '10px' }}>
              {activeItem.price.toLocaleString('vi-VN')}đ
            </div>

            {/* Options */}
            {activeItem.options && activeItem.options.map((optGroup, ogIdx) => (
              <div key={ogIdx} style={{ marginBottom: '10px' }}>
                <label className="form-label">{optGroup.title}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {optGroup.choices.map((choice, cIdx) => {
                    const isSelected = modalOptions[optGroup.title]?.name === choice.name;
                    return (
                      <button
                        key={cIdx}
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => {
                          setModalOptions({
                            ...modalOptions,
                            [optGroup.title]: choice
                          });
                        }}
                      >
                        {choice.name} {choice.price ? `(+${choice.price.toLocaleString('vi-VN')}đ)` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div className="form-group" style={{ marginTop: '10px' }}>
              <label className="form-label">Ghi chú (Ít cay, không hành...)</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="Nhập ghi chú..."
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex-between" style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>
                  <Minus size={12} />
                </button>
                <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{modalQuantity}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setModalQuantity(modalQuantity + 1)}>
                  <Plus size={12} />
                </button>
              </div>

              <button className="btn btn-primary btn-sm" onClick={handleAddToCart}>
                Thêm Vào Giỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isClosed && (
        <div className="floating-cart">
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>
              Đã chọn: <strong style={{ color: 'var(--text-main)' }}>{cart.length} món</strong>
            </span>
            <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              {totalCartAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSubmitOrder} disabled={isSubmitting}>
            <ShoppingCart size={14} />
            {isSubmitting ? 'Đang gửi...' : 'Chốt Đơn Ngay'}
          </button>
        </div>
      )}

      {/* Instant Payment QR Modal */}
      {placedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--badge-bg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <Check size={22} style={{ color: 'var(--text-main)' }} />
            </div>

            <h2 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '17px' }}>Đặt Món Thành Công!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
              Cảm ơn <strong>{placedOrder.userName}</strong>. Quét mã QR của Admin để chuyển tiền nhé.
            </p>

            <div style={{ margin: '12px 0' }}>
              {qrImage ? (
                <div className="qr-container">
                  <img src={qrImage} alt="Mã QR Admin" className="qr-img" style={{ width: '180px', height: '180px', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ background: 'var(--bg-card-hover)', color: 'var(--text-muted)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                  Admin chưa tải ảnh QR nhận tiền lên. Bạn hãy tự chuyển tiền cho Admin nhé!
                </div>
              )}
            </div>

            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '10px', borderRadius: '6px', textAlign: 'left', marginBottom: '12px' }}>
              <div className="flex-between" style={{ marginBottom: '2px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Số tiền cần chuyển:</span>
                <strong style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                  {placedOrder.totalAmount.toLocaleString('vi-VN')}đ
                </strong>
              </div>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Nội dung CK đề xuất:</span>
                <code style={{ color: 'var(--text-main)', fontWeight: '700' }}>{transferNote}</code>
              </div>
            </div>

            <button 
              className="btn btn-outline btn-sm" 
              style={{ width: '100%', marginBottom: '6px' }}
              onClick={() => {
                navigator.clipboard.writeText(transferNote);
                setCopiedNote(true);
                setTimeout(() => setCopiedNote(false), 2000);
              }}
            >
              <Copy size={13} />
              {copiedNote ? 'Đã copy nội dung!' : 'Copy Nội Dung Chuyển Khoản'}
            </button>

            <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => setPlacedOrder(null)}>
              Đã Xem / Hoàn Tất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
