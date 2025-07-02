<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">Feedbacks</h1>
        <p class="page-subtitle">Manage farmer and customer feedback on agricultural products and services</p>
      </div>
      
      <div class="feedback-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <MessageCircle size="24" />
          </div>
          <div class="stat-content">
            <h3>Total Feedbacks</h3>
            <p class="stat-number">1,847</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <Star size="24" />
          </div>
          <div class="stat-content">
            <h3>Average Rating</h3>
            <p class="stat-number">4.3</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <Clock size="24" />
          </div>
          <div class="stat-content">
            <h3>Pending Reviews</h3>
            <p class="stat-number">34</p>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">
            <TrendingUp size="24" />
          </div>
          <div class="stat-content">
            <h3>This Month</h3>
            <p class="stat-number">287</p>
          </div>
        </div>
      </div>
      
      <div class="feedback-filters">
        <div class="filter-group">
          <select class="filter-select">
            <option value="all">All Feedbacks</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="flagged">Flagged</option>
          </select>
          
          <select class="filter-select">
            <option value="all">All User Types</option>
            <option value="farmer">Farmers</option>
            <option value="customer">Customers</option>
          </select>
          
          <select class="filter-select">
            <option value="all">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
            <option value="grains">Grains & Cereals</option>
            <option value="herbs">Herbs & Spices</option>
            <option value="platform">Platform Experience</option>
          </select>
        </div>
        
        <div class="search-box">
          <Search size="18" />
          <input type="text" placeholder="Search feedbacks..." class="search-input">
        </div>
      </div>
      
      <div class="feedback-list">
        <div class="feedback-item">
          <div class="feedback-header">
            <div class="user-info">
              <div class="user-avatar farmer">
                <Sprout size="20" />
              </div>
              <div class="user-details">
                <h4>Mang Ricardo Villanueva</h4>
                <p>Farmer • Tomato Supplier • Dec 25, 2024</p>
              </div>
            </div>
            <div class="feedback-rating">
              <div class="stars">
                <Star v-for="i in 5" :key="i" :class="{ filled: i <= 5 }" size="16" />
              </div>
              <span class="status-badge pending">Pending</span>
            </div>
          </div>
          
          <div class="feedback-content">
            <h5>Excellent platform for connecting with customers!</h5>
            <p>Napakaganda ng FarmXpress! Nakatulong talaga sa akin na mabenta ang mga kamatis ko nang direkta sa mga customer. Walang middleman, mas malaki ang kita ko. Ang mga customer din ay satisfied sa freshness ng mga produkto ko. Sana mas marami pang features para sa mga farmer tulad ko.</p>
            <div class="feedback-meta">
              <div class="feedback-category">
                <Tag size="14" />
                <span>Platform Experience</span>
              </div>
              <div class="product-mentioned">
                <Package size="14" />
                <span>Fresh Tomatoes - ₱45/kg</span>
              </div>
            </div>
          </div>
          
          <div class="feedback-actions">
            <button class="btn-approve">
              <Check size="16" />
              Approve
            </button>
            <button class="btn-flag">
              <Flag size="16" />
              Flag
            </button>
            <button class="btn-reply">
              <MessageSquare size="16" />
              Reply
            </button>
          </div>
        </div>
        
        <div class="feedback-item">
          <div class="feedback-header">
            <div class="user-info">
              <div class="user-avatar customer">
                <ShoppingCart size="20" />
              </div>
              <div class="user-details">
                <h4>Maria Clara Santos</h4>
                <p>Customer • Quezon City • Dec 24, 2024</p>
              </div>
            </div>
            <div class="feedback-rating">
              <div class="stars">
                <Star v-for="i in 5" :key="i" :class="{ filled: i <= 4 }" size="16" />
              </div>
              <span class="status-badge approved">Approved</span>
            </div>
          </div>
          
          <div class="feedback-content">
            <h5>Fresh vegetables delivered to my doorstep!</h5>
            <p>Sobrang satisfied ako sa quality ng mga gulay na nabili ko from Ate Rosa's farm. Ang sariwa at organic talaga! Yung kangkong at pechay na binili ko kahapon, fresh pa rin hanggang ngayon. Reasonable din ang price compared sa palengke. Highly recommended ang FarmXpress!</p>
            <div class="feedback-meta">
              <div class="feedback-category">
                <Tag size="14" />
                <span>Vegetables</span>
              </div>
              <div class="product-mentioned">
                <Package size="14" />
                <span>Organic Kangkong Bundle - ₱25</span>
              </div>
            </div>
          </div>
          
          <div class="feedback-actions">
            <button class="btn-reply">
              <MessageSquare size="16" />
              Reply
            </button>
            <button class="btn-secondary">
              <Eye size="16" />
              View Order
            </button>
          </div>
        </div>
        
        <div class="feedback-item">
          <div class="feedback-header">
            <div class="user-info">
              <div class="user-avatar farmer">
                <Sprout size="20" />
              </div>
              <div class="user-details">
                <h4>Kuya Ben Magpantay</h4>
                <p>Farmer • Rice Producer • Dec 23, 2024</p>
              </div>
            </div>
            <div class="feedback-rating">
              <div class="stars">
                <Star v-for="i in 5" :key="i" :class="{ filled: i <= 3 }" size="16" />
              </div>
              <span class="status-badge approved">Approved</span>
            </div>
          </div>
          
          <div class="feedback-content">
            <h5>Good platform but needs improvement on payment system</h5>
            <p>Maganda naman ang FarmXpress para sa pagbebenta ng bigas ko. Maraming customer na nakakabili. Pero sana mas mabilis ang payment processing. Minsan 3-5 days pa bago makuha ang bayad. Sana may instant payment option para sa mga farmer na kailangan agad ng pera.</p>
            <div class="feedback-meta">
              <div class="feedback-category">
                <Tag size="14" />
                <span>Platform Experience</span>
              </div>
              <div class="product-mentioned">
                <Package size="14" />
                <span>Premium Rice - ₱52/kg</span>
              </div>
            </div>
          </div>
          
          <div class="feedback-actions">
            <button class="btn-reply">
              <MessageSquare size="16" />
              Reply
            </button>
            <button class="btn-secondary">
              <Eye size="16" />
              View Details
            </button>
          </div>
        </div>
        
        <div class="feedback-item">
          <div class="feedback-header">
            <div class="user-info">
              <div class="user-avatar customer">
                <ShoppingCart size="20" />
              </div>
              <div class="user-details">
                <h4>Jennifer Reyes</h4>
                <p>Customer • Makati City • Dec 22, 2024</p>
              </div>
            </div>
            <div class="feedback-rating">
              <div class="stars">
                <Star v-for="i in 5" :key="i" :class="{ filled: i <= 5 }" size="16" />
              </div>
              <span class="status-badge approved">Approved</span>
            </div>
          </div>
          
          <div class="feedback-content">
            <h5>Amazing variety of organic fruits!</h5>
            <p>I love how FarmXpress connects me directly with local farmers! Yung mga mangoes na binili ko from Tito Jun's farm sa Bataan, sobrang tamis at hinog na hinog. Mas mura pa compared sa supermarket. The app is user-friendly and delivery is reliable. Keep it up!</p>
            <div class="feedback-meta">
              <div class="feedback-category">
                <Tag size="14" />
                <span>Fruits</span>
              </div>
              <div class="product-mentioned">
                <Package size="14" />
                <span>Sweet Mangoes (1kg) - ₱120</span>
              </div>
            </div>
          </div>
          
          <div class="feedback-actions">
            <button class="btn-reply">
              <MessageSquare size="16" />
              Reply
            </button>
            <button class="btn-secondary">
              <Eye size="16" />
              View Order
            </button>
          </div>
        </div>
        
        <div class="feedback-item flagged">
          <div class="feedback-header">
            <div class="user-info">
              <div class="user-avatar customer">
                <ShoppingCart size="20" />
              </div>
              <div class="user-details">
                <h4>Anonymous User</h4>
                <p>Customer • Location Hidden • Dec 21, 2024</p>
              </div>
            </div>
            <div class="feedback-rating">
              <div class="stars">
                <Star v-for="i in 5" :key="i" :class="{ filled: i <= 1 }" size="16" />
              </div>
              <span class="status-badge flagged">Flagged</span>
            </div>
          </div>
          
          <div class="feedback-content">
            <h5>Poor quality vegetables received</h5>
            <p>Yung mga gulay na natanggap ko ay hindi fresh. May mga sira na at mukhang matagal nang nakatago. Hindi sulit ang bayad ko. Disappointed ako sa service.</p>
            <div class="feedback-meta">
              <div class="feedback-category">
                <Tag size="14" />
                <span>Vegetables</span>
              </div>
              <div class="flag-reason">
                <AlertTriangle size="14" />
                <span>Flagged: Potentially fake review</span>
              </div>
            </div>
          </div>
          
          <div class="feedback-actions">
            <button class="btn-investigate">
              <Search size="16" />
              Investigate
            </button>
            <button class="btn-remove">
              <Trash2 size="16" />
              Remove
            </button>
            <button class="btn-secondary">
              <Eye size="16" />
              View Details
            </button>
          </div>
        </div>
      </div>
      
      <div class="pagination">
        <button class="pagination-btn" disabled>
          <ChevronLeft size="16" />
          Previous
        </button>
        <div class="pagination-numbers">
          <button class="pagination-number active">1</button>
          <button class="pagination-number">2</button>
          <button class="pagination-number">3</button>
          <span>...</span>
          <button class="pagination-number">15</button>
        </div>
        <button class="pagination-btn">
          Next
          <ChevronRight size="16" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/AdminSidebar.vue';
import { 
  MessageCircle, 
  Star, 
  Clock, 
  TrendingUp, 
  Search, 
  Sprout,
  ShoppingCart,
  Tag, 
  Package,
  Check, 
  Flag,
  MessageSquare, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Trash2
} from 'lucide-vue-next';
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
  background-color: #f8f9fa;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: #6c757d;
  margin: 0;
}

.feedback-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: #e8f5e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2e5c31;
}

.stat-content h3 {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6c757d;
  margin: 0 0 0.25rem 0;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2e5c31;
  margin: 0;
}

.feedback-filters {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.filter-group {
  display: flex;
  gap: 1rem;
}

.filter-select {
  padding: 0.5rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box svg {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 0.9rem;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.feedback-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.feedback-item.flagged {
  border-left: 4px solid #dc3545;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.user-avatar.farmer {
  background: #28a745;
}

.user-avatar.customer {
  background: #007bff;
}

.user-details h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.25rem 0;
}

.user-details p {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.feedback-rating {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stars {
  display: flex;
  gap: 0.25rem;
}

.stars svg {
  color: #ddd;
}

.stars svg.filled {
  color: #ffc107;
  fill: #ffc107;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.flagged {
  background: #f8d7da;
  color: #721c24;
}

.feedback-content {
  padding: 1.5rem;
}

.feedback-content h5 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.75rem 0;
}

.feedback-content p {
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.feedback-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}

.feedback-category, .product-mentioned, .flag-reason {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6c757d;
  font-size: 0.85rem;
  padding: 0.25rem 0.75rem;
  background: #f8f9fa;
  border-radius: 15px;
}

.flag-reason {
  background: #f8d7da;
  color: #721c24;
}

.feedback-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  flex-wrap: wrap;
}

.btn-approve {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-approve:hover {
  background: #218838;
}

.btn-flag {
  background: #ffc107;
  color: #212529;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-flag:hover {
  background: #e0a800;
}

.btn-investigate {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-investigate:hover {
  background: #138496;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-remove:hover {
  background: #c82333;
}

.btn-reply {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-reply:hover {
  background: #1e3f21;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover {
  background: #5a6268;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.pagination-btn {
  background: #f8f9fa;
  border: 1px solid #ced4da;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background: #e9ecef;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-numbers {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pagination-number {
  background: none;
  border: none;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.pagination-number:hover {
  background: #e9ecef;
}

.pagination-number.active {
  background: #2e5c31;
  color: white;
}

@media (max-width: 768px) {
  .feedback-filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    flex-wrap: wrap;
  }
  
  .search-box {
    width: 100%;
  }
  
  .feedback-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .feedback-actions {
    flex-wrap: wrap;
  }
  
  .feedback-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>