<template>
  <div class="underpriced-view">
    <!-- Toast Notification Container (top right, global style) -->
    <div v-if="toast.visible" :class="['toast-global', toast.type]">
      <span>{{ toast.message }}</span>
      <button class="toast-close" @click="toast.visible = false">×</button>
    </div>
    <div class="underpriced-header">
      <h2>Underpriced Products</h2>
      <div class="actions">
        <button class="refresh-btn" @click="$emit('refresh-products')">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
        <button class="notify-btn" @click="notifyAll" :disabled="sendingAll">
          <i class="fas fa-bell"></i> Remind All ({{ props.underpricedProducts.length }})
        </button>
        <div class="export-dropdown" ref="exportDropdown">
          <button class="export-toggle" @click="toggleExportDropdown">
            <i class="fas fa-download"></i> Export
            <i class="fas fa-chevron-down"></i>
          </button>
          <div v-if="showExportDropdown" class="export-menu">
            <button @click="downloadCSV" class="export-option">
              <i class="fas fa-file-csv"></i> CSV
            </button>
            <button @click="openPdfPreview" class="export-option">
              <i class="fas fa-file-pdf"></i> PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Seller</th>
            <th>Price</th>
            <th>D.A. Min</th>
            <th>Deviation</th>
            <th>Status</th>
            <th>Notify</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in props.underpricedProducts" :key="p.id">
            <td>
              <div class="product-cell">
                <div class="product-image" :style="{ backgroundImage: `url(${getImageUrl(p.image)})` }"></div>
                <div class="product-info">
                  <span class="product-name">{{ p.productName }}</span>
                  <div class="product-meta">
                    <span v-if="p.variety && p.variety !== 'Normal'" class="variety-badge">{{ p.variety }}</span>
                  </div>
                </div>
              </div>
            </td>
            <td>{{ getSellerName(p.sellerId) }}</td>
            <td>₱{{ formatPrice(getUnderUnit(p)?.price) }} <small v-if="getUnderUnit(p)">{{ getUnderUnit(p).type }}</small></td>
            <td>₱{{ formatPrice(getUnderUnit(p)?.daReference?.minPrice) }}</td>
            <td><span class="text-info">{{ formatDeviation(getUnderUnit(p)?.deviation || 0) }}</span></td>
            <td><span class="status-badge underpriced">Underpriced</span></td>
            <td>
              <button class="notify-btn" @click="notifySeller(p)">
                <i class="fas fa-bell"></i> Remind
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UnderpricedExportPreview
      v-model="showPdfPreview"
      :rows="pdfRows"
      :generated-at="pdfGeneratedAt"
      :reminded-count="remindersSent"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import UnderpricedExportPreview from '@/components/previewpdf/UnderpricedExportPreview.vue';

const props = defineProps({
  underpricedProducts: { type: Array, required: true },
  sellers: { type: Array, required: false, default: () => [] }
});

const emit = defineEmits(['refresh-products']);

const showExportDropdown = ref(false);
const showPdfPreview = ref(false);
const pdfRows = ref([]);
const pdfGeneratedAt = ref(new Date());
const remindersSent = ref(0);

const toggleExportDropdown = () => {
  showExportDropdown.value = !showExportDropdown.value;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const buildPdfRows = () => {
  return (props.underpricedProducts || []).map(product => {
    const unit = getUnderUnit(product);
    const daMin = unit?.daReference?.minPrice ?? unit?.daReference?.newMinPrice ?? null;
    return {
      id: product.id,
      productName: product.productName,
      seller: getSellerName(product.sellerId),
      unit: unit?.type || 'N/A',
      sellerPrice: toNumber(unit?.price ?? product.price ?? 0, 0),
      daMin: toNumber(daMin, 0),
      deviation: typeof unit?.deviation === 'number' ? unit.deviation : null
    };
  });
};

const openPdfPreview = () => {
  showExportDropdown.value = false;
  const rows = buildPdfRows();
  if (!rows.length) {
    showToast('No underpriced products available to export.', 'error');
    return;
  }
  pdfRows.value = rows;
  pdfGeneratedAt.value = new Date();
  showPdfPreview.value = true;
};

const getUnderUnit = (p) => {
  if (!p?.units) return null;
  return p.units.find(u => u && u.isUnderpriced) || p.units.find(u => u && u.priceStatus === 'underpriced') || null;
};

const getImageUrl = (imageData) => {
  if (!imageData) return '/placeholder.svg?height=50&width=50';
  if (imageData.startsWith('http')) return imageData;
  if (imageData.startsWith('data:image')) return imageData;
  return '/placeholder.svg?height=50&width=50';
};

const getSellerName = (sellerId) => {
  const sellers = props.sellers || [];
  let seller = sellers.find(s => s.sellerId === sellerId) || sellers.find(s => s.id === sellerId);
  if (!seller) return sellerId;
  if (seller.personalInfo?.firstName && seller.personalInfo?.lastName) {
    return `${seller.personalInfo.firstName} ${seller.personalInfo.lastName}`;
  }
  if (seller.farmDetails?.farmName) return seller.farmDetails.farmName;
  if (seller.farmName) return seller.farmName;
  if (seller.personalInfo?.email) return seller.personalInfo.email;
  return sellerId;
};

const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
const formatDeviation = (deviation) => deviation > 0 ? `+${deviation.toFixed(1)}%` : `${deviation.toFixed(1)}%`;


// Toast notification state
const toast = ref({ visible: false, message: '', type: 'success', timeout: null });

function showToast(message, type = 'success', duration = 5000) {
  toast.value.message = message;
  toast.value.type = type;
  toast.value.visible = true;
  if (toast.value.timeout) clearTimeout(toast.value.timeout);
  toast.value.timeout = setTimeout(() => { toast.value.visible = false; }, duration);
}

const sendingAll = ref(false);

const notifySeller = async (product) => {
  try {
    const unit = getUnderUnit(product);
    const message = `Your product "${product.productName}" appears to be priced below the D.A. minimum for ${unit?.type}. Consider reviewing your price to ensure fair value for your goods.`;
    await addDoc(collection(db, 'notifications'), {
      userId: product.sellerId,
      sellerId: product.sellerId,
      title: 'Underprice Notice',
      message,
      type: 'underprice_warning',
      read: false,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
      productId: product.id,
      link: `/seller/products/edit/${product.id}`
    });
    remindersSent.value += 1;
    showToast('Reminder sent.', 'success');
  } catch (e) {
    console.error('notifySeller error', e);
    showToast('Failed to send reminder', 'error');
  }
};

const notifyAll = async () => {
  if (!props.underpricedProducts?.length) return;
  sendingAll.value = true;
  let success = 0, fail = 0;
  for (const p of props.underpricedProducts) {
    try { await notifySeller(p); success++; } catch { fail++; }
  }
  sendingAll.value = false;
  if (success) showToast(`Reminders sent: ${success}${fail ? `, failed: ${fail}` : ''}`, fail ? 'error' : 'success');
  else showToast('No reminders sent.', 'error');
};

const downloadCSV = () => {
  showExportDropdown.value = false;
  try {
    const rows = props.underpricedProducts.map(p => {
      const u = getUnderUnit(p);
      return {
        'Product Name': p.productName,
        'Seller ID': p.sellerId,
        'Unit': u?.type || 'N/A',
        'Seller Price': formatPrice(u?.price),
        'D.A. Min': formatPrice(u?.daReference?.minPrice),
        'Deviation %': formatDeviation(u?.deviation || 0)
      };
    });
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `underpriced-products-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error('CSV export error', e);
  }
};
</script>

<style scoped>
.underpriced-view { display: flex; flex-direction: column; gap: 12px; }
.underpriced-header { display: flex; justify-content: space-between; align-items: center; background: #fff; padding: 12px 16px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.actions { display: flex; gap: 8px; align-items: center; }
.refresh-btn, .export-toggle, .notify-btn { background: #2e5c31; color: #fff; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; }
.refresh-btn:disabled { opacity: 0.6; }
.table-wrapper { background: #fff; padding: 12px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
.products-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
.products-table th, .products-table td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; }
.product-cell { display: flex; align-items: center; gap: 8px; }
.product-image { width: 32px; height: 32px; border-radius: 6px; background-size: cover; background-position: center; background-color: #f3f4f6; border: 1px solid #eee; }
.product-name { font-weight: 600; }
.variety-badge { background: #eef2ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; }
.status-badge.underpriced { background: #e0f2fe; color: #0369a1; padding: 4px 8px; border-radius: 999px; font-weight: 600; font-size: 0.75rem; }
.export-dropdown { position: relative; }
.export-menu { position: absolute; right: 0; top: 100%; background: #fff; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.12); min-width: 160px; z-index: 20; }
.export-option { width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; cursor: pointer; }
/* Toast styles */
/* Toast styles (top right, global style) */
.toast-global {
  position: fixed;
  top: 32px;
  right: 32px;
  min-width: 260px;
  max-width: 400px;
  background: #22c55e;
  color: #fff;
  padding: 16px 28px;
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 9999;
  animation: toast-in 0.3s;
}
.toast-global.error {
  background: #ef4444;
}
.toast-close {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.2rem;
  margin-left: auto;
  cursor: pointer;
  opacity: 0.7;
}
.toast-close:hover {
  opacity: 1;
}
@keyframes toast-in {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
