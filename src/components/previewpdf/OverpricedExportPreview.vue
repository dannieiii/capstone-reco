<template>
  <div v-if="modelValue" class="pdf-preview-overlay">
    <div class="pdf-preview-panel" ref="previewPanelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>Overpriced Products Report</h2>
          <p class="preview-subtitle">
            Focus on sellers whose prices exceed the D.A. reference range. Review before printing or saving.
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
          <p class="meta-label">Rows in View</p>
          <p class="meta-value">{{ rows.length }}</p>
        </div>
        <div>
          <p class="meta-label">Severe Cases</p>
          <p class="meta-value">{{ severeCount }}</p>
        </div>
        <div>
          <p class="meta-label">Pending Warnings</p>
          <p class="meta-value">{{ pendingWarningCount }}</p>
        </div>
      </section>

      <section class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Seller</th>
              <th>Unit</th>
              <th>Seller Price</th>
              <th>D.A. Max</th>
              <th>Excess</th>
              <th>Deviation</th>
              <th>Warning Level</th>
              <th>Status</th>
              <th>Last Warning</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="cell-primary">
                  <span class="cell-title">{{ row.productName }}</span>
                  <span class="cell-subtitle">{{ row.category }}</span>
                </div>
              </td>
              <td>{{ row.seller }}</td>
              <td>{{ row.unit }}</td>
              <td>₱{{ formatPrice(row.sellerPrice) }}</td>
              <td>₱{{ formatPrice(row.daMax) }}</td>
              <td>
                <span :class="['excess-chip', excessClass(row.excess)]">
                  ₱{{ formatPrice(row.excess) }}
                </span>
              </td>
              <td>
                <span class="deviation-chip" :class="deviationClass(row.deviation)">
                  {{ formatDeviation(row.deviation) }}
                </span>
              </td>
              <td>
                <span class="status-chip" :class="warningClass(row.warningLevel)">
                  {{ formatWarningLabel(row.warningLevel) }}
                </span>
              </td>
              <td>{{ row.status }}</td>
              <td>{{ row.lastWarning || 'Never' }}</td>
            </tr>
            <tr v-if="rows.length === 0">
              <td colspan="10" class="empty-row">No overpriced products available for preview.</td>
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
        <p class="preview-hint">Only the current table page is included. Adjust filters or pagination, then reopen the preview.</p>
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
  }
});

const emit = defineEmits(['update:modelValue']);
const previewPanelRef = ref(null);
const isSavingPdf = ref(false);

const formattedGeneratedAt = computed(() => {
  const date = props.generatedAt ? new Date(props.generatedAt) : new Date();
  return date.toLocaleString();
});

const severeCount = computed(() => props.rows.filter(row => row.warningLevel === 'severe').length);
const pendingWarningCount = computed(() => props.rows.filter(row => row.status?.toLowerCase().includes('pending')).length);

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

const formatWarningLabel = (level) => {
  if (!level) return 'Mild';
  const map = {
    severe: 'Severe',
    moderate: 'Moderate',
    mild: 'Mild'
  };
  return map[level] || level;
};

const excessClass = (value) => {
  if (value > 50) return 'excess-severe';
  if (value > 20) return 'excess-warning';
  return 'excess-mild';
};

const deviationClass = (value) => {
  if (value === null || Number.isNaN(value)) return 'deviation-neutral';
  if (value >= 50) return 'deviation-severe';
  if (value >= 25) return 'deviation-warning';
  return 'deviation-mild';
};

const warningClass = (level) => {
  if (level === 'severe') return 'status-severe';
  if (level === 'moderate') return 'status-moderate';
  return 'status-mild';
};

const buildPrintableRows = () => {
  return props.rows.map(row => `
    <tr>
      <td>${escapeHtml(row.productName)}</td>
      <td>${escapeHtml(row.seller)}</td>
      <td>${escapeHtml(row.unit)}</td>
      <td>₱${formatPrice(row.sellerPrice)}</td>
      <td>₱${formatPrice(row.daMax)}</td>
      <td>₱${formatPrice(row.excess)}</td>
      <td>${formatDeviation(row.deviation)}</td>
      <td>${escapeHtml(formatWarningLabel(row.warningLevel))}</td>
      <td>${escapeHtml(row.status || '')}</td>
      <td>${escapeHtml(row.lastWarning || 'Never')}</td>
    </tr>
  `).join('');
};

const buildPrintableHtml = () => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Overpriced Products Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        h1 { color: #b91c1c; margin-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.9rem; }
        th { background-color: #fef2f2; font-weight: 600; }
        tr:nth-child(even) { background-color: #fff7ed; }
      </style>
    </head>
    <body>
      <h1>Overpriced Products Report</h1>
      <p class="subtitle">Generated on ${formattedGeneratedAt.value} • ${props.rows.length} records</p>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Seller</th>
            <th>Unit</th>
            <th>Seller Price</th>
            <th>D.A. Max</th>
            <th>Excess</th>
            <th>Deviation</th>
            <th>Warning Level</th>
            <th>Status</th>
            <th>Last Warning</th>
          </tr>
        </thead>
        <tbody>
          ${buildPrintableRows() || '<tr><td colspan="10">No data available.</td></tr>'}
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

    pdf.save(`overpriced-products-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  width: min(1150px, 100%);
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
  color: #f97316;
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
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.meta-label {
  font-size: 0.8rem;
  color: #9a3412;
  margin-bottom: 4px;
}

.meta-value {
  margin: 0;
  font-weight: 600;
  color: #7c2d12;
}

.preview-table-wrapper {
  flex: 1;
  overflow: auto;
  border: 1px solid #ffe4e6;
  border-radius: 12px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 12px;
  border-bottom: 1px solid #fee2e2;
  text-align: left;
  font-size: 0.9rem;
}

.preview-table th {
  position: sticky;
  top: 0;
  background: #fff1f2;
  z-index: 1;
  font-weight: 600;
  color: #9f1239;
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
  color: #a1a1aa;
}

.excess-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
}

.excess-severe { background: #fee2e2; color: #b91c1c; }
.excess-warning { background: #ffedd5; color: #c2410c; }
.excess-mild { background: #fef9c3; color: #854d0e; }

.deviation-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.8rem;
}

.deviation-severe { background: #fee2e2; color: #b91c1c; }
.deviation-warning { background: #ffedd5; color: #c2410c; }
.deviation-mild { background: #fef9c3; color: #92400e; }
.deviation-neutral { background: #e2e8f0; color: #475569; }

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-severe { background: #fee2e2; color: #991b1b; }
.status-moderate { background: #ffedd5; color: #c2410c; }
.status-mild { background: #fef9c3; color: #854d0e; }

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

.primary-btn { background: #be123c; color: #fff; }
.primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.outline-btn { background: transparent; border: 1px solid #b91c1c; color: #b91c1c; }
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
