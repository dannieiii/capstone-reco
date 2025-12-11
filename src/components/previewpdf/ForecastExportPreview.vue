<template>
  <div v-if="modelValue" class="forecast-preview-overlay">
    <div class="forecast-preview-panel" ref="panelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>{{ title }}</h2>
          <p v-if="subtitle" class="preview-subtitle">{{ subtitle }}</p>
          <p class="preview-generated">Generated on {{ formattedGeneratedAt }}</p>
        </div>
        <button
          type="button"
          class="close-btn"
          @click="closePreview"
          aria-label="Close preview"
          data-html2canvas-ignore="true"
        >
          &times;
        </button>
      </header>

      <div class="preview-body">
        <section v-if="metaItems.length" class="preview-meta">
          <div v-for="metric in metaItems" :key="metric.label" class="meta-item">
            <p class="meta-label">{{ metric.label }}</p>
            <p class="meta-value">{{ metric.value }}</p>
          </div>
        </section>

        <section
          v-for="(section, index) in sections"
          :key="`section-${index}`"
          class="preview-section"
        >
          <div class="section-heading">
            <div>
              <h3>{{ section.title }}</h3>
              <p v-if="section.description">{{ section.description }}</p>
            </div>
            <span v-if="section.badge" class="section-badge">{{ section.badge }}</span>
          </div>
          <div class="section-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th v-for="column in section.columns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rowIndex) in section.rows" :key="`row-${rowIndex}`">
                  <td v-for="(cell, cellIndex) in normalizeRow(row, section.columns.length)" :key="`cell-${cellIndex}`">
                    {{ cell }}
                  </td>
                </tr>
                <tr v-if="section.rows.length === 0">
                  <td :colspan="section.columns.length" class="empty-row">{{ section.emptyMessage || 'No data available.' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="section.note" class="section-note">{{ section.note }}</p>
        </section>

        <section v-if="insights.length" class="preview-insights">
          <h3>Insights & Recommendations</h3>
          <div class="insights-grid">
            <article
              v-for="(insight, index) in insights"
              :key="`insight-${index}`"
              class="insight-card"
              :class="`insight-${insight.type || 'info'}`"
            >
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
            </article>
          </div>
        </section>
      </div>

      <footer class="preview-footer" data-html2canvas-ignore="true">
        <div class="actions">
          <button type="button" class="secondary-btn" @click="closePreview">Close</button>
          <div class="primary-actions">
            <button type="button" class="outline-btn" @click="handlePrint">Print</button>
            <button type="button" class="primary-btn" @click="handleSavePdf" :disabled="isSavingPdf">
              {{ isSavingPdf ? 'Preparing…' : 'Save PDF' }}
            </button>
          </div>
        </div>
        <p v-if="footnote" class="preview-hint">{{ footnote }}</p>
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
  title: {
    type: String,
    default: 'Forecast Export Preview'
  },
  subtitle: {
    type: String,
    default: ''
  },
  generatedAt: {
    type: [String, Date],
    default: () => new Date()
  },
  metaItems: {
    type: Array,
    default: () => []
  },
  sections: {
    type: Array,
    default: () => []
  },
  insights: {
    type: Array,
    default: () => []
  },
  footnote: {
    type: String,
    default: ''
  },
  documentHtml: {
    type: String,
    default: ''
  },
  filename: {
    type: String,
    default: 'forecast-report.pdf'
  }
});

const emit = defineEmits(['update:modelValue', 'notify']);
const panelRef = ref(null);
const isSavingPdf = ref(false);

const formattedGeneratedAt = computed(() => {
  const date = props.generatedAt ? new Date(props.generatedAt) : new Date();
  return date.toLocaleString();
});

const closePreview = () => {
  emit('update:modelValue', false);
};

const normalizeRow = (row, expectedLength) => {
  if (Array.isArray(row)) {
    return row;
  }
  if (row && typeof row === 'object') {
    return Object.values(row).slice(0, expectedLength);
  }
  return Array.from({ length: expectedLength }).map(() => '—');
};

const openPrintWindow = () => {
  if (!props.documentHtml) {
    emit('notify', { type: 'error', message: 'Printable document is still preparing.' });
    return null;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    emit('notify', { type: 'error', message: 'Popup blocked. Please allow popups to continue.' });
    return null;
  }
  printWindow.document.open();
  printWindow.document.write(props.documentHtml);
  printWindow.document.close();
  return printWindow;
};

const handlePrint = () => {
  const printWindow = openPrintWindow();
  if (!printWindow) return;
  printWindow.focus();
  printWindow.addEventListener('afterprint', () => printWindow.close());
  setTimeout(() => {
    printWindow.print();
    emit('notify', { type: 'success', message: 'Print dialog opened for the preview.' });
  }, 250);
};

const handleSavePdf = async () => {
  if (isSavingPdf.value || !panelRef.value) return;
  isSavingPdf.value = true;
  try {
    const canvas = await html2canvas(panelRef.value, {
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

    pdf.save(props.filename || 'forecast-report.pdf');
    emit('notify', { type: 'success', message: 'PDF saved successfully.' });
  } catch (error) {
    console.error('Failed to save PDF:', error);
    emit('notify', { type: 'error', message: 'Saving PDF failed. Please try again.' });
  } finally {
    isSavingPdf.value = false;
  }
};
</script>

<style scoped>
.forecast-preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 24px;
}

.forecast-preview-panel {
  background: #ffffff;
  width: min(1100px, 100%);
  max-height: 92vh;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 25px 55px rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-body {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  margin-bottom: 16px;
}

.preview-body::-webkit-scrollbar {
  width: 6px;
}

.preview-body::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.7);
  border-radius: 999px;
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

.preview-generated {
  margin: 8px 0 0;
  color: #9ca3af;
  font-size: 0.85rem;
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
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
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

.preview-section {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.section-heading h3 {
  margin: 0;
  color: #111827;
}

.section-heading p {
  margin: 4px 0 0;
  color: #6b7280;
}

.section-badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  font-weight: 600;
  font-size: 0.8rem;
}

.section-table-wrapper {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: auto;
  max-height: 320px;
}

.section-table-wrapper table {
  width: 100%;
  border-collapse: collapse;
}

.section-table-wrapper th,
.section-table-wrapper td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  font-size: 0.9rem;
}

.section-table-wrapper th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  z-index: 1;
  font-weight: 600;
  color: #475569;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
}

.section-note {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

.preview-insights {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 24px;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.insight-card {
  border-radius: 12px;
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.insight-card h4 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.insight-card p {
  margin: 0;
  color: #4b5563;
  font-size: 0.9rem;
}

.insight-positive {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.insight-negative {
  border-color: #fecaca;
  background: #fef2f2;
}

.insight-info {
  border-color: #bfdbfe;
  background: #eef2ff;
}

.preview-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
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

.primary-btn {
  background: #2e5c31;
  color: #fff;
}

.outline-btn {
  background: transparent;
  border: 1px solid #2e5c31;
  color: #2e5c31;
}

.secondary-btn {
  background: #f1f5f9;
  color: #475569;
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.preview-hint {
  margin: 10px 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .forecast-preview-panel {
    padding: 20px;
  }

  .preview-header {
    flex-direction: column;
  }

  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .primary-actions {
    width: 100%;
  }

  .primary-actions button,
  .secondary-btn {
    width: 100%;
  }
}
</style>
