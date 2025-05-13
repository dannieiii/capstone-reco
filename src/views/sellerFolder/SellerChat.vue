<template>
  <div class="app-container">
    <Sidebar />
    
    <div class="chat-container">
      <div class="header">
        <h1>Messages</h1>
        <div class="header-actions">
          <button class="action-button">
            <Filter size="18" />
            <span>Filter</span>
          </button>
          <button class="action-button">
            <Search size="18" />
            <span>Search</span>
          </button>
        </div>
      </div>
      
      <div class="content">
        <div class="conversations-panel">
          <div class="panel-header">
            <h2>Conversations</h2>
            <span class="conversation-count">{{ filteredConversations.length }}</span>
          </div>
          
          <div class="search-box">
            <Search size="16" class="search-icon" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              v-model="searchQuery"
            />
          </div>
          
          <div class="conversations-list">
            <div 
              v-for="conversation in filteredConversations" 
              :key="conversation.id"
              class="conversation-item"
              :class="{ active: selectedConversationId === conversation.id }"
              @click="selectConversation(conversation)"
            >
              <div class="conversation-avatar">
                <img :src="conversation.customerAvatar" :alt="conversation.customerName">
                <div class="status-dot" :class="{ online: conversation.customerOnline }"></div>
              </div>
              <div class="conversation-content">
                <div class="conversation-header">
                  <h3>{{ conversation.customerName }}</h3>
                  <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
                </div>
                <p class="conversation-preview">{{ conversation.lastMessage }}</p>
              </div>
              <div class="conversation-indicators">
                <div v-if="conversation.unreadCount > 0 && conversation.lastMessageSender === 'customer'" class="unread-badge">
                  {{ conversation.unreadCount }}
                </div>
                <CheckCheck v-if="conversation.lastMessageSender === 'seller'" size="16" class="read-indicator" />
              </div>
            </div>
            
            <div v-if="filteredConversations.length === 0" class="empty-state">
              <MessageSquare size="40" />
              <p>No conversations found</p>
            </div>
          </div>
        </div>
        
        <div class="chat-panel" v-if="selectedConversation">
          <div class="chat-header">
            <div class="chat-user">
              <div class="chat-avatar">
                <img :src="selectedConversation.customerAvatar" :alt="selectedConversation.customerName">
                <div class="status-dot" :class="{ online: selectedConversation.customerOnline }"></div>
              </div>
              <div class="chat-user-info">
                <h3>{{ selectedConversation.customerName }}</h3>
                <p v-if="selectedConversation.customerOnline" class="online-status">Online</p>
                <p v-else class="offline-status">Offline</p>
              </div>
            </div>
            <div class="chat-actions">
              <button class="icon-button">
                <MoreVertical size="18" />
              </button>
            </div>
          </div>
          
          <div class="chat-messages" ref="messagesContainer">
            <div 
              v-for="(message, index) in chatMessages" 
              :key="index"
              class="chat-message"
              :class="{ 
                'outgoing': message.senderType === 'seller',
                'incoming': message.senderType === 'customer'
              }"
            >
              <div class="message-bubble">
                <p>{{ message.text }}</p>
              </div>
              <div class="message-time">
                {{ formatMessageTime(message.timestamp) }}
                <CheckCheck 
                  v-if="message.senderType === 'seller'" 
                  size="12" 
                  class="message-status" 
                  :class="{ 'read': message.read }" 
                />
              </div>
            </div>
          </div>
          
          <div class="chat-input">
            <div class="input-container">
              <input 
                type="text" 
                placeholder="Type a message..." 
                v-model="newMessage"
                @keydown.enter="sendMessage"
              >
              <button class="send-button" @click="sendMessage" :disabled="!newMessage.trim()">
                <Send size="18" />
              </button>
            </div>
          </div>
        </div>
        
        <div class="empty-chat" v-else>
          <div class="empty-chat-content">
            <MessageSquare size="60" />
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the list to start chatting</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  MoreVertical, 
  Send, 
  CheckCheck
} from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
import { db, auth } from '@/firebase/firebaseConfig';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, addDoc, updateDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';

// Firebase auth
const sellerId = auth.currentUser?.uid;

// State
const searchQuery = ref('');
const selectedConversationId = ref(null);
const selectedConversation = ref(null);
const newMessage = ref('');
const conversations = ref([]);
const chatMessages = ref([]);
const messagesContainer = ref(null);

// Unsubscribe functions
let conversationsUnsubscribe = null;
let messagesUnsubscribe = null;

// Format time
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Format message time
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Filtered conversations based on search query
const filteredConversations = computed(() => {
  if (!searchQuery.value) {
    return conversations.value;
  }
  const query = searchQuery.value.toLowerCase();
  return conversations.value.filter(conv => 
    conv.customerName.toLowerCase().includes(query) || 
    conv.lastMessage.toLowerCase().includes(query)
  );
});

// Fetch conversations for the seller
const fetchConversations = () => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', sellerId),
    orderBy('lastMessageTime', 'desc')
  );
  
  conversationsUnsubscribe = onSnapshot(q, async (snapshot) => {
    const convos = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const customerId = data.participants.find(id => id !== sellerId);
      
      // Get customer details from users collection
      let customerName = 'Customer';
      let customerAvatar = 'https://randomuser.me/api/portraits/lego/1.jpg';
      let customerOnline = false;
      
      try {
        const customerDoc = await getDoc(doc(db, 'users', customerId));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          customerName = customerData.firstName + ' ' + customerData.lastName;
          customerAvatar = customerData.photoURL || customerAvatar;
          customerOnline = customerData.isOnline || false;
        }
      } catch (error) {
        console.error('Error fetching customer data:', error);
      }
      
      convos.push({
        id: doc.id,
        ...data,
        customerId,
        customerName,
        customerAvatar,
        customerOnline
      });
    }
    
    conversations.value = convos;
  });
};

// Select conversation
const selectConversation = async (conversation) => {
  selectedConversationId.value = conversation.id;
  selectedConversation.value = conversation;
  
  // Mark as read if there are unread messages from customer
  if (conversation.unreadCount > 0 && conversation.lastMessageSender === 'customer') {
    await updateDoc(doc(db, 'conversations', conversation.id), {
      unreadCount: 0
    });
  }
  
  // Load messages for this conversation
  loadMessages(conversation.id);
};

// Load messages for a conversation
const loadMessages = (conversationId) => {
  if (messagesUnsubscribe) {
    messagesUnsubscribe();
  }
  
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  messagesUnsubscribe = onSnapshot(q, (snapshot) => {
    chatMessages.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Scroll to bottom
    scrollToBottom();
  });
};

// Send a message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversationId.value) return;
  
  const message = {
    senderId: sellerId,
    senderType: 'seller',
    text: newMessage.value,
    timestamp: serverTimestamp(),
    read: false
  };
  
  // Add message to Firestore
  await addDoc(
    collection(db, 'conversations', selectedConversationId.value, 'messages'),
    message
  );
  
  // Update conversation last message
  await updateDoc(doc(db, 'conversations', selectedConversationId.value), {
    lastMessage: newMessage.value,
    lastMessageTime: serverTimestamp(),
    lastMessageSender: 'seller',
    unreadCount: 0 // Reset unread count since seller is sending
  });
  
  // Clear input
  newMessage.value = '';
  
  // Scroll to bottom
  scrollToBottom();
};

// Scroll to bottom of messages
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Initialize on mount
onMounted(() => {
  if (sellerId) {
    fetchConversations();
  }
});

// Clean up on unmount
onUnmounted(() => {
  if (conversationsUnsubscribe) {
    conversationsUnsubscribe();
  }
  if (messagesUnsubscribe) {
    messagesUnsubscribe();
  }
});
</script>

  
  <style scoped>
  .app-container {
    display: flex;
    height: 100vh;
    width: 100%;
    overflow: hidden;
  }
  
  .chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    margin-left: 230px;
    transition: margin-left 0.3s ease;
  }
  
  .sidebar.collapsed ~ .chat-container {
    margin-left: 70px;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    background-color: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    height: 70px;
  }
  
  .header h1 {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
  
  .action-button {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 8px 12px;
    border-radius: 6px;
    background-color: #f5f5f5;
    color: #555;
    font-size: 14px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .action-button:hover {
    background-color: #e8e8e8;
  }
  
  .content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  
  .conversations-panel {
    width: 320px;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    background-color: #f9f9f9;
    transition: width 0.3s ease;
  }
  
  .sidebar.collapsed ~ .chat-container .conversations-panel {
    width: 280px;
  }
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .panel-header h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #333;
  }
  
  .conversation-count {
    background-color: #2e5c31;
    color: white;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
  }
  
  .tabs {
    display: flex;
    padding: 10px;
    gap: 5px;
    border-bottom: 1px solid #e0e0e0;
    overflow-x: auto;
  }
  
  .tab-button {
    padding: 8px 12px;
    border-radius: 15px;
    background: none;
    border: none;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: all 0.2s ease;
  }
  
  .tab-button.active {
    background-color: #2e5c31;
    color: white;
  }
  
  .tab-count {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 11px;
  }
  
  .tab-button:not(.active) .tab-count {
    background-color: #e0e0e0;
    color: #666;
  }
  
  .search-box {
    padding: 10px;
    position: relative;
  }
  
  .search-icon {
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }
  
  .search-box input {
    width: 100%;
    padding: 10px 10px 10px 35px;
    border-radius: 20px;
    border: 1px solid #e0e0e0;
    font-size: 13px;
    background-color: white;
  }
  
  .conversations-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
  }
  
  .conversation-item {
    display: flex;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: white;
    border: 1px solid transparent;
  }
  
  .conversation-item:hover {
    background-color: #f0f0f0;
  }
  
  .conversation-item.active {
    background-color: #e8f3e8;
    border-color: #2e5c31;
  }
  
  .conversation-avatar {
    position: relative;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
  }
  
  .conversation-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .status-dot {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #ccc;
    border: 2px solid white;
  }
  
  .status-dot.online {
    background-color: #4CAF50;
  }
  
  .conversation-content {
    flex: 1;
    min-width: 0;
  }
  
  .conversation-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
  }
  
  .conversation-header h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .conversation-time {
    font-size: 12px;
    color: #999;
    white-space: nowrap;
  }
  
  .conversation-preview {
    font-size: 13px;
    color: #666;
    margin: 0 0 5px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .conversation-meta {
    display: flex;
    gap: 5px;
  }
  
  .order-badge, .product-badge {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background-color: #f0f0f0;
    color: #666;
  }
  
  .order-badge {
    background-color: #e8f3e8;
    color: #2e5c31;
  }
  
  .conversation-indicators {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-left: 8px;
    gap: 5px;
  }
  
  .unread-badge {
    background-color: #2e5c31;
    color: white;
    font-size: 11px;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
  }
  
  .priority-indicator {
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 3px;
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .priority-indicator.high {
    background-color: #ffebee;
    color: #d32f2f;
  }
  
  .priority-indicator.medium {
    background-color: #fff8e1;
    color: #ffa000;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px;
    color: #999;
    text-align: center;
  }
  
  .chat-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: white;
  }
  
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px 20px;
    border-bottom: 1px solid #e0e0e0;
    background-color: white;
  }
  
  .chat-user {
    display: flex;
    align-items: center;
  }
  
  .chat-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 12px;
  }
  
  .chat-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .chat-user-info h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 3px 0;
    color: #333;
  }
  
  .chat-user-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #666;
  }
  
  .online-status {
    color: #4CAF50;
  }
  
  .offline-status {
    color: #999;
  }
  
  .order-number {
    background-color: #e8f3e8;
    color: #2e5c31;
    padding: 2px 6px;
    border-radius: 4px;
  }
  
  .chat-actions {
    display: flex;
    gap: 8px;
  }
  
  .icon-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    color: #555;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .icon-button:hover {
    background-color: #e8e8e8;
  }
  
  .chat-messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 10px 0;
  }
  
  .date-separator span {
    background-color: #e8e8e8;
    padding: 5px 10px;
    border-radius: 10px;
    font-size: 12px;
    color: #666;
  }
  
  .chat-message {
    display: flex;
    flex-direction: column;
    max-width: 70%;
  }
  
  .chat-message.incoming {
    align-self: flex-start;
  }
  
  .chat-message.outgoing {
    align-self: flex-end;
  }
  
  .chat-message.system {
    align-self: center;
    max-width: 80%;
  }
  
  .system-message {
    background-color: #f0f0f0;
    padding: 8px 12px;
    border-radius: 10px;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
  
  .message-bubble {
    padding: 12px 15px;
    border-radius: 15px;
    font-size: 14px;
    color: #333;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .chat-message.incoming .message-bubble {
    border-top-left-radius: 5px;
    background-color: white;
  }
  
  .chat-message.outgoing .message-bubble {
    border-top-right-radius: 5px;
    background-color: #e8f3e8;
    color: #333;
  }
  
  .product-preview {
    display: flex;
    gap: 10px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  
  .product-preview img {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    object-fit: cover;
  }
  
  .product-details h4 {
    font-size: 14px;
    margin: 0 0 3px 0;
  }
  
  .product-details p {
    font-size: 13px;
    margin: 0;
    color: #2e5c31;
    font-weight: 600;
  }
  
  .order-preview {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }
  
  .order-header {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 5px;
    font-weight: 600;
    font-size: 13px;
  }
  
  .order-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }
  
  .order-status-processing {
    color: #ff9800;
    font-weight: 600;
  }
  
  .order-status-shipped {
    color: #2196F3;
    font-weight: 600;
  }
  
  .order-status-delivered {
    color: #4CAF50;
    font-weight: 600;
  }
  
  .message-time {
    font-size: 11px;
    color: #999;
    margin-top: 5px;
    align-self: flex-end;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .message-status {
    color: #ccc;
  }
  
  .message-status.read {
    color: #2e5c31;
  }
  
  .quick-replies {
    display: flex;
    gap: 8px;
    padding: 10px 20px;
    overflow-x: auto;
    background-color: white;
    border-top: 1px solid #e0e0e0;
  }
  
  .quick-reply-button {
    white-space: nowrap;
    padding: 8px 12px;
    border-radius: 15px;
    background-color: #f0f0f0;
    color: #333;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .quick-reply-button:hover {
    background-color: #e0e0e0;
  }
  
  .chat-input {
    padding: 15px 20px;
    background-color: white;
    border-top: 1px solid #e0e0e0;
  }
  
  .input-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .input-container {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    background-color: #f5f5f5;
    border-radius: 20px;
    padding: 8px 15px;
  }
  
  .input-container textarea {
    flex: 1;
    border: none;
    background: none;
    resize: none;
    max-height: 100px;
    font-size: 14px;
    padding: 5px 0;
    outline: none;
    font-family: inherit;
  }
  
  .send-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2e5c31;
    color: white;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .send-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .empty-chat {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f9f9f9;
  }
  
  .empty-chat-content {
    text-align: center;
    color: #999;
    padding: 20px;
  }
  
  .empty-chat-content h2 {
    font-size: 18px;
    margin: 15px 0 5px 0;
    color: #666;
  }
  
  .empty-chat-content p {
    font-size: 14px;
    margin: 0;
  }
  
  /* Responsive Styles */
  @media (max-width: 1200px) {
    .conversations-panel {
      width: 280px;
    }
  }
  
  @media (max-width: 992px) {
    .chat-container {
      margin-left: 70px;
    }
    
    .conversations-panel {
      position: absolute;
      z-index: 90;
      left: 70px;
      height: 100%;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
    
    .conversations-panel.active {
      transform: translateX(0);
    }
    
    .sidebar.collapsed ~ .chat-container .conversations-panel {
      left: 70px;
    }
  }
  
  @media (max-width: 768px) {
    .chat-container {
      margin-left: 0;
    }
    
    .conversations-panel {
      left: 0;
      width: 280px;
    }
    
    .sidebar.collapsed ~ .chat-container .conversations-panel {
      left: 0;
    }
    
    .header {
      padding: 10px 15px;
    }
    
    .conversation-item {
      padding: 8px;
    }
  }
  
  @media (max-width: 576px) {
    .conversations-panel {
      width: 100%;
    }
    
    .chat-header {
      padding: 10px;
    }
    
    .chat-messages {
      padding: 10px;
    }
    
    .chat-input {
      padding: 10px;
    }
    
    .chat-message {
      max-width: 85%;
    }
  }
  
  /* Dark mode styles */
  :global(.dark) .chat-container {
    background-color: #1a1a1a;
  }
  
  :global(.dark) .header,
  :global(.dark) .chat-header {
    background-color: #222;
    border-color: #333;
  }
  
  :global(.dark) .header h1,
  :global(.dark) .chat-user-info h3 {
    color: #fff;
  }
  
  :global(.dark) .action-button,
  :global(.dark) .icon-button {
    background-color: #333;
    color: #ccc;
  }
  
  :global(.dark) .action-button:hover,
  :global(.dark) .icon-button:hover {
    background-color: #444;
  }
  
  :global(.dark) .conversations-panel {
    background-color: #222;
    border-color: #333;
  }
  
  :global(.dark) .panel-header {
    border-color: #333;
  }
  
  :global(.dark) .panel-header h2 {
    color: #fff;
  }
  
  :global(.dark) .tab-button {
    color: #ccc;
  }
  
  :global(.dark) .tab-button:not(.active) .tab-count {
    background-color: #444;
    color: #ccc;
  }
  
  :global(.dark) .search-box input {
    background-color: #333;
    border-color: #444;
    color: #fff;
  }
  
  :global(.dark) .conversation-item {
    background-color: #2a2a2a;
  }
  
  :global(.dark) .conversation-item:hover {
    background-color: #333;
  }
  
  :global(.dark) .conversation-item.active {
    background-color: #2e3c2f;
    border-color: #4a8f4d;
  }
  
  :global(.dark) .conversation-header h3 {
    color: #fff;
  }
  
  :global(.dark) .conversation-preview {
    color: #ccc;
  }
  
  :global(.dark) .order-badge {
    background-color: #2e3c2f;
    color: #8bc34a;
  }
  
  :global(.dark) .product-badge {
    background-color: #333;
    color: #ccc;
  }
  
  :global(.dark) .chat-messages {
    background-color: #1a1a1a;
  }
  
  :global(.dark) .date-separator span {
    background-color: #333;
    color: #ccc;
  }
  
  :global(.dark) .system-message {
    background-color: #333;
    color: #ccc;
  }
  
  :global(.dark) .message-bubble {
    background-color: #2a2a2a;
    color: #eee;
  }
  
  :global(.dark) .chat-message.outgoing .message-bubble {
    background-color: #2e3c2f;
    color: #eee;
  }
  
  :global(.dark) .product-preview,
  :global(.dark) .order-preview {
    background-color: #333;
  }
  
  :global(.dark) .quick-reply-button {
    background-color: #333;
    color: #ccc;
  }
  
  :global(.dark) .quick-reply-button:hover {
    background-color: #444;
  }
  
  :global(.dark) .input-container {
    background-color: #333;
  }
  
  :global(.dark) .input-container textarea {
    color: #fff;
  }
  
  :global(.dark) .empty-chat {
    background-color: #1a1a1a;
  }
  
  :global(.dark) .empty-chat-content h2 {
    color: #ccc;
  }
  </style>