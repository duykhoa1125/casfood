import React, { useState, useEffect } from 'react';
import { Clipboard, UploadCloud, Sparkles, Plus, Trash2, Check, Image, X, Edit3, Eye, Menu as MenuIcon } from 'lucide-react';
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

  // Sync activeMenuState when session changes
  useEffect(() => {
    if (session && session.menuData) {
      setActiveMenuState(JSON.parse(JSON.stringify(session.menuData)));
      if (session.restaurantName) setRestaurantName(session.restaurantName);
      if (session.title) setSessionTitle(session.title);
    }
  }, [session]);

  // State for AI dynamic mix menu detection
  const [isMixMenu, setIsMixMenu] = useState(false);
  const [mixRules, setMixRules] = useState(null);

  // Gửi text qua AI để phân tích
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
        setParseError(res.message || 'AI không tách được thực đơn. Kiểm tra lại API Key.');
      }
    } catch (err) {
      setParseError('Lỗi kết nối AI: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  // Dán từ Clipboard
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

  // Đính kèm ảnh menu
  const handleImageAttachment = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    files.forEach(file => {
      if (file.size > 8 * 1024 * 1024) { 
        showPopup({ type: 'warning', title: 'File quá lớn', message: `File ${file.name} quá lớn (> 8MB). Vui lòng chọn ảnh nhỏ hơn!` });
        return; 
      }
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImages(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachedImage = (index) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag & Drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => setAttachedImages(prev => [...prev, reader.result]);
          reader.readAsDataURL(file);
        } else {
          const reader = new FileReader();
          reader.onload = (ev) => { if (ev.target.result?.trim()) { setRawText(ev.target.result); processText(ev.target.result); } };
          reader.readAsText(file);
        }
      });
      return;
    }
    const droppedText = e.dataTransfer.getData('text');
    if (droppedText?.trim()) { setRawText(droppedText); processText(droppedText); }
  };

  // Draft menu edit helpers
  const handleAddItem = (catIndex) => {
    const updated = [...menuCategories];
    updated[catIndex].items.push({ id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: 'Món ăn mới', price: 35000, description: '', options: [] });
    setMenuCategories(updated);
  };
  const handleRemoveItem = (catIndex, itemIndex) => { const updated = [...menuCategories]; updated[catIndex].items.splice(itemIndex, 1); setMenuCategories(updated); };
  const handleUpdateItem = (catIndex, itemIndex, field, value) => { const updated = [...menuCategories]; updated[catIndex].items[itemIndex][field] = value; setMenuCategories(updated); };
  const handleAddCategory = () => { const n = prompt('Tên nhóm món ăn:'); if (n) setMenuCategories([...(menuCategories || []), { category: n, items: [] }]); };

  // Lưu phiên mới
  const handleSaveSession = async () => {
    if (!menuCategories || menuCategories.length === 0) { 
      showPopup({ type: 'warning', title: 'Thực đơn trống', message: 'Cần có ít nhất 1 nhóm món ăn để mở phiên gom đơn!' });
      return; 
    }
    try {
      const res = await createSession({
        title: sessionTitle,
        restaurantName,
        menuData: menuCategories,
        attachedImages,
        isMixMenu,
        mixRules,
        adminSlug: localStorage.getItem('casfood_admin_slug'),
        adminName: localStorage.getItem('casfood_admin_name')
      });
      if (res.success) {
        showPopup({
          type: 'success',
          title: 'Tạo phiên thành công 🎉',
          message: 'Đã mở phiên gom đơn mới thành công! Bạn có thể sao chép link gửi cho đồng nghiệp.'
        });
        setMenuCategories(null); setRawText(''); setAttachedImages([]);
        if (onSessionCreated) onSessionCreated(res.session);
      }
    } catch (err) { 
      showPopup({ type: 'error', title: 'Lỗi tạo phiên', message: err.message }); 
    }
  };

  // Active session menu edit helpers
  const handleActiveAddItem = (catIdx) => { const u = [...activeMenuState]; u[catIdx].items.push({ id: `item_${Date.now()}`, name: 'Món ăn mới', price: 35000, description: '', options: [] }); setActiveMenuState(u); };
  const handleActiveRemoveItem = (catIdx, itemIdx) => { const u = [...activeMenuState]; u[catIdx].items.splice(itemIdx, 1); setActiveMenuState(u); };
  const handleActiveUpdateItem = (catIdx, itemIdx, field, value) => { const u = [...activeMenuState]; u[catIdx].items[itemIdx][field] = value; setActiveMenuState(u); };
  const handleSaveActiveMenuChanges = async () => {
    if (!session?.id) return;
    try {
      setIsSavingMenu(true);
      const res = await updateSession(session.id, { menuData: activeMenuState });
      if (res.success) { 
        showPopup({ type: 'success', title: 'Đã lưu thay đổi', message: 'Đã cập nhật thực đơn phiên hiện tại thành công!' }); 
        setIsEditingActiveMenu(false); 
        if (onSessionUpdated) onSessionUpdated(res.session); 
      }
    } catch (err) { 
      showPopup({ type: 'error', title: 'Lỗi lưu thực đơn', message: err.message }); 
    } finally { setIsSavingMenu(false); }
  };

  const totalDraftItems = menuCategories ? menuCategories.reduce((s, c) => s + c.items.length, 0) : 0;
  const activeMenu = session?.menuData || [];
  const totalActiveItems = activeMenu.reduce((s, c) => s + (c.items?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* CARD 1: ACTIVE SESSION MENU */}
      {session && (
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <h2 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
              <MenuIcon size={15} />
              Thực Đơn Phiên Hiện Tại ({totalActiveItems} món)
            </h2>
            <button className="btn btn-outline btn-sm" onClick={() => setIsEditingActiveMenu(!isEditingActiveMenu)} style={{ fontSize: '11px', padding: '2px 6px' }}>
              {isEditingActiveMenu ? <Eye size={12} /> : <Edit3 size={12} />}
              {isEditingActiveMenu ? 'Xem' : 'Sửa Món & Giá'}
            </button>
          </div>

          {/* View Mode (100% Identical to User View) */}
          {!isEditingActiveMenu && (
            <div>
              {activeMenu.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', fontStyle: 'italic' }}>Chưa có món ăn nào.</p>
              ) : (
                <div>
                  {/* Dynamic Mix Box Preview for Admin */}
                  {(() => {
                    const isMixMenu = Boolean(
                      session?.isMixMenu || 
                      activeMenu.some(cat => (cat.category || '').toLowerCase().includes('mix'))
                    );

                    if (!isMixMenu) return null;

                    const rules = session?.mixRules || {};
                    const mixTitle = rules.mixTitle || '🍱 TỰ CHỌN HỘP CƠM MIX HÔM NAY';
                    const maxAllowed = typeof rules.maxAllowedItems === 'number' ? rules.maxAllowedItems : null;
                    const instructionText = rules.instructionText || (maxAllowed ? `Được chọn mix tối đa ${maxAllowed} món / topping` : 'Khách tự chọn món mix vào hộp cơm');

                    const allItems = activeMenu.flatMap(cat => cat.items || []);
                    const toppingItems = allItems.filter(it => it.isTopping || (it.price === 0 && !it.isFreeGift && !it.name.toLowerCase().includes('(free)')));
                    const freeGiftItems = allItems.filter(it => it.isFreeGift || it.name.toLowerCase().includes('(free)'));
                    const mixSelectionItems = toppingItems.length > 0 ? toppingItems : allItems.filter(it => it.price === 0);

                    return (
                      <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', marginBottom: '8px' }}>
                        <div className="flex-between" style={{ marginBottom: '4px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '3px' }}>
                          <span style={{ fontWeight: '700', fontSize: '11px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {mixTitle}
                          </span>
                          <span className="status-badge status-open" style={{ fontSize: '9px' }}>
                            {maxAllowed ? `Tối đa ${maxAllowed} Topping` : 'Tự chọn Mix'}
                          </span>
                        </div>

                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                          {instructionText}
                        </p>

                        {/* Topping list */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '4px', marginBottom: '6px' }}>
                          {mixSelectionItems.map((item, idx) => (
                            <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '3px 6px', borderRadius: '3px', fontSize: '10px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>•</span>
                              <span>{item.name}</span>
                            </div>
                          ))}
                        </div>

                        {/* Free gifts */}
                        {freeGiftItems.length > 0 && (
                          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '4px', marginTop: '4px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                              🎁 TẶNG KÈM MIỄN PHÍ:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {freeGiftItems.map((item, idx) => (
                                <span key={idx} style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-color)', padding: '2px 5px', borderRadius: '3px', fontSize: '10px', color: 'var(--text-main)' }}>
                                  🎁 {item.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2-Column Food Grid for Admin View Mode */}
                  {(() => {
                    const isMixMenu = Boolean(
                      session?.isMixMenu || 
                      activeMenu.some(cat => (cat.category || '').toLowerCase().includes('mix'))
                    );

                    const filteredActiveMenu = activeMenu.map(cat => {
                      if (!isMixMenu) return cat;
                      const nonMixItems = (cat.items || []).filter(item => {
                        const isMixItem = item.isTopping || item.isFreeGift || item.price === 0;
                        return !isMixItem;
                      });
                      return { ...cat, items: nonMixItems };
                    }).filter(cat => cat.items.length > 0);

                    return filteredActiveMenu.map((cat, catIdx) => (
                      <div key={catIdx} className="menu-category-section" style={{ marginBottom: '8px' }}>
                        <div className="category-header-title" style={{ fontSize: '11px', padding: '3px 8px' }}>
                          {cat.category} ({cat.items?.length || 0})
                        </div>
                        <div className="food-grid-2col" style={{ gap: '4px' }}>
                          {cat.items?.map((item, itemIdx) => (
                            <div key={item.id || itemIdx} className="food-cell" style={{ padding: '6px 8px' }}>
                              <div className="food-cell-info">
                                <div className="food-cell-name" style={{ fontSize: '11px' }}>{item.name}</div>
                                <div className="food-cell-price" style={{ fontSize: '11px' }}>{item.price?.toLocaleString('vi-VN')}đ</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Edit Mode */}
          {isEditingActiveMenu && (
            <div>
              {activeMenuState.map((cat, catIdx) => (
                <div key={catIdx} style={{ background: 'var(--input-bg)', padding: '6px', borderRadius: '4px', marginBottom: '6px', border: '1px solid var(--border-color)' }}>
                  <div className="flex-between" style={{ marginBottom: '4px' }}>
                    <input type="text" className="input-field" style={{ fontWeight: '700', fontSize: '11px', padding: '2px 5px', flex: 1, marginRight: '4px' }} value={cat.category}
                      onChange={e => { const u = [...activeMenuState]; u[catIdx].category = e.target.value; setActiveMenuState(u); }} />
                    <button className="btn btn-outline btn-sm" onClick={() => handleActiveAddItem(catIdx)} style={{ padding: '1px 5px', fontSize: '10px' }}><Plus size={10} /></button>
                  </div>
                  {cat.items?.map((item, itemIdx) => (
                    <div key={item.id || itemIdx} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 22px', gap: '4px' }}>
                        <input type="text" className="input-field" style={{ fontSize: '11px', padding: '2px 5px' }} value={item.name} onChange={e => handleActiveUpdateItem(catIdx, itemIdx, 'name', e.target.value)} />
                        <input type="number" className="input-field" style={{ fontSize: '11px', padding: '2px 5px' }} value={item.price} onChange={e => handleActiveUpdateItem(catIdx, itemIdx, 'price', parseInt(e.target.value) || 0)} />
                        <button className="btn btn-outline btn-sm" style={{ padding: '2px' }} onClick={() => handleActiveRemoveItem(catIdx, itemIdx)}><Trash2 size={11} /></button>
                      </div>

                      {/* Options Preview */}
                      {item.options && item.options.length > 0 && (
                        <div style={{ marginLeft: '10px', paddingLeft: '6px', borderLeft: '2px solid var(--border-color)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {item.options.map((optGroup, ogIdx) => (
                            <div key={ogIdx} style={{ marginTop: '2px' }}>
                              <strong style={{ color: 'var(--text-main)' }}>⚙️ {optGroup.title}:</strong>{' '}
                              {optGroup.choices?.map((c, cIdx) => (
                                <span key={cIdx} style={{ background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border-color)', marginRight: '3px', display: 'inline-block', marginTop: '2px' }}>
                                  {c.name} {c.price ? `(+${c.price.toLocaleString('vi-VN')}đ)` : ''}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSaveActiveMenuChanges} disabled={isSavingMenu}>
                  <Check size={12} /> {isSavingMenu ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setIsEditingActiveMenu(false)}>Hủy</button>
              </div>
            </div>
          )}

          {/* Attached images in session */}
          {session.attachedImages?.length > 0 && (
            <div style={{ marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>📷 Ảnh đính kèm:</span>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {session.attachedImages.map((img, idx) => (
                  <img key={idx} src={img} alt="" onClick={() => setPreviewImage(img)}
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CARD 2: PASTE MENU */}
      <div className="glass-card">
        <h2 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
          <Sparkles size={14} />
          {session ? 'Dán Menu / Tạo Phiên Mới' : 'Dán Menu & Đính Kèm Ảnh'}
        </h2>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed var(--text-main)' : '2px dashed var(--border-color)',
            background: isDragging ? 'var(--bg-card-hover)' : 'var(--input-bg)',
            borderRadius: '6px', padding: '12px 10px', textAlign: 'center',
            transition: 'all 0.15s ease', marginBottom: '8px'
          }}
        >
          <UploadCloud size={20} style={{ color: 'var(--text-muted)', marginBottom: '3px' }} />
          <p style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '11px', marginBottom: '2px' }}>
            Kéo & Thả File .txt vào đây
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '8px' }}>
            Hoặc dán trực tiếp từ Zalo / Facebook / TikTok
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePasteFromClipboard} disabled={isParsing} style={{ fontSize: '11px', padding: '3px 8px' }}>
              <Clipboard size={12} />
              {isParsing ? '🤖 AI đang phân tích...' : 'Dán Từ Clipboard'}
            </button>
            <label className="btn btn-outline btn-sm" style={{ margin: 0, cursor: 'pointer', fontSize: '11px', padding: '3px 8px' }}>
              <Image size={12} /> Đính Kèm Ảnh
              <input type="file" accept="image/*" multiple onChange={handleImageAttachment} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* Error */}
        {parseError && (
          <div style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '6px 8px', marginBottom: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            ⚠️ {parseError}
          </div>
        )}

        {/* Draft attached images */}
        {attachedImages.length > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <label className="form-label" style={{ fontSize: '10px' }}>Ảnh đính kèm ({attachedImages.length}):</label>
            <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
              {attachedImages.map((img, idx) => (
                <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                  <button type="button" onClick={() => handleRemoveAttachedImage(idx)}
                    style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#000', color: '#fff', border: '1px solid #fff', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Draft Menu Editor */}
        {menuCategories && (
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', marginTop: '6px' }}>

            {/* Summary */}
            <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '5px 8px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-main)' }}>
                ✅ AI tách được: <strong>{menuCategories.length} nhóm</strong>, <strong>{totalDraftItems} món</strong>
              </span>
              <button className="btn btn-outline btn-sm" style={{ padding: '1px 5px', fontSize: '10px' }}
                onClick={() => { setMenuCategories(null); setRawText(''); setParseError(''); }}>
                <X size={10} /> Hủy
              </button>
            </div>

            {/* Session Metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '8px' }}>
              <div><label className="form-label">Tên Phiên</label><input type="text" className="input-field" value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} /></div>
              <div><label className="form-label">Tên Quán Ăn</label><input type="text" className="input-field" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} /></div>
            </div>

            {/* Menu Editor */}
            <div className="flex-between" style={{ marginBottom: '6px' }}>
              <h3 style={{ color: 'var(--text-main)', fontSize: '11px', fontWeight: '700' }}>Kiểm Tra & Chỉnh Sửa</h3>
              <button className="btn btn-outline btn-sm" onClick={handleAddCategory} style={{ padding: '1px 5px', fontSize: '10px' }}><Plus size={10} /> Thêm Nhóm</button>
            </div>

            {menuCategories.map((cat, catIdx) => (
              <div key={catIdx} style={{ background: 'var(--input-bg)', padding: '6px', borderRadius: '4px', marginBottom: '6px', border: '1px solid var(--border-color)' }}>
                <div className="flex-between" style={{ marginBottom: '4px' }}>
                  <input type="text" className="input-field" style={{ fontWeight: '700', flex: 1, marginRight: '4px', fontSize: '11px', padding: '2px 5px' }} value={cat.category}
                    onChange={e => { const u = [...menuCategories]; u[catIdx].category = e.target.value; setMenuCategories(u); }} />
                  <button className="btn btn-outline btn-sm" onClick={() => handleAddItem(catIdx)} style={{ padding: '1px 5px', fontSize: '10px' }}><Plus size={10} /></button>
                </div>
                {cat.items.map((item, itemIdx) => (
                  <div key={item.id || itemIdx} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 22px', gap: '4px' }}>
                      <input type="text" className="input-field" style={{ fontSize: '11px', padding: '2px 5px' }} value={item.name} onChange={e => handleUpdateItem(catIdx, itemIdx, 'name', e.target.value)} />
                      <input type="number" className="input-field" style={{ fontSize: '11px', padding: '2px 5px' }} value={item.price} onChange={e => handleUpdateItem(catIdx, itemIdx, 'price', parseInt(e.target.value) || 0)} />
                      <button className="btn btn-outline btn-sm" style={{ padding: '2px' }} onClick={() => handleRemoveItem(catIdx, itemIdx)}><Trash2 size={11} /></button>
                    </div>

                    {/* Options Preview */}
                    {item.options && item.options.length > 0 && (
                      <div style={{ marginLeft: '10px', paddingLeft: '6px', borderLeft: '2px solid var(--border-color)', fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.options.map((optGroup, ogIdx) => (
                          <div key={ogIdx} style={{ marginTop: '2px' }}>
                            <strong style={{ color: 'var(--text-main)' }}>⚙️ {optGroup.title}:</strong>{' '}
                            {optGroup.choices?.map((c, cIdx) => (
                              <span key={cIdx} style={{ background: 'var(--bg-card)', padding: '1px 4px', borderRadius: '3px', border: '1px solid var(--border-color)', marginRight: '3px', display: 'inline-block', marginTop: '2px' }}>
                                {c.name} {c.price ? `(+${c.price.toLocaleString('vi-VN')}đ)` : ''}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            <button className="btn btn-primary" style={{ width: '100%', marginTop: '6px', padding: '7px' }} onClick={handleSaveSession}>
              <Check size={13} /> {session ? 'Mở Phiên Mới (Thay Phiên Hiện Tại)' : 'Mở Phiên Gom Đơn & Tạo Link'}
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {previewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '-12px', right: '-12px', background: '#000', color: '#fff', border: '1px solid #fff', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '6px' }} />
          </div>
        </div>
      )}

      <PopupAlert {...popup} onClose={closePopup} />
    </div>
  );
}
