<template>
  <div class="upload-page">
    <div class="card">
      <div class="card-header">
        <button class="back-btn" @click="goBack">← Back</button>
        <h2>Upload GCash Receipt</h2>
      </div>
      <p class="muted">Order Code: <strong>#{{ orderCode }}</strong></p>

      <div v-if="!orderCode" class="hint">Missing order code.</div>

      <div class="uploader">
            <!-- Existing proof notice -->
            <div v-if="existingProofUrl && !previewUrl" class="existing-proof">
              <div class="existing-header">
                <span class="badge">Already submitted</span>
                <span class="when" v-if="existingProofAt">on {{ formatDate(existingProofAt) }}</span>
              </div>
              <div class="existing-body">
                <img :src="existingProofUrl" alt="Existing receipt" />
                <p class="hint">To change it, choose a new image below. It will replace the existing proof for this order.</p>
                <div class="attempts" :class="{ exhausted: attemptsLeft === 0 }">
                  Changes left: <strong>{{ attemptsLeft }}</strong> / 2
                </div>
                <p v-if="attemptsLeft === 0" class="limit">You have reached the maximum of 2 changes.</p>
              </div>
            </div>
  <input type="file" accept="image/*" @change="onFileChange" :disabled="uploading" />
        <p v-if="fileName" class="file-name">Selected: {{ fileName }}</p>
            <div v-if="previewUrl" class="preview">
          <img :src="previewUrl" alt="Receipt preview" />
          <button class="remove" @click="clearFile" type="button">Remove</button>
        </div>
        <div class="field">
          <label class="label">Name of Sender (optional)</label>
          <input v-model="senderName" type="text" class="text-input" placeholder="Enter sender's name" />
        </div>
            <textarea v-model="note" class="note" placeholder="Optional note (last 4 digits, time, etc.)"></textarea>
            <button class="btn" :disabled="!file || uploading" @click="upload">
              {{ uploading ? 'Uploading…' : (existingProofUrl ? 'Replace Proof of Payment' : 'Submit Proof of Payment') }}
            </button>
  <button class="btn-outline" type="button" @click="payLater" :disabled="uploading">Pay Later</button>
      </div>

      <p v-if="message" :class="['msg', messageType]">{{ message }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const route = useRoute();
const router = useRouter();

const orderCode = ref('');
const file = ref(null);
const fileName = ref('');
const previewUrl = ref('');
const existingProofUrl = ref('');
const existingProofAt = ref(null);
const existingSenderName = ref('');
const replaceCount = ref(0); // number of times replaced (initial upload not counted)
const attemptsLeft = ref(2); // 2 allowed replacements
const senderName = ref('');
const note = ref('');
const uploading = ref(false);
const message = ref('');
const messageType = ref('success');

// Firestore document limit is 1 MiB; keep margin
const MAX_DATAURL_BYTES = 950 * 1024; // ~950KB

// Utility: estimate bytes from a data URL
const dataUrlBytes = (dataUrl) => {
  try {
    const base64 = (dataUrl || '').split(',')[1] || '';
    const padding = (base64.match(/=+$/) || [''])[0].length;
    return Math.floor((base64.length * 3) / 4) - padding;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
};

// Compress image using canvas (JPEG) with target max dimension and quality
const compressImage = (file, { maxW = 1280, maxH = 1280, quality = 0.72 } = {}) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const ratio = Math.min(1, maxW / width, maxH / height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      let q = quality;
      let out = canvas.toDataURL('image/jpeg', q);
      // If still too big, try lowering quality once or twice
      if (dataUrlBytes(out) > MAX_DATAURL_BYTES) {
        q = Math.max(0.5, q - 0.15);
        out = canvas.toDataURL('image/jpeg', q);
      }
      if (dataUrlBytes(out) > MAX_DATAURL_BYTES) {
        q = Math.max(0.4, q - 0.15);
        out = canvas.toDataURL('image/jpeg', q);
      }
      resolve(out);
    };
    img.onerror = reject;
    const reader = new FileReader();
    reader.onload = (ev) => {
      img.src = ev.target?.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert dataURL to Blob
const dataUrlToBlob = (dataUrl) => {
  const [header, base64] = (dataUrl || '').split(',');
  const mime = /data:(.*?);base64/.exec(header)?.[1] || 'image/jpeg';
  const binStr = atob(base64 || '');
  const len = binStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i);
  return new Blob([bytes], { type: mime });
};

// Upload to Firebase Storage and return the download URL
const uploadToStorage = async (dataUrl, originalFile) => {
  const blob = dataUrlToBlob(dataUrl);
  const fname = originalFile?.name || `payment_${Date.now()}.jpg`;
  const safeCode = (orderCode.value || 'unknown').toString();
  const path = `paymentProofs/${auth.currentUser?.uid || 'anon'}/${safeCode}/${Date.now()}_${fname}`;
  const sref = storageRef(storage, path);
  await uploadBytes(sref, blob, { contentType: blob.type });
  const url = await getDownloadURL(sref);
  return { url, size: blob.size, type: blob.type, name: fname };
};

onMounted(() => {
  orderCode.value = route.query.order || '';
  if (orderCode.value) {
    loadExistingProof();
  }
});

const onFileChange = async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  file.value = f;
  fileName.value = f.name;
  try {
    // Compress to stay under Firestore limits
    const compressed = await compressImage(f);
    if (dataUrlBytes(compressed) > MAX_DATAURL_BYTES) {
      message.value = 'Image is too large even after compression. Please pick a smaller image or screenshot.';
      messageType.value = 'error';
      previewUrl.value = '';
      return;
    }
    previewUrl.value = compressed;
    message.value = '';
  } catch (err) {
    console.warn('Image compression failed, using original', err);
    // Fallback: original file as dataURL
    const reader = new FileReader();
    reader.onload = (ev) => {
      const orig = ev.target?.result || '';
      if (dataUrlBytes(orig) > MAX_DATAURL_BYTES) {
        message.value = 'Selected image is too large. Please pick a smaller file.';
        messageType.value = 'error';
        previewUrl.value = '';
      } else {
        previewUrl.value = orig;
      }
    };
    reader.readAsDataURL(f);
  }
};

const clearFile = () => {
  file.value = null;
  fileName.value = '';
  previewUrl.value = '';
};

const goBack = () => router.back();

const payLater = () => {
  router.push('/customer/orders');
};

const formatDate = (ts) => {
  try {
    const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
    if (!d) return '';
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const loadExistingProof = async () => {
  try {
    const ordersRef = collection(db, 'orders');
    const [byGroup, byOrder] = await Promise.all([
      getDocs(query(ordersRef, where('groupOrderCode', '==', orderCode.value))),
      getDocs(query(ordersRef, where('orderCode', '==', orderCode.value))),
    ]);
    const docs = [...byGroup.docs, ...byOrder.docs];
    // compute max replacement count across related orders
    let maxReplace = 0;
    for (const d of docs) {
      const c = d.data().paymentProofReplaceCount || 0;
      if (c > maxReplace) maxReplace = c;
    }
    replaceCount.value = maxReplace;
    attemptsLeft.value = Math.max(0, 2 - replaceCount.value);

    const withProof = docs.find(d => d.data().paymentProofUrl);
    if (withProof) {
      const data = withProof.data();
      existingProofUrl.value = data.paymentProofUrl;
      existingProofAt.value = data.paymentProofAt || data.updatedAt || data.createdAt || null;
      existingSenderName.value = data.paymentSenderName || '';
      // Pre-fill optional fields for convenience
      if (!senderName.value) senderName.value = existingSenderName.value;
      if (!note.value) note.value = data.paymentProofNote || '';
    }
  } catch (e) {
    console.warn('Failed to load existing proof', e);
  }
};

const upload = async () => {
  if (!auth.currentUser) {
    message.value = 'Please sign in.';
    messageType.value = 'error';
    return;
  }
  if (!orderCode.value) {
    message.value = 'Missing order code.';
    messageType.value = 'error';
    return;
  }
  if (!file.value) {
    message.value = 'Please choose an image.';
    messageType.value = 'error';
    return;
  }
  try {
    uploading.value = true;
    // Enforce attempt limit for replacements (initial upload is allowed)
    if (existingProofUrl.value && replaceCount.value >= 2) {
      message.value = 'You have reached the maximum of 2 changes.';
      messageType.value = 'error';
      uploading.value = false;
      return;
    }
    // Use the (possibly compressed) preview data URL if available, else read now
    let dataUrl = previewUrl.value || await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file.value);
    });
    // Final size check; if too large try one more compression pass
    if (dataUrlBytes(dataUrl) > MAX_DATAURL_BYTES && file.value) {
      try {
        dataUrl = await compressImage(file.value, { maxW: 1024, maxH: 1024, quality: 0.65 });
      } catch {}
    }
  // If still big, prefer Storage to avoid hitting 1MiB doc limit
  const shouldUseStorage = dataUrlBytes(dataUrl) > Math.min(MAX_DATAURL_BYTES, 450 * 1024);

    // Find all orders in this checkout (by groupOrderCode or orderCode)
    const ordersRef = collection(db, 'orders');
    const [byGroup, byOrder] = await Promise.all([
      getDocs(query(ordersRef, where('groupOrderCode', '==', orderCode.value))),
      getDocs(query(ordersRef, where('orderCode', '==', orderCode.value))),
    ]);
    const orders = new Map();
    byGroup.forEach(d => orders.set(d.id, d));
    byOrder.forEach(d => orders.set(d.id, d));
    if (orders.size === 0) {
      message.value = 'We could not find your order. Please open Payment from My Orders again.';
      messageType.value = 'error';
      uploading.value = false;
      return;
    }

  const updates = [];
  // Determine new replacement count (only when replacing existing proof)
  const newReplaceCount = existingProofUrl.value ? (replaceCount.value + 1) : replaceCount.value;
    let proofMeta = {
      url: dataUrl,
      size: file.value.size || dataUrlBytes(dataUrl),
      type: file.value.type || 'image/jpeg',
      name: file.value.name || `payment_${Date.now()}.jpg`
    };

    // If large, or if Firestore update fails due to size, upload to Storage
    if (shouldUseStorage) {
      proofMeta = await uploadToStorage(dataUrl, file.value);
    }

    const applyUpdate = () => {
      updates.length = 0;
      orders.forEach((snap) => {
        updates.push(updateDoc(snap.ref, {
          paymentStatus: 'paid',
          payStatus: 'paid',
          paymentProofUrl: proofMeta.url,
          paymentProofType: proofMeta.type || null,
          paymentProofFile: proofMeta.name || null,
          paymentProofSize: proofMeta.size || null,
          paymentSenderName: senderName.value || null,
          paymentProofNote: note.value || null,
          paymentProofAt: serverTimestamp(),
          paymentProofReplaceCount: newReplaceCount,
        }));
      });
      return Promise.all(updates);
    };

    try {
      await applyUpdate();
    } catch (e1) {
      // If doc too large, fallback to Storage
      const msg = String(e1?.message || '').toLowerCase();
      if (!shouldUseStorage && (msg.includes('1 mib') || msg.includes('maximum') || msg.includes('document size'))) {
        proofMeta = await uploadToStorage(dataUrl, file.value);
        await applyUpdate();
      } else {
        throw e1;
      }
    }

  // Reset existing cache to reflect new image (use actual uploaded URL)
  existingProofUrl.value = proofMeta.url;
  existingProofAt.value = new Date();
  replaceCount.value = newReplaceCount;
  attemptsLeft.value = Math.max(0, 2 - replaceCount.value);

    // Create notifications
    const sellerIds = new Set();
    orders.forEach((snap) => sellerIds.add(snap.data().sellerId));

    // Notify sellers
    await Promise.all(Array.from(sellerIds).map(async (sid) => {
      await addDoc(collection(db, 'notifications'), {
        type: 'order',
        subtype: 'payment_proof',
        title: 'Payment proof uploaded',
        message: `Customer uploaded GCash receipt for order #${orderCode.value}. Please verify.`,
        sellerId: sid,
        userId: auth.currentUser.uid,
        read: false,
        createdAt: serverTimestamp(),
      });
    }));

    // Notify customer (for history)
    await addDoc(collection(db, 'notifications'), {
      type: 'order',
      subtype: 'payment_proof_submitted',
      title: 'Payment submitted',
      message: `We received your proof of payment for #${orderCode.value}.`,
      userId: auth.currentUser.uid,
      read: false,
      createdAt: serverTimestamp(),
    });

    message.value = 'Uploaded. We sent it to the seller for verification.';
    messageType.value = 'success';
    setTimeout(() => router.push('/customer/orders'), 1200);
  } catch (e) {
    console.error(e);
    // Provide a more informative error if document becomes too large
    const msg = String(e?.message || e || '').toLowerCase();
    if (msg.includes('maximum') || msg.includes('1 mib') || msg.includes('document size')) {
      message.value = 'Upload failed: the image is too large. We tried to compress it. Please try a smaller image or screenshot.';
    } else if (msg.includes('permission')) {
      message.value = 'Upload failed due to permissions. Please sign in again or contact support.';
    } else {
      message.value = e.message || 'Upload failed.';
    }
    messageType.value = 'error';
  } finally {
    uploading.value = false;
  }
};
</script>

<style scoped>
.upload-page { display:flex; justify-content:center; padding:24px; }
.card { width:100%; max-width:520px; background:#fff; border-radius:12px; padding:20px; box-shadow:0 8px 24px rgba(0,0,0,.08); }
.card-header { display:flex; align-items:center; gap:12px; }
.card-header h2 { margin:0; }
.back-btn { background:none; border:none; color:#2e5c31; cursor:pointer; font-weight:600; padding:6px 8px; }
.muted { color:#666; margin:6px 0 16px; }
.uploader { display:flex; flex-direction:column; gap:12px; }
.file-name { font-size:14px; color:#333; }
.preview { position:relative; border:1px solid #ddd; border-radius:8px; overflow:hidden; }
.preview img { width:100%; height:260px; object-fit:cover; display:block; }
.preview .remove { position:absolute; top:8px; right:8px; background:rgba(0,0,0,.6); color:#fff; border:none; border-radius:6px; padding:6px 8px; cursor:pointer; }
.existing-proof { border:1px solid #e5e7eb; border-radius:10px; padding:10px; background:#f9fafb; }
.existing-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.badge { display:inline-block; background:#e8f5e9; color:#1b5e20; border:1px solid #1b5e20; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:600; }
.existing-body img { width:100%; max-height:260px; object-fit:cover; border-radius:6px; }
.attempts { margin-top:8px; font-size:13px; color:#1b5e20; }
.attempts.exhausted { color:#b91c1c; }
.limit { margin:4px 0 0; font-size:12px; color:#b91c1c; }
.field { display:flex; flex-direction:column; gap:6px; }
.label { font-size:14px; color:#444; }
.text-input { padding:10px; border:1px solid #ddd; border-radius:8px; }
.note { min-height:80px; padding:10px; border:1px solid #ddd; border-radius:8px; }
.btn { background:#2e5c31; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; }
.btn:disabled { opacity:.6; cursor:not-allowed; }
.btn-outline { background:#fff; color:#2e5c31; border:1px solid #2e5c31; padding:10px 14px; border-radius:8px; cursor:pointer; }
.msg { margin-top:12px; font-size:14px; }
.msg.error { color:#b91c1c; }
.msg.success { color:#166534; }
.hint { color:#b91c1c; }
</style>