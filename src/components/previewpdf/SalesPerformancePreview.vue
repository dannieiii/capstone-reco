<template>
  <div v-if="modelValue" class="pdf-preview-overlay">
    <div class="pdf-preview-panel" ref="panelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>{{ title }}</h2>
          <p class="preview-subtitle">{{ subtitle }}</p>
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
          <p class="meta-label">Chart View</p>
          <p class="meta-value">{{ subtitle || 'Current View' }}</p>
        </div>
        <div>
          <p class="meta-label">Data Points</p>
          <p class="meta-value">{{ stats.length }}</p>
        </div>
      </section>

      <section class="chart-preview">
        <img v-if="chartSrc" :src="chartSrc" alt="Sales performance chart" />
        <div v-else class="chart-placeholder">
          <span>No chart snapshot available.</span>
        </div>
      </section>

      <section v-if="stats.length" class="stats-grid">
        <article v-for="(item, index) in stats" :key="index" class="stat-card">
          <p class="stat-label">{{ item.label }}</p>
          <p class="stat-value">{{ item.value }}</p>
        </article>
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
          Use Print or Save PDF to export this snapshot. Update chart filters and reopen the preview for fresh data.
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
  chartSrc: {
    type: String,
    default: ''
  },
  generatedAt: {
    type: [String, Date],
    default: () => new Date()
  },
  title: {
    type: String,
    default: 'Sales Performance Snapshot'
  },
  subtitle: {
    type: String,
    default: ''
  },
  stats: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);
const panelRef = ref(null);
const isSavingPdf = ref(false);

const formattedGeneratedAt = computed(() => {
  const date = props.generatedAt ? new Date(props.generatedAt) : new Date();
  return date.toLocaleString();
});

const closePreview = () => emit('update:modelValue', false);

const buildPrintableHtml = () => {
  const statsRows = props.stats.length
    ? props.stats.map(item => `<tr><td>${escapeHtml(item.label)}</td><td>${escapeHtml(item.value)}</td></tr>`).join('')
    : '<tr><td colspan="2">No summary statistics available.</td></tr>';

  const chartBlock = props.chartSrc
    ? `<img src="${props.chartSrc}" alt="Sales performance chart" />`
    : '<div class="placeholder">No chart snapshot available.</div>';

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(props.title)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        h1 { margin-bottom: 4px; color: #14532d; }
        p { margin-top: 0; color: #4b5563; }
        .chart { margin: 24px 0; text-align: center; }
        .chart img { max-width: 100%; height: auto; border: 1px solid #d1d5db; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(props.title)}</h1>
      <p>${escapeHtml(props.subtitle)}</p>
      <p>Generated on: ${formattedGeneratedAt.value}</p>
      <div class="chart">${chartBlock}</div>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          ${statsRows}
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
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`sales-performance-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  width: min(1100px, 100%);
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
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
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
  font-size: 1.1rem;
  font-weight: 600;
  color: #0f172a;
}

.chart-preview {
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: #f8fafc;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  max-height: 360px;
  overflow: hidden;
}

.chart-preview img {
  width: 100%;
  height: auto;
  max-height: 320px;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08);
  object-fit: contain;
}

.chart-placeholder {
  width: 100%;
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.95rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  padding: 16px;
  background: #ffffff;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #94a3b8;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
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

@media (max-width: 640px) {
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
