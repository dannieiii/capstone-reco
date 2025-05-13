<template>
    <div class="dashboard-container">
      <Sidebar initialActiveItem="Help" />
      
      <div class="main-content">
        <header class="header">
          <div class="page-title">
            <h1>Help Center</h1>
            <p>Find answers, get support, and learn about FarmXpress</p>
          </div>
          
          <div class="search-container">
            <div class="search-box">
              <Search size="18" class="search-icon" />
              <input type="text" placeholder="Search for help..." v-model="searchQuery" />
            </div>
          </div>
        </header>
        
        <div class="content-section">
          <div class="quick-help">
            <h2>How can we help you today?</h2>
            <div class="help-cards">
              <div 
                v-for="card in helpCards" 
                :key="card.id" 
                class="help-card"
                @click="setActiveCategory(card.category)"
              >
                <div class="card-icon">
                  <component :is="card.icon" size="24" />
                </div>
                <div class="card-content">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.description }}</p>
                </div>
              </div>
            </div>
          </div>
             <div class="help-content">
            <div class="help-sidebar">
              <div class="categories-list">
                <button 
                  v-for="category in categories" 
                  :key="category.id"
                  :class="['category-btn', { active: activeCategory === category.id }]"
                  @click="setActiveCategory(category.id)"
                >
                  <component :is="category.icon" size="18" />
                  {{ category.name }}
                </button>
              </div>
              
              <div class="contact-support">
                <h3>Need more help?</h3>
                <button class="contact-btn">
                  <MessageSquare size="16" />
                  Contact Support
                </button>
              </div>
            </div>
            
            <div class="help-articles">
              <h2>{{ activeCategoryName }}</h2>
              
              <div class="articles-list" v-if="filteredArticles.length > 0">
                <div 
                  v-for="article in filteredArticles" 
                  :key="article.id"
                  class="article-item"
                  :class="{ active: activeArticle === article.id }"
                  @click="setActiveArticle(article.id)"
                >
                  <div class="article-header">
                    <h3>{{ article.title }}</h3>
                    <ChevronDown 
                      size="18" 
                      class="chevron-icon"
                      :class="{ rotated: activeArticle === article.id }"
                    />
                  </div>
                  <div v-if="activeArticle === article.id" class="article-content">
                    <p v-for="(paragraph, index) in article.content" :key="index">
                      {{ paragraph }}
                    </p>
                    <div v-if="article.steps" class="article-steps">
                      <div v-for="(step, index) in article.steps" :key="index" class="step">
                        <div class="step-number">{{ index + 1 }}</div>
                        <div class="step-content">{{ step }}</div>
                      </div>
                    </div>
                    <div class="article-footer">
                      <p>Was this article helpful?</p>
                      <div class="feedback-buttons">
                        <button class="feedback-btn yes">
                          <ThumbsUp size="14" />
                          Yes
                        </button>
                        <button class="feedback-btn no">
                          <ThumbsDown size="14" />
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-articles">
                <FileQuestion size="48" />
                <p>No articles found for "{{ searchQuery }}"</p>
                <button class="reset-search-btn" @click="searchQuery = ''">
                  Reset Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  import Sidebar from '@/components/Sidebar.vue';
  import { 
    Search, 
    MessageSquare, 
    ChevronDown, 
    ThumbsUp, 
    ThumbsDown,
    FileQuestion,
    ShoppingCart,
    TrendingUp,
    CreditCard,
    Truck,
    HelpCircle,
    Settings,
    Users,
    BarChart,
    FileText,
    Calendar
  } from 'lucide-vue-next';
  
  
  // State
  const searchQuery = ref('');
  const activeCategory = ref('getting_started');
  const activeArticle = ref(null);
  
  // Quick help cards
  const helpCards = [
    {
      id: 1,
      title: 'Getting Started',
      description: 'Learn the basics of FarmXpress',
      icon: HelpCircle,
      category: 'getting_started'
    },
    {
      id: 2,
      title: 'Managing Products',
      description: 'Add, edit and organize your farm products',
      icon: ShoppingCart,
      category: 'products'
    },
    {
      id: 3,
      title: 'Sales & Orders',
      description: 'Process orders and manage deliveries',
      icon: CreditCard,
      category: 'orders'
    },
    {
      id: 4,
      title: 'Reports & Analytics',
      description: 'Understand your farm business performance',
      icon: BarChart,
      category: 'analytics'
    }
  ];
  
  // Help categories
  const categories = [
    { id: 'getting_started', name: 'Getting Started', icon: HelpCircle },
    { id: 'products', name: 'Products', icon: ShoppingCart },
    { id: 'orders', name: 'Orders', icon: Truck },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'analytics', name: 'Analytics', icon: BarChart },
    { id: 'forecasting', name: 'Forecasting', icon: TrendingUp },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'account', name: 'Account Settings', icon: Settings }
  ];
  
  // Help articles
  const articles = [
    {
      id: 1,
      category: 'getting_started',
      title: 'How to set up your seller account',
      content: [
        'Setting up your seller account on FarmXpress is quick and easy. Follow these steps to get started selling your farm products online.',
        'Before you begin, make sure you have the following information ready: business details, tax information, bank account for payments, and photos of your farm and products.'
      ],
      steps: [
        'Create your account by clicking "Sign Up" on the FarmXpress homepage and selecting "Seller Account".',
        'Complete your profile with your farm name, location, and a brief description about your farm and growing practices.',
        'Verify your identity and business information.',
        'Set up your payment method to receive funds from sales.',
        'Add your first products by going to the "Farm Products" section and clicking "Add Product".',
        'Once approved, your products will be visible to customers in your area.'
      ]
    },
    {
      id: 2,
      category: 'getting_started',
      title: 'Understanding the seller dashboard',
      content: [
        'The seller dashboard is your command center for managing your farm business on FarmXpress. It provides at-a-glance information about your sales, inventory, and customer activity.',
        'Take some time to familiarize yourself with the different sections of the dashboard to make the most of your selling experience.'
      ],
      steps: [
        'The Overview section shows your key metrics such as total sales, average order value, and number of active customers.',
        'The Recent Orders section displays your latest incoming orders that need attention.',
        'The Inventory Alerts highlights products that are low in stock or out of stock.',
        'The Performance Graph shows your sales trends over time.',
        'The Quick Actions menu provides shortcuts to common tasks like adding products or generating reports.'
      ]
    },
    {
      id: 3,
      category: 'products',
      title: 'How to add a new farm product',
      content: [
        'Adding your farm products to FarmXpress is simple. Make sure to include detailed information and quality photos to attract more customers.'
      ],
      steps: [
        'Navigate to the "Farm Products" section from the main sidebar.',
        'Click the "Add Product" button in the top right corner.',
        'Fill in the basic information: product name, category, and description.',
        'Set your pricing information, including unit price and unit type (e.g., per pound, per bunch).',
        'Enter inventory information, including current stock and restock thresholds.',
        'Upload at least one high-quality photo of your product. Multiple photos are recommended.',
        'Add additional details like growing methods, harvest date, and nutritional information.',
        'Set availability dates if your product is seasonal.',
        'Preview your listing and click "Publish" when ready.'
      ]
    },
    {
      id: 4,
      category: 'products',
      title: 'Managing product inventory',
      content: [
        'Keeping your inventory accurate is crucial for a good customer experience. FarmXpress provides tools to help you track and update your product inventory efficiently.'
      ],
      steps: [
        'Inventory is automatically updated when orders are placed.',
        'You can manually update inventory by going to the product listing and clicking "Edit".',
        'Set inventory alerts by entering minimum threshold values for each product.',
        'You\'ll receive notifications when products reach their threshold levels.',
        'Use the bulk inventory update feature to quickly adjust multiple products at once.',
        'Mark products as "Out of Season" rather than deleting them when they\'re temporarily unavailable.'
      ]
    },
    {
      id: 5,
      category: 'orders',
      title: 'How to process and fulfill orders',
      content: [
        'When customers place orders for your products, you\'ll need to fulfill them quickly and efficiently. Follow these steps to ensure smooth order processing.'
      ],
      steps: [
        'You\'ll receive a notification when new orders come in.',
        'Go to the "Orders" section to view all pending orders.',
        'Click on an order to view its details, including products, quantities, and delivery preferences.',
        'Confirm the order by clicking "Accept Order" if you can fulfill it completely.',
        'If you need to make changes, use the "Propose Changes" option to suggest alternatives.',
        'Prepare the products for delivery or pickup according to the customer\'s preference.',
        'Mark the order as "Ready for Pickup" or "Shipped" as appropriate.',
        'Once the customer receives the order, it will be marked as "Completed".'
      ]
    },
    {
      id: 6,
      category: 'analytics',
      title: 'Understanding your sales analytics',
      content: [
        'FarmXpress provides detailed analytics to help you understand your business performance and make informed decisions.',
        'The Analytics dashboard gives you insights into sales trends, customer behavior, and product performance over time.'
      ],
      steps: [
        'Navigate to the "Analytics" section from the main sidebar.',
        'Use the date range selector to view data for specific time periods.',
        'The Overview panel shows key metrics like total revenue, order count, and average order value.',
        'The Sales Trends graph displays your sales patterns over time.',
        'The Product Performance section shows your best and worst-selling products.',
        'Customer Demographics provides insights about who is buying your products.',
        'Export reports in CSV or PDF format by clicking "Export Data".'
      ]
    }
  ];
  
  // Get active category name
  const activeCategoryName = computed(() => {
    const category = categories.find(c => c.id === activeCategory.value);
    return category ? category.name : '';
  });
  
  // Filter articles by category and search query
  const filteredArticles = computed(() => {
    return articles.filter(article => {
      const matchesCategory = article.category === activeCategory.value;
      const matchesSearch = searchQuery.value === '' || 
        article.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        article.content.some(para => para.toLowerCase().includes(searchQuery.value.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  });
  
  // Set active category
  const setActiveCategory = (categoryId) => {
    activeCategory.value = categoryId;
    activeArticle.value = null; // Reset active article when changing category
  };
  
  // Set active article
  const setActiveArticle = (articleId) => {
    activeArticle.value = activeArticle.value === articleId ? null : articleId;
  };
  
  const ll = ref(null);
  const receive = ref(null);
  const notifications = ref(null);
  const when = ref(null);
  const products = ref(null);
  </script>
  
  <style scoped>
  .dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #f9fafb;
  }
  
  .main-content {
    flex: 1;
    padding: 20px;
    margin-left: 230px;
    width: calc(100% - 230px);
    overflow-y: auto;
    transition: all 0.3s ease;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .page-title {
    flex: 1;
  }
  
  .page-title h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
    margin: 0 0 5px 0;
  }
  
  .page-title p {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0;
  }
  
  .search-container {
    width: 300px;
  }
  
  .search-box {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 20px;
    padding: 8px 16px;
    border: 1px solid #e5e7eb;
    width: 100%;
  }
  
  .search-icon {
    color: #9ca3af;
    margin-right: 8px;
  }
  
  .search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 0.9rem;
  }
  
  .content-section {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  
  .quick-help {
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .quick-help h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 20px 0;
  }
  
  .help-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 15px;
  }
  
  .help-card {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    background-color: #f9fafb;
    border-radius: 10px;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .help-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background-color: #2e5c31;
    color: white;
  }
  
  .card-content h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 5px 0;
  }
  
  .card-content p {
    font-size: 0.8rem;
    color: #6b7280;
    margin: 0;
  }
  
  .help-content {
    display: flex;
    gap: 20px;
  }
  
  .help-sidebar {
    width: 250px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .categories-list {
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .category-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 8px;
    background: none;
    border: none;
    text-align: left;
    font-size: 0.9rem;
    color: #6b7280;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .category-btn:hover {
    background-color: #f3f4f6;
  }
  
  .category-btn.active {
    background-color: #f3f4f6;
    color: #2e5c31;
    font-weight: 500;
  }
  
  .contact-support {
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .contact-support h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .contact-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px;
    background-color: #2e5c31;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .contact-btn:hover {
    background-color: #26492a;
  }
  
  .help-articles {
    flex: 1;
    background-color: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .help-articles h2 {
    font-size: 1.2rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 20px 0;
  }
  
  .articles-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .article-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .article-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .article-header:hover {
    background-color: #f9fafb;
  }
  
  .article-header h3 {
    font-size: 1rem;
    font-weight: 500;
    color: #111827;
    margin: 0;
  }
  
  .article-item.active .article-header {
    background-color: #f9fafb;
  }
  
  .chevron-icon {
    color: #6b7280;
    transition: transform 0.2s;
  }
  
  .chevron-icon.rotated {
    transform: rotate(180deg);
  }
  
  .article-content {
    padding: 0 15px 15px;
    border-top: 1px solid #e5e7eb;
  }
  
  .article-content p {
    font-size: 0.9rem;
    line-height: 1.6;
    color: #4b5563;
    margin: 15px 0;
  }
  
  .article-steps {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 20px 0;
  }
  
  .step {
    display: flex;
    gap: 15px;
  }
  
  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: #2e5c31;
    color: white;
    font-size: 0.8rem;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .step-content {
    font-size: 0.9rem;
    color: #4b5563;
    flex: 1;
  }
  
  .article-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #e5e7eb;
  }
  
  .article-footer p {
    font-size: 0.9rem;
    color: #6b7280;
    margin: 0;
  }
  
  .feedback-buttons {
    display: flex;
    gap: 10px;
  }
  
  .feedback-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    border: 1px solid #e5e7eb;
    cursor: pointer;
  }
  
  .feedback-btn.yes {
    background-color: #dcfce7;
    color: #2e5c31;
    border-color: #a7f3d0;
  }
  
  .feedback-btn.no {
    background-color: #fee2e2;
    color: #ef4444;
    border-color: #fecaca;
  }
  
  .no-articles {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;
    gap: 15px;
    color: #6b7280;
  }
  
  .reset-search-btn {
    padding: 8px 16px;
    background-color: #f3f4f6;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    color: #4b5563;
    cursor: pointer;
  }
  
  .reset-search-btn:hover {
    background-color: #e5e7eb;
  }
  
  @media (max-width: 992px) {
    .main-content {
      margin-left: 70px;
      width: calc(100% - 70px);
    }
    
    .help-content {
      flex-direction: column;
    }
    
    .help-sidebar {
      width: 100%;
    }
  }
  
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
      width: 100%;
      padding: 15px;
    }
    
    .header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .search-container {
      width: 100%;
    }
    
    .help-cards {
      grid-template-columns: 1fr;
    }
  }
  
  :global(.dark) .main-content {
    background-color: #111827;
  }
  
  :global(.dark) .page-title h1,
  :global(.dark) .quick-help h2,
  :global(.dark) .help-articles h2,
  :global(.dark) .card-content h3,
  :global(.dark) .contact-support h3,
  :global(.dark) .article-header h3 {
    color: #f9fafb;
  }
  
  :global(.dark) .page-title p,
  :global(.dark) .card-content p,
  :global(.dark) .article-footer p {
    color: #9ca3af;
  }
  
  :global(.dark) .search-box,
  :global(.dark) .quick-help,
  :global(.dark) .categories-list,
  :global(.dark) .contact-support,
  :global(.dark) .help-articles {
    background-color: #1f2937;
    border-color: #374151;
  }
  
  :global(.dark) .help-card,
  :global(.dark) .article-header:hover,
  :global(.dark) .article-item.active .article-header {
    background-color: #111827;
  }
  
  :global(.dark) .category-btn {
    color: #e5e7eb;
  }
  
  :global(.dark) .category-btn:hover,
  :global(.dark) .category-btn.active {
    background-color: #111827;
  }
  
  :global(.dark) .category-btn.active {
    color: #34d399;
  }
  
  :global(.dark) .article-item {
    border-color: #374151;
  }
  
  :global(.dark) .article-content {
    border-color: #374151;
  }
  
  :global(.dark) .article-content p,
  :global(.dark) .step-content {
    color: #d1d5db;
  }
  
  :global(.dark) .article-footer {
    border-color: #374151;
  }
  
  :global(.dark) .reset-search-btn {
    background-color: #374151;
    color: #e5e7eb;
  }
  
  :global(.dark) .reset-search-btn:hover {
    background-color: #4b5563;
  }
  </style>