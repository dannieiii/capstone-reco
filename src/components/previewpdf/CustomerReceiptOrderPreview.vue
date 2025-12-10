<template>
  <div v-if="modelValue" class="order-receipt-overlay">
    <div class="order-receipt-panel" ref="previewPanel">
      <header class="panel-header">
        <div>
          <p class="eyebrow">FarmXpress</p>
          <h2>Customer Receipt</h2>
          <p class="subtitle">Preview the full receipt, then decide whether to print or save it.</p>
        </div>
        <button type="button" class="close-btn" aria-label="Close" @click="closePreview">
          &times;
        </button>
      </header>

      <div v-if="isLoading" class="panel-loading">
        <p>Preparing receipt...</p>
      </div>

      <div v-else-if="hasReceipt" class="panel-body">
        <section class="hero">
          <h3 class="brand">FarmXpress</h3>
          <p class="hero-subtitle">Customer Receipt</p>
          <p class="hero-order">Order {{ renderOrderCode }}</p>
          <p class="hero-date">{{ receiptDetails.orderDate || 'N/A' }}</p>
        </section>

        <section class="triple-grid">
          <article>
            <h4>Seller</h4>
            <p><strong>Name:</strong> {{ receiptDetails.sellerName || 'N/A' }}</p>
            <p><strong>Address:</strong> {{ receiptDetails.sellerAddress || 'N/A' }}</p>
          </article>
          <article>
            <h4>Shipping To</h4>
            <p><strong>Name:</strong> {{ receiptDetails.customerName || receiptDetails.shippingName || 'N/A' }}</p>
            <p><strong>Address:</strong> {{ receiptDetails.shippingAddress || 'N/A' }}</p>
          </article>
          <article>
            <h4>Order Summary</h4>
            <p><strong>Status:</strong>
              <span class="status-chip">{{ receiptDetails.status || 'N/A' }}</span>
            </p>
            <p><strong>Payment Method:</strong> {{ receiptDetails.paymentMethod || 'N/A' }}</p>
            <p><strong>Payment Status:</strong> {{ receiptDetails.paymentStatus || 'N/A' }}</p>
            <p><strong>Order Code:</strong> {{ receiptDetails.orderCode || 'N/A' }}</p>
          </article>
        </section>

        <section class="items-table">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in lineItems" :key="index">
                <td>{{ item.name || 'N/A' }}</td>
                <td>{{ item.unit || 'Unit' }}</td>
                <td>{{ item.quantity ?? 0 }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>{{ formatCurrency(item.subtotal) }}</td>
              </tr>
              <tr v-if="!lineItems.length">
                <td colspan="5" class="empty">No products available.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="totals">
          <div class="row" v-if="Number(receiptDetails.deliveryFee)">
            <span>Delivery Fee</span>
            <span>{{ formatCurrency(receiptDetails.deliveryFee) }}</span>
          </div>
          <div class="row" v-if="Number(receiptDetails.tax)">
            <span>Tax</span>
            <span>{{ formatCurrency(receiptDetails.tax) }}</span>
          </div>
          <div class="row total">
            <span>Total</span>
            <span>{{ formatCurrency(receiptDetails.total) }}</span>
          </div>
        </section>

        <p class="note">Thank you for your order! Keep this receipt for your records.</p>
      </div>

      <div v-else class="panel-loading">
        <p>Receipt details unavailable. Please close this window and try again.</p>
      </div>

      <footer class="panel-footer" data-html2canvas-ignore="true">
        <button type="button" class="secondary" @click="closePreview">Close</button>
        <div class="primary-group">
          <button type="button" class="outline" :disabled="!hasReceipt || isLoading" @click="handlePrint">
            Print
          </button>
          <button
            type="button"
            class="primary"
            :disabled="!hasReceipt || isLoading || isSavingPdf"
            @click="handleSavePdf"
          >
            <span v-if="isSavingPdf">Saving...</span>
            <span v-else>Save PDF</span>
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  receipt: { type: Object, default: () => null },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);
const isSavingPdf = ref(false);
const previewPanel = ref(null);

const receiptDetails = computed(() => props.receipt || {});
const lineItems = computed(() => receiptDetails.value.items || []);
const hasReceipt = computed(() => Object.keys(receiptDetails.value).length > 0);
const isLoading = computed(() => props.loading);
const renderOrderCode = computed(() => `#${receiptDetails.value.orderCode || 'N/A'}`);

const closePreview = () => emit('update:modelValue', false);

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `₱${num.toFixed(2)}`;
};

const printableStyles = `
  body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }
  .hero { text-align: center; margin-bottom: 16px; }
  .brand { color: #1b5e20; margin: 0; font-size: 26px; }
  .hero-order { font-weight: 600; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
  th { background: #f1f5f9; }
  .grid { display: flex; gap: 16px; margin-top: 16px; }
  .grid section { flex: 1; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
  .totals { margin-top: 20px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
  .row.total { font-size: 18px; font-weight: 700; }
`;

const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
};

const buildItemsHtml = () => {
  if (!lineItems.value.length) {
    return '<tr><td colspan="5">No products available.</td></tr>';
  }
  return lineItems.value.map((item) => `
    <tr>
      <td>${escapeHtml(item.name || 'N/A')}</td>
      <td>${escapeHtml(item.unit || 'Unit')}</td>
      <td>${escapeHtml(item.quantity ?? 0)}</td>
      <td>${escapeHtml(formatCurrency(item.unitPrice))}</td>
      <td>${escapeHtml(formatCurrency(item.subtotal))}</td>
    </tr>
  `).join('');
};

const buildPrintableHtml = () => {
  const r = receiptDetails.value;
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt ${escapeHtml(r.orderCode || '')}</title>
      <style>${printableStyles}</style>
    </head>
    <body>
      <div class="hero">
        <h1 class="brand">FarmXpress</h1>
        <p>Customer Receipt</p>
        <p class="hero-order">Order ${escapeHtml(r.orderCode || 'N/A')}</p>
        <p>${escapeHtml(r.orderDate || '')}</p>
      </div>
      <div class="grid">
        <section>
          <h3>Seller</h3>
          <p><strong>Name:</strong> ${escapeHtml(r.sellerName || 'N/A')}</p>
          <p><strong>Address:</strong> ${escapeHtml(r.sellerAddress || 'N/A')}</p>
        </section>
        <section>
          <h3>Shipping To</h3>
          <p><strong>Name:</strong> ${escapeHtml(r.customerName || r.shippingName || 'N/A')}</p>
          <p><strong>Address:</strong> ${escapeHtml(r.shippingAddress || 'N/A')}</p>
        </section>
        <section>
          <h3>Order Summary</h3>
          <p><strong>Status:</strong> ${escapeHtml(r.status || 'N/A')}</p>
          <p><strong>Payment Method:</strong> ${escapeHtml(r.paymentMethod || 'N/A')}</p>
          <p><strong>Payment Status:</strong> ${escapeHtml(r.paymentStatus || 'N/A')}</p>
          <p><strong>Order Code:</strong> ${escapeHtml(r.orderCode || 'N/A')}</p>
        </section>
      </div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Unit</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${buildItemsHtml()}
        </tbody>
      </table>
      <div class="totals">
        ${Number(r.deliveryFee) ? `<div class="row"><span>Delivery Fee</span><span>${escapeHtml(formatCurrency(r.deliveryFee))}</span></div>` : ''}
        ${Number(r.tax) ? `<div class="row"><span>Tax</span><span>${escapeHtml(formatCurrency(r.tax))}</span></div>` : ''}
        <div class="row total">
          <span>Total</span>
          <span>${escapeHtml(formatCurrency(r.total))}</span>
        </div>
      </div>
    </body>
  </html>`;
};

const handlePrint = () => {
  if (!hasReceipt.value || isLoading.value) return;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(buildPrintableHtml());
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const handleSavePdf = async () => {
  if (!hasReceipt.value || isSavingPdf.value || isLoading.value) return;
  if (!previewPanel.value) return;
  isSavingPdf.value = true;

  try {
    const canvas = await html2canvas(previewPanel.value, {
      scale: window.devicePixelRatio || 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      ignoreElements: (element) => element?.dataset?.html2canvasIgnore === 'true'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const ratio = Math.min(pageWidth / imgProps.width, pageHeight / imgProps.height);
    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = Math.max((pageHeight - imgHeight) / 2, 10);

    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(`receipt-${receiptDetails.value.orderCode || 'order'}.pdf`);
  } catch (error) {
    console.error('Failed to save PDF:', error);
    alert('Saving PDF failed. Please try again.');
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
.order-receipt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  padding: 24px;
}

.order-receipt-panel {
  width: min(940px, 100%);
  max-height: 92vh;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.35);
  padding: 28px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.eyebrow {
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1b5e20;
  margin: 0 0 6px;
  font-weight: 600;
}

.subtitle {
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

.panel-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #64748b;
  padding: 40px;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.hero {
  text-align: center;
  border-bottom: 1px solid #cbd5f5;
  padding-bottom: 16px;
  margin-bottom: 24px;
}

.brand {
  font-size: 26px;
  margin: 0;
  color: #1b5e20;
}

.hero-subtitle,
.hero-order,
.hero-date {
  margin: 4px 0;
  color: #475569;
}

.triple-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.triple-grid article {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #fff;
}

.triple-grid h4 {
  margin: 0 0 8px;
  color: #0f172a;
}

.triple-grid p {
  margin: 4px 0;
  color: #475569;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2f1;
  color: #00695c;
  font-size: 0.75rem;
  font-weight: 600;
}

.items-table {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
}

.items-table table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  font-size: 0.9rem;
}

.items-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #475569;
}

.empty {
  text-align: center;
  font-style: italic;
  color: #94a3b8;
}

.totals {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
}

.totals .row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: #0f172a;
}

.totals .row.total {
  font-size: 1.1rem;
  font-weight: 700;
}

.note {
  font-size: 0.9rem;
  color: #94a3b8;
  text-align: center;
}

.panel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.primary-group {
  display: flex;
  gap: 12px;
}

.secondary,
.outline,
.primary {
  border-radius: 999px;
  padding: 10px 20px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.outline {
  background: transparent;
  border: 2px solid #94a3b8;
  color: #0f172a;
}

.primary {
  background: #1b5e20;
  color: #fff;
}

.primary:disabled,
.outline:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .order-receipt-panel {
    padding: 20px;
  }
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .panel-footer {
    flex-direction: column;
  }
  .primary-group {
    width: 100%;
    flex-direction: column;
  }
  .primary-group button,
  .secondary {
    width: 100%;
  }
}
</style>
