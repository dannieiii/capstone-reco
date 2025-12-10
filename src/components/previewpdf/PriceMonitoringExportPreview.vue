<template>
  <div v-if="modelValue" class="pdf-preview-overlay">
    <div class="pdf-preview-panel" ref="previewPanelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>{{ title }}</h2>
          <p class="preview-subtitle">
            {{ subtitle }}
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
          <p class="meta-label">Products in View</p>
          <p class="meta-value">{{ productCount }}</p>
        </div>
        <div>
          <p class="meta-label">Units Displayed</p>
          <p class="meta-value">{{ rows.length }}</p>
        </div>
        <div>
          <p class="meta-label">Average Deviation</p>
          <p class="meta-value">{{ averageDeviation }}</p>
        </div>
      </section>

      <section class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Seller</th>
              <th>Unit</th>
              <th>Current Price</th>
              <th>D.A. Min</th>
              <th>D.A. Max</th>
              <th>Deviation</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="cell-primary">
                  <span class="cell-title">{{ row.productName }}</span>
                  <span v-if="row.variety && row.variety !== 'Normal'" class="cell-subtitle">{{ row.variety }}</span>
                </div>
              </td>
              <td>{{ row.category }}</td>
              <td>{{ row.seller }}</td>
              <td>{{ row.unit }}</td>
              <td>₱{{ formatPrice(row.currentPrice) }}</td>
              <td>
                <span v-if="row.daMin !== null" class="da-value">₱{{ formatPrice(row.daMin) }}</span>
                <span v-else class="no-data">N/A</span>
              </td>
              <td>
                <span v-if="row.daMax !== null" class="da-value">₱{{ formatPrice(row.daMax) }}</span>
                <span v-else class="no-data">N/A</span>
              </td>
              <td>
                <span v-if="row.deviation !== null" :class="['deviation-chip', deviationClass(row.deviation)]">
                  {{ formatDeviation(row.deviation) }}
                </span>
                <span v-else class="no-data">N/A</span>
              </td>
              <td>
                <span class="status-chip" :class="statusClass(row.status)">{{ row.status }}</span>
              </td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="9" class="empty-row">No products available for preview.</td>
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
        <p class="preview-hint">Need different rows? Adjust filters or pagination in the monitoring table, then reopen this preview.</p>
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
  rows: {
    type: Array,
    default: () => []
  },
  generatedAt: {
    type: [String, Date],
    default: () => new Date()
  },
  title: {
    type: String,
    default: 'Product Price Analysis'
  },
  subtitle: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);
const previewPanelRef = ref(null);
const isSavingPdf = ref(false);

const formattedGeneratedAt = computed(() => {
  const date = props.generatedAt ? new Date(props.generatedAt) : new Date();
  return date.toLocaleString();
});

const productCount = computed(() => {
  const names = new Set(props.rows.map(row => row.productName));
  return names.size;
});

const averageDeviation = computed(() => {
  const deviations = props.rows
    .map(row => (typeof row.deviation === 'number' ? row.deviation : null))
    .filter(value => value !== null);
  if (!deviations.length) return 'N/A';
  const avg = deviations.reduce((sum, value) => sum + value, 0) / deviations.length;
  const rounded = avg > 0 ? `+${avg.toFixed(1)}%` : `${avg.toFixed(1)}%`;
  return rounded;
});

const closePreview = () => emit('update:modelValue', false);

const formatPrice = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '0.00';
  }
  return value.toFixed(2);
};

const formatDeviation = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'N/A';
  }
  return value > 0 ? `+${value.toFixed(1)}%` : `${value.toFixed(1)}%`;
};

const deviationClass = (value) => {
  if (value === null || Number.isNaN(value)) return 'deviation-neutral';
  const abs = Math.abs(value);
  if (abs > 50) return 'deviation-severe';
  if (abs > 25) return 'deviation-warning';
  if (abs > 10) return 'deviation-watch';
  return 'deviation-ok';
};

const statusClass = (status) => {
  if (!status) return 'status-neutral';
  const key = status.toLowerCase();
  if (key.includes('over')) return 'status-overpriced';
  if (key.includes('under')) return 'status-underpriced';
  if (key.includes('normal') || key.includes('within')) return 'status-normal';
  return 'status-neutral';
};

const buildPrintableRows = () => {
  return props.rows.map(row => {
    const daMin = row.daMin !== null && row.daMin !== undefined ? `₱${formatPrice(row.daMin)}` : 'N/A';
    const daMax = row.daMax !== null && row.daMax !== undefined ? `₱${formatPrice(row.daMax)}` : 'N/A';
    const deviation = row.deviation !== null && row.deviation !== undefined ? formatDeviation(row.deviation) : 'N/A';
    return `
      <tr>
        <td>${escapeHtml(row.productName)}</td>
        <td>${escapeHtml(row.category || '')}</td>
        <td>${escapeHtml(row.seller || '')}</td>
        <td>${escapeHtml(row.unit || '')}</td>
        <td>₱${formatPrice(row.currentPrice)}</td>
        <td>${daMin}</td>
        <td>${daMax}</td>
        <td>${deviation}</td>
        <td>${escapeHtml(row.status || '')}</td>
      </tr>
    `;
  }).join('');
};

const buildPrintableHtml = () => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${props.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        h1 { color: #2e5c31; margin-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.9rem; }
        th { background-color: #f3f4f6; font-weight: 600; }
        tr:nth-child(even) { background-color: #fafafa; }
      </style>
    </head>
    <body>
      <h1>${props.title}</h1>
      <p class="subtitle">Generated on ${formattedGeneratedAt.value} • ${props.rows.length} unit rows</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Seller</th>
            <th>Unit</th>
            <th>Current Price</th>
            <th>D.A. Min</th>
            <th>D.A. Max</th>
            <th>Deviation</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${buildPrintableRows() || '<tr><td colspan="9">No data available.</td></tr>'}
        </tbody>
      </table>
    </body>
  </html>`;
};

const openPrintWindow = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups for this site to print or save the PDF.');
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
  const panelEl = previewPanelRef.value;
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

    pdf.save(`price-monitoring-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  z-index: 2000;
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

.preview-header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #111827;
}

.preview-subtitle {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: #9ca3af;
  align-self: flex-start;
}

.preview-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.meta-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-bottom: 4px;
}

.meta-value {
  margin: 0;
  font-weight: 600;
  color: #111827;
}

.preview-table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 0.9rem;
}

.preview-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 1;
  font-weight: 600;
  color: #475569;
}

.cell-primary {
  display: flex;
  flex-direction: column;
}

.cell-title {
  font-weight: 600;
  color: #0f172a;
}

.cell-subtitle {
  font-size: 0.8rem;
  color: #64748b;
}

.da-value {
  color: #155e75;
  font-weight: 600;
}

.deviation-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
}

.deviation-severe { background: #fee2e2; color: #b91c1c; }
.deviation-warning { background: #ffedd5; color: #c2410c; }
.deviation-watch { background: #fef9c3; color: #854d0e; }
.deviation-ok { background: #dcfce7; color: #15803d; }
.deviation-neutral { background: #e2e8f0; color: #475569; }

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-overpriced { background: #fee2e2; color: #b91c1c; }
.status-underpriced { background: #dbeafe; color: #1d4ed8; }
.status-normal { background: #dcfce7; color: #15803d; }
.status-neutral { background: #e2e8f0; color: #475569; }

.no-data {
  color: #94a3b8;
  font-style: italic;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

.preview-footer {
  margin-top: 20px;
}

.actions {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.primary-actions {
  display: flex;
  gap: 12px;
}

.primary-btn,
.outline-btn,
.secondary-btn {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  border: none;
}

.primary-btn { background: #2e5c31; color: #fff; }
.primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.outline-btn { background: transparent; border: 1px solid #2e5c31; color: #2e5c31; }
.secondary-btn { background: #f1f5f9; color: #475569; }

.preview-hint {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .pdf-preview-panel { padding: 20px; }
  .preview-header { flex-direction: column; }
  .actions { flex-direction: column; align-items: stretch; }
  .primary-actions { width: 100%; }
  .primary-actions button,
  .secondary-btn { width: 100%; }
}
</style>
