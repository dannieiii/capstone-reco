<template>
  <div class="admin-layout">
    <AdminSidebar />
    <div class="main-content">
      <div class="page-header">
        <h1 class="page-title">Reports</h1>
        <p class="page-subtitle">Generate and view comprehensive reports</p>
      </div>
      
      <div class="reports-grid">
        <div class="report-card">
          <div class="report-icon">
            <FileText size="24" />
          </div>
          <h3>Sales Report</h3>
          <p>View detailed sales analytics and performance metrics</p>
          <button class="btn-primary">Generate Report</button>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <Users size="24" />
          </div>
          <h3>User Activity Report</h3>
          <p>Track user engagement and activity patterns</p>
          <button class="btn-primary">Generate Report</button>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <TrendingUp size="24" />
          </div>
          <h3>Market Trends Report</h3>
          <p>Analyze market trends and price fluctuations</p>
          <button class="btn-primary">Generate Report</button>
        </div>
        
        <div class="report-card">
          <div class="report-icon">
            <Store size="24" />
          </div>
          <h3>Seller Performance Report</h3>
          <p>Evaluate seller performance and metrics</p>
          <button class="btn-primary">Generate Report</button>
        </div>
      </div>
      
      <div class="recent-reports">
        <h2>Recent Reports</h2>
        <div class="reports-table">
          <table>
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Generated Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Sales Report - December 2024</td>
                <td>Sales</td>
                <td>Dec 25, 2024</td>
                <td><span class="status-badge completed">Completed</span></td>
                <td>
                  <button class="btn-secondary">Download</button>
                  <button class="btn-secondary">View</button>
                </td>
              </tr>
              <tr>
                <td>User Activity Report - Q4 2024</td>
                <td>Activity</td>
                <td>Dec 24, 2024</td>
                <td><span class="status-badge processing">Processing</span></td>
                <td>
                  <button class="btn-secondary" disabled>Download</button>
                  <button class="btn-secondary" disabled>View</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import AdminSidebar from '@/components/AdminSidebar.vue';
import { FileText, Users, TrendingUp, Store } from 'lucide-vue-next';
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

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.report-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.2s ease;
}

.report-card:hover {
  transform: translateY(-2px);
}

.report-icon {
  width: 60px;
  height: 60px;
  background: #e8f5e8;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem auto;
  color: #2e5c31;
}

.report-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 0.5rem 0;
}

.report-card p {
  color: #6c757d;
  margin: 0 0 1.5rem 0;
}

.btn-primary {
  background: #2e5c31;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background: #1e3f21;
}

.recent-reports h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2e5c31;
  margin: 0 0 1.5rem 0;
}

.reports-table {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

th {
  background: #f8f9fa;
  font-weight: 600;
  color: #2e5c31;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.processing {
  background: #fff3cd;
  color: #856404;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  margin-right: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>