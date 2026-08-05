import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Check, Edit2, AlertTriangle, X, QrCode, Maximize2, ChevronUp, Trash2, Download, Users, ShoppingBag, RefreshCw, Image as ImageIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { submitOrder, fetchSession, fetchOrders } from '../../services/api';
import PopupAlert from '../common/PopupAlert';

function getCategoryEmoji(catName = '') {
  const name = catName.toLowerCase();
  if (name.includes('cơm')) return '🍚';
  if (name.includes('bún') || name.includes('phở') || name.includes('mì') || name.includes('hủ tiếu')) return '🍜';
  if (name.includes('uống') || name.includes('trà') || name.includes('nước') || name.includes('cà phê') || name.includes('juices')) return '🧋';
  if (name.includes('bánh') || name.includes('tráng miệng') || name.includes('chè')) return '🍰';
  if (name.includes('lẩu') || name.includes('nướng')) return '🍲';
  if (name.includes('vặt') || name.includes('ăn kèm')) return '🍿';
  return '🍱';
}

export default function UserView({ session: propSession, settings: propSettings, onOrderPlaced }) {
  const { sessionId: routeSessionId } = useParams();
  const [session, setSession] = useState(propSession);
  const [settings, setSettings] = useState(propSettings);

  // Saved User Name in LocalStorage
  const [userName, setUserName] = useState(() => localStorage.getItem('lunch_user_name') || '');
  const [isEditingName, setIsEditingName] = useState(!localStorage.getItem('lunch_user_name'));

  // Popup Alert Dialog State
  const [popup, setPopup] = useState({ isOpen: false, type: 'warning', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });

  const showPopup = ({ type = 'warning', title, message, confirmText, cancelText, onConfirm }) => {
    setPopup({ isOpen: true, type, title, message, confirmText, cancelText, onConfirm });
  };
  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  // Cart State
  const [cart, setCart] = useState([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Option Customization Modal
  const [activeItem, setActiveItem] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalOptions, setModalOptions] = useState({});
  const [modalNotes, setModalNotes] = useState('');

  // Payment QR Success Popup Modal
  const [placedOrder, setPlacedOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox Modal for Attached Images
  const [previewImage, setPreviewImage] = useState(null);
  const [showAdminQrSection, setShowAdminQrSection] = useState(false);

  // Interactive Mix Box State
  const [selectedMixDishes, setSelectedMixDishes] = useState([]);

  // Live Session Orders State
  const [sessionOrders, setSessionOrders] = useState([]);

  const loadSessionOrders = async () => {
    if (!session?.id) return;
    try {
      const res = await fetchOrders(session.id);
      if (res.success) {
        setSessionOrders(res.orders || []);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách đơn:', err);
    }
  };

  useEffect(() => {
    if (session?.id) {
      loadSessionOrders();
      const interval = setInterval(loadSessionOrders, 8000);
      return () => clearInterval(interval);
    }
  }, [session?.id]);

  // Live Session Polling & Status Transition Notification
  useEffect(() => {
    const sId = routeSessionId || propSession?.id || session?.id;
    if (!sId) return;

    const pollSession = async () => {
      try {
        const res = await fetchSession(sId);
        if (res.success && res.session) {
          const updated = res.session;
          setSession(prev => {
            if (prev && prev.status && prev.status !== updated.status) {
              if (updated.status === 'CLOSED') {
                showPopup({
                  type: 'warning',
                  title: 'Phiên Gom Đơn Đã Đóng 🔴',
                  message: 'Người gom đơn đã khóa sổ nhận đơn hôm nay! Bạn không thể thêm hoặc sửa đơn được nữa.'
                });
              } else if (updated.status === 'OPEN') {
                showPopup({
                  type: 'success',
                  title: 'Phiên Gom Đơn Đã Mở Lại 🟢',
                  message: 'Người gom đơn đã mở lại nhận đơn! Bạn có thể tiếp tục chọn món và chốt đơn.'
                });
              }
            }
            return updated;
          });
          if (res.settings) setSettings(res.settings);
        }
      } catch (err) {
        console.error('Session polling error:', err);
      }
    };

    pollSession();
    const interval = setInterval(pollSession, 5000);
    return () => clearInterval(interval);
  }, [routeSessionId, propSession?.id]);

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
      cartId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      id: activeItem.id,
      name: activeItem.name,
      price: activeItem.price,
      quantity: modalQuantity,
      selectedOptions: optionSummaries,
      notes: modalNotes,
      itemTotal
    };

    const existingIndex = cart.findIndex(c => 
      c.id === cartItem.id && 
      JSON.stringify(c.selectedOptions) === JSON.stringify(cartItem.selectedOptions) && 
      (c.notes || '').trim() === (cartItem.notes || '').trim()
    );

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const existing = updatedCart[existingIndex];
      const newQty = existing.quantity + modalQuantity;
      const unit = existing.itemTotal / existing.quantity;
      updatedCart[existingIndex] = {
        ...existing,
        quantity: newQty,
        itemTotal: unit * newQty
      };
      setCart(updatedCart);
    } else {
      setCart([...cart, cartItem]);
    }

    setActiveItem(null);
  };

  // Increment cart item quantity
  const handleIncrementCartItem = (cartId) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === cartId) {
        const unitPrice = item.itemTotal / item.quantity;
        const newQty = item.quantity + 1;
        return {
          ...item,
          quantity: newQty,
          itemTotal: unitPrice * newQty
        };
      }
      return item;
    }));
  };

  // Decrement cart item quantity
  const handleDecrementCartItem = (cartId) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.cartId === cartId) {
        if (item.quantity > 1) {
          const unitPrice = item.itemTotal / item.quantity;
          const newQty = item.quantity - 1;
          return {
            ...item,
            quantity: newQty,
            itemTotal: unitPrice * newQty
          };
        }
        return null;
      }
      return item;
    }).filter(Boolean));
  };

  // Remove single item from cart
  const handleRemoveCartItem = (cartId) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId));
  };

  // Clear all items in cart
  const handleClearCart = () => {
    showPopup({
      type: 'confirm',
      title: 'Xóa toàn bộ giỏ hàng',
      message: 'Bạn có chắc chắn muốn xóa tất cả món ăn trong giỏ hàng?',
      confirmText: 'Xóa ngay',
      cancelText: 'Hủy',
      onConfirm: () => {
        setCart([]);
        setShowCartModal(false);
      }
    });
  };

  // Copy Colleague Order 1-Click
  const handleCopyColleagueOrder = (colleagueOrder) => {
    if (!colleagueOrder || !colleagueOrder.items || colleagueOrder.items.length === 0) return;

    const clonedItems = colleagueOrder.items.map(it => {
      const unitPrice = it.itemTotal && it.quantity ? Math.round(it.itemTotal / it.quantity) : (it.price || 0);
      const qty = it.quantity || 1;
      return {
        cartId: `cart_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        id: it.id || `item_${Date.now()}`,
        name: it.name,
        price: unitPrice,
        quantity: qty,
        selectedOptions: it.selectedOptions || [],
        notes: it.notes || '',
        itemTotal: it.itemTotal || (unitPrice * qty)
      };
    });

    setCart(prevCart => [...prevCart, ...clonedItems]);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    setShowCartModal(true);
    showPopup({
      type: 'success',
      title: 'Đã sao chép món ăn! 🎉',
      message: `Đã thêm tất cả món ăn của "${colleagueOrder.userName}" vào giỏ hàng của bạn. Kiểm tra và chốt đơn ngay nhé!`
    });
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // Submit Order
  const handleSubmitOrder = async () => {
    if (session?.status === 'CLOSED') {
      showPopup({
        type: 'warning',
        title: 'Phiên Gom Đơn Đã Đóng 🔴',
        message: 'Người gom đơn đã khóa sổ nhận đơn! Rất tiếc bạn không thể chốt đơn lúc này.'
      });
      return;
    }

    if (!userName.trim()) {
      showPopup({
        type: 'warning',
        title: 'Chưa nhập tên người đặt',
        message: 'Vui lòng nhập tên của bạn trước khi chốt đơn nhé!'
      });
      setIsEditingName(true);
      return;
    }

    if (cart.length === 0) {
      showPopup({
        type: 'warning',
        title: 'Giỏ hàng đang trống',
        message: 'Vui lòng chọn ít nhất 1 món ăn từ thực đơn trước khi chốt đơn!'
      });
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
        loadSessionOrders();
        if (onOrderPlaced) onOrderPlaced();
      } else {
        showPopup({
          type: 'error',
          title: 'Lỗi đặt món',
          message: res.message || 'Không thể chốt đơn vào lúc này.'
        });
      }
    } catch (err) {
      showPopup({
        type: 'error',
        title: 'Lỗi kết nối',
        message: 'Không thể gửi đơn đặt món: ' + err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="user-grid">
      {/* Left Column: Menu & Cart Selection */}
      <div>
        <div className="glass-card">
          {/* Session Header */}
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '17px', fontWeight: '800' }}>
                {session.title}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                📍 {session.restaurantName}
              </p>
              {session.adminName && (
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                  👤 Người gom đơn: <strong style={{ color: 'var(--text-main)' }}>{session.adminName}</strong>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {qrImage && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAdminQrSection(!showAdminQrSection)}
                  title="Xem mã QR Chuyển Tiền của Admin"
                >
                  <QrCode size={13} /> {showAdminQrSection ? 'Ẩn QR' : '💳 QR Admin'}
                </button>
              )}

              {attachedImages.length > 0 && (
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setPreviewImage(attachedImages[0])}
                >
                  <ImageIcon size={13} /> Ảnh Menu ({attachedImages.length})
                </button>
              )}
            </div>
          </div>

          {/* Session Closed Banner */}
          {isClosed && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '700', margin: '10px 0', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Phiên gom đơn đã đóng. Người gom đơn đã khóa sổ nhận đơn!
            </div>
          )}

          {/* Admin QR Code View */}
          {qrImage && showAdminQrSection && (
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px', margin: '10px 0', textAlign: 'center' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={15} style={{ color: 'var(--accent-green)' }} /> Mã QR Ngân Hàng Nhận Tiền
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAdminQrSection(false)}>
                  <X size={13} />
                </button>
              </div>

              <div className="qr-container" style={{ margin: '6px 0' }}>
                <img src={qrImage} alt="Mã QR Chuyển Khoản Admin" className="qr-img" />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                Quét mã QR bằng ứng dụng ngân hàng để chuyển tiền cơm cho người gom đơn.
              </p>
            </div>
          )}

          {/* Attached Images */}
          {attachedImages.length > 0 && (
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px', margin: '10px 0' }}>
              <div className="flex-between" style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} /> Ảnh Menu & Quán Ăn ({attachedImages.length}):
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chạm để phóng to</span>
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
                      alt={`Menu ${idx + 1}`} 
                      style={{ width: '84px', height: '84px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }}
                    />
                    <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', color: '#ffffff', padding: '2px 4px', borderRadius: '3px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <Maximize2 size={10} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Name Bar */}
          <div style={{ margin: '10px 0', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text"
                  className="input-field"
                  placeholder="Nhập tên của bạn (Ví dụ: Minh Khoa)..."
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && userName.trim() && setIsEditingName(false)}
                  autoFocus
                />
                <button className="btn btn-primary btn-sm" onClick={() => setIsEditingName(false)} disabled={!userName.trim()}>
                  Lưu
                </button>
              </div>
            ) : (
              <div className="flex-between">
                <span style={{ color: 'var(--text-main)', fontSize: '13px' }}>
                  👋 Bạn: <strong style={{ fontWeight: '700' }}>{userName}</strong>
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditingName(true)}>
                  <Edit2 size={12} /> Đổi tên
                </button>
              </div>
            )}
          </div>

          {/* Interactive Mix Menu Box */}
          {(() => {
            const isMixMenu = Boolean(
              session?.isMixMenu || 
              menuData.some(cat => (cat.category || '').toLowerCase().includes('mix'))
            );

            if (!isMixMenu || menuData.length === 0) return null;

            const rules = session?.mixRules || {};
            const mixTitle = rules.mixTitle || '🍱 TỰ CHỌN HỘP CƠM MIX HÔM NAY';
            const maxAllowed = typeof rules.maxAllowedItems === 'number' 
              ? rules.maxAllowedItems 
              : (typeof rules.tier2Count === 'number' 
                  ? rules.tier2Count 
                  : (typeof rules.tier1Count === 'number' ? rules.tier1Count : null));

            const instructionText = rules.instructionText || (maxAllowed ? `Được chọn tối đa ${maxAllowed} món / topping:` : 'Đánh dấu chọn các món ăn bạn muốn mix vào hộp cơm hôm nay:');
            
            const tier1Count = typeof rules.tier1Count === 'number' ? rules.tier1Count : 2;
            const tier1Price = typeof rules.tier1Price === 'number' ? rules.tier1Price : (rules.basePrice || 28000);
            
            const tier2Count = typeof rules.tier2Count === 'number' ? rules.tier2Count : (tier1Count + 1);
            const tier2Price = typeof rules.tier2Price === 'number' ? rules.tier2Price : (tier1Price + 7000);
            
            const extraItemPrice = typeof rules.extraItemPrice === 'number' ? rules.extraItemPrice : (tier2Price - tier1Price);

            const allItems = menuData.flatMap(cat => cat.items || []);
            
            const freeGiftItems = allItems.filter(it => 
              it.isFreeGift || 
              it.name.toLowerCase().includes('(free)') ||
              it.name.toLowerCase().includes('ăn kèm') ||
              it.name.toLowerCase().includes('miễn phí') ||
              it.name.toLowerCase().includes('tặng')
            );

            const toppingItems = allItems.filter(it => 
              (it.isTopping || (it.price === 0 && !freeGiftItems.some(fg => fg.name === it.name))) &&
              !freeGiftItems.some(fg => fg.name === it.name)
            );

            const mixSelectionItems = toppingItems.length > 0 ? toppingItems : allItems.filter(it => it.price === 0);

            const selectedToppingsCount = selectedMixDishes.filter(dishName => 
              mixSelectionItems.some(it => it.name === dishName)
            ).length;

            const count = selectedToppingsCount;
            let selectedPrice = 0;
            if (count === 0) {
              selectedPrice = 0;
            } else if (rules.basePrice) {
              selectedPrice = rules.basePrice;
            } else if (count <= tier1Count) {
              selectedPrice = tier1Price;
            } else if (count <= tier2Count) {
              selectedPrice = tier2Price;
            } else {
              selectedPrice = tier2Price + (count - tier2Count) * extraItemPrice;
            }

            return (
              <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px', margin: '10px 0 14px' }}>
                <div className="flex-between" style={{ marginBottom: '8px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>
                    {mixTitle}
                  </span>
                  <span className="status-badge status-open">
                    {selectedToppingsCount === 0 
                      ? 'Chưa chọn món' 
                      : maxAllowed 
                        ? `Đã chọn ${selectedToppingsCount}/${maxAllowed} món (${selectedPrice.toLocaleString('vi-VN')}đ)` 
                        : `Mix ${count} món = ${selectedPrice.toLocaleString('vi-VN')}đ`
                    }
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {instructionText}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                  {mixSelectionItems.map((item, idx) => {
                    const isChecked = selectedMixDishes.includes(item.name);
                    return (
                      <label 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: isChecked ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                          border: isChecked ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontSize: '12px',
                          color: 'var(--text-main)',
                          fontWeight: isChecked ? '700' : '400',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              if (maxAllowed && selectedToppingsCount >= maxAllowed) {
                                showPopup({
                                  type: 'warning',
                                  title: 'Đã đạt giới hạn chọn món! ⚠️',
                                  message: `Suất cơm này chỉ cho phép chọn tối đa ${maxAllowed} món!`
                                });
                                return;
                              }
                              setSelectedMixDishes(prev => [...prev, item.name]);
                            } else {
                              setSelectedMixDishes(prev => prev.filter(n => n !== item.name));
                            }
                          }}
                          style={{ accentColor: 'var(--accent-green)', flexShrink: 0 }}
                        />
                        <span style={{ flex: 1, minWidth: 0, wordBreak: 'break-word', lineHeight: '1.3' }}>{item.name}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex-between" style={{ background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Đã chọn: <strong style={{ color: 'var(--text-main)' }}>{selectedMixDishes.length > 0 ? selectedMixDishes.join(' + ') : 'Chưa chọn'}</strong>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--accent-green)', marginTop: '2px' }}>
                      Thành tiền: {selectedPrice.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary btn-sm"
                    disabled={selectedMixDishes.length === 0 || isClosed}
                    onClick={() => {
                      const boxName = `Hộp Cơm Mix (${selectedMixDishes.join(', ')})`;

                      const cartItem = {
                        cartId: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                        id: `mix_${Date.now()}`,
                        name: boxName,
                        price: selectedPrice,
                        quantity: 1,
                        selectedOptions: [],
                        notes: '',
                        itemTotal: selectedPrice
                      };

                      setCart(prev => [...prev, cartItem]);
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                      setSelectedMixDishes([]);
                      setShowCartModal(true);
                    }}
                  >
                    <Plus size={14} /> Thêm Hộp Cơm
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2-Column Food Grid Layout */}
          <div>
            {(() => {
              const isMixMenu = Boolean(
                session?.isMixMenu || 
                menuData.some(cat => (cat.category || '').toLowerCase().includes('mix'))
              );

              const filteredMenu = menuData.map(catGroup => {
                let items = catGroup.items || [];

                if (isMixMenu) {
                  items = items.filter(item => !(item.isTopping || item.isFreeGift || item.price === 0));
                }

                if (items.length === 0) return null;

                return {
                  ...catGroup,
                  items
                };
              }).filter(Boolean);

              return filteredMenu.map((catGroup, catIdx) => (
                <div key={catIdx} className="menu-category-section">
                  <div className="category-header-title">
                    <span>{getCategoryEmoji(catGroup.category)} {catGroup.category}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
                      {catGroup.items.length} món
                    </span>
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
                          <Plus size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Right Column: Live Orders List Side Panel */}
      <div>
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} style={{ color: 'var(--text-main)' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-main)', fontSize: '14px', fontWeight: '700' }}>
                Đồng Nghiệp Đã Đặt ({sessionOrders.length})
              </h3>
            </div>

            <button 
              className="btn btn-outline btn-sm" 
              onClick={loadSessionOrders}
              title="Cập nhật danh sách đơn"
            >
              <RefreshCw size={12} /> Cập nhật
            </button>
          </div>

          {sessionOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)' }}>
              <ShoppingBag size={32} style={{ opacity: 0.3, marginBottom: '6px' }} />
              <p style={{ fontSize: '13px', fontWeight: '600' }}>Chưa có ai đặt món</p>
              <p style={{ fontSize: '11px', marginTop: '2px' }}>Hãy là người đầu tiên mở hàng nhé!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '75vh', overflowY: 'auto', paddingRight: '2px' }}>
              {sessionOrders.map((order, idx) => (
                <div 
                  key={order.id || idx}
                  style={{
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px'
                  }}
                >
                  {/* Header: User name & Total */}
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👤 {order.userName}
                      {order.userName === userName && (
                        <span style={{ fontSize: '9px', background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)', padding: '1px 5px', borderRadius: 'var(--radius-xs)', fontWeight: '800' }}>Bạn</span>
                      )}
                    </span>
                    <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--accent-green)' }}>
                      {order.totalAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  {/* Order Items */}
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.4' }}>
                    {order.items.map((it, itemIdx) => (
                      <div key={itemIdx} style={{ marginBottom: '2px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{it.quantity}x</span> {it.name}
                        {it.selectedOptions?.length > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
                            ({it.selectedOptions.map(o => o.choice).join(', ')})
                          </span>
                        )}
                        {it.notes && (
                          <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-muted)', paddingLeft: '12px' }}>
                            📝 {it.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Status Badge */}
                  <div className="flex-between" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '6px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className={`status-badge ${order.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                      {order.paymentStatus === 'PAID' ? '🟢 Đã CK' : '⏳ Chưa CK'}
                    </span>
                  </div>

                  {/* 1-Click Copy Colleague Order Button */}
                  {order.userName !== userName && !isClosed && (
                    <button 
                      className="btn btn-outline btn-sm" 
                      onClick={() => handleCopyColleagueOrder(order)}
                      style={{ width: '100%', marginTop: '8px', fontSize: '11px', padding: '4px 8px' }}
                      title={`Sao chép tất cả món của ${order.userName}`}
                    >
                      👯‍♂️ Đặt giống bạn này
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '-36px', right: '0', background: 'var(--bg-card)', color: 'var(--text-main)' }}
            >
              <X size={15} /> Đóng
            </button>
            <img 
              src={previewImage} 
              alt="Full size menu" 
              style={{ maxWidth: '90vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} 
            />
          </div>
        </div>
      )}

      {/* Item Customization Modal */}
      {activeItem && (
        <div className="modal-overlay" onClick={() => setActiveItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '12px' }}>
              <h3 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700' }}>{activeItem.name}</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setActiveItem(null)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent-green)', marginBottom: '12px' }}>
              {activeItem.price.toLocaleString('vi-VN')}đ
            </div>

            {/* Options */}
            {activeItem.options && activeItem.options.map((optGroup, ogIdx) => (
              <div key={ogIdx} style={{ marginBottom: '12px' }}>
                <label className="form-label">{optGroup.title}</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
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
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-label">Ghi chú (Ít cay, không hành...)</label>
              <input 
                type="text" 
                className="input-field"
                placeholder="Ghi chú món..."
                value={modalNotes}
                onChange={e => setModalNotes(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddToCart()}
              />
            </div>

            {/* Quantity Selector */}
            <div className="flex-between" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}>
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{modalQuantity}</span>
                <button className="btn btn-outline btn-sm" onClick={() => setModalQuantity(modalQuantity + 1)}>
                  <Plus size={14} />
                </button>
              </div>

              <button className="btn btn-primary" onClick={handleAddToCart}>
                Thêm Vào Giỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isClosed && (
        <div className="floating-cart">
          <div 
            onClick={() => setShowCartModal(true)} 
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
            title="Xem chi tiết giỏ hàng"
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShoppingCart size={22} style={{ color: 'var(--text-main)' }} />
              <span className="cart-badge-count">{totalCartCount}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', lineHeight: 1.1 }}>
                Giỏ hàng ({cart.length} món)
              </span>
              <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
                {totalCartAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setShowCartModal(true)}>
              <ChevronUp size={14} /> Chi Tiết
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmitOrder} disabled={isSubmitting}>
              <ShoppingCart size={14} />
              {isSubmitting ? 'Đang gửi...' : 'Chốt Đơn'}
            </button>
          </div>
        </div>
      )}

      {/* Detailed Cart Modal / Bottom Sheet */}
      {showCartModal && (
        <div className="bottom-sheet-overlay" onClick={() => setShowCartModal(false)}>
          <div className="bottom-sheet-content" style={{ maxWidth: '480px', margin: '0 auto', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>

            {/* Modal Header */}
            <div className="flex-between" style={{ marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} style={{ color: 'var(--text-main)' }} />
                <h3 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '800' }}>
                  Giỏ Hàng Của Bạn ({totalCartCount} món)
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cart.length > 0 && (
                  <button 
                    className="btn btn-outline btn-sm text-red" 
                    onClick={handleClearCart}
                    style={{ fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                  >
                    <Trash2 size={12} /> Xóa tất cả
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCartModal(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Items List */}
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 10px', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '32px', marginBottom: '6px' }}>🛒</p>
                <p style={{ fontSize: '14px', fontWeight: '600' }}>Giỏ hàng của bạn đang trống</p>
                <p style={{ fontSize: '12px', marginTop: '2px' }}>Hãy chọn món ăn từ thực đơn bên dưới nhé!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '2px' }}>
                {cart.map((item) => (
                  <div 
                    key={item.cartId}
                    style={{
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 12px'
                    }}
                  >
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-main)' }}>
                        {item.name}
                      </span>
                      <span style={{ fontWeight: '800', fontSize: '13px', color: 'var(--accent-green)' }}>
                        {item.itemTotal.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {(item.selectedOptions?.length > 0 || item.notes) && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', lineHeight: '1.3' }}>
                        {item.selectedOptions?.map(o => `${o.title}: ${o.choice}`).join(', ')}
                        {item.notes ? (item.selectedOptions?.length ? ` | Ghi chú: ${item.notes}` : `Ghi chú: ${item.notes}`) : ''}
                      </div>
                    )}

                    <div className="flex-between" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '6px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => handleDecrementCartItem(item.cartId)}
                          style={{ width: '26px', height: '26px', padding: 0 }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '14px', fontWeight: '800', minWidth: '20px', textAlign: 'center', color: 'var(--text-main)' }}>
                          {item.quantity}
                        </span>
                        <button 
                          className="btn btn-outline btn-sm" 
                          onClick={() => handleIncrementCartItem(item.cartId)}
                          style={{ width: '26px', height: '26px', padding: 0 }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button 
                        className="btn btn-outline btn-sm text-red" 
                        onClick={() => handleRemoveCartItem(item.cartId)}
                        style={{ padding: '2px 8px', fontSize: '11px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <Trash2 size={12} /> Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '12px' }}>
                <div className="flex-between" style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
                    {totalCartAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button className="btn btn-outline btn-lg" onClick={() => setShowCartModal(false)}>
                    Tiếp tục chọn
                  </button>
                  <button 
                    className="btn btn-primary btn-lg" 
                    onClick={() => {
                      setShowCartModal(false);
                      handleSubmitOrder();
                    }}
                    disabled={isSubmitting}
                  >
                    <ShoppingCart size={16} />
                    {isSubmitting ? 'Đang gửi...' : 'Chốt Đơn Ngay'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instant Payment QR Modal */}
      {placedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Check size={24} style={{ color: 'var(--accent-green)' }} />
            </div>

            <h2 style={{ color: 'var(--text-main)', fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '800' }}>Đặt Món Thành Công!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Cảm ơn <strong>{placedOrder.userName}</strong>. Quét mã QR để chuyển tiền cơm trưa nhé.
            </p>

            <div style={{ margin: '14px 0' }}>
              {qrImage ? (
                <div className="qr-container">
                  <img src={qrImage} alt="Mã QR Admin" className="qr-img" />
                </div>
              ) : (
                <div style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
                  Người gom đơn chưa cập nhật QR ngân hàng. Hãy nhắn trực tiếp cho người gom đơn nhé!
                </div>
              )}
            </div>

            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', textAlign: 'left', marginBottom: '12px' }}>
              <div className="flex-between">
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Số tiền cần chuyển:</span>
                <strong style={{ color: 'var(--accent-green)', fontSize: '16px' }}>
                  {placedOrder.totalAmount.toLocaleString('vi-VN')}đ
                </strong>
              </div>
            </div>

            {qrImage && (
              <a 
                href={qrImage} 
                download={`QR_Chuyen_Tien_${placedOrder.userName.replace(/\s+/g, '_')}.png`}
                className="btn btn-outline" 
                style={{ width: '100%', marginBottom: '10px', textDecoration: 'none' }}
              >
                <Download size={15} /> Tải Ảnh QR Về Máy
              </a>
            )}

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={() => setPlacedOrder(null)}>
              Hoàn Tất
            </button>
          </div>
        </div>
      )}

      {/* Global Centered Popup Alert / Confirm Dialog */}
      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
