import React, { useState, useEffect } from 'react';
import { Clipboard, UploadCloud, Sparkles, Plus, Trash2, Check, Image as ImageIcon, X, Edit3, Eye, Menu as MenuIcon, Loader2 } from 'lucide-react';
import { createSession, updateSession, parseMenuWithAI } from '../../services/api';
import PopupAlert from '../common/PopupAlert';

export default function MenuScanner({ session, onSessionCreated, onSessionUpdated, settings }) {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [menuCategories, setMenuCategories] = useState(null);
  const [parseError, setParseError] = useState('');
  const [restaurantName, setRestaurantName] = useState('Cơm Tấm & Trà Sữa Văn Phòng');
  const [sessionTitle, setSessionTitle] = useState('Đặt Cơm Trưa Hôm Nay');

  // Popup Alert State
  const [popup, setPopup] = useState({ isOpen: false, type: 'info', title: '', message: '', confirmText: '', cancelText: '', onConfirm: null });
  const showPopup = (opts) => setPopup({ isOpen: true, type: 'info', ...opts });
  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));

  // Attached images uploaded by Admin
  const [attachedImages, setAttachedImages] = useState([]);

  // Active Menu Editing State
  const [isEditingActiveMenu, setIsEditingActiveMenu] = useState(false);
  const [activeMenuState, setActiveMenuState] = useState([]);
  const [isSavingMenu, setIsSavingMenu] = useState(false);

  // Lightbox preview for image
  const [previewImage, setPreviewImage] = useState(null);

  // State for editing active session mix rules
  const [activeIsMixMenuState, setActiveIsMixMenuState] = useState(false);
  const [activeMixRulesState, setActiveMixRulesState] = useState(null);

  // Sync activeMenuState when session changes
  useEffect(() => {
    if (session && session.menuData) {
      setActiveMenuState(JSON.parse(JSON.stringify(session.menuData)));
      if (session.restaurantName) setRestaurantName(session.restaurantName);
      if (session.title) setSessionTitle(session.title);
      setActiveIsMixMenuState(Boolean(session.isMixMenu));
      setActiveMixRulesState(session.mixRules ? JSON.parse(JSON.stringify(session.mixRules)) : null);
    }
  }, [session]);

  // State for AI dynamic mix menu detection
  const [isMixMenu, setIsMixMenu] = useState(false);
  const [mixRules, setMixRules] = useState(null);

  // Process text with AI
  const processText = async (text) => {
    if (!text || !text.trim()) {
      setParseError('Chưa có văn bản thực đơn.');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      const provider = localStorage.getItem('casfood_ai_provider') || 'deepseek';
      const model = localStorage.getItem('casfood_ai_model') || undefined;
      const apiKey = localStorage.getItem('casfood_ai_apikey') || undefined;

      const res = await parseMenuWithAI({ text, apiKey, provider, model });

      if (res.success && res.menuData && res.menuData.length > 0) {
        setMenuCategories(res.menuData);
        setIsMixMenu(res.isMixMenu || false);
        setMixRules(res.mixRules || null);
      } else {
        setParseError(res.message || 'AI không tách được thực đơn. Kiểm tra lại văn bản dán.');
      }
    } catch (err) {
      setParseError('Lỗi kết nối AI: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // Clipboard paste
  const handlePasteFromClipboard = async () => {
    try {
      let text = '';
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      } else {
        text = prompt('Dán văn bản thực đơn vào đây:');
      }

      if (text && text.trim()) {
        setRawText(text);
        processText(text);
      } else {
        showPopup({ type: 'warning', title: 'Clipboard đang trống', message: 'Vui lòng sao chép văn bản thực đơn từ Zalo / Facebook rồi bấm lại nút này nhé!' });
      }
    } catch (err) {
      const text = prompt('Dán (Ctrl+V) văn bản thực đơn từ Zalo/Facebook vào đây:');
      if (text && text.trim()) {
        setRawText(text);
        processText(text);
      }
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target.result;
        setRawText(text);
        processText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleImageAttachment = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAttachedImages(prev => [...prev, evt.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachedImage = (idx) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddCategory = () => {
    setMenuCategories(prev => [
      ...(prev || []),
      { category: 'Nhóm Món Mới', items: [{ id: `item_${Date.now()}`, name: 'Tên Món', price: 30000 }] }
    ]);
  };

  const handleAddItem = (catIdx) => {
    const updated = [...menuCategories];
    updated[catIdx].items.push({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: 'Món Mới',
      price: 35000
    });
    setMenuCategories(updated);
  };

  const handleRemoveItem = (catIdx, itemIdx) => {
    const updated = [...menuCategories];
    updated[catIdx].items.splice(itemIdx, 1);
    if (updated[catIdx].items.length === 0) {
      updated.splice(catIdx, 1);
    }
    setMenuCategories(updated);
  };

  const handleUpdateItem = (catIdx, itemIdx, field, val) => {
    const updated = [...menuCategories];
    updated[catIdx].items[itemIdx][field] = val;
    setMenuCategories(updated);
  };

  const handleActiveAddItem = (catIdx) => {
    const updated = [...activeMenuState];
    updated[catIdx].items.push({
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: 'Món Mới',
      price: 35000
    });
    setActiveMenuState(updated);
  };

  const handleActiveRemoveItem = (catIdx, itemIdx) => {
    const updated = [...activeMenuState];
    updated[catIdx].items.splice(itemIdx, 1);
    if (updated[catIdx].items.length === 0) {
      updated.splice(catIdx, 1);
    }
    setActiveMenuState(updated);
  };

  const handleActiveUpdateItem = (catIdx, itemIdx, field, val) => {
    const updated = [...activeMenuState];
    updated[catIdx].items[itemIdx][field] = val;
    setActiveMenuState(updated);
  };

  const handleSaveSession = async () => {
    if (!menuCategories || menuCategories.length === 0) {
      showPopup({ type: 'warning', title: 'Chưa có thực đơn', message: 'Hãy dán menu và để AI tách món trước khi tạo phiên!' });
      return;
    }

    try {
      const adminSlug = localStorage.getItem('casfood_admin_slug');
      const adminName = localStorage.getItem('casfood_admin_name') || 'Người Gom Đơn';
      const res = await createSession({
        title: sessionTitle || 'Đặt Cơm Trưa Hôm Nay',
        restaurantName: restaurantName || 'Quán Cơm Văn Phòng',
        menuData: menuCategories,
        attachedImages: attachedImages,
        adminSlug: adminSlug,
        adminName: adminName,
        isMixMenu: isMixMenu,
        mixRules: mixRules
      });

      if (res.success) {
        showPopup({ type: 'success', title: 'Đã mở phiên gom đơn! 🎉', message: 'Phiên mới đã được khởi tạo thành công!' });
        if (onSessionCreated) onSessionCreated(res.session);
        setMenuCategories(null);
        setRawText('');
        setAttachedImages([]);
      }
    } catch (err) {
      showPopup({ type: 'error', title: 'Lỗi tạo phiên', message: err.message });
    }
  };

  const handleSaveActiveMenuChanges = async () => {
    if (!session) return;
    setIsSavingMenu(true);
    try {
      const res = await updateSession(session.id, {
        menuData: activeMenuState,
        isMixMenu: activeIsMixMenuState,
        mixRules: activeMixRulesState
      });
      if (res.success) {
        showPopup({ type: 'success', title: 'Đã lưu thay đổi', message: 'Đã cập nhật thực đơn & cấu hình mix thành công!' });
        setIsEditingActiveMenu(false);
        if (onSessionUpdated) onSessionUpdated(res.session);
      }
    } catch (err) {
      showPopup({ type: 'error', title: 'Lỗi lưu thực đơn', message: err.message });
    } finally {
      setIsSavingMenu(false);
    }
  };

  const totalDraftItems = menuCategories ? menuCategories.reduce((s, c) => s + c.items.length, 0) : 0;
  const activeMenu = session?.menuData || [];
  const totalActiveItems = activeMenu.reduce((s, c) => s + (c.items?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* CARD 1: ACTIVE SESSION MENU */}
      {session && (
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '10px' }}>
            <h2 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '800' }}>
              <MenuIcon size={16} />
              Thực Đơn Đang Mở ({totalActiveItems} món)
            </h2>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditingActiveMenu(!isEditingActiveMenu)}>
              {isEditingActiveMenu ? <Eye size={13} /> : <Edit3 size={13} />}
              {isEditingActiveMenu ? 'Xem' : 'Sửa Món & Giá'}
            </button>
          </div>

          {/* View Mode */}
          {!isEditingActiveMenu && (
            <div>
              {activeMenu.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic' }}>Chưa có món ăn nào trong phiên.</p>
              ) : (
                <div>
                  {activeMenu.map((cat, catIdx) => (
                    <div key={catIdx} className="menu-category-section" style={{ marginBottom: '10px' }}>
                      <div className="category-header-title">
                        <span>{cat.category}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.items?.length || 0} món</span>
                      </div>
                      <div className="food-grid-2col">
                        {cat.items?.map((item, itemIdx) => (
                          <div key={item.id || itemIdx} className="food-cell">
                            <div className="food-cell-info">
                              <div className="food-cell-name">{item.name}</div>
                              <div className="food-cell-price">{item.price?.toLocaleString('vi-VN')}đ</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Edit Mode */}
          {isEditingActiveMenu && (
            <div>
              {activeMenuState.map((cat, catIdx) => (
                <div key={catIdx} style={{ background: 'var(--input-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '6px' }}>
                    <input type="text" className="input-field" style={{ fontWeight: '700', fontSize: '12px', flex: 1, marginRight: '6px' }} value={cat.category}
                      onChange={e => { const u = [...activeMenuState]; u[catIdx].category = e.target.value; setActiveMenuState(u); }} />
                    <button className="btn btn-outline btn-sm" onClick={() => handleActiveAddItem(catIdx)}><Plus size={12} /></button>
                  </div>
                  {cat.items?.map((item, itemIdx) => (
                    <div key={item.id || itemIdx} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 28px', gap: '6px', alignItems: 'center' }}>
                        <input type="text" className="input-field" value={item.name} onChange={e => handleActiveUpdateItem(catIdx, itemIdx, 'name', e.target.value)} />
                        <input type="number" className="input-field" value={item.price} onChange={e => handleActiveUpdateItem(catIdx, itemIdx, 'price', parseInt(e.target.value) || 0)} />
                        <button className="btn btn-outline btn-sm text-red" title="Xóa món" onClick={() => handleActiveRemoveItem(catIdx, itemIdx)}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSaveActiveMenuChanges} disabled={isSavingMenu}>
                  <Check size={14} /> {isSavingMenu ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditingActiveMenu(false)}>Hủy</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARD 2: PASTE MENU AI SCANNER */}
      <div className="glass-card">
        <h2 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800', marginBottom: '10px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-orange)' }} />
          {session ? 'Dán Menu Mới / Tạo Phiên Mới' : 'Tạo Phiên Gom Đơn Với AI'}
        </h2>

        {/* Drop / Paste Zone */}
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed var(--text-main)' : '2px dashed var(--border-color)',
            background: isDragging ? 'var(--bg-card-hover)' : 'var(--input-bg)',
            borderRadius: 'var(--radius-md)', padding: '16px 12px', textAlign: 'center',
            transition: 'all var(--transition-fast)', marginBottom: '10px'
          }}
        >
          <UploadCloud size={24} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
          <p style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '13px', marginBottom: '2px' }}>
            Dán văn bản thực đơn từ Zalo / Facebook
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginBottom: '12px' }}>
            AI DeepSeek sẽ tự động phân loại món ăn & giá tiền trong 1 giây
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary" onClick={handlePasteFromClipboard} disabled={isParsing}>
              {isParsing ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
              {isParsing ? 'AI Đang Phân Tích...' : 'Dán Từ Clipboard'}
            </button>
            <label className="btn btn-outline" style={{ margin: 0, cursor: 'pointer' }}>
              <ImageIcon size={14} /> Đính Kèm Ảnh
              <input type="file" accept="image/*" multiple onChange={handleImageAttachment} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Error Notification */}
        {parseError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: '10px', fontSize: '12px', color: '#ef4444' }}>
            ⚠️ {parseError}
          </div>
        )}

        {/* Attached Draft Images */}
        {attachedImages.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <label className="form-label">Ảnh đính kèm ({attachedImages.length}):</label>
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {attachedImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-color)' }} />
                  <button type="button" onClick={() => handleRemoveAttachedImage(idx)}
                    style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#000', color: '#fff', border: '1px solid #fff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft Menu Editor */}
        {menuCategories && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-main)' }}>
                ✅ AI đã phân tích: <strong>{menuCategories.length} nhóm</strong>, <strong>{totalDraftItems} món</strong>
              </span>
              <button className="btn btn-ghost btn-sm" onClick={() => { setMenuCategories(null); setRawText(''); setParseError(''); }}>
                <X size={12} /> Hủy
              </button>
            </div>

            {/* Session Title & Restaurant Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div><label className="form-label">Tên Phiên</label><input type="text" className="input-field" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} /></div>
              <div><label className="form-label">Tên Quán Ăn</label><input type="text" className="input-field" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} /></div>
            </div>

            {/* Category Items Editor */}
            <div className="flex-between" style={{ marginBottom: '8px' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '12px', fontWeight: '700' }}>Kiểm Tra & Chỉnh Sửa Thực Đơn</h3>
              <button className="btn btn-outline btn-sm" onClick={handleAddCategory}><Plus size={12} /> Thêm Nhóm</button>
            </div>

            {menuCategories.map((cat, catIdx) => (
              <div key={catIdx} style={{ background: 'var(--input-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                <div className="flex-between" style={{ marginBottom: '6px' }}>
                  <input type="text" className="input-field" style={{ fontWeight: '700', flex: 1, marginRight: '6px' }} value={cat.category}
                    onChange={e => { const u = [...menuCategories]; u[catIdx].category = e.target.value; setMenuCategories(u); }} />
                  <button className="btn btn-outline btn-sm" onClick={() => handleAddItem(catIdx)}><Plus size={12} /></button>
                </div>
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 28px', gap: '6px' }}>
                      <input type="text" className="input-field" value={item.name} onChange={e => handleUpdateItem(catIdx, itemIdx, 'name', e.target.value)} />
                      <input type="number" className="input-field" value={item.price} onChange={e => handleUpdateItem(catIdx, itemIdx, 'price', parseInt(e.target.value) || 0)} />
                      <button className="btn btn-outline btn-sm text-red" onClick={() => handleRemoveItem(catIdx, itemIdx)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '10px' }} onClick={handleSaveSession}>
              <Check size={16} /> {session ? 'Mở Phiên Mới (Thay Phiên Hiện Tại)' : 'Mở Phiên Gom Đơn & Tạo Link'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Preview */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#000', color: '#fff', border: '1px solid #fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      )}

      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
