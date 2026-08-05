import React, { useState } from 'react';
import { Copy, Check, Store } from 'lucide-react';

export default function ReportExporter({ session, orders }) {
  const [copiedVendor, setCopiedVendor] = useState(false);

  if (!session || !orders) return null;

  // Calculate Vendor Aggregated Summary
  const itemMap = {};
  const generalNotes = [];

  orders.forEach(order => {
    if (order.notes && order.notes.trim()) {
      generalNotes.push(`${order.userName}: ${order.notes.trim()}`);
    }

    (order.items || []).forEach(item => {
      const optionsText = item.selectedOptions && item.selectedOptions.length > 0
        ? ` (${item.selectedOptions.map(o => o.choice).join(', ')})`
        : '';
      const itemNote = item.notes && item.notes.trim() ? item.notes.trim() : '';

      const key = `${item.name}${optionsText}${itemNote ? ` [${itemNote}]` : ''}`;

      if (!itemMap[key]) {
        itemMap[key] = {
          name: item.name,
          optionsText,
          itemNote,
          quantity: 0,
          unitPrice: item.price
        };
      }
      itemMap[key].quantity += (item.quantity || 1);
    });
  });

  const totalItemsCount = Object.values(itemMap).reduce((sum, i) => sum + i.quantity, 0);

  // Generate Vendor Text
  let vendorText = `BÁO CÁO ĐẶT MÓN - ${session.restaurantName || 'Quán Cơm'}\n`;
  vendorText += `Phiên: ${session.title}\n`;
  vendorText += `----------------------------------\n`;
  
  let idx = 1;
  for (const [key, details] of Object.entries(itemMap)) {
    vendorText += `${idx}. ${details.name}${details.optionsText}: ${details.quantity} phần\n`;
    if (details.itemNote) {
      vendorText += `   (Ghi chú: ${details.itemNote})\n`;
    }
    idx++;
  }
  
  vendorText += `----------------------------------\n`;
  vendorText += `TỔNG CỘNG: ${totalItemsCount} phần món\n`;

  if (generalNotes.length > 0) {
    vendorText += `\nGHI CHÚ CHUNG:\n`;
    generalNotes.forEach(note => {
      vendorText += `- ${note}\n`;
    });
  }

  const copyVendorReport = () => {
    navigator.clipboard.writeText(vendorText);
    setCopiedVendor(true);
    setTimeout(() => setCopiedVendor(false), 2000);
  };

  return (
    <div className="glass-card" style={{ marginTop: '12px' }}>
      <div style={{ background: 'var(--code-bg)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
        <div className="flex-between" style={{ marginBottom: '8px' }}>
          <h4 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
            <Store size={15} style={{ color: 'var(--accent-orange)' }} /> Gộp Món Gửi Quán (Bản Copy 1-Click)
          </h4>
          <button className="btn btn-primary btn-sm" onClick={copyVendorReport}>
            {copiedVendor ? <Check size={13} /> : <Copy size={13} />}
            {copiedVendor ? 'Đã sao chép!' : 'Copy Gửi Quán'}
          </button>
        </div>
        <pre className="report-box" style={{ minHeight: '140px' }}>
          {vendorText}
        </pre>
      </div>
    </div>
  );
}
