<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">Help & Documentation</h1>
        <p class="page-subtitle">Find answers and learn how to use the system</p>
      </div>
      
      <div class="help-container">
        <div class="help-search">
          <div class="search-box">
            <Search size="20" />
            <input type="text" placeholder="Search for help topics..." class="search-input">
          </div>
        </div>
        
        <div class="help-content">
          <div class="help-categories">
            <div class="category-card">
              <div class="category-icon">
                <BookOpen size="24" />
              </div>
              <h3>Getting Started</h3>
              <p>Learn the basics of using FarmXpress admin panel</p>
              <ul>
                <li><a href="#">Dashboard Overview</a></li>
                <li><a href="#">User Management</a></li>
                <li><a href="#">Initial Setup</a></li>
                <li><a href="#">Navigation Guide</a></li>
              </ul>
            </div>
            
            <div class="category-card">
              <div class="category-icon">
                <Users size="24" />
              </div>
              <h3>User Management</h3>
              <p>Manage sellers, customers, and admin accounts</p>
              <ul>
                <li><a href="#">Adding New Users</a></li>
                <li><a href="#">User Permissions</a></li>
                <li><a href="#">Account Verification</a></li>
                <li><a href="#">User Activity Monitoring</a></li>
              </ul>
            </div>
            
            <div class="category-card">
              <div class="category-icon">
                <Store size="24" />
              </div>
              <h3>Product Management</h3>
              <p>Handle products, categories, and pricing</p>
              <ul>
                <li><a href="#">Product Categories</a></li>
                <li><a href="#">Price Monitoring</a></li>
                <li><a href="#">Inventory Management</a></li>
                <li><a href="#">Product Approval Process</a></li>
              </ul>
            </div>
            
            <div class="category-card">
              <div class="category-icon">
                <BarChart size="24" />
              </div>
              <h3>Reports & Analytics</h3>
              <p>Generate reports and analyze data</p>
              <ul>
                <li><a href="#">Sales Reports</a></li>
                <li><a href="#">User Analytics</a></li>
                <li><a href="#">Market Trends</a></li>
                <li><a href="#">Export Data</a></li>
              </ul>
            </div>
            
            <div class="category-card">
              <div class="category-icon">
                <Settings size="24" />
              </div>
              <h3>System Settings</h3>
              <p>Configure system preferences and security</p>
              <ul>
                <li><a href="#">General Settings</a></li>
                <li><a href="#">Security Configuration</a></li>
                <li><a href="#">Notification Settings</a></li>
                <li><a href="#">Backup & Recovery</a></li>
              </ul>
            </div>
            
            <div class="category-card">
              <div class="category-icon">
                <AlertCircle size="24" />
              </div>
              <h3>Troubleshooting</h3>
              <p>Common issues and their solutions</p>
              <ul>
                <li><a href="#">Login Problems</a></li>
                <li><a href="#">Data Loading Issues</a></li>
                <li><a href="#">Performance Problems</a></li>
                <li><a href="#">Error Messages</a></li>
              </ul>
            </div>
          </div>
          
          <div class="help-sidebar">
            <!-- Removed contact card, kept only FAQ section -->
            <div class="faq-card">
              <h3>Frequently Asked Questions</h3>
              <div class="faq-item">
                <h4>How do I reset a user's password?</h4>
                <p>Go to User Management, select the user, and click "Reset Password".</p>
              </div>
              <div class="faq-item">
                <h4>How often should I backup the system?</h4>
                <p>We recommend daily backups for optimal data protection.</p>
              </div>
              <div class="faq-item">
                <h4>Can I customize the dashboard?</h4>
                <p>Yes, you can rearrange widgets and customize the layout in Settings.</p>
              </div>
              <div class="faq-item">
                <h4>How do I approve new seller registrations?</h4>
                <p>Navigate to User Management > Pending Approvals to review and approve new sellers.</p>
              </div>
              <div class="faq-item">
                <h4>Where can I view system performance metrics?</h4>
                <p>System performance data is available in the Reports & Analytics section under System Health.</p>
              </div>
              <div class="faq-item">
                <h4>How do I set up automated notifications?</h4>
                <p>Go to System Settings > Notification Settings to configure automated alerts and notifications.</p>
              </div>
            </div>
            
            <!-- Added additional help resources section -->
            <div class="resources-card">
              <h3>Additional Resources</h3>
              <div class="resource-item">
                <h4>System Requirements</h4>
                <p>Minimum browser and system requirements for optimal performance.</p>
              </div>
              <div class="resource-item">
                <h4>Keyboard Shortcuts</h4>
                <p>Learn useful keyboard shortcuts to navigate the admin panel efficiently.</p>
              </div>
              <div class="resource-item">
                <h4>Data Export Guidelines</h4>
                <p>Best practices for exporting and handling system data.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/AdminSidebar.vue';
import { 
  Search, 
  BookOpen, 
  Users, 
  Store, 
  BarChart, 
  Settings, 
  AlertCircle
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

.help-search {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  max-width: 500px;
}

.search-box svg {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 1px solid #ced4da;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #2e5c31;
  box-shadow: 0 0 0 2px rgba(46, 92, 49, 0.1);
}

.help-content {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 2rem;
}

.help-categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.category-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
}

.category-icon {
  width: 50px;
  height: 50px;
  background: #e8f5e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: #2e5c31;
}

.category-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
}

.category-card p {
  color: #6c757d;
  margin: 0 0 1rem 0;
}

.category-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-card li {
  margin-bottom: 0.5rem;
}

.category-card a {
  color: #2e5c31;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.category-card a:hover {
  color: #1e3f21;
  text-decoration: underline;
}

.help-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.faq-card, .resources-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.faq-card h3, .resources-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 1rem 0;
}

.faq-card p {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
}

.resource-item {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.resource-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.resource-item h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
}

.resource-item p {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.btn-primary {
  width: 100%;
  background: #2e5c31;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background: #1e3f21;
}

.faq-item {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.faq-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.faq-item h4 {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
}

.faq-item p {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

@media (max-width: 768px) {
  .help-content {
    grid-template-columns: 1fr;
  }
  
  .help-categories {
    grid-template-columns: 1fr;
  }
}
</style>
