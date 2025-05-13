<template>
  <div v-if="visible">
    <div class="modal-overlay" @click.self="close"></div>
    
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">{{ productName }}</h3>
        <img :src="productImage" :alt="productName" class="product-image">
      </div>

      <div class="modal-body">
        <div class="detail-row">
          <span class="detail-label">Category:</span>
          <span class="detail-value">{{ category }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Weight (kg)</label>
          <input 
            type="number" 
            v-model="weight" 
            min="0.1" 
            max="20" 
            step="0.1" 
            @input="updatePrice"
            class="form-input"
          >
        </div>

        <div class="form-group">
          <label class="form-label">Packaging</label>
          <select v-model="packagingType" class="form-select">
            <option value="plastic">Plastic</option>
            <option value="paper">Paper</option>
            <option value="box">Box</option>
          </select>
        </div>

        <div class="price-summary">
          <div class="price-row">
            <span>Price:</span>
            <span class="price-value">₱{{ computedPrice }}</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="close">Cancel</button>
        <button class="btn btn-primary" @click="confirm">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    visible: Boolean,
    productName: String,
    productImage: String,
    category: String,
    initialPackagingType: String,
    initialWeight: Number,
    pricePerKg: Number,
    sellerId: String, // Ensure sellerId is included
    userId: String,
    username: String
  },
  data() {
    return {
      packagingType: this.initialPackagingType,
      weight: this.initialWeight,
      computedPrice: this.pricePerKg * this.initialWeight
    };
  },
  methods: {
   
    updatePrice() {
      if (this.weight > 20) {
        alert('Maximum weight is 20 kg.');
        this.weight = 20;
      }
      this.computedPrice = this.pricePerKg * this.weight;
    },
    confirm() {
      this.$emit('confirm', {
        weight: this.weight,
        packagingType: this.packagingType,
        totalPrice: this.computedPrice,
        sellerId: this.sellerId, // Include sellerId in the emitted data
        userId: this.userId,
        username: this.username
      });
      this.close();
    },
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
}

.modal-header {
  padding: 20px 20px 0;
  text-align: center;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2e5c31;
  margin-bottom: 15px;
}

.product-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  margin: 0 auto 15px;
  display: block;
}

.modal-body {
  padding: 0 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.detail-label {
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  font-weight: 500;
}

.form-group {
  margin: 15px 0;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: #555;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus, .form-select:focus {
  border-color: #2e5c31;
  outline: none;
}

.price-summary {
  margin: 20px 0;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}

.price-value {
  font-weight: 600;
  color: #2e5c31;
}

.modal-footer {
  display: flex;
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #2e5c31;
  color: white;
  margin-left: 10px;
}

.btn-primary:hover {
  background-color: #26492a;
}

.btn-secondary {
  background-color: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #f5f5f5;
}
</style>