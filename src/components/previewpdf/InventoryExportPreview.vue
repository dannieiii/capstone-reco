<template>
  <div v-if="modelValue" class="pdf-preview-overlay">
    <div class="pdf-preview-panel" ref="previewPanelRef">
      <header class="preview-header">
        <div>
          <p class="preview-eyebrow">Report Preview</p>
          <h2>Inventory Export Summary</h2>
          <p class="preview-subtitle">
            Review the items that match your current filters before printing or saving the PDF export.
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
          <p class="meta-label">Products in Export</p>
          <p class="meta-value">{{ totalProducts }}</p>
        </div>
        <div>
          <p class="meta-label">Categories Covered</p>
          <p class="meta-value">{{ uniqueCategories }}</p>
        </div>
        <div>
          <p class="meta-label">Low Stock Items</p>
          <p class="meta-value">{{ lowStockCount }}</p>
        </div>
      </section>

      <section class="preview-hint-line" v-if="filtersSummary">
        <p><strong>Filters:</strong> {{ filtersSummary }}</p>
      </section>

      <section class="preview-table-wrapper">
        <table class="preview-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Status</th>
              <th>Available Units</th>
              <th>Total Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id || product.productName">
              <td>
                <div class="cell-primary">
                  <span class="cell-title">{{ product.productName }}</span>
                  <span v-if="product.description" class="cell-subtitle">{{ product.description }}</span>
                </div>
              </td>
              <td>{{ product.category || 'N/A' }}</td>
              <td>
                <span class="status-chip" :class="statusClass(product.status)">
                  {{ formatStatus(product.status) }}
                </span>
              </td>
              <td>{{ formatUnits(product.availableUnits) }}</td>
              <td>
                <span class="stock-chip" :class="stockClass(totalStock(product))">
                  {{ totalStock(product) }}
                </span>
              </td>
            </tr>
            <tr v-if="products.length === 0">
              <td colspan="5" class="empty-row">No products available for export.</td>
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
        <p class="preview-hint">Need different records? Adjust your filters or pagination, then reopen this preview.</p>
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
  products: {
    type: Array,
    default: () => []
  },
  generatedAt: {
    type: [String, Date],
    default: () => new Date()
  },
  filtersSummary: {
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

const totalProducts = computed(() => props.products.length);
const uniqueCategories = computed(() => {
  const set = new Set(props.products.map(product => product.category || 'Uncategorized'));
  return set.size;
});
const lowStockCount = computed(() => props.products.filter(product => {
  const total = totalStock(product);
  return total > 0 && total <= 10;
}).length);

const closePreview = () => emit('update:modelValue', false);

const totalStock = (product) => {
  if (!product) return 0;
  const fields = [
    'stockPerKilo',
    'stockPerSack',
    'stockPerTali',
    'stockPerKaing',
    'stockPerBundle',
    'stockPerTray',
    'stockPerPiece'
  ];
  return fields.reduce((sum, field) => {
    const value = Number(product[field]) || 0;
    return sum + value;
  }, 0);
};

const formatUnits = (units) => {
  if (!Array.isArray(units) || units.length === 0) return 'N/A';
  const map = {
    perKilo: 'Kilogram',
    perSack: 'Sack',
    perTali: 'Tali',
    perKaing: 'Kaing',
    perBundle: 'Bundle',
    perTray: 'Tray',
    perPiece: 'Piece'
  };
  return units.map(unit => map[unit] || unit).join(', ');
};

const stockClass = (value) => {
  if (value === 0) return 'stock-empty';
  if (value <= 10) return 'stock-low';
  if (value > 50) return 'stock-high';
  return 'stock-normal';
};

const statusClass = (status) => {
  if (!status) return 'status-neutral';
  const key = status.toLowerCase();
  if (key.includes('available')) return 'status-available';
  if (key.includes('limited') || key.includes('inactive')) return 'status-limited';
  if (key.includes('pre')) return 'status-preorder';
  return 'status-neutral';
};

const formatStatus = (status) => {
  if (!status) return 'N/A';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const buildPrintableRows = () => {
  return props.products.map(product => `
    <tr>
      <td>${escapeHtml(product.productName || 'N/A')}</td>
      <td>${escapeHtml(product.category || 'N/A')}</td>
      <td>${escapeHtml(formatStatus(product.status || ''))}</td>
      <td>${escapeHtml(formatUnits(product.availableUnits))}</td>
      <td>${totalStock(product)}</td>
    </tr>
  `).join('');
};

const buildPrintableHtml = () => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Inventory Export</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
        h1 { color: #1f4e23; margin-bottom: 8px; }
        .subtitle { color: #6b7280; margin-bottom: 24px; }
        .meta { display: flex; gap: 24px; margin-bottom: 24px; font-size: 0.9rem; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.9rem; }
        th { background-color: #f3f4f6; font-weight: 600; }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <h1>Inventory Export</h1>
      <p class="subtitle">Generated on ${formattedGeneratedAt.value} • ${totalProducts.value} products</p>
      <div class="meta">
        <div><strong>Categories:</strong> ${uniqueCategories.value}</div>
        <div><strong>Low Stock:</strong> ${lowStockCount.value}</div>
        ${props.filtersSummary ? `<div><strong>Filters:</strong> ${escapeHtml(props.filtersSummary)}</div>` : ''}
      </div>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Status</th>
            <th>Units</th>
            <th>Total Stock</th>
          </tr>
        </thead>
        <tbody>
          ${buildPrintableRows() || '<tr><td colspan="5">No products available.</td></tr>'}
        </tbody>
      </table>
    </body>
  </html>`;
};

const openPrintWindow = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Popup blocked. Please allow popups to print or save.');
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

    pdf.save(`inventory-export-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  color: #16a34a;
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
  margin-bottom: 16px;
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

.preview-hint-line {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  padding: 10px 16px;
  margin-bottom: 16px;
  font-size: 0.9rem;
  color: #065f46;
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
  gap: 4px;
}

.cell-title {
  font-weight: 600;
  color: #0f172a;
}

.cell-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-available {
  background: #dcfce7;
  color: #15803d;
}

.status-limited {
  background: #fef3c7;
  color: #b45309;
}

.status-preorder {
  background: #e0f2fe;
  color: #0369a1;
}

.status-neutral {
  background: #e5e7eb;
  color: #475569;
}

.stock-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-weight: 600;
}

.stock-empty {
  background: #fee2e2;
  color: #b91c1c;
}

.stock-low {
  background: #fef3c7;
  color: #b45309;
}

.stock-normal {
  background: #e0f2fe;
  color: #0369a1;
}

.stock-high {
  background: #dcfce7;
  color: #15803d;
}

.empty-row {
  text-align: center;
  color: #94a3b8;
  font-style: italic;
  padding: 32px 0;
}

.preview-footer {
  margin-top: 20px;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.secondary-btn {
  background: transparent;
  border: 1px solid #cbd5f5;
  color: #1f4e23;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
}

.primary-actions {
  display: flex;
  gap: 10px;
}

.outline-btn {
  background: transparent;
  border: 1px solid #16a34a;
  color: #166534;
  padding: 10px 20px;
  border-radius: 999px;
  cursor: pointer;
}

.primary-btn {
  background: #166534;
  color: #ffffff;
  border: none;
  padding: 10px 22px;
  border-radius: 999px;
  cursor: pointer;
}

.preview-hint {
  margin-top: 10px;
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
