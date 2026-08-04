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

  // Generate Vendor Text (Clean & Simple Layout)
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
    <div className="glass-card" style={{ marginTop: '8px' }}>
      <div style={{ background: 'var(--code-bg)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
        <div className="flex-between" style={{ marginBottom: '6px' }}>
          <h4 style={{ color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
            <Store size={14} /> Gộp Món Gửi Quán (Bản Copy)
          </h4>
          <button className="btn btn-primary btn-sm" onClick={copyVendorReport} style={{ padding: '2px 8px' }}>
            {copiedVendor ? <Check size={12} /> : <Copy size={12} />}
            {copiedVendor ? 'Đã copy!' : 'Copy Gửi Quán'}
          </button>
        </div>
        <pre className="report-box" style={{ height: '150px' }}>
          {vendorText}
        </pre>
      </div>
    </div>
  );
}
