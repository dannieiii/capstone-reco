<template>
  <div v-if="modelValue" class="pdf-preview-overlay">
    <div class="pdf-preview-panel" ref="panelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>Orders Export Summary</h2>
          <p class="preview-subtitle">
            Review the orders included in this export. Use the controls below to print or save the PDF.
          </p>
        </div>
        <button
          class="close-btn"
          type="button"
          @click="closePreview"
          aria-label="Close preview"
          data-html2canvas-ignore="true"
        >
          &times;
        </button>
      </header>

      <section class="preview-meta">
        <div>
          <p class="meta-label">Generated On</p>
          <p class="meta-value">{{ formattedGeneratedAt }}</p>
        </div>
        <div>
          <p class="meta-label">Status Filter</p>
          <p class="meta-value">{{ filterLabel }}</p>
        </div>
        <div>
          <p class="meta-label">Date Range</p>
          <p class="meta-value">{{ dateRangeLabel }}</p>
        </div>
        <div>
          <p class="meta-label">Search</p>
          <p class="meta-value">{{ searchLabel }}</p>
        </div>
        <div>
          <p class="meta-label">Orders Included</p>
          <p class="meta-value">{{ totalOrders }}</p>
        </div>
      </section>

      <section class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Order Code</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Type</th>
              <th>Unit & Qty</th>
              <th>Location</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in visibleOrders" :key="order.id || order.orderCode">
              <td>{{ formatOrderCode(order.orderCode) }}</td>
              <td>{{ order.username || 'Unknown' }}</td>
              <td>{{ order.productName || 'N/A' }}</td>
              <td>{{ orderTypeLabel(order.orderType, order.isPreOrder) }}</td>
              <td>{{ formatUnitAndQuantity(order) }}</td>
              <td>{{ getAddressDisplay(order.Location) }}</td>
              <td>{{ formatDateTime(order.timestamp || order.createdAt) }}</td>
              <td>{{ formatCurrency(order.totalPrice) }}</td>
              <td>
                <span class="status-chip" :class="statusClass(order.status)">
                  {{ order.status || 'N/A' }}
                </span>
              </td>
            </tr>
            <tr v-if="!visibleOrders.length">
              <td colspan="9" class="empty-state">No orders available for the current filters.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer class="preview-footer" data-html2canvas-ignore="true">
        <div class="actions">
          <button type="button" class="secondary-btn" @click="closePreview">Close</button>
          <div class="primary-actions">
            <button type="button" class="outline-btn" @click="handlePrint">Print</button>
            <button type="button" class="primary-btn" @click="handleSavePdf" :disabled="isSavingPdf">
              <span v-if="isSavingPdf">Saving...</span>
              <span v-else>Save PDF</span>
            </button>
          </div>
        </div>
        <p class="preview-hint">
          Adjust filters or search terms in the Orders page, then reopen this preview for a refreshed snapshot.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orders: {
    type: Array,
    default: () => []
  },
  generatedAt: {
    type: [String, Date],
    default: () => new Date()
  },
  filterLabel: {
    type: String,
    default: 'All Orders'
  },
  dateRangeLabel: {
    type: String,
    default: 'All Dates'
  },
  searchLabel: {
    type: String,
    default: 'None'
  }
});

const emit = defineEmits(['update:modelValue']);
const panelRef = ref(null);
const isSavingPdf = ref(false);

const formattedGeneratedAt = computed(() => {
  const date = props.generatedAt ? new Date(props.generatedAt) : new Date();
  return date.toLocaleString();
});

const visibleOrders = computed(() => props.orders ?? []);
const totalOrders = computed(() => visibleOrders.value.length);

const closePreview = () => emit('update:modelValue', false);

const formatOrderCode = (code) => {
  if (!code) return 'N/A';
  return code.startsWith('#') ? code : `#${code}`;
};

const formatUnitAndQuantity = (order) => {
  const qty = order.quantity || 0;
  const unit = getUnitDisplay(order.unit);
  return `${qty} ${unit}`;
};

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `₱${num.toFixed(2)}`;
};

const getUnitDisplay = (unit) => {
  const map = {
    kg: 'Kilogram',
    sack: 'Sack',
    tali: 'Tali',
    kaing: 'Kaing',
    bundle: 'Bundle',
    tray: 'Tray',
    piece: 'Piece',
    perKilo: 'Kilogram',
    perSack: 'Sack',
    perTali: 'Tali',
    perKaing: 'Kaing',
    perBundle: 'Bundle',
    perTray: 'Tray',
    perPiece: 'Piece'
  };
  return map[unit] || unit || 'Unit';
};

const orderTypeLabel = (type, isPreOrderFlag) => {
  const t = (type || '').toLowerCase();
  if (t === 'preorder' || isPreOrderFlag) return 'Pre-Order';
  if (t === 'wholesale') return 'Wholesale';
  return 'Normal';
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  let dateObj = value;
  if (typeof value?.toDate === 'function') {
    dateObj = value.toDate();
  } else if (!(value instanceof Date)) {
    dateObj = new Date(value);
  }
  if (Number.isNaN(dateObj)) return 'N/A';
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const getAddressDisplay = (location) => {
  if (!location) return 'N/A';
  if (typeof location === 'string') return location;
  if (location.address) return location.address;
  const parts = [];
  if (location.barangay) parts.push(location.barangay);
  if (location.municipality) parts.push(location.municipality);
  if (location.province) parts.push(location.province);
  return parts.length ? parts.join(', ') : 'N/A';
};

const statusClass = (status) => {
  const key = (status || '').toLowerCase();
  if (key === 'pending') return 'status-pending';
  if (key === 'processing') return 'status-processing';
  if (key === 'shipped') return 'status-shipped';
  if (key === 'delivered') return 'status-delivered';
  if (key === 'order received') return 'status-received';
  if (key === 'refund processing') return 'status-refund';
  if (key === 'cancelled') return 'status-cancelled';
  return 'status-neutral';
};

const buildPrintableHtml = () => {
  const rows = visibleOrders.value.length
    ? visibleOrders.value.map(order => `
        <tr>
          <td>${escapeHtml(formatOrderCode(order.orderCode))}</td>
          <td>${escapeHtml(order.username || 'Unknown')}</td>
          <td>${escapeHtml(order.productName || 'N/A')}</td>
          <td>${escapeHtml(orderTypeLabel(order.orderType, order.isPreOrder))}</td>
          <td>${escapeHtml(formatUnitAndQuantity(order))}</td>
          <td>${escapeHtml(getAddressDisplay(order.Location))}</td>
          <td>${escapeHtml(formatDateTime(order.timestamp || order.createdAt))}</td>
          <td>${escapeHtml(formatCurrency(order.totalPrice))}</td>
          <td>${escapeHtml(order.status || 'N/A')}</td>
        </tr>`).join('')
    : '<tr><td colspan="9">No orders available.</td></tr>';

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Orders Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        h1 { margin-bottom: 6px; color: #1f2937; }
        .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; font-size: 0.9rem; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.85rem; }
        th { background: #2e5c31; color: #fff; }
        tr:nth-child(even) { background: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>Orders Export</h1>
      <div class="meta">
        <div>Generated: <strong>${formattedGeneratedAt.value}</strong></div>
        <div>Status Filter: <strong>${escapeHtml(props.filterLabel)}</strong></div>
        <div>Date Range: <strong>${escapeHtml(props.dateRangeLabel)}</strong></div>
        <div>Search: <strong>${escapeHtml(props.searchLabel)}</strong></div>
        <div>Total Orders: <strong>${totalOrders.value}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order Code</th>
            <th>Customer</th>
            <th>Product</th>
            <th>Type</th>
            <th>Unit & Qty</th>
            <th>Location</th>
            <th>Date</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
  </html>`;
};

const openPrintWindow = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site.');
    return null;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableHtml());
  printWindow.document.close();
  return printWindow;
};

const handlePrint = () => {
  const printWindow = openPrintWindow();
  if (!printWindow) return;
  printWindow.focus();
  printWindow.print();
};

const handleSavePdf = async () => {
  if (isSavingPdf.value) return;
  const panelEl = panelRef.value;
  if (!panelEl) {
    alert('Preview content is still loading. Please try again.');
    return;
  }

  isSavingPdf.value = true;
  try {
    const canvas = await html2canvas(panelEl, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`orders-export-${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (error) {
    console.error('Failed to save PDF:', error);
    alert('Saving PDF failed. Please try again.');
  } finally {
    isSavingPdf.value = false;
  }
};

const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
};
</script>

<style scoped>
.pdf-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
  padding: 24px;
}

.pdf-preview-panel {
  background: #ffffff;
  width: min(1200px, 100%);
  max-height: 90vh;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.preview-eyebrow {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #22c55e;
  margin: 0 0 6px;
  font-weight: 600;
}

.preview-subtitle {
  margin: 6px 0 0;
  color: #475569;
  font-size: 0.95rem;
}

.close-btn {
  border: none;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  font-size: 1.3rem;
  cursor: pointer;
}

.preview-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 16px;
}

.meta-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 4px;
}

.meta-value {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
}

.preview-table-wrapper {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  margin-bottom: 20px;
  overflow-x: auto;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 960px;
}

.preview-table th,
.preview-table td {
  padding: 10px 12px;
  font-size: 0.85rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}

.preview-table th {
  font-weight: 600;
  color: #475569;
  background: #f1f5f9;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-processing { background: #e0f2fe; color: #0369a1; }
.status-shipped { background: #dbeafe; color: #1d4ed8; }
.status-delivered { background: #d1fae5; color: #047857; }
.status-received { background: #ecfccb; color: #3f6212; }
.status-refund { background: #fff7ed; color: #c2410c; }
.status-cancelled { background: #fee2e2; color: #b91c1c; }
.status-neutral { background: #f1f5f9; color: #475569; }

.empty-state {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  grid-column: 1 / -1;
}

.preview-footer {
  margin-top: auto;
}

.actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.primary-actions {
  display: flex;
  gap: 12px;
}

.secondary-btn,
.outline-btn,
.primary-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn {
  background: #e2e8f0;
  color: #0f172a;
}

.outline-btn {
  background: transparent;
  border: 2px solid #94a3b8;
  color: #0f172a;
}

.primary-btn {
  background: #22c55e;
  color: #fff;
}

.primary-btn:disabled {
  background: #86efac;
  cursor: not-allowed;
}

.preview-hint {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 0.85rem;
}

@media (max-width: 1024px) {
  .preview-table tbody tr {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .preview-table thead {
    display: none;
  }

  .preview-table tbody td {
    border-right: none;
    padding: 8px 10px;
  }

  .preview-table tbody tr {
    border-bottom: 1px solid #e2e8f0;
  }
}
</style>
