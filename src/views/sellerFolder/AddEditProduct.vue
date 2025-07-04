<template>
  <div class="dashboard-container">
    <Sidebar 
      :initialActiveItem="isEditing ? 'Farm Products' : 'Add Product'" 
    />
    
    <div class="main-content">
      <NotifProduct ref="notifProduct" />
      
      <!-- Header -->
      <header class="header">
        <div class="page-title">
          <h1>{{ isEditing ? 'Edit Product' : 'Add New Product' }}</h1>
          <p>{{ isEditing ? 'Update product details' : 'Create a new farm product with detailed information' }}</p>
        </div>
      </header>

      <!-- Status Ribbons -->
      <div v-if="product.status === 'limited' || product.isOnSale || product.isPreOrder" class="status-ribbons">
        <div v-if="product.status === 'limited'" class="status-badge limited">
          <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
          </svg>
          Limited Stock
        </div>
        <div v-if="product.isOnSale" class="status-badge sale">
          <svg class="badge-icon" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
          </svg>
          On Sale - {{ product.discountPercentage }}% Off
        </div>
        <div v-if="product.isPreOrder" class="status-badge pre-order">
          Pre-Order Available
        </div>
      </div>

      <form @submit.prevent="saveProduct" class="product-form">
        <div class="form-grid">
          
          <!-- Basic Information -->
          <div class="form-section">
            <h2>Basic Information</h2>
              <!-- Category Selection with Search -->
            <div class="form-group">
              <label for="category">Category *</label>
              <div class="searchable-dropdown">
                <input 
                  type="text" 
                  v-model="categorySearchText"
                  @input="onCategorySearch"
                  @focus="showCategoryDropdown = true"
                  @blur="hideCategoryDropdown"
                  placeholder="Type to search or select category..."
                  class="searchable-input"
                  autocomplete="off"
                >
                <div 
                  v-if="showCategoryDropdown && filteredCategories.length > 0" 
                  class="dropdown-list"
                >
                  <div 
                    v-for="cat in filteredCategories" 
                    :key="cat.id" 
                    @mousedown="selectCategory(cat.category)"
                    class="dropdown-item"
                  >
                    {{ cat.category }}
                  </div>
                </div>
              </div>
            </div>     
                       <!-- Product Name Selection with Search -->
                <div class="form-group">
  <label for="productName">Product Name *</label>
  <div class="product-select-container">
    <div class="searchable-dropdown">
      <input 
        type="text" 
        v-model="productSearchText"
        @input="onProductSearch"
        @focus="showProductDropdown = true"
        @blur="hideProductDropdown"
        :placeholder="!product.category ? 'Select category first' : 'Type to search or select product...'"
        :disabled="!product.category"
        class="searchable-input"
        autocomplete="off"
      >
      <div 
        v-if="showProductDropdown && filteredProductsBySearch.length > 0" 
        class="dropdown-list"
      >
        <div 
          v-for="productItem in filteredProductsBySearch" 
          :key="productItem.id" 
          @mousedown="selectProduct(productItem)"
          class="dropdown-item product-group-item"
        >
          <div class="product-item">
            <div class="product-main">
              <span class="product-name">{{ getDisplayProductName(productItem) }}</span>
              <span class="units-count">{{ productItem.priceRange }}</span>
            </div>
            
            <!-- Show all available units for this product -->
            <div v-if="productItem.unitSummaries && productItem.unitSummaries.length > 0" class="units-preview">
              <div 
                v-for="unitSummary in productItem.unitSummaries.slice(0, 3)" 
                :key="unitSummary.unit"
                class="unit-preview-item"
              >
                <span class="unit-name">{{ unitSummary.unit }}</span>
                <span class="unit-price">{{ unitSummary.priceRange }}</span>
              </div>
              <div v-if="productItem.unitSummaries.length > 3" class="more-units">
                +{{ productItem.unitSummaries.length - 3 }} more units
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <span v-if="selectedProductFromTable" class="price-range-display">
      {{ selectedProductFromTable.priceRange }} ({{ selectedProductFromTable.unit }})
    </span>
  </div>
  
  <!-- Unit Selection Modal -->
  <div v-if="showUnitSelectionModal" class="unit-selection-modal" @click.self="showUnitSelectionModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Select Reference Units for {{ getDisplayProductName(selectedProductForUnitSelection) }}</h3>
        <button @click="showUnitSelectionModal = false" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-description">Select one or more units that you want to use as D.A. price reference. You can only sell in the units you select here:</p>
        
        <!-- Selected Units Summary -->
        <div v-if="selectedReferenceUnits.length > 0" class="selected-units-summary">
          <h4>Selected Reference Units:</h4>
          <div class="selected-units-list">
            <span 
              v-for="unit in selectedReferenceUnits" 
              :key="unit.unit"
              class="selected-unit-tag"
            >
              {{ unit.unit }} ({{ unit.priceRange }})
              <button @click="removeReferenceUnit(unit)" class="remove-unit-btn">×</button>
            </span>
          </div>
        </div>
        
        <div class="units-selection-grid">
          <div 
            v-for="unitSummary in selectedProductForUnitSelection?.unitSummaries" 
            :key="unitSummary.unit"
            @click="toggleReferenceUnit(unitSummary)"
            class="unit-selection-card"
            :class="{ 'selected': isReferenceUnitSelected(unitSummary.unit) }"
          >
            <div class="unit-checkbox">
              <input 
                type="checkbox" 
                :checked="isReferenceUnitSelected(unitSummary.unit)"
                @change.stop="toggleReferenceUnit(unitSummary)"
              >
            </div>
            <div class="unit-name">{{ unitSummary.unit }}</div>
            <div class="unit-price">{{ unitSummary.priceRange }}</div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button 
            @click="showUnitSelectionModal = false" 
            class="btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="confirmReferenceUnits" 
            class="btn-primary"
            :disabled="selectedReferenceUnits.length === 0"
          >
            Confirm Selection ({{ selectedReferenceUnits.length }} units)
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Update D.A. Price Modal -->
  <div v-if="showUpdatePriceModal" class="unit-selection-modal" @click.self="showUpdatePriceModal = false">
    <div class="modal-content update-price-modal">
      <div class="modal-header">
        <h3>Update D.A. Reference Prices</h3>
        <button @click="showUpdatePriceModal = false" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-description">
          Help keep D.A. reference prices current by updating unit prices for 
          <strong>{{ getDisplayProductName(selectedProductFromTable) }}</strong>.
          Your contributions help other farmers with accurate market pricing.
        </p>
        
        <!-- Existing Units Update -->
        <div v-if="updatePriceUnits.length > 0" class="existing-units-section">
          <h4>Update Existing Units</h4>
          <div class="price-update-grid">
            <div 
              v-for="unitData in updatePriceUnits" 
              :key="unitData.unit"
              class="price-update-card"
            >
              <div class="unit-header">
                <h5>{{ unitData.unit }}</h5>
                <span class="current-range">Current: {{ unitData.currentPriceRange }}</span>
              </div>
              <div class="price-inputs">
                <div class="input-group">
                  <label>Min Price (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="unitData.newMinPrice"
                    :placeholder="unitData.currentMinPrice"
                    min="0"
                    step="0.01"
                    @input="validatePriceInput($event)"
                  >
                </div>
                <div class="input-group">
                  <label>Max Price (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="unitData.newMaxPrice"
                    :placeholder="unitData.currentMaxPrice"
                    min="0"
                    step="0.01"
                    @input="validatePriceInput($event)"
                  >
                </div>
              </div>
              <div v-if="unitData.newMinPrice || unitData.newMaxPrice" class="new-range-preview">
                New Range: ₱{{ (unitData.newMinPrice || unitData.currentMinPrice).toFixed(2) }} - 
                ₱{{ (unitData.newMaxPrice || unitData.currentMaxPrice).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add New Unit -->
        <div class="add-new-unit-section">
          <h4>Add New Unit</h4>
          <div class="new-unit-form">
            <div class="unit-selector">
              <label>Unit Type</label>
              <select v-model="newUnitData.unit">
                <option value="">Select unit type...</option>
                <option 
                  v-for="unit in availableNewUnits" 
                  :key="unit.value"
                  :value="unit.label"
                >
                  {{ unit.label }}
                </option>
              </select>
            </div>
            <div v-if="newUnitData.unit" class="price-inputs">
              <div class="input-group">
                <label>Min Price (₱)</label>
                <input 
                  type="number" 
                  v-model.number="newUnitData.minPrice"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  @input="validatePriceInput($event)"
                >
              </div>
              <div class="input-group">
                <label>Max Price (₱)</label>
                <input 
                  type="number" 
                  v-model.number="newUnitData.maxPrice"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  @input="validatePriceInput($event)"
                >
              </div>
            </div>
            <div v-if="newUnitData.minPrice && newUnitData.maxPrice" class="new-range-preview">
              New Unit Range: ₱{{ newUnitData.minPrice.toFixed(2) }} - ₱{{ newUnitData.maxPrice.toFixed(2) }}
            </div>
          </div>
        </div>
        
        <!-- Contribution Note -->
        <div class="contribution-note">
          <div class="note-icon">ℹ️</div>
          <div class="note-text">
            <strong>Note:</strong> Your price updates will be reviewed and may be combined with other farmer contributions 
            to maintain accurate market pricing. Thank you for helping the farming community!
          </div>
        </div>
        
        <div class="modal-actions">
          <button 
            @click="showUpdatePriceModal = false" 
            class="btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="submitPriceUpdates" 
            class="btn-primary"
            :disabled="!hasValidPriceUpdates || isUpdatingPrices"
          >
            {{ isUpdatingPrices ? 'Updating...' : 'Submit Updates' }}
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Edit Reference Units Modal -->
  <div v-if="showEditReferenceUnitsModal" class="unit-selection-modal" @click.self="showEditReferenceUnitsModal = false">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Edit Your Selected Reference Units</h3>
        <button @click="showEditReferenceUnitsModal = false" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <p class="modal-description">
          Modify your selected reference units for <strong>{{ getDisplayProductName(selectedProductFromTable) }}</strong>.
          You can only sell in the units you select here.
        </p>
        
        <!-- Current Selected Units Summary -->
        <div v-if="tempSelectedReferenceUnits.length > 0" class="selected-units-summary">
          <h4>Currently Selected Reference Units:</h4>
          <div class="selected-units-list">
            <span 
              v-for="unit in tempSelectedReferenceUnits" 
              :key="unit.unit"
              class="selected-unit-tag"
            >
              {{ unit.unit }} ({{ unit.priceRange }})
              <button @click="removeTempReferenceUnit(unit)" class="remove-unit-btn">×</button>
            </span>
          </div>
        </div>
        
        <!-- All Available Units Grid -->
        <div class="units-selection-section">
          <h4>Available Units for This Product:</h4>
          <div class="units-selection-grid">
            <div 
              v-for="unitSummary in selectedProductFromTable?.originalProduct?.unitSummaries" 
              :key="unitSummary.unit"
              @click="toggleTempReferenceUnit(unitSummary)"
              class="unit-selection-card"
              :class="{ 'selected': isTempReferenceUnitSelected(unitSummary.unit) }"
            >
              <div class="unit-checkbox">
                <input 
                  type="checkbox" 
                  :checked="isTempReferenceUnitSelected(unitSummary.unit)"
                  @change.stop="toggleTempReferenceUnit(unitSummary)"
                >
              </div>
              <div class="unit-name">{{ unitSummary.unit }}</div>
              <div class="unit-price">{{ unitSummary.priceRange }}</div>
            </div>
          </div>
        </div>
        
        <!-- Info about selling units -->
        <div class="info-note">
          <div class="note-icon">💡</div>
          <div class="note-text">
            <strong>Note:</strong> Only the units you select here will be available for selling. 
            Your current selling unit selections will be updated to match.
          </div>
        </div>
        
        <div class="modal-actions">
          <button 
            @click="cancelEditReferenceUnits" 
            class="btn-secondary"
          >
            Cancel
          </button>
          <button 
            @click="confirmEditReferenceUnits" 
            class="btn-primary"
            :disabled="tempSelectedReferenceUnits.length === 0"
          >
            Update Reference Units ({{ tempSelectedReferenceUnits.length }} selected)
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <div v-if="selectedProductFromTable" class="selected-product-info">
    <small class="text-muted">
      <strong>Selected:</strong> {{ getDisplayProductName(selectedProductFromTable) }}
      <span v-if="selectedProductFromTable.variety && selectedProductFromTable.variety !== 'Normal'" class="variety-badge">
        {{ selectedProductFromTable.variety }}
      </span>
      <span v-if="selectedProductFromTable.unit" class="unit-info"> - {{ selectedProductFromTable.unit }}</span>
    </small>
  </div>
</div>

            <!-- Custom Product Name (if not in table) -->
            <div class="form-group">
              <label>
                <input type="checkbox" v-model="useCustomProductName" @change="onCustomNameToggle">
                Use custom product name (not in D.A. list)
              </label>
            </div>

            <div v-if="useCustomProductName" class="form-group">
              <label for="customProductName">Custom Product Name *</label>
              <input 
                type="text" 
                id="customProductName" 
                v-model="product.productName" 
                :required="useCustomProductName"
                placeholder="Enter custom product name"
              >
            </div>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="product.description" 
                rows="3"
                placeholder="Short description of your product"
              ></textarea>
            </div>

            <!-- Add this right before the description form-group -->
            <div class="form-group">
              <label for="variety">Variety (Optional)</label>
              <input 
                type="text" 
                id="variety" 
                v-model="product.variety" 
                placeholder="e.g., Small, Medium, Large, Organic, etc. (Default: Normal)"
              >
            </div>

            <div class="form-group">
              <label>Product Code</label>
              <input 
                type="text" 
                v-model="product.code" 
                readonly
                class="readonly-input"
              >
            </div>
          </div>

          <!-- Selling Units & Pricing -->
          <div class="form-section wide">
            <h2>Selling Options & Pricing</h2>
            
            <!-- D.A. Price Reference -->
            <div v-if="selectedProductFromTable && !useCustomProductName" class="da-price-reference">
              <div class="reference-card">
                <div class="reference-header">
                  <h4>D.A. Reference Prices</h4>
                  <button 
                    type="button"
                    @click="showEditReferenceUnitsModal = true"
                    class="edit-reference-btn"
                    title="Edit Your Selected Reference Units"
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708L10.5 8.207l-3-3L12.146.146zM11.207 9l-3-3L2.5 11.707V14.5a.5.5 0 0 0 .5.5h2.793L11.207 9zM1 11.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5z"/>
                    </svg>
                    Edit Reference Units
                  </button>
                </div>
                <div class="reference-details">
                  <!-- Show selected reference units -->
                  <div v-if="selectedReferenceUnits.length > 0" class="selected-references">
                    <h5>Your Selected Reference Units:</h5>
                    <div class="reference-units-grid">
                      <div 
                        v-for="refUnit in selectedReferenceUnits" 
                        :key="refUnit.unit"
                        class="reference-unit-card"
                        :class="{ 'primary': refUnit.unit === selectedProductFromTable.unit }"
                      >
                        <div class="ref-unit-name">{{ refUnit.unit }}</div>
                        <div class="ref-unit-price">{{ refUnit.priceRange }}</div>
                        <div v-if="refUnit.unit === selectedProductFromTable.unit" class="primary-badge">Primary</div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Fallback for single unit selection -->
                  <div v-else class="selected-reference">
                    <strong>Selected Unit:</strong> {{ selectedProductFromTable.unit }}
                    <span class="reference-range">{{ selectedProductFromTable.priceRange }}</span>
                    <span v-if="selectedProductFromTable.variety && selectedProductFromTable.variety !== 'Normal'" class="reference-variety">
                      ({{ selectedProductFromTable.variety }})
                    </span>
                  </div>
                  
                  <!-- Show all available units for this product (collapsed/expandable) -->
                  <div v-if="selectedProductFromTable.originalProduct && selectedProductFromTable.originalProduct.unitSummaries" class="all-units-reference">
                    <details class="units-accordion">
                      <summary class="units-toggle">
                        <h5>View All Available Units ({{ selectedProductFromTable.originalProduct.unitSummaries.length }})</h5>
                      </summary>
                      <div class="units-grid">
                        <div 
                          v-for="unitSummary in selectedProductFromTable.originalProduct.unitSummaries" 
                          :key="unitSummary.unit"
                          class="unit-ref-item"
                          :class="{ 
                            'selected': selectedReferenceUnits.some(ru => ru.unit === unitSummary.unit),
                            'not-selected': !selectedReferenceUnits.some(ru => ru.unit === unitSummary.unit)
                          }"
                        >
                          <span class="unit-name">{{ unitSummary.unit }}</span>
                          <span class="unit-price">{{ unitSummary.priceRange }}</span>
                          <span v-if="selectedReferenceUnits.some(ru => ru.unit === unitSummary.unit)" class="selected-indicator">✓</span>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
                <small class="reference-note">
                  Use this as a guide for competitive pricing. Click "Update Prices" to contribute current market data.
                  <span v-if="selectedProductFromTable.originalProduct?.updatedAt" class="last-updated">
                    Last updated: {{ formatUpdateTime(selectedProductFromTable.originalProduct.updatedAt) }}
                  </span>
                </small>
              </div>
            </div>
            
            <!-- Unit Selection -->
            <div class="unit-selection">
              <label class="with-tooltip">
                Selling Units *
                <div class="info-tooltip">
                  <div class="info-icon">i</div>
                  <div class="tooltip-content">
                    Select the units in which you want to sell this product. Only units you selected as D.A. reference are available.
                  </div>
                </div>
              </label>
              
              <!-- Show selected reference units info -->
              <div v-if="selectedReferenceUnits.length > 0" class="reference-units-info">
                <small class="reference-info-text">
                  <strong>Available units based on your D.A. reference selection:</strong>
                  <span class="reference-units-list">
                    {{ selectedReferenceUnits.map(u => u.unit).join(', ') }}
                  </span>
                </small>
              </div>
              
              <div class="unit-checkboxes">
                <label 
                  v-for="unit in availableUnits" 
                  :key="unit.value"
                  class="unit-checkbox-wrapper"
                  :class="{ 
                    'disabled': !useCustomProductName && selectedProductFromTable && availableSellingUnits.length > 0 && !availableSellingUnits.some(au => au.value === unit.value)
                  }"
                >
                  <input 
                    type="checkbox" 
                    v-model="selectedUnits" 
                    :value="unit.value"
                    :disabled="!useCustomProductName && selectedProductFromTable && availableSellingUnits.length > 0 && !availableSellingUnits.some(au => au.value === unit.value)"
                    @change="handleUnitSelection(unit.value)"
                  >
                  <span class="unit-label">{{ unit.label }}</span>
                  <span 
                    v-if="!useCustomProductName && selectedProductFromTable && availableSellingUnits.length > 0 && !availableSellingUnits.some(au => au.value === unit.value)" 
                    class="disabled-reason"
                  >
                    (Not selected as D.A. reference)
                  </span>
                </label>
              </div>
              
              <!-- Show message when no reference units selected -->
              <div v-if="!selectedProductFromTable && !useCustomProductName" class="no-reference-message">
                <p class="info-message">
                  <i class="fas fa-info-circle"></i>
                  Please select a product from the D.A. database to see available selling units.
                </p>
              </div>
              
              <!-- Debug info for development (remove in production) -->
              <!-- <div v-if="selectedReferenceUnits.length > 0" class="debug-info" style="background-color: #f3f4f6; padding: 8px; margin-top: 8px; border-radius: 4px; font-size: 0.75rem;">
                <strong>Debug Info:</strong><br>
                Selected Reference Units: {{ selectedReferenceUnits.map(u => u.unit).join(', ') }}<br>
                Available Selling Units: {{ availableSellingUnits.map(u => u.label).join(', ') }}<br>
                Selected Selling Units: {{ selectedUnits.join(', ') }}
              </div> -->
            </div>

            <!-- Dynamic Unit Fields -->
            <template v-for="unit in selectedUnits" :key="unit">
              <div class="unit-details">
                <h3>{{ getUnitLabel(unit) }}</h3>
                
                <!-- Per Kilo -->
                <div v-if="unit === 'perKilo'" class="form-group">
                  <label>Price per Kilo (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerKilo" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerKilo'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerKilo')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Kilo (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerKilo" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerKilo'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerKilo')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerKilo).toFixed(2) }}
                  </p>
                  <label>Available Stock (kg)</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerKilo" 
                    min="0"
                    step="0.01"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerKilo'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerKilo')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                </div>
                
                <!-- Per Sack -->
                <div v-if="unit === 'perSack'" class="form-group">
                  <label>Price per Sack (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerSack" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerSack'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerSack')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Sack (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerSack" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerSack'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerSack')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerSack).toFixed(2) }}
                  </p>
                  <label>Sack Weight (kg)</label>
                  <input 
                    type="number" 
                    v-model.number="product.sackWeight" 
                    min="0"
                    step="0.01"
                    placeholder="50"
                    @input="validateNumericInput($event, 'sackWeight'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'sackWeight')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Available Sacks</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerSack" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerSack'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerSack')"
                    pattern="[0-9]*"
                  >
                </div>
                
                <!-- Per Tali -->
                <div v-if="unit === 'perTali'" class="form-group">
                  <label>Price per Tali (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerTali" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerTali'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerTali')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Tali (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerTali" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerTali'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerTali')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerTali).toFixed(2) }}
                  </p>
                  <label>Bunches per Tali</label>
                  <input 
                    type="number" 
                    v-model.number="product.itemsPerTali" 
                    min="1"
                    step="1"
                    placeholder="10"
                    @input="validateNumericInput($event, 'itemsPerTali'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'itemsPerTali')"
                    pattern="[0-9]*"
                  >
                  <label>Available Tali</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerTali" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerTali'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerTali')"
                    pattern="[0-9]*"
                  >
                </div>
                
                <!-- Per Kaing -->
                <div v-if="unit === 'perKaing'" class="form-group">
                  <label>Price per Kaing (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerKaing" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerKaing'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerKaing')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Kaing (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerKaing" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerKaing'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerKaing')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerKaing).toFixed(2) }}
                  </p>
                  <label>Weight per Kaing (kg)</label>
                  <input 
                    type="number" 
                    v-model.number="product.kaingWeight" 
                    min="0"
                    step="0.01"
                    placeholder="12"
                    @input="validateNumericInput($event, 'kaingWeight'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'kaingWeight')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Available Kaing</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerKaing" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerKaing'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerKaing')"
                    pattern="[0-9]*"
                  >
                </div>
                
                <!-- Per Bundle -->
                <div v-if="unit === 'perBundle'" class="form-group">
                  <label>Price per Bundle (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerBundle" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerBundle'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerBundle')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Bundle (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerBundle" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerBundle'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerBundle')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerBundle).toFixed(2) }}
                  </p>
                  <label>Weight per Bundle (kg)</label>
                  <input 
                    type="number" 
                    v-model.number="product.bundleWeight" 
                    min="0"
                    step="0.01"
                    placeholder="12"
                    @input="validateNumericInput($event, 'bundleWeight'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'bundleWeight')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Available Bundles</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerBundle" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerBundle'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerBundle')"
                    pattern="[0-9]*"
                  >
                </div>
                
                <!-- Per Tray -->
                <div v-if="unit === 'perTray'" class="form-group">
                  <label>Price per Tray (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerTray" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerTray'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerTray')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Tray (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerTray" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerTray'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerTray')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerTray).toFixed(2) }}
                  </p>
                  <label>Items per Tray</label>
                  <input 
                    type="number" 
                    v-model.number="product.itemsPerTray" 
                    min="1"
                    step="1"
                    placeholder="30"
                    @input="validateNumericInput($event, 'itemsPerTray'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'itemsPerTray')"
                    pattern="[0-9]*"
                  >
                  <label>Available Trays</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerTray" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerTray'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerTray')"
                    pattern="[0-9]*"
                  >
                </div>
                
                <!-- Per Piece -->
                <div v-if="unit === 'perPiece'" class="form-group">
                  <label>Price per Piece (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.pricePerPiece" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'pricePerPiece'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'pricePerPiece')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <label>Production Cost per Piece (₱)</label>
                  <input 
                    type="number" 
                    v-model.number="product.costPerPiece" 
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    @input="validateNumericInput($event, 'costPerPiece'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'costPerPiece')"
                    pattern="[0-9]*\.?[0-9]*"
                  >
                  <p v-if="product.isOnSale" class="sale-price">
                    Sale Price: ₱{{ calculateSalePrice(product.pricePerPiece).toFixed(2) }}
                  </p>
                  <label>Available Pieces</label>
                  <input 
                    type="number" 
                    v-model.number="product.stockPerPiece" 
                    min="0"
                    step="1"
                    placeholder="0"
                    @input="validateNumericInput($event, 'stockPerPiece'); calculateProfit()"
                    @keypress="onlyNumbers"
                    @paste="handlePaste($event, 'stockPerPiece')"
                    pattern="[0-9]*"
                  >
                </div>
              </div>
            </template>

            <!-- Cost & Profit -->
            <div class="cost-profit-section">
              <div class="form-group">
                <label class="with-tooltip">
                  Estimated Profit (₱)
                  <div class="info-tooltip">
                    <div class="info-icon">i</div>
                    <div class="tooltip-content">
                      Calculated profit based on price minus cost
                    </div>
                  </div>
                </label>
                <input 
                  type="number" 
                  v-model.number="product.profit" 
                  readonly
                  class="readonly-input"
                  placeholder="0.00"
                >
              </div>
            </div>
          </div>

          <!-- Sale Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Sale Settings
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure sale pricing and discounts
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.isOnSale">
                Product is on sale
              </label>
            </div>

            <div v-if="product.isOnSale" class="form-group">
              <label>Discount Percentage (%)</label>
              <input 
                type="number" 
                v-model.number="product.discountPercentage" 
                min="0" 
                max="100"
                step="0.01"
                placeholder="0"
                @input="validateNumericInput($event, 'discountPercentage'); calculateProfit()"
                @keypress="onlyNumbers"
                @paste="handlePaste($event, 'discountPercentage')"
                pattern="[0-9]*\.?[0-9]*"
              >
            </div>
          </div>

          <!-- Pre-order Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Pre-order Settings
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure pre-order options for future availability
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.isPreOrder">
                Enable pre-orders
              </label>
            </div>

            <template v-if="product.isPreOrder">
              <div class="form-group">
                <label>Pre-order Message</label>
                <input 
                  type="text"
                  v-model="product.preOrderMessage"
                  placeholder="e.g., Available for harvest in 2 weeks"
                >
              </div>

              <div class="form-group">
                <label>Pre-order Limit</label>
                <input 
                  type="number" 
                  v-model.number="product.preOrderLimit"
                  min="0"
                  step="1"
                  placeholder="Maximum pre-order quantity"
                  @input="validateNumericInput($event, 'preOrderLimit')"
                  @keypress="onlyNumbers"
                  @paste="handlePaste($event, 'preOrderLimit')"
                  pattern="[0-9]*"
                >
              </div>

              <div class="form-group">
                <label>Lead Time (days)</label>
                <input 
                  type="number" 
                  v-model.number="product.preorderDays"
                  min="0"
                  step="1"
                  placeholder="7"
                  @input="validateNumericInput($event, 'preorderDays')"
                  @keypress="onlyNumbers"
                  @paste="handlePaste($event, 'preorderDays')"
                  pattern="[0-9]*"
                >
              </div>
            </template>
          </div>

          <!-- Wholesale Settings -->
          <div class="form-section">
            <h2 class="with-tooltip">
              Wholesale Options
              <div class="info-tooltip">
                <div class="info-icon">i</div>
                <div class="tooltip-content">
                  Configure wholesale pricing for bulk orders
                </div>
              </div>
            </h2>
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" v-model="product.wholesaleAvailable">
                Available for wholesale
              </label>
            </div>

            <div v-if="product.wholesaleAvailable" class="form-group">
              <label>Minimum Wholesale Quantity</label>
              <input 
                type="number" 
                v-model.number="product.minWholesaleQty" 
                min="1"
                step="1"
                placeholder="1"
                @input="validateNumericInput($event, 'minWholesaleQty')"
                @keypress="onlyNumbers"
                @paste="handlePaste($event, 'minWholesaleQty')"
                pattern="[0-9]*"
              >
              <label>Wholesale Price (₱)</label>
              <input 
                type="number" 
                v-model.number="product.wholesalePrice" 
                min="0"
                step="0.01"
                placeholder="0.00"
                @input="validateNumericInput($event, 'wholesalePrice')"
                @keypress="onlyNumbers"
                @paste="handlePaste($event, 'wholesalePrice')"
                pattern="[0-9]*\.?[0-9]*"
              >
            </div>
          </div>

          <!-- Product Details -->
          <div class="form-section">
            <h2>Product Details</h2>
            <div class="form-group">
              <label>Packaging Type</label>
              <select v-model="product.packagingType">
                <option value="none">None</option>
                <option value="plastic">Plastic Bag</option>
                <option value="kaing">Kaing (Basket)</option>
                <option value="sack">Sack</option>
                <option value="tray">Tray</option>
                <option value="bundle">Bundle</option>
                <option value="tali">Tied (Tali)</option>
              </select>
            </div>

            <div class="form-group">
              <label>Status *</label>
              <select v-model="product.status" required>
                <option value="available">Available</option>
                <option value="limited">Limited Stock</option>
                <option value="preorder">Pre-order Only</option>
              </select>
            </div>
          </div>

          <!-- Product Image -->
          <div class="form-section">
            <h2>Product Image</h2>
            <div class="form-group">
              <input 
                type="file" 
                @change="uploadImage" 
                accept="image/*"
                class="image-upload-input"
              >
            </div>
            <div class="image-preview">
              <div v-if="product.image" class="image-item">
                <img 
                  :src="product.image" 
                  class="product-image" 
                  alt="Product image"
                >
                <button @click="removeImage" class="remove-image" type="button">
                  ×
                </button>
              </div>
              <div v-else class="empty-state">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2FhYSI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPg==" class="empty-image" alt="No image uploaded">
                <p>No image uploaded yet</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pre-order and Sale Info Display -->
        <div v-if="product.isPreOrder || product.isOnSale" class="info-panel">
          <div class="info-content">
            <div v-if="product.isOnSale" class="info-row">
              <span class="info-label">Sale Information:</span>
              <span class="info-value">{{ product.discountPercentage }}% discount applied</span>
            </div>
            <div v-if="product.isPreOrder" class="info-row">
              <span class="info-label">Pre-order Message:</span>
              <span class="info-value">{{ product.preOrderMessage || 'Available for pre-order' }}</span>
            </div>
            <div v-if="product.isPreOrder" class="info-row">
              <span class="info-label">Pre-order Limit:</span>
              <span class="info-value">{{ product.preOrderLimit }} units</span>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button 
            type="button" 
            class="cancel-btn" 
            @click="cancelEdit"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="save-btn" 
            :disabled="isSaving"
          >
            {{ isSaving ? 'Saving...' : 'Save Product' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db } from '@/firebase/firebaseConfig';
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, increment, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Sidebar from '@/components/Sidebar.vue';
import NotifProduct from '@/components/sellerside/NotifProduct.vue';

export default {
  components: {
    Sidebar,
    NotifProduct
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const auth = getAuth();
    const notifProduct = ref(null);

    // Configuration
    const availableUnits = ref([
      { value: 'perKilo', label: 'Per Kilo' },
      { value: 'perSack', label: 'Per Sack' },
      { value: 'perTali', label: 'Per Tali' },
      { value: 'perKaing', label: 'Per Kaing' },
      { value: 'perBundle', label: 'Per Bundle' },
      { value: 'perTray', label: 'Per Tray' },
      { value: 'perPiece', label: 'Per Piece' }
    ]);    // Component state
    const isEditing = computed(() => route.name === 'EditProduct');
    const isSaving = ref(false);
    const selectedUnits = ref([]);
    const categories = ref([]);
    const productTable = ref([]); // Data from ProductTable (productPrices collection)
    const selectedProductFromTable = ref(null);
    const useCustomProductName = ref(false);

    // Search functionality for dropdowns
    const categorySearchText = ref('');
    const productSearchText = ref('');
    const showCategoryDropdown = ref(false);
    const showProductDropdown = ref(false);
    
    // Unit selection modal for products with multiple units
    const showUnitSelectionModal = ref(false);
    const selectedProductForUnitSelection = ref(null);
    const selectedReferenceUnits = ref([]); // Array of selected reference units
    const availableSellingUnits = ref([]); // Units available for selling based on reference selection

    // D.A. Price Update Modal
    const showUpdatePriceModal = ref(false);
    const updatePriceUnits = ref([]);
    const newUnitData = ref({
      unit: '',
      minPrice: null,
      maxPrice: null
    });
    const isUpdatingPrices = ref(false);

    // Edit Reference Units Modal
    const showEditReferenceUnitsModal = ref(false);
    const tempSelectedReferenceUnits = ref([]); // Temporary selection for editing

    // Computed for filtering categories by search
    const filteredCategories = computed(() => {
      if (!categorySearchText.value) return categories.value;
      return categories.value.filter(cat => 
        cat.category.toLowerCase().includes(categorySearchText.value.toLowerCase())
      );
    });

    // Computed for filtering products by category
    const filteredProductTable = computed(() => {
      if (!product.value.category) return [];
      return productTable.value.filter(item => item.category === product.value.category);
    });

    // Computed for filtering products by search text - grouped by product
    const filteredProductsBySearch = computed(() => {
      const baseProducts = filteredProductTable.value;
      const filteredProducts = !productSearchText.value 
        ? baseProducts 
        : baseProducts.filter(item => 
            item.productName.toLowerCase().includes(productSearchText.value.toLowerCase())
          );
      
      // Return products grouped (not expanded) - each product appears once
      return filteredProducts.map(product => ({
        id: product.id,
        originalId: product.id,
        productName: product.productName,
        category: product.category,
        variety: product.variety,
        // Include all unit summaries for display
        unitSummaries: product.unitSummaries || [],
        // For backward compatibility, include first unit data
        unit: product.unitSummaries && product.unitSummaries.length > 0 ? product.unitSummaries[0].unit : 'N/A',
        minPrice: product.unitSummaries && product.unitSummaries.length > 0 ? product.unitSummaries[0].minPrice : 0,
        maxPrice: product.unitSummaries && product.unitSummaries.length > 0 ? product.unitSummaries[0].maxPrice : 0,
        priceRange: product.unitSummaries && product.unitSummaries.length > 0 ? 
          `${product.unitSummaries.length} unit${product.unitSummaries.length > 1 ? 's' : ''} available` : 'No pricing data',
        originalProduct: product
      }));
    });

    // Computed for available units to add (not already in D.A. database)
    const availableNewUnits = computed(() => {
      if (!selectedProductFromTable.value || !selectedProductFromTable.value.originalProduct) {
        return availableUnits.value;
      }
      
      const existingUnits = selectedProductFromTable.value.originalProduct.unitSummaries.map(u => u.unit.toLowerCase());
      return availableUnits.value.filter(unit => 
        !existingUnits.includes(unit.label.toLowerCase())
      );
    });

    // Computed to check if there are valid price updates
    const hasValidPriceUpdates = computed(() => {
      // Check existing units updates
      const hasExistingUpdates = updatePriceUnits.value.some(unit => 
        (unit.newMinPrice && unit.newMinPrice > 0) || 
        (unit.newMaxPrice && unit.newMaxPrice > 0)
      );
      
      // Check new unit data
      const hasNewUnit = newUnitData.value.unit && 
                        newUnitData.value.minPrice > 0 && 
                        newUnitData.value.maxPrice > 0 &&
                        newUnitData.value.minPrice <= newUnitData.value.maxPrice;
      
      return hasExistingUpdates || hasNewUnit;
    });

    const product = ref({
      // Basic Info
      productName: '',
      description: '',
      category: '',
      code: '',
        variety: 'Normal', // Add this line

      // Pricing
      costPerKilo: 0,
      costPerSack: 0,
      costPerTali: 0,
      costPerKaing: 0,
      costPerBundle: 0,
      costPerTray: 0,
      costPerPiece: 0,

      // Units
      pricePerKilo: 0,
      stockPerKilo: 0,
      pricePerSack: 0,
      sackWeight: 50,
      stockPerSack: 0,
      pricePerTali: 0,
      itemsPerTali: 10,
      stockPerTali: 0,
      pricePerKaing: 0,
      kaingWeight: 12,
      stockPerKaing: 0,
      pricePerBundle: 0,
      bundleWeight: 12,
      stockPerBundle: 0,
      pricePerTray: 0,
      itemsPerTray: 30,
      stockPerTray: 0,
      pricePerPiece: 0,
      stockPerPiece: 0,
      

      // Details
      packagingType: 'none',
      image: '',

      // Availability
      status: 'available',
      wholesaleAvailable: false,
      minWholesaleQty: 1,
      wholesalePrice: 0,
      preorderDays: 7,

      // Sale features
      isOnSale: false,
      discountPercentage: 0,

      // Pre-order features
      isPreOrder: false,
      preOrderMessage: '',
      preOrderLimit: 0,

      // Metadata
      sellerId: '',
      createdAt: null,
      updatedAt: null,
      availableUnits: []
    });

    // Methods
    const generateProductCode = () => {
      if (!product.value.category || !product.value.productName) return;

      const categoryPrefix = product.value.category.substring(0, 3).toUpperCase();
      const namePrefix = product.value.productName.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, '');
      const randomNum = Math.floor(100 + Math.random() * 900);
      const timestamp = Date.now().toString().slice(-3);

      product.value.code = `${categoryPrefix}${namePrefix}-${randomNum}${timestamp}`;
    };    const onCategoryChange = () => {
      // Reset product selection when category changes
      selectedProductFromTable.value = null;
      selectedReferenceUnits.value = [];
      availableSellingUnits.value = [];
      product.value.productName = '';
      useCustomProductName.value = false;
      productSearchText.value = '';
      generateProductCode();
    };

    const getDisplayProductName = (productItem) => {
  if (!productItem) return '';
  
  const baseName = productItem.productName;
  const variety = productItem.variety;
  
  // If no variety or variety is 'Normal', return just the base name
  if (!variety || variety.toLowerCase() === 'normal') {
    return baseName;
  }
  
  // Check if variety is already included in the product name
  const lowerBaseName = baseName.toLowerCase();
  const lowerVariety = variety.toLowerCase();
  
  // If variety is already in parentheses in the name, return as is
  if (lowerBaseName.includes(`(${lowerVariety})`)) {
    return baseName;
  }
  
  // If variety is somehow already in the name but not in parentheses
  if (lowerBaseName.includes(lowerVariety)) {
    return baseName;
  }
  
  // Add variety in parentheses
  return `${baseName} (${variety})`;
};

    // New methods for searchable dropdowns
    const onCategorySearch = () => {
      showCategoryDropdown.value = true;
    };

    const selectCategory = (categoryName) => {
      product.value.category = categoryName;
      categorySearchText.value = categoryName;
      showCategoryDropdown.value = false;
      onCategoryChange();
    };

    const hideCategoryDropdown = () => {
      setTimeout(() => {
        showCategoryDropdown.value = false;
        // If no valid category is selected, clear the search text
        if (!product.value.category) {
          categorySearchText.value = '';
        }
      }, 200);
    };

   const onProductSearch = () => {
  showProductDropdown.value = true;
  // If typing custom text, enable custom product name
  if (productSearchText.value && !filteredProductsBySearch.value.find(p => 
    getDisplayProductName(p).toLowerCase() === productSearchText.value.toLowerCase()
  )) {
    useCustomProductName.value = true;
    product.value.productName = productSearchText.value;
  }
};

   // Modify the selectProduct method to handle grouped products
const selectProduct = (productItem) => {
  // If the product has multiple units, show unit selection
  if (productItem.unitSummaries && productItem.unitSummaries.length > 1) {
    selectedReferenceUnits.value = []; // Reset previous selections
    showUnitSelectionModal.value = true;
    selectedProductForUnitSelection.value = productItem;
  } else {
    // Single unit product - select directly
    const unitToSelect = productItem.unitSummaries && productItem.unitSummaries.length > 0 
      ? productItem.unitSummaries[0] 
      : null;
    
    if (unitToSelect) {
      selectedReferenceUnits.value = [unitToSelect];
      selectedProductFromTable.value = {
        ...productItem,
        unit: unitToSelect.unit,
        minPrice: unitToSelect.minPrice,
        maxPrice: unitToSelect.maxPrice,
        priceRange: unitToSelect.priceRange
      };
      
      // Update available selling units
      updateAvailableSellingUnits();
    }
    
    const displayName = getDisplayProductName(productItem);
    productSearchText.value = displayName;
    product.value.productName = displayName;
    
    // Store the original product name and variety separately for reference
    product.value.baseProductName = productItem.productName;
    product.value.variety = productItem.variety || 'Normal';
    
    useCustomProductName.value = false;
    showProductDropdown.value = false;
    generateProductCode();
  }
};

// New method to select a specific unit from the modal
const selectProductUnit = (productItem, unitSummary) => {
  selectedProductFromTable.value = {
    ...productItem,
    unit: unitSummary.unit,
    minPrice: unitSummary.minPrice,
    maxPrice: unitSummary.maxPrice,
    priceRange: unitSummary.priceRange
  };
  
  const displayName = getDisplayProductName(productItem);
  productSearchText.value = `${displayName} (${unitSummary.unit})`;
  product.value.productName = displayName;
  
  // Store the original product name and variety separately for reference
  product.value.baseProductName = productItem.productName;
  product.value.variety = productItem.variety || 'Normal';
  
  useCustomProductName.value = false;
  showProductDropdown.value = false;
  showUnitSelectionModal.value = false;
  selectedProductForUnitSelection.value = null;
  generateProductCode();
};

    const hideProductDropdown = () => {
  setTimeout(() => {
    showProductDropdown.value = false;
    // Update product name based on current search text if no product selected
    if (!selectedProductFromTable.value && productSearchText.value) {
      useCustomProductName.value = true;
      product.value.productName = productSearchText.value;
      // Reset variety and reference units if using custom name
      product.value.variety = 'Normal';
      selectedReferenceUnits.value = [];
      availableSellingUnits.value = [];
      generateProductCode();
    }
  }, 200);
};
     const onProductSelect = () => {
      if (selectedProductFromTable.value) {
        product.value.productName = selectedProductFromTable.value.productName;
        productSearchText.value = selectedProductFromTable.value.productName;
        useCustomProductName.value = false;
        generateProductCode();
      }
    };

    const onCustomNameToggle = () => {
      if (useCustomProductName.value) {
        selectedProductFromTable.value = null;
        selectedReferenceUnits.value = [];
        availableSellingUnits.value = [];
        product.value.productName = productSearchText.value || '';
      } else {
        product.value.productName = '';
        productSearchText.value = '';
      }
      generateProductCode();
    };

    // Unit selection modal methods
    const toggleReferenceUnit = (unitSummary) => {
      const index = selectedReferenceUnits.value.findIndex(u => u.unit === unitSummary.unit);
      if (index > -1) {
        selectedReferenceUnits.value.splice(index, 1);
      } else {
        selectedReferenceUnits.value.push(unitSummary);
      }
    };

    const isReferenceUnitSelected = (unit) => {
      return selectedReferenceUnits.value.some(u => u.unit === unit);
    };

    const removeReferenceUnit = (unitToRemove) => {
      const index = selectedReferenceUnits.value.findIndex(u => u.unit === unitToRemove.unit);
      if (index > -1) {
        selectedReferenceUnits.value.splice(index, 1);
      }
    };

    const confirmReferenceUnits = () => {
      if (selectedReferenceUnits.value.length === 0) return;
      
      // Set the selected product with the first reference unit as primary
      const primaryUnit = selectedReferenceUnits.value[0];
      selectedProductFromTable.value = {
        ...selectedProductForUnitSelection.value,
        unit: primaryUnit.unit,
        minPrice: primaryUnit.minPrice,
        maxPrice: primaryUnit.maxPrice,
        priceRange: primaryUnit.priceRange,
        originalProduct: selectedProductForUnitSelection.value
      };
      
      // Update product name and form
      const displayName = getDisplayProductName(selectedProductForUnitSelection.value);
      productSearchText.value = displayName;
      product.value.productName = displayName;
      product.value.baseProductName = selectedProductForUnitSelection.value.productName;
      product.value.variety = selectedProductForUnitSelection.value.variety || 'Normal';
      
      // Update available selling units based on selected reference units
      updateAvailableSellingUnits();
      
      // Close modal
      showUnitSelectionModal.value = false;
      selectedProductForUnitSelection.value = null;
      showProductDropdown.value = false;
      useCustomProductName.value = false;
      generateProductCode();
    };

    // Update available selling units based on selected reference units
    const updateAvailableSellingUnits = () => {
      if (selectedReferenceUnits.value.length === 0) {
        availableSellingUnits.value = [];
        return;
      }
      
      // Map reference units to available units format
      const referenceUnitNames = selectedReferenceUnits.value.map(u => u.unit.toLowerCase());
      
      // Create a comprehensive mapping from D.A. units to form units
      const unitMapping = {
        // Kilo variations
        'per kilo': 'perKilo',
        'per kg': 'perKilo',
        'kilo': 'perKilo',
        'kg': 'perKilo',
        'kilogram': 'perKilo',
        
        // Sack variations
        'per sack': 'perSack',
        'sack': 'perSack',
        'bag': 'perSack',
        'per bag': 'perSack',
        
        // Tali variations
        'per tali': 'perTali',
        'tali': 'perTali',
        'tied': 'perTali',
        'bundle': 'perTali', // Sometimes tali is referred to as bundle in D.A.
        
        // Kaing variations
        'per kaing': 'perKaing',
        'kaing': 'perKaing',
        'basket': 'perKaing',
        'per basket': 'perKaing',
        
        // Bundle variations (separate from tali)
        'per bundle': 'perBundle',
        'bundles': 'perBundle',
        
        // Tray variations
        'per tray': 'perTray',
        'tray': 'perTray',
        'trays': 'perTray',
        
        // Piece variations
        'per piece': 'perPiece',
        'piece': 'perPiece',
        'pieces': 'perPiece',
        'each': 'perPiece',
        'per each': 'perPiece'
      };
      
      availableSellingUnits.value = availableUnits.value.filter(unit => {
        // Check if this unit corresponds to any of the selected reference units
        return referenceUnitNames.some(refUnit => {
          const normalizedRefUnit = refUnit.toLowerCase().trim();
          
          // Direct mapping check
          if (unitMapping[normalizedRefUnit] === unit.value) {
            return true;
          }
          
          // Fallback: check if the unit label matches the reference unit
          const unitLabel = unit.label.toLowerCase();
          return normalizedRefUnit === unitLabel || 
                 normalizedRefUnit.includes(unitLabel.replace('per ', '')) ||
                 unitLabel.includes(normalizedRefUnit.replace('per ', ''));
        });
      });
      
      console.log('Reference units:', referenceUnitNames);
      console.log('Available selling units:', availableSellingUnits.value);
    };

    // Edit Reference Units Methods
    const toggleTempReferenceUnit = (unitSummary) => {
      const index = tempSelectedReferenceUnits.value.findIndex(u => u.unit === unitSummary.unit);
      if (index > -1) {
        tempSelectedReferenceUnits.value.splice(index, 1);
      } else {
        tempSelectedReferenceUnits.value.push(unitSummary);
      }
    };

    const isTempReferenceUnitSelected = (unit) => {
      return tempSelectedReferenceUnits.value.some(u => u.unit === unit);
    };

    const removeTempReferenceUnit = (unitToRemove) => {
      const index = tempSelectedReferenceUnits.value.findIndex(u => u.unit === unitToRemove.unit);
      if (index > -1) {
        tempSelectedReferenceUnits.value.splice(index, 1);
      }
    };

    const confirmEditReferenceUnits = () => {
      if (tempSelectedReferenceUnits.value.length === 0) return;
      
      // Update the actual selected reference units
      selectedReferenceUnits.value = [...tempSelectedReferenceUnits.value];
      
      // Update the selected product with the first reference unit as primary
      const primaryUnit = selectedReferenceUnits.value[0];
      selectedProductFromTable.value = {
        ...selectedProductFromTable.value,
        unit: primaryUnit.unit,
        minPrice: primaryUnit.minPrice,
        maxPrice: primaryUnit.maxPrice,
        priceRange: primaryUnit.priceRange
      };
      
      // Update available selling units based on new reference selection
      updateAvailableSellingUnits();
      
      // Filter existing selected units to only include those that are still available
      const availableUnitValues = availableSellingUnits.value.map(u => u.value);
      selectedUnits.value = selectedUnits.value.filter(unit => availableUnitValues.includes(unit));
      
      // Close modal
      showEditReferenceUnitsModal.value = false;
      
      // Show feedback
      showNotification(`Updated reference units. ${selectedReferenceUnits.value.length} units selected.`, 'success');
    };

    const cancelEditReferenceUnits = () => {
      // Reset temp selection to current selection
      tempSelectedReferenceUnits.value = [...selectedReferenceUnits.value];
      showEditReferenceUnitsModal.value = false;
    };

    // D.A. Price Update Methods
    const initializePriceUpdateModal = () => {
      if (!selectedProductFromTable.value || !selectedProductFromTable.value.originalProduct) {
        return;
      }

      // Initialize existing units for update
      updatePriceUnits.value = selectedProductFromTable.value.originalProduct.unitSummaries.map(unit => ({
        unit: unit.unit,
        currentMinPrice: unit.minPrice,
        currentMaxPrice: unit.maxPrice,
        currentPriceRange: unit.priceRange,
        newMinPrice: null,
        newMaxPrice: null
      }));

      // Reset new unit form
      newUnitData.value = {
        unit: '',
        minPrice: null,
        maxPrice: null
      };
    };

    const validatePriceInput = (event) => {
      let value = parseFloat(event.target.value);
      if (isNaN(value) || value < 0) {
        event.target.value = '';
        return;
      }
    };

    const submitPriceUpdates = async () => {
      if (!hasValidPriceUpdates.value) return;

      // Validate price ranges before submitting
      for (const unit of updatePriceUnits.value) {
        if (unit.newMinPrice && unit.newMaxPrice && unit.newMinPrice > unit.newMaxPrice) {
          showNotification(`Invalid price range for ${unit.unit}: Min price cannot be greater than max price`, 'warning');
          return;
        }
      }

      if (newUnitData.value.minPrice && newUnitData.value.maxPrice && newUnitData.value.minPrice > newUnitData.value.maxPrice) {
        showNotification('Invalid price range for new unit: Min price cannot be greater than max price', 'warning');
        return;
      }

      isUpdatingPrices.value = true;
      
      try {
        const updates = {};
        let hasUpdates = false;

        // Process existing unit updates
        updatePriceUnits.value.forEach(unit => {
          if (unit.newMinPrice || unit.newMaxPrice) {
            const unitKey = unit.unit;
            updates[`unitPricing.${unitKey}`] = {
              minPrice: unit.newMinPrice || unit.currentMinPrice,
              maxPrice: unit.newMaxPrice || unit.currentMaxPrice
            };
            hasUpdates = true;
          }
        });

        // Process new unit addition
        if (newUnitData.value.unit && newUnitData.value.minPrice && newUnitData.value.maxPrice) {
          const unitKey = newUnitData.value.unit;
          updates[`unitPricing.${unitKey}`] = {
            minPrice: newUnitData.value.minPrice,
            maxPrice: newUnitData.value.maxPrice
          };
          hasUpdates = true;
        }

        if (hasUpdates) {
          // Update the productPrices document
          const productPriceRef = doc(db, 'productPrices', selectedProductFromTable.value.id);
          await updateDoc(productPriceRef, {
            ...updates,
            updatedAt: serverTimestamp(),
            lastUpdatedBy: auth.currentUser?.uid
          });

          showNotification('D.A. reference prices updated successfully! Thank you for your contribution.', 'success');
          
          // Refresh the product table to show updated prices
          await fetchProductTable();
          
          // Update current selected product with new data
          if (selectedProductFromTable.value) {
            const updatedProduct = productTable.value.find(p => p.id === selectedProductFromTable.value.id);
            if (updatedProduct) {
              selectedProductFromTable.value = {
                ...selectedProductFromTable.value,
                originalProduct: updatedProduct
              };
              
              // Update selected reference units with new pricing
              selectedReferenceUnits.value = selectedReferenceUnits.value.map(refUnit => {
                const updatedUnit = updatedProduct.unitSummaries.find(u => u.unit === refUnit.unit);
                return updatedUnit || refUnit;
              });
            }
          }
          
          // Close modal
          showUpdatePriceModal.value = false;
        }
      } catch (error) {
        console.error('Error updating D.A. prices:', error);
        showNotification('Failed to update D.A. prices. Please try again.', 'error');
      } finally {
        isUpdatingPrices.value = false;
      }
    };

    const formatUpdateTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        // Handle Firestore timestamp
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 24) {
          return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
        } else {
          const diffInDays = Math.floor(diffInHours / 24);
          return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
        }
      } catch (error) {
        return '';
      }
    };

    const fetchProductTable = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'productPrices'));
        productTable.value = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Process the new unitPricing structure
          const processedProduct = {
            id: doc.id,
            productName: data.productName || '',
            category: data.category || '',
            variety: data.variety || 'Normal',
            unitPricing: data.unitPricing || {},
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            // Extract available units from unitPricing
            availableUnits: data.unitPricing ? Object.keys(data.unitPricing) : [],
            // Create a summary for display purposes
            unitSummaries: []
          };
          
          // Create unit summaries for easier display
          if (data.unitPricing) {
            Object.entries(data.unitPricing).forEach(([unit, pricing]) => {
              if (pricing && typeof pricing === 'object' && pricing.minPrice !== undefined && pricing.maxPrice !== undefined) {
                processedProduct.unitSummaries.push({
                  unit: unit,
                  minPrice: pricing.minPrice || 0,
                  maxPrice: pricing.maxPrice || 0,
                  priceRange: `₱${(pricing.minPrice || 0).toFixed(2)} - ₱${(pricing.maxPrice || 0).toFixed(2)}`
                });
              }
            });
          }
          
          return processedProduct;
        });
        
        console.log('Fetched product table:', productTable.value);
      } catch (error) {
        console.error('Error fetching product table:', error);
        showNotification('Failed to load product reference data', 'error');
      }
    };

    const calculateSalePrice = (originalPrice) => {
      if (!product.value.isOnSale || product.value.discountPercentage <= 0) return originalPrice;
      return originalPrice * (1 - product.value.discountPercentage / 100);
    };

    const calculateProfit = () => {
      let totalProfit = 0;

      selectedUnits.value.forEach(unit => {
        let unitProfit = 0;
        let price = 0;
        let stock = 0;
        let unitCost = 0;

        switch (unit) {
          case 'perKilo':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerKilo) : product.value.pricePerKilo;
            stock = product.value.stockPerKilo;
            unitCost = product.value.costPerKilo;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perSack':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerSack) : product.value.pricePerSack;
            stock = product.value.stockPerSack;
            unitCost = product.value.costPerSack;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perTali':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerTali) : product.value.pricePerTali;
            stock = product.value.stockPerTali;
            unitCost = product.value.costPerTali;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perKaing':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerKaing) : product.value.pricePerKaing;
            stock = product.value.stockPerKaing;
            unitCost = product.value.costPerKaing;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perBundle':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerBundle) : product.value.pricePerBundle;
            stock = product.value.stockPerBundle;
            unitCost = product.value.costPerBundle;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perTray':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerTray) : product.value.pricePerTray;
            stock = product.value.stockPerTray;
            unitCost = product.value.costPerTray;
            unitProfit = (price - unitCost) * stock;
            break;

          case 'perPiece':
            price = product.value.isOnSale ? calculateSalePrice(product.value.pricePerPiece) : product.value.pricePerPiece;
            stock = product.value.stockPerPiece;
            unitCost = product.value.costPerPiece;
            unitProfit = (price - unitCost) * stock;
            break;
        }

        totalProfit += unitProfit;
      });

      product.value.profit = parseFloat(totalProfit.toFixed(2));
    };

    const handleUnitSelection = (unit) => {
      if (selectedUnits.value.includes(unit)) {
        switch (unit) {
          case 'perSack':
            if (!product.value.sackWeight) product.value.sackWeight = 50;
            break;
          case 'perTali':
            if (!product.value.itemsPerTali) product.value.itemsPerTali = 10;
            break;
          case 'perKaing':
            if (!product.value.kaingWeight) product.value.kaingWeight = 12;
            break;
          case 'perBundle':
            if (!product.value.bundleWeight) product.value.bundleWeight = 12;
            break;
          case 'perTray':
            if (!product.value.itemsPerTray) product.value.itemsPerTray = 30;
            break;
        }
      }
      calculateProfit();
    };

    const getUnitLabel = (unit) => {
      const unitObj = availableUnits.value.find(u => u.value === unit);
      return unitObj ? unitObj.label : '';
    };

    const showNotification = (message, type = 'success') => {
      notifProduct.value?.showNotification(message, type);
    };

    const uploadImage = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        product.value.image = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const removeImage = () => {
      product.value.image = '';
    };

    const validateForm = () => {
      if (!product.value.productName || product.value.productName.trim() === '') {
        showNotification('Product name is required', 'warning');
        return false;
      }
      if (!product.value.category || product.value.category.trim() === '') {
        showNotification('Category is required', 'warning');
        return false;
      }
      if (!selectedUnits.value || selectedUnits.value.length === 0) {
        showNotification('At least one selling unit is required', 'warning');
        return false;
      }
      if (!product.value.status || product.value.status.trim() === '') {
        showNotification('Status is required', 'warning');
        return false;
      }
      
      // Validate that at least one unit has pricing and stock
      let hasValidPricing = false;
      
      for (const unit of selectedUnits.value) {
        switch (unit) {
          case 'perKilo':
            if (product.value.pricePerKilo > 0 && product.value.stockPerKilo > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perSack':
            if (product.value.pricePerSack > 0 && product.value.stockPerSack > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perTali':
            if (product.value.pricePerTali > 0 && product.value.stockPerTali > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perKaing':
            if (product.value.pricePerKaing > 0 && product.value.stockPerKaing > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perBundle':
            if (product.value.pricePerBundle > 0 && product.value.stockPerBundle > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perTray':
            if (product.value.pricePerTray > 0 && product.value.stockPerTray > 0) {
              hasValidPricing = true;
            }
            break;
          case 'perPiece':
            if (product.value.pricePerPiece > 0 && product.value.stockPerPiece > 0) {
              hasValidPricing = true;
            }
            break;
        }
      }
      
      if (!hasValidPricing) {
        showNotification('At least one unit must have both price and stock greater than 0', 'warning');
        return false;
      }
      
      return true;
    };   
    const fetchProduct = async (productId) => {
  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const data = productSnap.data();
      
      // Load all product data
      product.value = {
        ...data,
        variety: data.variety || 'Normal',
        id: productSnap.id,
        productId: productSnap.id
      };
      
      selectedUnits.value = data.availableUnits || [];

      // Restore selected reference units if available
      if (data.selectedReferenceUnits && data.selectedReferenceUnits.length > 0) {
        selectedReferenceUnits.value = data.selectedReferenceUnits;
        updateAvailableSellingUnits();
      }

      // Set search text for existing product
      categorySearchText.value = data.category || '';
      productSearchText.value = data.productName || '';

      // Restore D.A. product reference if available (new simplified structure)
      if (data.daProductReference && !data.isCustomProduct) {
        // Try to find the matching product in the current product table
        await fetchProductTable(); // Ensure product table is loaded
        
        const matchingProduct = productTable.value.find(p => 
          p.id === data.daProductReference.id &&
          p.productName === data.daProductReference.productName &&
          p.category === data.daProductReference.category
        );
        
        if (matchingProduct) {
          selectedProductFromTable.value = {
            ...matchingProduct,
            unit: data.daProductReference.primaryUnit,
            priceRange: data.daProductReference.primaryPriceRange,
            originalProduct: matchingProduct
          };
        } else {
          // Fallback: create a basic reference from saved data
          selectedProductFromTable.value = {
            id: data.daProductReference.id,
            productName: data.daProductReference.productName,
            category: data.daProductReference.category,
            variety: data.daProductReference.variety || 'Normal',
            unit: data.daProductReference.primaryUnit,
            priceRange: data.daProductReference.primaryPriceRange
          };
        }
        
        useCustomProductName.value = false;
      } else if (data.isCustomProduct) {
        // This is a custom product
        useCustomProductName.value = true;
        selectedProductFromTable.value = null;
        selectedReferenceUnits.value = [];
        availableSellingUnits.value = [];
      } else {
        // Try to match with current product table data
        await fetchProductTable(); // Ensure product table is loaded
        
        const matchingProducts = productTable.value.filter(p => {
          const displayName = getDisplayProductName(p);
          return displayName === data.productName && p.category === data.category;
        });
        
        if (matchingProducts.length > 0) {
          selectedProductFromTable.value = matchingProducts[0];
          useCustomProductName.value = false;
        } else {
          useCustomProductName.value = true;
          selectedProductFromTable.value = null;
        }
      }
    } else {
      showNotification('Product not found', 'error');
      router.push('/products');
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    showNotification('Failed to load product details', 'error');
    router.push('/products');
  }
};

    const saveProduct = async () => {
      if (!validateForm()) return;

      const user = auth.currentUser;
      if (!user) {
        showNotification('You must be logged in to save a product.', 'error');
        return;
      }

      isSaving.value = true;

      try {
        // Create a clean product data object
        const productData = {
          // Basic product information
          productName: product.value.productName,
          description: product.value.description || '',
          category: product.value.category,
          code: product.value.code,
          variety: product.value.variety || 'Normal',
          
          // Pricing data
          costPerKilo: product.value.costPerKilo || 0,
          costPerSack: product.value.costPerSack || 0,
          costPerTali: product.value.costPerTali || 0,
          costPerKaing: product.value.costPerKaing || 0,
          costPerBundle: product.value.costPerBundle || 0,
          costPerTray: product.value.costPerTray || 0,
          costPerPiece: product.value.costPerPiece || 0,
          
          pricePerKilo: product.value.pricePerKilo || 0,
          stockPerKilo: product.value.stockPerKilo || 0,
          pricePerSack: product.value.pricePerSack || 0,
          sackWeight: product.value.sackWeight || 50,
          stockPerSack: product.value.stockPerSack || 0,
          pricePerTali: product.value.pricePerTali || 0,
          itemsPerTali: product.value.itemsPerTali || 10,
          stockPerTali: product.value.stockPerTali || 0,
          pricePerKaing: product.value.pricePerKaing || 0,
          kaingWeight: product.value.kaingWeight || 12,
          stockPerKaing: product.value.stockPerKaing || 0,
          pricePerBundle: product.value.pricePerBundle || 0,
          bundleWeight: product.value.bundleWeight || 12,
          stockPerBundle: product.value.stockPerBundle || 0,
          pricePerTray: product.value.pricePerTray || 0,
          itemsPerTray: product.value.itemsPerTray || 30,
          stockPerTray: product.value.stockPerTray || 0,
          pricePerPiece: product.value.pricePerPiece || 0,
          stockPerPiece: product.value.stockPerPiece || 0,
          
          profit: product.value.profit || 0,
          
          // Product details
          packagingType: product.value.packagingType || 'none',
          image: product.value.image || '',
          status: product.value.status || 'available',
          
          // Business features
          wholesaleAvailable: product.value.wholesaleAvailable || false,
          minWholesaleQty: product.value.minWholesaleQty || 1,
          wholesalePrice: product.value.wholesalePrice || 0,
          preorderDays: product.value.preorderDays || 7,
          isOnSale: product.value.isOnSale || false,
          discountPercentage: product.value.discountPercentage || 0,
          isPreOrder: product.value.isPreOrder || false,
          preOrderMessage: product.value.preOrderMessage || '',
          preOrderLimit: product.value.preOrderLimit || 0,
          
          // System data
          sellerId: user.uid,
          updatedAt: serverTimestamp(),
          availableUnits: selectedUnits.value || [],
          isCustomProduct: useCustomProductName.value
        };

        // Add D.A. reference data if available (simplified structure)
        if (selectedProductFromTable.value && !useCustomProductName.value) {
          productData.daProductReference = {
            id: selectedProductFromTable.value.id,
            productName: selectedProductFromTable.value.productName,
            category: selectedProductFromTable.value.category,
            variety: selectedProductFromTable.value.variety || 'Normal',
            primaryUnit: selectedProductFromTable.value.unit,
            primaryPriceRange: selectedProductFromTable.value.priceRange
          };
        }

        // Add selected reference units if available
        if (selectedReferenceUnits.value && selectedReferenceUnits.value.length > 0) {
          productData.selectedReferenceUnits = selectedReferenceUnits.value.map(unit => ({
            unit: unit.unit,
            minPrice: unit.minPrice || 0,
            maxPrice: unit.maxPrice || 0,
            priceRange: unit.priceRange || `₱${unit.minPrice || 0} - ₱${unit.maxPrice || 0}`
          }));
        }

        // Remove undefined values to prevent Firebase errors
        const cleanData = Object.fromEntries(
          Object.entries(productData).filter(([_, value]) => value !== undefined)
        );

        const { id, productId, ...dataToSave } = cleanData;

        if (isEditing.value) {
          const productRef = doc(db, 'products', product.value.id || product.value.productId);
          await updateDoc(productRef, dataToSave);
          showNotification('Product updated successfully!', 'success');
        } else {
          dataToSave.createdAt = serverTimestamp();
          const docRef = await addDoc(collection(db, 'products'), dataToSave);

          // Increment product count in category
          try {
            const categorySnapshot = await getDocs(collection(db, 'categories'));
            const matchedCategory = categorySnapshot.docs.find(doc => 
              doc.data().category === product.value.category
            );
            if (matchedCategory) {
              await updateDoc(matchedCategory.ref, { productCount: increment(1) });
            }
          } catch (categoryError) {
            console.warn('Failed to update category count:', categoryError);
            // Don't fail the entire save operation for this
          }

          // Update the document with its own ID
          await updateDoc(docRef, { productId: docRef.id });
          product.value.productId = docRef.id;
          showNotification('Product saved successfully!', 'success');
        }

        setTimeout(() => router.push('/products'), 1500);
      } catch (error) {
        console.error('Error saving product:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to save product. Please try again.';
        if (error.code === 'permission-denied') {
          errorMessage = 'Permission denied. Please check your authentication.';
        } else if (error.code === 'invalid-argument') {
          errorMessage = 'Invalid data provided. Please check your inputs.';
        } else if (error.message) {
          errorMessage = `Save failed: ${error.message}`;
        }
        
        showNotification(errorMessage, 'error');
      } finally {
        isSaving.value = false;
      }
    };

    const cancelEdit = () => {
      showNotification('Cancelled editing. Changes were not saved.', 'warning');
      setTimeout(() => router.push('/products'), 1500);
    };

    // Watch for changes to generate product code
    watch([() => product.value.category, () => product.value.productName], () => {
      if (product.value.category && product.value.productName) {
        generateProductCode();
      }
    }, { immediate: false });

    // Watch to sync category search text with selected category
    watch(() => product.value.category, (newCategory) => {
      if (newCategory && categorySearchText.value !== newCategory) {
        categorySearchText.value = newCategory;
      }
    });

    // Watch to sync product search text with selected product name
    watch(() => product.value.productName, (newProductName) => {
      if (newProductName && productSearchText.value !== newProductName) {
        productSearchText.value = newProductName;
      }
    });

    // Watch for update price modal opening
    watch(showUpdatePriceModal, (isOpen) => {
      if (isOpen) {
        initializePriceUpdateModal();
      }
    });

    // Watch for edit reference units modal opening
    watch(showEditReferenceUnitsModal, (isOpen) => {
      if (isOpen) {
        // Initialize temp selection with current selection
        tempSelectedReferenceUnits.value = [...selectedReferenceUnits.value];
      }
    });

    // Initialize
    onMounted(async () => {
      const user = auth.currentUser;
      if (user) product.value.sellerId = user.uid;

      // Fetch categories and product table data
      const [categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        fetchProductTable()
      ]);

      categories.value = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        category: doc.data().category
      }));

      if (isEditing.value && route.params.id) {
        fetchProduct(route.params.id);
      } else {
        generateProductCode();
      }
    });    // Add these numeric validation methods
    const onlyNumbers = (event) => {
      const char = String.fromCharCode(event.which);
      const currentValue = event.target.value;
      
      // Allow only numbers, one decimal point, and control keys
      if (!/[0-9.]/.test(char)) {
        event.preventDefault();
        return;
      }
      
      // Prevent multiple decimal points
      if (char === '.' && currentValue.includes('.')) {
        event.preventDefault();
        return;
      }
      
      // Prevent decimal point at the beginning
      if (char === '.' && currentValue.length === 0) {
        event.preventDefault();
        return;
      }
    };

    const validateNumericInput = (event, fieldName) => {
      let inputValue = event.target.value;
      
      // Remove any non-numeric characters except decimal point
      inputValue = inputValue.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = inputValue.split('.');
      if (parts.length > 2) {
        inputValue = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Update the input field value
      event.target.value = inputValue;
      
      // Convert to number
      let value = parseFloat(inputValue) || 0;
      
      // Ensure value is not negative
      if (value < 0) {
        value = 0;
        event.target.value = value;
      }
      
      // Update the product field
      product.value[fieldName] = value;
    };

    // Add a method to handle paste events
    const handlePaste = (event, fieldName) => {
      event.preventDefault();
      
      // Get pasted data
      const paste = (event.clipboardData || window.clipboardData).getData('text');
      
      // Remove any non-numeric characters except decimal point
      const numericValue = paste.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      let cleanValue = parts[0];
      if (parts.length > 1) {
        cleanValue += '.' + parts[1];
      }
      
      // Update the input field
      event.target.value = cleanValue;
      
      // Update the product field
      const value = parseFloat(cleanValue) || 0;
      product.value[fieldName] = value;
      
      // Recalculate profit
      calculateProfit();
    };

    return {
      getDisplayProductName,
      isEditing,
      isSaving,
      product,
      categories,
      availableUnits,
      selectedUnits,
      productTable,
      filteredProductTable,
      filteredProductsBySearch,
      selectedProductFromTable,
      useCustomProductName,
      categorySearchText,
      productSearchText,
      showCategoryDropdown,
      showProductDropdown,
      showUnitSelectionModal,
      selectedProductForUnitSelection,
      selectedReferenceUnits,
      availableSellingUnits,
      showUpdatePriceModal,
      updatePriceUnits,
      newUnitData,
      isUpdatingPrices,
      availableNewUnits,
      hasValidPriceUpdates,
      showEditReferenceUnitsModal,
      tempSelectedReferenceUnits,
      filteredCategories,
      notifProduct,
      generateProductCode,
      onCategoryChange,
      onCategorySearch,
      selectCategory,
      hideCategoryDropdown,
      onProductSearch,
      selectProduct,
      selectProductUnit,
      hideProductDropdown,
      onProductSelect,
      onCustomNameToggle,
      toggleReferenceUnit,
      isReferenceUnitSelected,
      removeReferenceUnit,
      confirmReferenceUnits,
      updateAvailableSellingUnits,
      toggleTempReferenceUnit,
      isTempReferenceUnitSelected,
      removeTempReferenceUnit,
      confirmEditReferenceUnits,
      cancelEditReferenceUnits,
      initializePriceUpdateModal,
      validatePriceInput,
      submitPriceUpdates,
      formatUpdateTime,
      calculateSalePrice,
      calculateProfit,
      handleUnitSelection,
      getUnitLabel,
      uploadImage,
      removeImage,
      saveProduct,
      cancelEdit,
      showNotification,
      onlyNumbers,
      validateNumericInput,
      handlePaste
    };
  }
};
</script>

<style scoped>
/* Dashboard Layout */
.dashboard-container {
  display: flex;
  min-height: 100vh;
  background-color: #f9fafb;
}

.main-content {
  flex: 1;
  padding: 20px;
  margin-left: 230px;
  transition: margin-left 0.3s ease;
  overflow-y: auto;
}

.sidebar.collapsed ~ .main-content {
  margin-left: 70px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 15px;
  }
  
  .main-content.expanded {
    margin-left: 0;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .form-section {
    padding: 15px;
  }
  
  .page-title h1 {
    font-size: 1.5rem;
  }
  
  .product-form {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 10px;
  }
  
  .form-section {
    padding: 12px;
  }
  
  .product-form {
    padding: 12px;
  }
  
  .page-title h1 {
    font-size: 1.25rem;
  }
  
  .status-ribbons {
    flex-direction: column;
  }
}

/* Header */
.header {
  margin-bottom: 20px;
}

.page-title h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
}

.page-title p {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* Status Ribbons */
.status-ribbons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.limited {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-badge.sale {
  background-color: #ef4444;
  color: white;
}

.status-badge.pre-order {
  background-color: #ffedd5;
  color: #9a3412;
  border: 1px solid #f97316;
}

.badge-icon {
  width: 0.75rem;
  height: 0.75rem;
  margin-right: 0.25rem;
}

/* Price Range Info */
.price-range-info {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #0284c7;
}

.text-muted {
  color: #6b7280;
  font-size: 0.875rem;
}

.price-range {
  color: #059669;
  font-weight: 500;
}

/* Form Layout */
.product-form {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.form-section {
  background-color: #f9fafb;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.form-section.wide {
  grid-column: span 1;
}

@media (min-width: 768px) {
  .form-section.wide {
    grid-column: span 2;
  }
}

.form-section h2 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}

.form-section h3 {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 1rem 0;
}

/* Form Fields */
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s;
}

/* Mobile friendly form inputs */
@media (max-width: 768px) {
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 12px;
    font-size: 16px; /* Prevents zoom on iOS */
    border-radius: 6px;
  }
  
  .form-group label {
    font-size: 0.9rem;
    margin-bottom: 6px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
}

@media (max-width: 480px) {
  .form-group input,
  .form-group select,
  .form-group textarea {
    padding: 14px;
    font-size: 16px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.readonly-input {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.sale-price {
  font-size: 0.875rem;
  color: #16a34a;
  margin-top: 0.25rem;
  margin-bottom: 0;
}

/* Checkbox Styles */
.checkbox-group {
  flex-direction: row;
  align-items: center;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.unit-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.unit-checkboxes label {
  display: flex;
  align-items: center;
  gap: 5px;
  background: #f3f4f6;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

/* Unit Details */
.unit-selection {
  margin-bottom: 1.5rem;
}

.unit-details {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
}

.cost-profit-section {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 768px) {
  .cost-profit-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Info Tooltip */
.with-tooltip {
  display: flex;
  align-items: center;
}

.info-tooltip {
  position: relative;
  margin-left: 0.5rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  background-color: white;
  border: 2px solid #2e5c31;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  color: #2e5c31;
  cursor: help;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  background-color: #1f2937;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.375rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 10;
  width: max-content;
  max-width: 200px;
}

.info-tooltip:hover .tooltip-content {
  opacity: 1;
  visibility: visible;
}

/* Image Upload */
.image-upload-input {
  width: 100%;
  padding: 8px;
  border: 1px dashed #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-upload-input:hover {
  border-color: #2e5c31;
  background-color: #f0fdf4;
}

.image-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Mobile responsive image preview */
@media (max-width: 768px) {
  .image-preview {
    gap: 8px;
  }
  
  .image-item {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .image-preview {
    justify-content: center;
    gap: 6px;
  }
  
  .image-item {
    width: 80px;
    height: 80px;
  }
  
  .remove-image {
    width: 20px;
    height: 20px;
    font-size: 12px;
    top: 3px;
    right: 3px;
  }
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-image:hover {
  opacity: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  background-color: #f3f4f6;
  border: 1px dashed #d1d5db;
}

.empty-image {
  width: 50px;
  height: 50px;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 0.75rem;
  color: #6b7280;
  text-align: center;
  margin: 0;
}

/* Info Panel */
.info-panel {
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1.5rem;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: #1e40af;
}

.info-value {
  color: #1e40af;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

/* Mobile responsive buttons */
@media (max-width: 480px) {
  .form-actions {
    flex-direction: column-reverse;
    gap: 12px;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
    padding: 12px 20px;
    font-size: 1rem;
    justify-content: center;
  }
}

.cancel-btn {
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.save-btn {
  background-color: #2e5c31;
  color: #fff;
  border: none;
}

.save-btn:hover:not(:disabled) {
  background-color: #26492a;
}

.save-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Searchable Dropdown Styles */
.searchable-dropdown {
  position: relative;
  width: 100%;
}

.searchable-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  color: #111827;
  transition: border-color 0.2s;
  background-color: #fff;
}

.searchable-input:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.searchable-input:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: #fff;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 4px 4px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 100%;
}

/* Mobile responsive dropdowns */
@media (max-width: 768px) {
  .dropdown-list {
    max-height: 200px;
    font-size: 0.9rem;
  }
  
  .dropdown-item {
    padding: 12px;
    font-size: 0.9rem;
  }
  
  .searchable-input {
    font-size: 16px; /* Prevents zoom on iOS */
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .dropdown-list {
    max-height: 150px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .dropdown-item {
    padding: 10px;
  }
  
  .product-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.dropdown-item {
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.product-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.product-name {
  font-weight: 500;
  color: #111827;
  flex: 1;
  margin-right: 8px;
}

.unit-badge {
  background-color: #e5e7eb;
  color: #374151;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.price-range {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 500;
  align-self: flex-end;
  width: 100%;
  text-align: right;
}

/* D.A. Reference Styles */
.da-price-reference {
  margin-bottom: 1.5rem;
}

.reference-card {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
  padding: 1rem;
}

.reference-card h4 {
  margin: 0 0 0.75rem 0;
  color: #0369a1;
  font-size: 1rem;
  font-weight: 600;
}

.reference-card h5 {
  margin: 0.75rem 0 0.5rem 0;
  color: #0369a1;
  font-size: 0.875rem;
  font-weight: 500;
}

.selected-reference {
  margin-bottom: 0.75rem;
}

.selected-reference strong {
  color: #1e40af;
  margin-right: 0.5rem;
}

.reference-range {
  color: #059669;
  font-weight: 600;
  margin: 0 0.5rem;
}

.reference-variety {
  color: #7c2d12;
  font-style: italic;
  font-size: 0.875rem;
}

.all-units-reference {
  border-top: 1px solid #bae6fd;
  padding-top: 0.75rem;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.5rem;
}

.unit-ref-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background-color: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  text-align: center;
  transition: all 0.2s;
}

.unit-ref-item.selected {
  border-color: #2563eb;
  background-color: #dbeafe;
}

.unit-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 0.25rem;
}

.unit-price {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
}

.reference-note {
  color: #64748b;
  font-style: italic;
  margin-top: 0.75rem;
  display: block;
}

/* Price Range Display */
.price-range-display {
  font-size: 0.875rem;
  color: #059669;
  font-weight: 500;
  margin-top: 0.25rem;
  display: block;
}

.selected-product-info {
  margin-top: 0.5rem;
}

.variety-badge {
  background-color: #fef3c7;
  color: #92400e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-left: 0.5rem;
}

/* Product Group Dropdown Styles */
.product-group-item {
  padding: 12px;
}

.units-count {
  background-color: #f3f4f6;
  color: #374151;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.units-preview {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.unit-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 0.8rem;
}

.unit-preview-item .unit-name {
  color: #6b7280;
  font-weight: 500;
}

.unit-preview-item .unit-price {
  color: #059669;
  font-weight: 500;
}

.more-units {
  font-size: 0.75rem;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  margin-top: 4px;
}

/* Unit Selection Modal */
.unit-selection-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

/* Mobile responsive modals */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
    margin: 20px;
  }
  
  .modal-header {
    padding: 15px;
  }
  
  .modal-header h3 {
    font-size: 1rem;
  }
  
  .modal-body {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .modal-content {
    width: 98%;
    max-height: 95vh;
    margin: 10px;
    border-radius: 4px;
  }
  
  .modal-header {
    padding: 12px;
  }
  
  .modal-body {
    padding: 12px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #111827;
  font-size: 1.125rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.modal-description {
  color: #6b7280;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

.units-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.unit-selection-card {
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.unit-selection-card:hover {
  border-color: #2e5c31;
  background-color: #f0fdf4;
}

.unit-selection-card .unit-name {
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
  font-size: 1rem;
}

.unit-selection-card .unit-price {
  color: #059669;
  font-weight: 500;
  font-size: 0.875rem;
}

.unit-info {
  color: #059669;
  font-weight: 500;
}

/* Multi-select Reference Units Styles */
.selected-units-summary {
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.selected-units-summary h4 {
  margin: 0 0 8px 0;
  color: #0369a1;
  font-size: 0.875rem;
  font-weight: 600;
}

.selected-units-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-unit-tag {
  background-color: #2e5c31;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.remove-unit-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0 2px;
  border-radius: 2px;
}

.remove-unit-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.unit-selection-card.selected {
  border-color: #2e5c31;
  background-color: #f0fdf4;
}

.unit-checkbox {
  position: absolute;
  top: 8px;
  right: 8px;
}

.unit-selection-card {
  position: relative;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary, .btn-primary {
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-secondary {
  background-color: white;
  border-color: #d1d5db;
  color: #374151;
}

.btn-secondary:hover {
  background-color: #f9fafb;
}

.btn-primary {
  background-color: #2e5c31;
  border-color: #2e5c31;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1f4e23;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Disabled selling units styles */
.unit-checkbox-wrapper.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.unit-checkbox-wrapper.disabled .unit-label {
  color: #9ca3af;
}

.disabled-reason {
  font-size: 0.75rem;
  color: #ef4444;
  font-style: italic;
}

.reference-units-info {
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bae6fd;
}

.reference-info-text {
  color: #0369a1;
  font-size: 0.875rem;
}

.reference-units-list {
  font-weight: 600;
  margin-left: 4px;
}

.no-reference-message {
  margin-top: 12px;
  padding: 12px;
  background-color: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
}

.info-message {
  margin: 0;
  color: #92400e;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Updated D.A. Reference styles */
.selected-references {
  margin-bottom: 12px;
}

.reference-units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.reference-unit-card {
  background-color: white;
  border: 2px solid #2e5c31;
  border-radius: 6px;
  padding: 8px 12px;
  position: relative;
  text-align: center;
}

.reference-unit-card.primary {
  border-color: #059669;
  background-color: #ecfdf5;
}

.ref-unit-name {
  font-weight: 600;
  color: #111827;
  font-size: 0.875rem;
}

.ref-unit-price {
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
}

.primary-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #059669;
  color: white;
  font-size: 0.625rem;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.units-accordion summary {
  cursor: pointer;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.units-accordion summary:hover {
  color: #0369a1;
}

.units-accordion[open] summary {
  margin-bottom: 8px;
}

.unit-ref-item.selected {
  background-color: #ecfdf5;
  border-color: #059669;
}

.unit-ref-item.not-selected {
  opacity: 0.6;
}

.selected-indicator {
  color: #059669;
  font-weight: bold;
  font-size: 0.875rem;
}

/* Update Price Modal Styles */
.reference-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.reference-header h4 {
  margin: 0;
}

.update-price-btn,
.edit-reference-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.update-price-btn:hover,
.edit-reference-btn:hover {
  background-color: #1f4e23;
}

.edit-reference-btn {
  background-color: #0284c7;
}

.edit-reference-btn:hover {
  background-color: #0369a1;
}

.update-price-modal {
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.existing-units-section,
.add-new-unit-section {
  margin-bottom: 24px;
}

.existing-units-section h4,
.add-new-unit-section h4 {
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}

.price-update-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.price-update-card {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.unit-header {
  margin-bottom: 12px;
}

.unit-header h5 {
  margin: 0 0 4px 0;
  color: #111827;
  font-size: 0.875rem;
  font-weight: 600;
}

.current-range {
  color: #6b7280;
  font-size: 0.75rem;
}

.price-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 8px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.input-group input {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.input-group input:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.new-range-preview {
  color: #059669;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 4px 8px;
  background-color: #ecfdf5;
  border-radius: 4px;
  border: 1px solid #a7f3d0;
}

.new-unit-form {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.unit-selector {
  margin-bottom: 16px;
}

.unit-selector label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
}

.unit-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: white;
}

.unit-selector select:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.contribution-note,
.info-note {
  display: flex;
  gap: 12px;
  padding: 12px;
  background-color: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  margin-top: 20px;
}

.info-note {
  margin-bottom: 20px;
  margin-top: 16px;
}

.note-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.note-text {
  color: #1e40af;
  font-size: 0.875rem;
  line-height: 1.4;
}

.last-updated {
  display: block;
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 4px;
  font-style: italic;
}

.units-selection-section {
  margin-bottom: 20px;
}

.units-selection-section h4 {
  color: #111827;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
}
</style>
