<template>
    <div class="dashboard-card recent-activity">
      <div class="card-header">
        <h3>Recent Activity</h3>
        <button class="view-all-btn">View All</button>
      </div>
      <div class="activity-list">
        <div v-for="(activity, index) in activities" :key="index" class="activity-item">
          <div class="activity-icon" :class="activity.type">
            <component :is="getActivityIcon(activity.type)" size="18" />
          </div>
          <div class="activity-content">
            <div class="activity-text" v-html="activity.text"></div>
            <div class="activity-time">{{ activity.time }}</div>
          </div>
          <div class="activity-actions">
            <button class="action-btn">
              <MoreVertical size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { User, ShoppingBag, Truck, AlertCircle, CheckCircle, MessageSquare, MoreVertical } from 'lucide-vue-next';
  
  const activities = [
    {
      type: 'user',
      text: '<strong>John Doe</strong> registered as a new seller',
      time: '2 hours ago'
    },
    {
      type: 'product',
      text: '<strong>15 new products</strong> were added by <strong>Green Harvest Farm</strong>',
      time: '4 hours ago'
    },
    {
      type: 'order',
      text: '<strong>Order #12345</strong> has been completed',
      time: '5 hours ago'
    },
    {
      type: 'alert',
      text: '<strong>Price alert:</strong> Tomato prices increased by 15%',
      time: '8 hours ago'
    },
    {
      type: 'system',
      text: 'System maintenance scheduled for <strong>tomorrow at 2:00 AM</strong>',
      time: '1 day ago'
    }
  ];
  
  const getActivityIcon = (type) => {
    const icons = {
      'user': User,
      'product': ShoppingBag,
      'order': Truck,
      'alert': AlertCircle,
      'system': CheckCircle,
      'message': MessageSquare
    };
    return icons[type] || Info;
  };
  </script>
  
  <style scoped>
  .dashboard-card {
    background-color: #fff;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .card-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  
  .view-all-btn {
    background: none;
    border: none;
    color: #3498db;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
  }
  
  .activity-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .activity-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-radius: 8px;
    background-color: #f9fafb;
  }
  
  .activity-icon {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .activity-icon.user {
    background-color: #3498db;
  }
  
  .activity-icon.product {
    background-color: #4a8f4d;
  }
  
  .activity-icon.order {
    background-color: #8b5cf6;
  }
  
  .activity-icon.alert {
    background-color: #ef4444;
  }
  
  .activity-icon.system {
    background-color: #f59e0b;
  }
  
  .activity-icon.message {
    background-color: #06b6d4;
  }
  
  .activity-content {
    flex: 1;
  }
  
  .activity-text {
    font-size: 0.9rem;
    color: #4b5563;
    margin-bottom: 5px;
  }
  
  .activity-time {
    font-size: 0.8rem;
    color: #9ca3af;
  }
  
  .activity-actions {
    display: flex;
    gap: 5px;
  }
  
  .action-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-btn:hover {
    background-color: #e5e7eb;
    color: #111827;
  }
  </style>