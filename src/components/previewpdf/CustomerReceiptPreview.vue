<template>
  <div v-if="modelValue" class="receipt-preview-overlay">
    <div class="receipt-preview-panel">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Receipt Preview</p>
          <h2>Customer Receipt</h2>
          <p class="preview-subtitle">Review this receipt before printing or saving it as a PDF.</p>
        </div>
        <button
          class="close-btn"
          type="button"
          aria-label="Close preview"
          data-html2canvas-ignore="true"
          @click="closePreview"
        >
          &times;
        </button>
      </header>

      <div v-if="isLoading" class="empty-preview loading-state">
        <p>Preparing receipt details...</p>
      </div>

      <div v-else-if="hasReceipt" class="preview-body">
        <section class="receipt-meta">
          <div class="meta-item">
            <p class="meta-label">Order Code</p>
            <p class="meta-value">{{ receiptDetails.orderCode || 'N/A' }}</p>
          </div>
          <div class="meta-item">
            <p class="meta-label">Order Date</p>
            <p class="meta-value">{{ receiptDetails.orderDate || 'N/A' }}</p>
          </div>
          <div class="meta-item">
            <p class="meta-label">Payment Method</p>
            <p class="meta-value">{{ receiptDetails.paymentMethod || 'N/A' }}</p>
          </div>
          <div class="meta-item">
            <p class="meta-label">Payment Status</p>
            <p class="meta-value">{{ receiptDetails.paymentStatus || 'N/A' }}</p>
          </div>
          <div class="meta-item">
            <p class="meta-label">Order Status</p>
            <p class="meta-value"><span class="status-chip">{{ receiptDetails.status || 'N/A' }}</span></p>
          </div>
        </section>

        <section class="info-grid">
          <article>
            <h3>Seller</h3>
            <p><strong>Name:</strong> {{ receiptDetails.sellerName || 'N/A' }}</p>
            <p><strong>Address:</strong> {{ receiptDetails.sellerAddress || 'N/A' }}</p>
          </article>
          <article>
            <h3>Shipping</h3>
            <p><strong>Address:</strong> {{ receiptDetails.shippingAddress || 'N/A' }}</p>
            <p v-if="receiptDetails.instructions"><strong>Instructions:</strong> {{ receiptDetails.instructions }}</p>
            <p v-if="receiptDetails.deliveryLabel"><strong>Delivery:</strong> {{ receiptDetails.deliveryLabel }}</p>
          </article>
          <article>
            <h3>Customer</h3>
            <p><strong>Name:</strong> {{ receiptDetails.customerName || 'N/A' }}</p>
            <p><strong>Total:</strong> {{ formatCurrency(receiptDetails.total) }}</p>
          </article>
        </section>

        <section class="items-section">
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
                <td>{{ item.quantity }}</td>
                <td>{{ formatCurrency(item.unitPrice) }}</td>
                <td>{{ formatCurrency(item.subtotal) }}</td>
              </tr>
              <tr v-if="!lineItems.length">
                <td colspan="5" class="empty-row">No items available.</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="totals-section">
          <div class="totals-row" v-if="Number(receiptDetails.deliveryFee)">
            <span>Delivery Fee</span>
            <span>{{ formatCurrency(receiptDetails.deliveryFee) }}</span>
          </div>
          <div class="totals-row" v-if="Number(receiptDetails.tax)">
            <span>Tax</span>
            <span>{{ formatCurrency(receiptDetails.tax) }}</span>
          </div>
          <div class="totals-row total">
            <span>Total</span>
            <span>{{ formatCurrency(receiptDetails.total) }}</span>
          </div>
        </section>

        <p class="preview-note">Need to adjust something? Close this preview, make your changes, then reopen the receipt.</p>
      </div>

      <div v-else class="empty-preview">
        <p>Receipt details are unavailable. Please close this preview and try again.</p>
      </div>

      <footer class="preview-footer" data-html2canvas-ignore="true">
        <div class="actions">
          <button type="button" class="secondary-btn" @click="closePreview">Close</button>
          <div class="primary-actions">
            <button type="button" class="outline-btn" :disabled="!hasReceipt || isLoading" @click="handlePrint">Print</button>
            <button type="button" class="primary-btn" :disabled="!hasReceipt || isSavingPdf || isLoading" @click="handleSavePdf">
              <span v-if="isSavingPdf">Saving...</span>
              <span v-else>Save PDF</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import jsPDF from 'jspdf';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  receipt: {
    type: Object,
    default: () => null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
const isSavingPdf = ref(false);

const receiptDetails = computed(() => props.receipt || {});
const lineItems = computed(() => receiptDetails.value.items || []);
const hasReceipt = computed(() => Object.keys(receiptDetails.value).length > 0);
const isLoading = computed(() => props.loading);

const closePreview = () => emit('update:modelValue', false);

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `₱${num.toFixed(2)}`;
};

const escapeHtml = (text) => {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
};

const printableStyles = `
  body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
  h1 { margin-bottom: 6px; color: #1f2937; }
  .meta { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; font-size: 0.9rem; color: #4b5563; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.85rem; }
  th { background: #2e5c31; color: #fff; }
  tr:nth-child(even) { background: #f9fafb; }
  .totals { margin-top: 12px; }
  .totals td { border: none; font-weight: 600; }
`;

const buildPrintableBody = () => {
  const r = receiptDetails.value;
  const rows = lineItems.value.length
    ? lineItems.value.map(item => `
        <tr>
          <td>${escapeHtml(item.name || 'N/A')}</td>
          <td>${escapeHtml(item.unit || 'Unit')}</td>
          <td>${escapeHtml(item.quantity ?? 0)}</td>
          <td>${escapeHtml(formatCurrency(item.unitPrice))}</td>
          <td>${escapeHtml(formatCurrency(item.subtotal))}</td>
        </tr>`).join('')
    : '<tr><td colspan="5">No items available.</td></tr>';

  const deliveryRow = Number(r.deliveryFee)
    ? `<tr><td colspan="4">Delivery Fee</td><td>${escapeHtml(formatCurrency(r.deliveryFee))}</td></tr>`
    : '';
  const taxRow = Number(r.tax)
    ? `<tr><td colspan="4">Tax</td><td>${escapeHtml(formatCurrency(r.tax))}</td></tr>`
    : '';

  return `
    <h1>FarmXpress Receipt</h1>
    <div class="meta">
      <div>Order Code: <strong>${escapeHtml(r.orderCode || 'N/A')}</strong></div>
      <div>Date: <strong>${escapeHtml(r.orderDate || 'N/A')}</strong></div>
      <div>Payment Method: <strong>${escapeHtml(r.paymentMethod || 'N/A')}</strong></div>
      <div>Payment Status: <strong>${escapeHtml(r.paymentStatus || 'N/A')}</strong></div>
      <div>Status: <strong>${escapeHtml(r.status || 'N/A')}</strong></div>
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
        ${rows}
      </tbody>
    </table>
    <table class="totals">
      ${deliveryRow}
      ${taxRow}
      <tr>
        <td colspan="4">Total</td>
        <td>${escapeHtml(formatCurrency(r.total))}</td>
      </tr>
    </table>
    <p style="margin-top:16px;color:#4b5563;">Seller: <strong>${escapeHtml(r.sellerName || 'N/A')}</strong></p>
    <p style="margin:0;color:#4b5563;">Shipping Address: <strong>${escapeHtml(r.shippingAddress || 'N/A')}</strong></p>
  `;
};

const buildPrintableHtml = () => `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt ${escapeHtml(receiptDetails.value.orderCode || '')}</title>
      <style>${printableStyles}</style>
    </head>
    <body>
      ${buildPrintableBody()}
    </body>
  </html>`;

const createPrintableElement = () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <style>${printableStyles}</style>
    ${buildPrintableBody()}
  `;
  return container;
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

  isSavingPdf.value = true;
  const hiddenContainer = document.createElement('div');
  hiddenContainer.style.position = 'fixed';
  hiddenContainer.style.top = '-99999px';
  hiddenContainer.style.left = '-99999px';
  hiddenContainer.style.width = '900px';
  const printableElement = createPrintableElement();
  hiddenContainer.appendChild(printableElement);
  document.body.appendChild(hiddenContainer);

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    await pdf.html(printableElement, {
      margin: [12, 12, 12, 12],
      autoPaging: 'text',
      html2canvas: { scale: 0.7, useCORS: true },
      callback(doc) {
        doc.save(`receipt-${receiptDetails.value.orderCode || 'order'}.pdf`);
      }
    });
  } catch (error) {
    console.error('Failed to save PDF:', error);
    alert('Saving PDF failed. Please try again.');
  } finally {
    document.body.removeChild(hiddenContainer);
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
.receipt-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2200;
  padding: 24px;
}

.receipt-preview-panel {
  width: min(960px, 100%);
  max-height: 92vh;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.35);
  padding: 28px;
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

.preview-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.receipt-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 20px;
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

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.info-grid article {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  background: #fff;
}

.info-grid h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #0f172a;
}

.info-grid p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #475569;
}

.items-section {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
}

.items-section table {
  width: 100%;
  border-collapse: collapse;
}

.items-section th,
.items-section td {
  padding: 10px 12px;
  font-size: 0.85rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.items-section th {
  background: #f1f5f9;
  color: #475569;
  font-weight: 600;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

.totals-section {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: #fff;
  margin-bottom: 12px;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.95rem;
  color: #0f172a;
}

.totals-row.total {
  font-size: 1.1rem;
  font-weight: 700;
}

.preview-note {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0 0 12px;
}

.empty-preview {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94a3b8;
  padding: 40px 0;
}

.loading-state {
  flex-direction: column;
  gap: 12px;
  font-size: 0.95rem;
  color: #475569;
}

.preview-footer {
  margin-top: auto;
  padding-top: 16px;
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

.primary-btn:disabled,
.outline-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .receipt-preview-panel {
    padding: 20px;
  }

  .preview-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-actions {
    width: 100%;
    flex-direction: column;
  }

  .primary-actions button,
  .secondary-btn {
    width: 100%;
  }
}
</style>
