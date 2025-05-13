<template>
    <div class="dashboard-container">
      <Sidebar initialActiveItem="Harvest Calendar" />
      
      <div class="main-content">
        <header class="header">
          <div class="page-title">
            <h1>Harvest Calendar</h1>
            <p>Plan, track, and optimize your farm's harvesting schedule in Oriental Mindoro</p>
          </div>
        </header>
        
        <div class="tabs">
          <button 
            @click="activeTab = 'calendar'" 
            :class="['tab-btn', { active: activeTab === 'calendar' }]"
          >
            <Calendar size="18" />
            Calendar
          </button>
          <button 
            @click="activeTab = 'crops'" 
            :class="['tab-btn', { active: activeTab === 'crops' }]"
          >
            <Sprout size="18" />
            Crop Guide
          </button>
        </div>
        
        <div v-if="activeTab === 'calendar'">
          <HarvestCalendar />
        </div>
        
        <div v-else-if="activeTab === 'crops'">
          <OrientalMindoroCrops />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  import { Calendar, Sprout } from 'lucide-vue-next';
  import Sidebar from '@/components/Sidebar.vue';
  import HarvestCalendar from '@/components/harvest-calendar/HarvestCalendar.vue';
  import OrientalMindoroCrops from '@/components/harvest-calendar/OrientalMindoroCrops.vue';
  
  const activeTab = ref('calendar');
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
  
  .sidebar.collapsed + .main-content {
    margin-left: 70px;
    width: calc(100% - 70px);
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
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
  
  .tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 10px;
  }
  
  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 0.9rem;
    background-color: transparent;
    color: #6b7280;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .tab-btn:hover {
    background-color: #f3f4f6;
    color: #111827;
  }
  
  .tab-btn.active {
    background-color: #2e5c31;
    color: #fff;
  }
  
  @media (max-width: 992px) {
    .main-content {
      margin-left: 70px;
      width: calc(100% - 70px);
    }
    
    .sidebar.collapsed + .main-content {
      margin-left: 70px;
    }
  }
  
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
      width: 100%;
      padding: 15px;
      margin-top: 56px; /* For mobile header */
    }
    
    .sidebar.collapsed + .main-content {
      margin-left: 0;
    }
  }
  
  /* Dark Mode Styles */
  :global(.dark) .dashboard-container {
    background-color: #111827;
  }
  
  :global(.dark) .page-title h1 {
    color: #f9fafb;
  }
  
  :global(.dark) .page-title p {
    color: #9ca3af;
  }
  
  :global(.dark) .tabs {
    border-color: #374151;
  }
  
  :global(.dark) .tab-btn {
    color: #9ca3af;
  }
  
  :global(.dark) .tab-btn:hover {
    background-color: #1f2937;
    color: #f9fafb;
  }
  </style>