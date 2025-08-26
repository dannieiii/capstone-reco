<template>
    <div class="app-container">
      <Sidebar />
      
  <div class="chat-container" ref="chatContainerEl">
        <div class="header">
          <h1>Messages</h1>
          <div class="header-actions">
            <button class="action-button" @click="toggleFilter">
              <Filter size="18" />
              <span>Filter</span>
            </button>
            <button class="action-button" @click="toggleSearch">
              <Search size="18" />
              <span>Search</span>
            </button>
          </div>
        </div>
        
        <div class="content">
          <!-- Conversations list: always visible on desktop; on mobile only when no conversation is selected -->
          <div class="conversations-panel" v-if="!isMobile || !selectedConversation">
            <div class="panel-header">
              <h2>Conversations</h2>
              <span class="conversation-count">{{ filteredConversations.length }}</span>
            </div>
            
            <div class="tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                class="tab-button" 
                :class="{ active: activeTab === tab.id }"
                @click="activeTab = tab.id"
              >
                {{ tab.name }}
                <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
              </button>
            </div>
            
            <div v-if="showSearch" class="search-box">
              <Search size="16" class="search-icon" />
              <input 
                type="text" 
                placeholder="Search conversations..." 
                v-model="searchQuery"
                @input="handleSearch"
              />
              <button class="close-search" @click="closeSearch">×</button>
            </div>
            
            <div v-if="loadingConversations" class="loading-state">
              <div class="loading-spinner"></div>
              <!-- Loading state with skeleton -->
              <div v-if="loadingConversations" class="loading-skeleton">
                <div v-for="i in 3" :key="i" class="skeleton-conversation">
                  <div class="skeleton-avatar"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-name"></div>
                    <div class="skeleton-message"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else-if="filteredConversations.length === 0" class="empty-state">
              <MessageSquare size="40" />
              <p>No conversations found</p>
            </div>
            
            <div v-else class="conversations-list">
              <div 
                v-for="conversation in filteredConversations" 
                :key="conversation.id"
                class="conversation-item"
                :class="{ active: selectedConversationId === conversation.id }"
                @click="selectConversation(conversation)"
              >
                <div class="conversation-avatar">
                  <img 
                    :src="conversation.customerAvatar" 
                    :alt="conversation.customerName" 
                    @error="handleImageError"
                    loading="lazy"
                  >
                  <div class="status-dot" :class="{ online: conversation.customerOnline }"></div>
                </div>
                <div class="conversation-content">
                  <div class="conversation-header">
                    <h3>{{ conversation.customerName }}</h3>
                    <span class="conversation-time">{{ formatTime(conversation.lastMessageTime) }}</span>
                  </div>
                  <p class="conversation-preview">{{ conversation.lastMessage || 'No messages yet' }}</p>
                  <div class="conversation-meta">
                    <span v-if="conversation.orderId" class="order-badge">
                      Order #{{ conversation.orderId }}
                    </span>
                    <span v-if="conversation.isTyping" class="typing-indicator">
                      Typing...
                    </span>
                  </div>
                </div>
                <div class="conversation-indicators">
                  <div v-if="conversation.unreadCount > 0" class="unread-badge">{{ conversation.unreadCount }}</div>
                </div>
              </div>
            </div>
          </div>
          
      <!-- Chat panel: always visible on desktop; on mobile only when a conversation is selected -->
      <div class="chat-panel" v-if="(!isMobile && selectedConversation) || (isMobile && selectedConversation)">
            <div class="chat-header">
        <!-- Back button for mobile to go back to conversations list -->
        <button v-if="isMobile" class="back-button" @click="backToList" aria-label="Back to conversations">⟵</button>
        <div class="chat-user">
                <div class="chat-avatar">
                  <img 
                    :src="selectedConversation.customerAvatar" 
                    :alt="selectedConversation.customerName" 
                    @error="handleImageError"
                    loading="lazy"
                  >
                  <div class="status-dot" :class="{ online: selectedConversation.customerOnline }"></div>
                </div>
                <div class="chat-user-info">
                  <h3>{{ selectedConversation.customerName }}</h3>
                  <div class="chat-user-meta">
                    <span v-if="selectedConversation.customerOnline" class="online-status">Online</span>
                    <span v-else class="offline-status">Last seen {{ formatLastSeen(selectedConversation.lastSeen) }}</span>
                    <span v-if="selectedConversation.orderId" class="order-number">
                      Order #{{ selectedConversation.orderId }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="chat-actions">
                <button class="icon-button" @click="toggleCall">
                  <Phone size="18" />
                </button>
                <button class="icon-button" @click="toggleMoreOptions">
                  <MoreVertical size="18" />
                </button>
              </div>
            </div>
            
            <div class="chat-messages" ref="messagesContainer">
              <div v-if="loadingMessages" class="loading-messages">
                <div class="loading-spinner"></div>
                <p>Loading messages...</p>
              </div>
              
              <div v-else>
                <div class="date-separator">
                  <span>{{ currentDate }}</span>
                </div>
                
                <div 
                  v-for="(message, index) in chatMessages" 
                  :key="message.id || index"
                  class="chat-message"
                  :class="{ 
                    'outgoing': message.senderType === 'seller',
                    'incoming': message.senderType === 'customer'
                  }"
                >
                  <div v-if="message.senderType === 'system'" class="system-message">
                    {{ message.text }}
                  </div>
                  <template v-else>
                    <div class="message-bubble">
                      <p>{{ message.text }}</p>
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
                    </div>
                    <div class="message-time">
                      {{ formatMessageTime(message.timestamp) }}
                      <CheckCheck 
                        v-if="message.senderType === 'seller'" 
                        size="14" 
                        class="message-status" 
                        :class="{ 'read': message.read }" 
                      />
                    </div>
                  </template>
                </div>
              </div>
            </div>
            
            <div v-if="selectedConversation.isTyping" class="typing-indicator">
              <span class="dot"></span>
              <span class="dot"></span>
              <span class="dot"></span>
            </div>
            
            <div class="quick-replies" v-if="quickReplies.length > 0">
              <button 
                v-for="(reply, index) in quickReplies" 
                :key="index"
                class="quick-reply-button"
                @click="sendQuickReply(reply)"
              >
                {{ reply }}
              </button>
            </div>
            
            <div class="chat-input">
              <div class="input-actions">
                <button class="icon-button" @click="toggleAttachment">
                  <Paperclip size="18" />
                </button>
                <button class="icon-button" @click="toggleImageUpload">
                  <Image size="18" />
                </button>
                <button class="icon-button" @click="toggleProductTag">
                  <Tag size="18" />
                </button>
              </div>
              <div class="input-container">
                <textarea 
                  v-model="newMessage" 
                  placeholder="Type a message..." 
                  @keydown.enter.prevent="sendMessage"
                  @input="handleTyping"
                  rows="1"
                  ref="messageInput"
                ></textarea>
                <button 
                  class="send-button" 
                  @click="sendMessage" 
                  :disabled="!newMessage.trim() || sendingMessage"
                >
                  <Send size="18" />
                </button>
              </div>
            </div>
          </div>
          
          <div class="empty-chat" v-else v-show="!isMobile">
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
  import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
  import { 
    Filter, 
    Search, 
    MessageSquare, 
    Phone, 
    MoreVertical, 
    CheckCheck, 
    ShoppingBag, 
    Paperclip, 
    Image, 
    Tag, 
    Send
  } from 'lucide-vue-next';
  import Sidebar from '@/components/Sidebar.vue';
  import { db } from '@/firebase/firebaseConfig';
  import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    doc, 
    addDoc, 
    updateDoc, 
    serverTimestamp, 
  getDoc,
  writeBatch,
  setDoc,
  increment
  } from 'firebase/firestore';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  
  // Firebase auth
  const auth = getAuth();
  const sellerIdRef = ref(null);
  
  // State
  const activeTab = ref('all');
  const searchQuery = ref('');
  const selectedConversationId = ref(null);
  const selectedConversation = ref(null);
  const newMessage = ref('');
  const messagesContainer = ref(null);
  const messageInput = ref(null);
  const conversations = ref([]);
  const chatMessages = ref([]);
  const loadingConversations = ref(true);
  const loadingMessages = ref(false);
  const sendingMessage = ref(false);
  const showSearch = ref(false);
  const typingTimeout = ref(null);
  // Unsubscribe functions
  let conversationsUnsubscribe = null;
  let messagesUnsubscribe = null;
  let globalConversationsListener = null;
  let typingListener = null;
  let cacheInterval = null;
  const isMobile = ref(false);
  // responsive detector (module-scope so we can remove the listener on unmount)
  const updateIsMobile = () => {
    isMobile.value = window.innerWidth < 768;
    adjustChatOffset();
  };
  
  // Customer data cache to avoid redundant fetches
  const customerCache = new Map();
  
  // Helper function to get customer avatar with proper fallback
  const getCustomerAvatar = (customerData) => {
    // Priority order for avatar fields
    const avatarFields = [
      'profileImageUrl',
      'photoURL', 
      'avatar',
      'profilePicture',
      'imageUrl'
    ];
    
    for (const field of avatarFields) {
      const imageValue = customerData[field];
      if (imageValue && typeof imageValue === 'string' && imageValue.trim() !== '') {
        console.log(`Using customer avatar from ${field}:`, imageValue.trim());
        return imageValue.trim();
      }
    }
    
    console.log('No custom avatar found, using default for customer:', customerData);
    // Default fallback avatar - Generic user silhouette
    return "data:image/svg+xml;base64," + btoa(`
      <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#e5e7eb"/>
        <circle cx="75" cy="60" r="25" fill="#9ca3af"/>
        <ellipse cx="75" cy="130" rx="40" ry="30" fill="#9ca3af"/>
      </svg>
    `);
  };
  
  // Handle image loading errors
  const handleImageError = (event) => {
    console.warn('Failed to load customer avatar:', event.target.src);
    // Set to fallback avatar - Generic user silhouette
    event.target.src = "data:image/svg+xml;base64," + btoa(`
      <svg width="150" height="150" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
        <circle cx="75" cy="75" r="75" fill="#e5e7eb"/>
        <circle cx="75" cy="60" r="25" fill="#9ca3af"/>
        <ellipse cx="75" cy="130" rx="40" ry="30" fill="#9ca3af"/>
      </svg>
    `);
    // Prevent infinite error loops
    event.target.onerror = null;
  };
  
  // Tabs - make reactive
  const tabs = ref([
    { id: 'all', name: 'All', count: 0 },
    { id: 'unread', name: 'Unread', count: 0 },
    { id: 'orders', name: 'Orders', count: 0 },
    { id: 'support', name: 'Support', count: 0 }
  ]);
  
  // Quick replies
  const quickReplies = [
    "Yes, we have that in stock!",
    "We can deliver tomorrow",
    "Thank you for your order!",
    "How can I help you today?"
  ];
  
  // Current date for the chat
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
    // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    // Handle different timestamp types
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      return '';
    }
    
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
    
    // Handle different timestamp types
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      return '';
    }
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
    // Format last seen
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'recently';
    
    // Handle different timestamp types
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
      // Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // JavaScript Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Unix timestamp
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // ISO string
      date = new Date(timestamp);
    } else {
      return 'recently';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Filtered conversations based on active tab and search query
  const filteredConversations = computed(() => {
    let filtered = conversations.value;
    
    // Filter by tab
    if (activeTab.value !== 'all') {
      if (activeTab.value === 'unread') {
        filtered = filtered.filter(conv => conv.hasUnread);
      } else if (activeTab.value === 'orders') {
        filtered = filtered.filter(conv => conv.orderId);
      } else if (activeTab.value === 'support') {
        filtered = filtered.filter(conv => conv.isSupport);
      }
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(conv => 
        conv.customerName.toLowerCase().includes(query) || 
        conv.lastMessage.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
  // Fetch conversations for the seller
  const fetchConversations = () => {
    if (!sellerIdRef.value) return;
    console.log('Starting to fetch conversations for seller:', sellerIdRef.value);
    
    const q = query(
      collection(db, 'conversations'),
  where('participants', 'array-contains', sellerIdRef.value),
      orderBy('lastMessageTime', 'desc')
    );
    
    conversationsUnsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Conversations snapshot received, documents:', snapshot.docs.length);
      
      if (snapshot.docs.length === 0) {
        conversations.value = [];
        loadingConversations.value = false;
        updateTabCounts();
        return;
      }

      // Get all unique customer IDs first
      const customerIds = [...new Set(snapshot.docs.map(doc => {
        const data = doc.data();
        return data.participants.find(id => id !== sellerIdRef.value);
      }))];

      console.log('Fetching data for customers:', customerIds);      // Batch fetch all customer data
      const customerDataMap = new Map();
      
      try {
        // Use Promise.all to fetch all customer data in parallel
        const customerPromises = customerIds.map(async (customerId) => {
          try {
            // Check cache first
            if (customerCache.has(customerId)) {
              customerDataMap.set(customerId, customerCache.get(customerId));
              return;
            }
            
            const customerDoc = await getDoc(doc(db, 'users', customerId));
            if (customerDoc.exists()) {
              const customerData = customerDoc.data();
              customerCache.set(customerId, customerData); // Cache the data
              customerDataMap.set(customerId, customerData);
            } else {
              const emptyData = {};
              customerCache.set(customerId, emptyData);
              customerDataMap.set(customerId, emptyData);
            }
          } catch (error) {
            console.error(`Error fetching customer ${customerId}:`, error);
            const errorData = {};
            customerCache.set(customerId, errorData);
            customerDataMap.set(customerId, errorData);
          }
        });

        await Promise.all(customerPromises);
        console.log('Customer data fetched for', customerDataMap.size, 'customers');

      } catch (error) {
        console.error("Error in batch customer fetch:", error);
      }

      // Now build conversations with cached customer data
      const convs = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
  const customerId = data.participants.find(id => id !== sellerIdRef.value);
        const customerData = customerDataMap.get(customerId) || {};
        
        const fullName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
        
        return {
          id: docSnapshot.id,
          customerId: customerId,
          customerName: fullName || 'Customer',
          customerAvatar: getCustomerAvatar(customerData),
          customerOnline: customerData.isOnline || false,
          lastMessage: data.lastMessage || '',
          lastMessageTime: data.lastMessageTime,
          lastMessageSender: data.lastMessageSender,
          unreadCount: (data.lastMessageSender === 'customer') ? (data.unreadCount || 0) : 0,
          hasUnread: (data.lastMessageSender === 'customer') && (data.unreadCount > 0),
          type: 'customer',
          lastSeen: customerData.lastSeen,
          orderId: data.orderId || null,
          isSupport: data.type === 'support' || false
        };
      });
      
      conversations.value = convs;
      loadingConversations.value = false;
      
      console.log('Conversations loaded:', convs.length);
      
      // Update tab counts
      updateTabCounts();
    }, (error) => {
      console.error("Error fetching conversations:", error);
      loadingConversations.value = false;
    });
  };
    // Update tab counts based on conversations
  const updateTabCounts = () => {
    const unreadCount = conversations.value.filter(conv => conv.hasUnread).length;
    const ordersCount = conversations.value.filter(conv => conv.orderId).length;
    const supportCount = conversations.value.filter(conv => conv.isSupport).length;
    
    tabs.value.forEach(tab => {
      if (tab.id === 'unread') {
        tab.count = unreadCount;
      } else if (tab.id === 'orders') {
        tab.count = ordersCount;
      } else if (tab.id === 'support') {
        tab.count = supportCount;
      } else {
        tab.count = conversations.value.length;
      }
    });
  };
    // Select conversation and mark as read
  const selectConversation = async (conversation) => {
    selectedConversationId.value = conversation.id;
    
    // Ensure we have all customer data before setting as selected
    let customerData = {};
    try {
      const customerDoc = await getDoc(doc(db, 'users', conversation.customerId));
      if (customerDoc.exists()) {
        customerData = customerDoc.data();
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
    
    const fullName = `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim();
    
    selectedConversation.value = {
      ...conversation,
      customerName: fullName || 'Customer',
      customerAvatar: getCustomerAvatar(customerData),
      customerOnline: customerData.isOnline || false,
      lastSeen: customerData.lastSeen
    };
    
    // Mark as read if the last message was from customer
    if (conversation.lastMessageSender === 'customer' && conversation.unreadCount > 0) {
      await updateDoc(doc(db, 'conversations', conversation.id), {
        unreadCount: 0,
        lastMessageSeen: serverTimestamp()
      });
      
      // Update local conversation state
      const convIndex = conversations.value.findIndex(c => c.id === conversation.id);
      if (convIndex !== -1) {
        conversations.value[convIndex].unreadCount = 0;
        conversations.value[convIndex].hasUnread = false;
      }
    }
    
    // Load messages for this conversation
    loadMessages(conversation.id);
    
    // Set up typing indicator listener
    setupTypingListener(conversation.id);
  };
  
  // Load messages for a conversation
  const loadMessages = (conversationId) => {
    loadingMessages.value = true;
    
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }
    
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    messagesUnsubscribe = onSnapshot(q, (snapshot) => {
      chatMessages.value = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          senderType: data.senderId === sellerIdRef.value ? 'seller' : 'customer'
        };
      });
      
      // Mark messages as read when loaded
      if (snapshot.docs.length > 0) {
        const unreadMessages = snapshot.docs
          .filter(doc => doc.data().senderId !== sellerIdRef.value && !doc.data().read);
        
        if (unreadMessages.length > 0) {
          const batch = writeBatch(db);
          unreadMessages.forEach(msg => {
            const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
            batch.update(msgRef, { read: true });
          });
          batch.commit();
        }
      }
      
      loadingMessages.value = false;
      scrollToBottom();
    });
  };
    // Set up typing indicator listener
  const setupTypingListener = (conversationId) => {
    if (typingListener) {
      typingListener();
    }
    
    const typingRef = doc(db, 'conversations', conversationId, 'typing', 'status');
    typingListener = onSnapshot(typingRef, (doc) => {
      if (doc.exists() && doc.data().customerTyping && selectedConversation.value) {
        selectedConversation.value.isTyping = true;
      } else if (selectedConversation.value) {
        selectedConversation.value.isTyping = false;
      }
    });
  };
  
  // Handle typing indicator
  const handleTyping = () => {
  if (!selectedConversationId.value) return;
    
    // Clear existing timeout
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value);
    }
    
    // Set new timeout
    typingTimeout.value = setTimeout(() => {
      updateTypingStatus(false);
    }, 3000);
    
    // Update typing status
    updateTypingStatus(true);
  };
  
  // Update typing status
  const updateTypingStatus = async (isTyping) => {
    if (!selectedConversationId.value) return;
    
    try {
      await setDoc(
        doc(db, 'conversations', selectedConversationId.value, 'typing', 'status'),
        {
          sellerTyping: isTyping,
          timestamp: serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };
    // Send a message
  const sendMessage = async () => {
    if (!newMessage.value.trim() || !selectedConversationId.value || sendingMessage.value) return;
    
    sendingMessage.value = true;
    const message = {
  senderId: sellerIdRef.value,
      senderType: 'seller',
      text: newMessage.value,
      timestamp: serverTimestamp(),
      read: false
    };
    
    try {
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
        unreadCount: increment(1) // Customer has unread message
      });
      
      // Clear typing status
      await updateTypingStatus(false);
      
      newMessage.value = '';
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      sendingMessage.value = false;
    }
  };
  
  // Send a quick reply
  const sendQuickReply = (reply) => {
    newMessage.value = reply;
    sendMessage();
  };
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  };
  
  // Auto-resize textarea
  const resizeTextarea = () => {
    if (messageInput.value) {
      messageInput.value.style.height = 'auto';
      messageInput.value.style.height = messageInput.value.scrollHeight + 'px';
    }
  };
  
  // Toggle search
  const toggleSearch = () => {
    showSearch.value = !showSearch.value;
    if (!showSearch.value) {
      searchQuery.value = '';
    }
  };
  
  // Close search
  const closeSearch = () => {
    showSearch.value = false;
    searchQuery.value = '';
  };
    // Handle search
  const handleSearch = () => {
    // Search is handled by the computed property filteredConversations
    console.log('Search query:', searchQuery.value);
    console.log('Filtered conversations:', filteredConversations.value);
  };
  
  // Toggle filter
  const toggleFilter = () => {
    // Implement filter functionality
  };
  
  // Toggle call
  const toggleCall = () => {
    // Implement call functionality
  };
  
  // Toggle more options
  const toggleMoreOptions = () => {
    // Implement more options functionality
  };
  
  // Toggle attachment
  const toggleAttachment = () => {
    // Implement attachment functionality
  };
  
  // Toggle image upload
  const toggleImageUpload = () => {
    // Implement image upload functionality
  };
  
  // Toggle product tag
  const toggleProductTag = () => {
    // Implement product tag functionality
  };
  
  // Watch for changes to newMessage to resize textarea
  watch(newMessage, () => {
    resizeTextarea();
  });
  
  // Initialize on mount
  onMounted(() => {
    // responsive detector
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    // Wait for auth to be ready
    const init = () => {
      if (!auth.currentUser) return;
      sellerIdRef.value = auth.currentUser.uid;
      fetchConversations();

      // Global listener for new messages in any conversation
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', sellerIdRef.value)
      );
      globalConversationsListener = onSnapshot(conversationsQuery, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const conversation = change.doc.data();
            if (conversation.lastMessageSender === 'customer' && 
                conversation.unreadCount > 0 &&
                change.doc.id !== selectedConversationId.value) {
              console.log('New message in conversation:', change.doc.id);
            }
          }
        });
      });

      // Listen to sidebar state to adjust layout
      window.addEventListener('sidebar:toggled', handleSidebarToggle);
      window.addEventListener('sidebar:state', handleSidebarToggle);

      // Apply initial offset based on current sidebar state
      adjustChatOffset();
    };

  if (auth.currentUser) init();
  else onAuthStateChanged(auth, () => init());

    scrollToBottom();
  });
  
  // Clean up on unmount  onUnmounted(() => {  // Clean up on unmount
  onUnmounted(() => {
    if (conversationsUnsubscribe) {
      conversationsUnsubscribe();
    }
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }
    if (globalConversationsListener) {
      globalConversationsListener();
    }
    if (typingListener) {
      typingListener();
    }
    if (typingTimeout.value) {
      clearTimeout(typingTimeout.value);
    }
    if (cacheInterval) {
      clearInterval(cacheInterval);
    }
  window.removeEventListener('sidebar:toggled', handleSidebarToggle);
  window.removeEventListener('sidebar:state', handleSidebarToggle);
    // remove resize listener
    window.removeEventListener('resize', updateIsMobile);
    customerCache.clear();
  });
  
  // Cache management functions
  const clearCustomerCache = () => {
    customerCache.clear();
    console.log('Customer cache cleared');
  };
  
  // Clear cache every 5 minutes to ensure data freshness
  cacheInterval = setInterval(() => {
    clearCustomerCache();
  }, 5 * 60 * 1000); // 5 minutes

  // --- Layout helpers to close responsiveness gap with sidebar ---
  const chatContainerEl = ref(null);
  const adjustChatOffset = () => {
    // Default sidebar width 250px on desktop (collapsible to 70px)
    const isMobile = window.innerWidth < 768;
    const collapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const left = isMobile ? 0 : (collapsed ? 70 : 250);
    const el = chatContainerEl.value || document.querySelector('.chat-container');
    if (el) {
      el.style.marginLeft = left + 'px';
    }
  };

  const handleSidebarToggle = (e) => {
    adjustChatOffset();
  };

  // Mobile helpers
  const backToList = () => {
    // Unsubscribe from messages and typing when leaving chat on mobile
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
      messagesUnsubscribe = null;
    }
    if (typingListener) {
      typingListener();
      typingListener = null;
    }
    selectedConversationId.value = null;
    selectedConversation.value = null;
    chatMessages.value = [];
  };
  </script>
  
  <style scoped>
  :root {
    /* Fallback height for the global top app bar */
    --topbar-height: 56px;
  }
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
  margin-left: 250px; /* Match sidebar width (desktop) */
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
    width: 350px;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    background-color: white;
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
    padding: 0;
  }
    .conversation-item {
    display: flex;
    padding: 15px 12px;
    border-radius: 0;
    margin-bottom: 0;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: white;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .conversation-item:hover {
    background-color: #f8f9fa;
  }
  
  .conversation-item.active {
    background-color: #e8f3e8;
    border-left: 3px solid #2e5c31;
  }
    .conversation-avatar {
    position: relative;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 15px;
    flex-shrink: 0;
  }
  
  .conversation-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .status-dot {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 12px;
    height: 12px;
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
    align-items: center;
    margin-bottom: 5px;
  }
  
  .conversation-header h3 {
    font-size: 16px;
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
    margin-left: 10px;
  }
  
  .conversation-preview {
    font-size: 14px;
    color: #666;
    margin: 0 0 5px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
    .conversation-meta {
    display: flex;
    gap: 8px;
    align-items: center;
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
  
  .typing-indicator {
    color: #4CAF50;
    font-size: 12px;
    font-style: italic;
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
    font-size: 12px;
    min-width: 20px;
    height: 20px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    font-weight: 600;
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

  .back-button {
    border: none;
    background: #f5f5f5;
    color: #333;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: none; /* hidden by default, shown on mobile via media query */
    align-items: center;
    justify-content: center;
    margin-right: 8px;
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
  
  /* Dark mode support */
  :root.dark .chat-container {
    background-color: #1a1a1a;
  }
  
  :root.dark .header,
  :root.dark .chat-header {
    background-color: #222;
    border-color: #333;
  }
  
  :root.dark .header h1,
  :root.dark .chat-user-info h3 {
    color: #fff;
  }
  
  :root.dark .action-button,
  :root.dark .icon-button {
    background-color: #333;
    color: #ccc;
  }
  
  :root.dark .action-button:hover,
  :root.dark .icon-button:hover {
    background-color: #444;
  }
  
  :root.dark .conversations-panel {
    background-color: #222;
    border-color: #333;
  }
  
  :root.dark .panel-header {
    border-color: #333;
  }
  
  :root.dark .panel-header h2 {
    color: #fff;
  }
  
  :root.dark .tab-button {
    color: #ccc;
  }
  
  :root.dark .tab-button:not(.active) .tab-count {
    background-color: #444;
    color: #ccc;
  }
  
  :root.dark .search-box input {
    background-color: #333;
    border-color: #444;
    color: #fff;
  }
  
  :root.dark .conversation-item {
    background-color: #2a2a2a;
  }
  
  :root.dark .conversation-item:hover {
    background-color: #333;
  }
  
  :root.dark .conversation-item.active {
    background-color: #2e3c2f;
    border-color: #4a8f4d;
  }
  
  :root.dark .conversation-header h3 {
    color: #fff;
  }
  
  :root.dark .conversation-preview {
    color: #ccc;
  }
  
  :root.dark .order-badge {
    background-color: #2e3c2f;
    color: #8bc34a;
  }
  
  :root.dark .product-badge {
    background-color: #333;
    color: #ccc;
  }
  
  :root.dark .chat-messages {
    background-color: #1a1a1a;
  }
  
  :root.dark .date-separator span {
    background-color: #333;
    color: #ccc;
  }
  
  :root.dark .system-message {
    background-color: #333;
    color: #ccc;
  }
  
  :root.dark .message-bubble {
    background-color: #2a2a2a;
    color: #eee;
  }
  
  :root.dark .chat-message.outgoing .message-bubble {
    background-color: #2e3c2f;
    color: #eee;
  }
  
  :root.dark .product-preview,
  :root.dark .order-preview {
    background-color: #333;
  }
  
  :root.dark .quick-reply-button {
    background-color: #333;
    color: #ccc;
  }
  
  :root.dark .quick-reply-button:hover {
    background-color: #444;
  }
  
  :root.dark .input-container {
    background-color: #333;
  }
  
  :root.dark .input-container textarea {
    color: #fff;
  }
  
  :root.dark .empty-chat {
    background-color: #1a1a1a;
  }
  
  :root.dark .empty-chat-content h2 {
    color: #ccc;
  }
  
  /* Add new styles for typing indicator */
  .typing-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }
  
  .typing-indicator .dot {
    width: 4px;
    height: 4px;
    background-color: #666;
    border-radius: 50%;
    animation: typing 1s infinite ease-in-out;
  }
  
  .typing-indicator .dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  .typing-indicator .dot:nth-child(3) {
    animation-delay: 0.4s;
  }
  
  @keyframes typing {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-4px);
    }
  }
  
  /* Add styles for loading states */
  .loading-spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #2e5c31;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 10px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .loading-state,
  .loading-messages {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    color: #666;
  }
  
  /* Add styles for search */
  .close-search {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: 20px;
    color: #666;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  .close-search:hover {
    background-color: #f0f0f0;
  }
  
  /* Dark mode support for new elements */
  :root.dark .typing-indicator {
    color: #ccc;
  }
  
  :root.dark .typing-indicator .dot {
    background-color: #ccc;
  }
  
  :root.dark .loading-spinner {
    border-color: #333;
    border-top-color: #4a8f4d;
  }
  
  :root.dark .close-search {
    color: #ccc;
  }
  
  :root.dark .close-search:hover {
    background-color: #333;
  }
  
  /* Loading skeleton styles */
  .loading-skeleton {
    padding: 20px;
  }
  
  .skeleton-conversation {
    display: flex;
    align-items: center;
    padding: 15px;
    margin-bottom: 10px;
    border-radius: 12px;
    background: #f8f9fa;
  }
  
  .skeleton-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(90deg, #e2e5e7 25%, #f0f0f0 50%, #e2e5e7 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    margin-right: 15px;
  }
  
  .skeleton-content {
    flex: 1;
  }
  
  .skeleton-name {
    height: 16px;
    width: 120px;
    background: linear-gradient(90deg, #e2e5e7 25%, #f0f0f0 50%, #e2e5e7 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  
  .skeleton-message {
    height: 14px;
    width: 200px;
    background: linear-gradient(90deg, #e2e5e7 25%, #f0f0f0 50%, #e2e5e7 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
  }
  
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Mobile-first responsive adjustments */
  @media (max-width: 767.98px) {
    .chat-container {
  margin-left: 0 !important;
  height: 100dvh;
  /* Push content below the fixed green app bar */
  padding-top: calc(var(--topbar-height, 56px) + env(safe-area-inset-top));
    }
    .header {
      display: none; /* Hide secondary header to reclaim space */
    }
    .content {
  flex-direction: column;
  /* keep a small gutter; top space now comes from container padding */
  padding: 6px 8px 0;
      box-sizing: border-box;
    }
    .conversations-panel {
      width: 100%;
      height: 100dvh;
      border-right: none;
    }
    .chat-panel {
      width: 100%;
      height: 100dvh;
      padding: 6px 8px 0; /* match gutters with list view */
      box-sizing: border-box;
    }
    .chat-header {
      position: sticky;
  /* header stays below the app bar when sticking */
  top: env(safe-area-inset-top);
      z-index: 2;
      padding-left: 12px;
      padding-right: 12px;
    }
    .back-button {
      display: inline-flex;
    }
    .chat-user-info h3 { font-size: 15px; }
    .chat-messages {
      padding: 16px 12px 12px; /* nudge content slightly down */
      gap: 10px;
    }
    .chat-input {
      padding: 10px 12px;
      padding-bottom: calc(10px + env(safe-area-inset-bottom));
    }
    .input-container {
      border-radius: 14px;
      padding: 8px 12px;
    }
    .conversation-item { padding: 12px; }
    .conversation-avatar { width: 44px; height: 44px; }
    .conversation-preview { max-width: none; }
  }
  </style>