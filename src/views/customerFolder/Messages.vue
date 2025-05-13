<template>
  <div class="messages-page">
    <div class="header">
      <button class="back-button" @click="$emit('navigate', 'HomePage')">
        <ChevronLeft size="22" />
      </button>
      <h1>Messages</h1>
      <div class="header-buttons">
        <button class="icon-button">
          <Search size="18" />
        </button>
        <button class="icon-button profile-icon">
          <img :src="userPhoto" alt="Profile" />
        </button>
      </div>
    </div>
    
    <div class="content">
      <div class="tabs">
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          All
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'farmers' }"
          @click="activeTab = 'farmers'"
        >
          Farmers
        </button>
        <button 
          class="tab-button" 
          :class="{ active: activeTab === 'support' }"
          @click="activeTab = 'support'"
        >
          Support
        </button>
      </div>
      
      <div v-if="filteredConversations.length === 0" class="empty-state">
        <div class="empty-icon">
          <MessageCircle size="60" />
        </div>
        <h2>No messages yet</h2>
        <p>Your conversations with farmers will appear here</p>
      </div>
      
      <div v-else class="messages-list">
        <div 
          class="message-item" 
          v-for="(conversation, index) in filteredConversations" 
          :key="index"
          @click="openChat(conversation)"
        >
          <div class="message-avatar">
            <img :src="conversation.sellerAvatar" :alt="conversation.sellerName">
            <div class="status-dot" :class="{ online: conversation.sellerOnline }"></div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <h3>{{ conversation.sellerName }}</h3>
              <span class="message-time">{{ formatTime(conversation.lastMessageTime) }}</span>
            </div>
            <p class="message-preview">{{ conversation.lastMessage }}</p>
          </div>
          <div class="message-indicators">
            <div v-if="conversation.unreadCount > 0 && conversation.lastMessageSender === 'seller'" class="unread-badge">
              {{ conversation.unreadCount }}
            </div>
            <CheckCheck v-if="conversation.lastMessageSender === 'customer'" size="16" class="read-indicator" />
          </div>
        </div>
      </div>
      
      <div v-if="selectedConversation" class="chat-window">
        <div class="chat-header">
          <button class="back-button" @click="selectedConversation = null">
            <ChevronLeft size="22" />
          </button>
          <div class="chat-user">
            <div class="chat-avatar">
              <img :src="selectedConversation.sellerAvatar" :alt="selectedConversation.sellerName">
              <div class="status-dot" :class="{ online: selectedConversation.sellerOnline }"></div>
            </div>
            <div>
              <h3>{{ selectedConversation.sellerName }}</h3>
              <p v-if="selectedConversation.sellerOnline">Online</p>
              <p v-else>Offline</p>
            </div>
          </div>
          <button class="icon-button">
            <MoreVertical size="18" />
          </button>
        </div>
        
        <div class="chat-messages">
          <div 
            v-for="(message, index) in chatMessages" 
            :key="index" 
            class="chat-message"
            :class="{ 'outgoing': message.senderType === 'customer' }"
          >
            <div class="message-bubble">
              <div v-if="message.productInfo" class="product-preview">
                <img :src="message.productInfo.image" :alt="message.productInfo.name">
                <div class="product-details">
                  <h4>{{ message.productInfo.name }}</h4>
                  <p>₱{{ message.productInfo.price }}</p>
                </div>
              </div>
              <div v-if="message.orderInfo" class="order-preview">
                <div class="order-header">
                  <ShoppingBag size="16" />
                  <span>Order #{{ message.orderInfo.id }}</span>
                </div>
                <div class="order-details">
                  <p>{{ message.orderInfo.items }} items • ₱{{ message.orderInfo.total }}</p>
                  <span :class="'order-status-' + message.orderInfo.status.toLowerCase()">
                    {{ message.orderInfo.status }}
                  </span>
                </div>
              </div>
              <p>{{ message.text }}</p>
            </div>
            <div class="message-time">
              {{ formatMessageTime(message.timestamp) }}
              <CheckCheck 
                v-if="message.senderType === 'customer'" 
                size="12" 
                class="message-status" 
                :class="{ 'read': message.read }" 
              />
            </div>
          </div>
        </div>
        
        <div class="chat-input">
          <button class="attachment-button">
            <Paperclip size="18" />
          </button>
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
      
      <BottomNavigation active-tab="messages" @navigate="$emit('navigate', $event)" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  ChevronLeft, 
  Search, 
  MessageCircle, 
  CheckCheck, 
  MoreVertical,
  Paperclip,
  Send,
  ShoppingBag
} from 'lucide-vue-next';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, addDoc, updateDoc, serverTimestamp, getDoc 
} from 'firebase/firestore';
import { db, auth } from '@/firebase/firebaseConfig';
import BottomNavigation from '@/components/BottomNavigation.vue';

// User data
const user = auth.currentUser;
const customerId = user?.uid;
const userPhoto = user?.photoURL || 'https://randomuser.me/api/portraits/lego/1.jpg';

// State
const activeTab = ref('all');
const conversations = ref([]);
const selectedConversation = ref(null);
const chatMessages = ref([]);
const newMessage = ref('');

// Initialize
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

// Filtered conversations based on active tab
const filteredConversations = computed(() => {
  if (activeTab.value === 'all') {
    return conversations.value;
  } else if (activeTab.value === 'farmers') {
    return conversations.value.filter(conv => !conv.isSupport);
  } else if (activeTab.value === 'support') {
    return conversations.value.filter(conv => conv.isSupport);
  }
  return conversations.value;
});

const fetchConversations = () => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', customerId),
    orderBy('lastMessageTime', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const convos = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const sellerId = data.participants.find(id => id !== customerId);
      
      // Get seller details from sellers collection
      let sellerName = 'Seller';
      let sellerAvatar = 'https://randomuser.me/api/portraits/lego/2.jpg';
      let sellerOnline = false;
      
      try {
        // First try sellers collection
        const sellerDoc = await getDoc(doc(db, 'sellers', sellerId));
        if (sellerDoc.exists()) {
          const sellerData = sellerDoc.data();
          sellerName = sellerData.firstName + ' ' + sellerData.lastName;
          // Add default avatar if none exists
          sellerAvatar = sellerData.photoURL || sellerAvatar; 
        } else {
          // Fallback to users collection
          const userDoc = await getDoc(doc(db, 'users', sellerId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            sellerName = userData.firstName + ' ' + userData.lastName;
          }
        }
      } catch (error) {
        console.error('Error fetching seller data:', error);
      }
      
      convos.push({
        id: doc.id,
        ...data,
        sellerId,
        sellerName,
        sellerAvatar,
        sellerOnline // You'll need to implement online status tracking
      });
    }
    
    conversations.value = convos;
  });
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
  });
};

// Open chat
const openChat = async (conversation) => {
  selectedConversation.value = conversation;
  
  // Mark as read if there are unread messages from seller
  if (conversation.unreadCount > 0 && conversation.lastMessageSender === 'seller') {
    await updateDoc(doc(db, 'conversations', conversation.id), {
      unreadCount: 0
    });
  }
  
  // Load messages for this conversation
  loadMessages(conversation.id);
};

// Send a message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedConversation.value) return;
  
  const message = {
    senderId: customerId,
    senderType: 'customer',
    text: newMessage.value,
    timestamp: serverTimestamp(),
    read: false
  };
  
  // Add message to Firestore
  await addDoc(
    collection(db, 'conversations', selectedConversation.value.id, 'messages'),
    message
  );
  
  // Update conversation last message
  await updateDoc(doc(db, 'conversations', selectedConversation.value.id), {
    lastMessage: newMessage.value,
    lastMessageTime: serverTimestamp(),
    lastMessageSender: 'customer',
    unreadCount: 0 // Reset unread count since customer is sending
  });
  
  // Clear input
  newMessage.value = '';
};

// Initialize on mount
onMounted(() => {
  if (customerId) {
    conversationsUnsubscribe = fetchConversations();
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

<!-- Keep the existing styles -->
  
  <style scoped>
  .messages-page {
    height: 100%;
    display: flex;
    flex-direction: column;
    padding-bottom: 80px;
    position: relative;
  }
  
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 15px;
    background-color: #2e5c31;
    color: white;
  }
  
  .back-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .header h1 {
    font-size: 18px;
    font-weight: 600;
  }
  
  .header-buttons {
    display: flex;
    gap: 8px;
  }
  
  .icon-button {
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    overflow: hidden;
  }
  
  .profile-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .content {
    flex: 1;
    padding: 20px 15px;
    background-color: #f5f5f5;
    overflow-y: auto;
  }
  
  .tabs {
    display: flex;
    background-color: white;
    border-radius: 10px;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
  
  .tab-button {
    flex: 1;
    padding: 15px 0;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: #666;
    background: none;
    border: none;
    transition: all 0.2s ease;
  }
  
  .tab-button.active {
    color: #2e5c31;
    background-color: rgba(46, 92, 49, 0.1);
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 50px 20px;
  }
  
  .empty-icon {
    color: #ccc;
    margin-bottom: 20px;
  }
  
  .empty-state h2 {
    font-size: 18px;
    margin-bottom: 10px;
    color: #333;
  }
  
  .empty-state p {
    font-size: 14px;
    color: #666;
    margin-bottom: 30px;
  }
  
  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .message-item {
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 10px;
    padding: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .message-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
  
  .message-avatar {
    position: relative;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 15px;
  }
  
  .message-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: #ccc;
    border: 2px solid white;
  }
  
  .status-dot.online {
    background-color: #4CAF50;
  }
  
  .message-content {
    flex: 1;
  }
  
  .message-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  
  .message-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .message-time {
    font-size: 12px;
    color: #999;
  }
  
  .message-preview {
    font-size: 13px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  
  .message-indicators {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-left: 10px;
  }
  
  .unread-badge {
    background-color: #2e5c31;
    color: white;
    font-size: 10px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  
  .read-indicator {
    color: #2e5c31;
  }
  
  /* Chat Window */
  .chat-window {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: white;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }
  
  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 15px;
    background-color: #2e5c31;
    color: white;
  }
  
  .chat-user {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .chat-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
  }
  
  .chat-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .chat-user h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  
  .chat-user p {
    font-size: 12px;
    margin: 0;
    opacity: 0.8;
  }
  
  .chat-messages {
    flex: 1;
    padding: 15px;
    background-color: #f5f5f5;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .chat-message {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    align-self: flex-start;
  }
  
  .chat-message.outgoing {
    align-self: flex-end;
  }
  
  .message-bubble {
    background-color: white;
    padding: 12px 15px;
    border-radius: 15px;
    border-top-left-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    font-size: 14px;
    color: #333;
  }
  
  .chat-message.outgoing .message-bubble {
    background-color: #e1f5e1;
    border-top-left-radius: 15px;
    border-top-right-radius: 5px;
  }
  
  .message-time {
    font-size: 11px;
    color: #999;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .message-status {
    color: #ccc;
  }
  
  .message-status.read {
    color: #2e5c31;
  }
  
  .chat-input {
    display: flex;
    align-items: center;
    padding: 10px 15px;
    background-color: white;
    border-top: 1px solid #eee;
  }
  
  .attachment-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    background: none;
  }
  
  .chat-input input {
    flex: 1;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 14px;
    margin: 0 10px;
  }
  
  .send-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #2e5c31;
    color: white;
  }
  </style>