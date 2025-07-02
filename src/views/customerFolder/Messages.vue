<template>
  <div class="messages-page">
    <div class="header">
      <button class="back-button" @click="$emit('navigate', 'HomePage')">
        <ChevronLeft size="22" />
      </button>
      <h1>Messages</h1>
      <div class="header-buttons">
        <button class="icon-button" @click="toggleSearch">
          <Search size="18" />
        </button>
        
      </div>
    </div>

    <!-- Search Bar -->
    <div v-if="showSearch" class="search-container">
      <div class="search-box">
        <Search size="16" class="search-icon" />
        <input
          type="text"
          placeholder="Search sellers or farms..."
          v-model="searchQuery"
          @input="handleSearch"
        />
        <button class="close-search" @click="closeSearch">×</button>
      </div>
      <div v-if="searchResults.length > 0" class="search-results">
        <div
          v-for="result in searchResults"
          :key="result.id"
          class="search-result-item"
          @click="startNewChat(result)"
        >
          <img :src="result.photoURL" alt="" class="result-avatar" />
          <div class="result-info">
            <h4>{{ result.firstName }} {{ result.lastName }}</h4>
            <p v-if="result.farmName">{{ result.farmName }}</p>
            <p v-else-if="result.accountName" class="account-name">{{ result.accountName }}</p>
            <span v-if="result.isRecent" class="recent-tag">Recent</span>
          </div>
        </div>
      </div>
      <div v-else-if="searchQuery && !searching" class="no-results">
        No sellers or farms found matching "{{ searchQuery }}"
      </div>
      <div v-if="searching" class="searching-state">
        Searching...
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

      <div v-if="loadingConversations" class="loading-state">
        <p>Loading conversations...</p>
      </div>

      <div v-else-if="filteredConversations.length === 0" class="empty-state">
        <div class="empty-icon">
          <MessageCircle size="60" />
        </div>
        <h2>No messages yet</h2>
        <p>Your conversations with farmers and support will appear here</p>
      </div>

      <div v-else class="messages-list">
        <div
          class="message-item"
          v-for="conversation in filteredConversations"
          :key="conversation.id"
          @click="openChat(conversation)"
        >
          <div class="message-avatar">
            <img :src="conversation.sellerPhoto" :alt="conversation.sellerName" />
            <div class="status-dot" :class="{ online: conversation.sellerOnline }"></div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <h3>{{ conversation.sellerName }}</h3>
              <span class="message-time">{{ formatConversationTime(conversation.lastMessageTime) }}</span>
            </div>
            <p class="message-preview">{{ conversation.lastMessage }}</p>
            <p v-if="conversation.sellerFarm" class="farm-name">{{ conversation.sellerFarm }}</p>
          </div>
          <div class="message-indicators">
            <div v-if="conversation.unreadCount > 0" class="unread-badge">
              {{ conversation.unreadCount }}
            </div>
            <CheckCheck
              v-if="!conversation.unreadCount && conversation.lastMessageSender === 'customer'"
              size="16"
              class="read-indicator"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedConversation" class="chat-window">
      <div class="chat-header">
        <button class="back-button" @click="closeChat">
          <ChevronLeft size="22" />
        </button>
        <div class="chat-user">
          <div class="chat-avatar">
            <img :src="selectedConversation.otherUserPhoto" :alt="selectedConversation.otherUserName" />
            <div class="status-dot" :class="{ online: selectedConversation.otherUserOnline }"></div>
          </div>
          <div>
            <h3>{{ selectedConversation.otherUserName }}</h3>
            <p v-if="selectedConversation.otherUserOnline">Online</p>
            <p v-else>Offline</p>
          </div>
        </div>
      </div>
      
      <div class="chat-messages" ref="messagesContainer">
        <div 
          v-for="(message, index) in chatMessages" 
          :key="message.id || index" 
          class="chat-message"
          :class="{ 'outgoing': message.senderId === currentUserId }"
        >
          <div class="message-bubble">
            {{ message.text }}
          </div>
          <div class="message-time">
            {{ formatMessageTime(message.timestamp) }}
            <CheckCheck 
              v-if="message.senderId === currentUserId" 
              size="12" 
              class="message-status" 
              :class="{ 'read': message.read }" 
            />
          </div>
        </div>
      </div>
      
      <div class="chat-input">
        <input 
          type="text" 
          placeholder="Type a message..." 
          v-model="newMessage"
          @keyup.enter="sendMessage"
          :disabled="sendingMessage"
        >
        <button class="send-button" @click="sendMessage" :disabled="!newMessage.trim() || sendingMessage">
          <Send size="18" />
        </button>
      </div>
    </div>

    <div v-if="showNotification" class="notification">
      <Bell size="20" />
      <span>{{ notificationMessage }}</span>
    </div>
  </div>
</template>

<script>
import { 
  ChevronLeft, 
  Search, 
  MessageCircle, 
  CheckCheck, 
  MoreVertical,
  Paperclip,
  Send,
  Bell
} from "lucide-vue-next";
import { 
  ref, 
  computed, 
  onMounted, 
  onUnmounted, 
  nextTick 
} from "vue";
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
  setDoc,
  getDocs
} from "firebase/firestore";
import { db, auth } from "@/firebase/firebaseConfig";

export default {
  name: 'MessagesPage',
  components: {
    ChevronLeft,
    Search,
    MessageCircle,
    CheckCheck,
    MoreVertical,
    Paperclip,
    Send,
    Bell
  },
  setup() {
    const activeTab = ref("all");
    const selectedConversation = ref(null);
    const newMessage = ref("");
    const chatMessages = ref([]);
    const conversations = ref([]);
    const loadingConversations = ref(true);
    const sendingMessage = ref(false);
    const messagesContainer = ref(null);
    
    // Search related state
    const showSearch = ref(false);
    const searchQuery = ref("");
    const searchResults = ref([]);
    const searching = ref(false);
    
    const currentUserId = auth.currentUser?.uid;
    const currentUserPhoto = auth.currentUser?.photoURL || "https://randomuser.me/api/portraits/men/32.jpg";
    
    let conversationsUnsubscribe = null;
    let messagesUnsubscribe = null;

    // Add notification state
    const notifications = ref([]);
    const showNotification = ref(false);
    const notificationMessage = ref('');

    const filteredConversations = computed(() => {
      return conversations.value.filter(conv => {
        if (activeTab.value === "all") return true;
        if (activeTab.value === "farmers") return conv.type === "farmer";
        if (activeTab.value === "support") return conv.type === "support";
        return true;
      });
    });    const formatConversationTime = (timestamp) => {
      if (!timestamp) return "No messages";
      
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
        return "No messages";
      }
      
      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (diffInDays === 1) {
        return "Yesterday";
      } else if (diffInDays < 7) {
        return date.toLocaleDateString([], { weekday: "short" });
      } else {
        return date.toLocaleDateString([], { month: "short", day: "numeric" });
      }
    };    const formatMessageTime = (timestamp) => {
      if (!timestamp) return "";
      
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
        return "";
      }
      
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    const fetchConversations = () => {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId),
        orderBy("lastMessageTime", "desc")
      );
      
      conversationsUnsubscribe = onSnapshot(q, async (snapshot) => {        if (snapshot.docs.length === 0) {
          conversations.value = [];
          loadingConversations.value = false;
          return;
        }

        // Get all unique seller IDs first
        const sellerIds = [...new Set(snapshot.docs.map(doc => {
          const data = doc.data();
          return data.participants.find(id => id !== currentUserId);
        }))];

        console.log('Fetching data for sellers:', sellerIds);

        // Batch fetch all seller data
        const sellerDataMap = new Map();
        
        try {
          // Use Promise.all to fetch all seller data in parallel
          const sellerPromises = sellerIds.map(async (sellerId) => {
            try {
              // Fetch both user and seller data in parallel
              const [userDoc, sellerDoc] = await Promise.all([
                getDoc(doc(db, "users", sellerId)),
                getDoc(doc(db, "sellers", sellerId))
              ]);
              
              let sellerData = {};
              if (userDoc.exists()) {
                sellerData = userDoc.data();
              }
              
              if (sellerDoc.exists()) {
                const additionalSellerData = sellerDoc.data();
                sellerData = { ...sellerData, ...additionalSellerData };
              }
              
              sellerDataMap.set(sellerId, sellerData);
            } catch (error) {
              console.error(`Error fetching seller ${sellerId}:`, error);
              sellerDataMap.set(sellerId, {});
            }
          });

          await Promise.all(sellerPromises);
          console.log('Seller data fetched for', sellerDataMap.size, 'sellers');

        } catch (error) {
          console.error("Error in batch seller fetch:", error);
        }

        // Now build conversations with cached seller data
        const convs = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const sellerId = data.participants.find(id => id !== currentUserId);
          const sellerData = sellerDataMap.get(sellerId) || {};
          
          const fullName = `${sellerData.firstName || ''} ${sellerData.lastName || ''}`.trim();
          const farmName = sellerData.farmName || '';
          
          return {
            id: docSnapshot.id,
            conversationId: docSnapshot.id,
            sellerId,
            sellerName: fullName || 'Seller',
            sellerFarm: farmName,
            sellerPhoto: sellerData.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
            sellerOnline: sellerData.isOnline || false,
            lastMessage: data.lastMessage || 'No messages yet',
            lastMessageTime: data.lastMessageTime,
            lastMessageSender: data.lastMessageSender,
            unreadCount: (data.lastMessageSender === 'seller') ? (data.unreadCount || 0) : 0,
            type: data.type || "farmer"
          };
        });
        
        conversations.value = convs;
        loadingConversations.value = false;
        
        console.log("Loaded conversations:", convs);
      });
    };

    const openChat = async (conversation) => {
      selectedConversation.value = {
        ...conversation,
        otherUserId: conversation.sellerId,
        otherUserName: conversation.sellerName,
        otherUserPhoto: conversation.sellerPhoto,
        otherUserOnline: conversation.sellerOnline
      };
      
      // Mark as read if needed
      if (conversation.unreadCount > 0 && conversation.lastMessageSender !== "customer") {
        await updateDoc(doc(db, "conversations", conversation.id), {
          unreadCount: 0
        });
      }
      
      // Load messages
      loadMessages(conversation.id);
    };

    const loadMessages = (conversationId) => {
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
      
      const q = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("timestamp", "asc")
      );
      
      messagesUnsubscribe = onSnapshot(q, (snapshot) => {
        chatMessages.value = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        scrollToBottom();
      });
    };

    const closeChat = () => {
      selectedConversation.value = null;
      chatMessages.value = [];
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value || sendingMessage.value) return;
      
      sendingMessage.value = true;
      const message = {
        senderId: currentUserId,
        text: newMessage.value,
        timestamp: serverTimestamp(),
        read: false
      };
      
      try {
        // Add message to Firestore
        await addDoc(
          collection(db, "conversations", selectedConversation.value.id, "messages"),
          message
        );
        
        // Update conversation last message
        await updateDoc(doc(db, "conversations", selectedConversation.value.id), {
          lastMessage: newMessage.value,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: "customer",
          unreadCount: 1 // Seller has unread message
        });
        
        newMessage.value = "";
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        sendingMessage.value = false;
      }
    };

    // Function to get recent sellers the customer has interacted with
    const getRecentSellers = async () => {
      try {
        const conversationsQuery = query(
          collection(db, "conversations"),
          where("participants", "array-contains", currentUserId),
          orderBy("lastMessageTime", "desc")
        );
        
        const snapshot = await getDocs(conversationsQuery);
        const recentSellerIds = new Set();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const sellerId = data.participants.find(id => id !== currentUserId);
          if (sellerId) {
            recentSellerIds.add(sellerId);
          }
        });
        
        return Array.from(recentSellerIds).slice(0, 5);
      } catch (error) {
        console.error("Error fetching recent sellers:", error);
        return [];
      }
    };

    // Function to show contact suggestions in search
    const showRecentSellers = async () => {
      if (searchQuery.value) return;
      
      const recentSellerIds = await getRecentSellers();
      const suggestions = [];
      
      for (const sellerId of recentSellerIds) {
        try {
          const userDoc = await getDoc(doc(db, "users", sellerId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
            const sellerData = sellerDoc.exists() ? sellerDoc.data() : {};
            
            suggestions.push({
              id: sellerId,
              userId: sellerId,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              photoURL: userData.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
              farmName: sellerData.farmName || '',
              accountName: sellerData.accountName || '',
              isOnline: userData.isOnline || false,
              isRecent: true
            });
          }
        } catch (error) {
          console.error("Error fetching seller details:", error);
        }
      }
      
      searchResults.value = suggestions;
    };

    const toggleSearch = () => {
      showSearch.value = !showSearch.value;
      if (!showSearch.value) {
        searchQuery.value = "";
        searchResults.value = [];
      } else {
        // Show recent sellers when search is opened
        showRecentSellers();
      }
    };

    const closeSearch = () => {
      showSearch.value = false;
      searchQuery.value = "";
      searchResults.value = [];
    };

    const handleSearch = async () => {
      if (!searchQuery.value.trim()) {
        showRecentSellers();
        return;
      }

      searching.value = true;
      const queryText = searchQuery.value.toLowerCase();

      try {
        // Get all users with role 'seller'
        const usersQuery = query(
          collection(db, "users"),
          where("role", "==", "seller")
        );
        const usersSnapshot = await getDocs(usersQuery);
        
        const results = [];
        
        for (const userDoc of usersSnapshot.docs) {
          const userData = userDoc.data();
          const userId = userDoc.id;
          
          // Create searchable name combinations
          const firstName = (userData.firstName || '').toLowerCase();
          const lastName = (userData.lastName || '').toLowerCase();
          const fullName = `${firstName} ${lastName}`.trim();
          
          // Check name matches (partial matches included)
          const nameMatches = 
            firstName.includes(queryText) ||
            lastName.includes(queryText) ||
            fullName.includes(queryText);
          
          // Get seller data from sellers collection
          let sellerData = {};
          try {
            const sellerDoc = await getDoc(doc(db, "sellers", userId));
            if (sellerDoc.exists()) {
              sellerData = sellerDoc.data();
            }
          } catch (error) {
            console.error("Error fetching seller data:", error);
          }
          
          // Check farm/account matches
          const farmName = (sellerData.farmName || '').toLowerCase();
          const accountName = (sellerData.accountName || '').toLowerCase();
          
          const sellerMatches = 
            farmName.includes(queryText) || 
            accountName.includes(queryText);
          
          if (nameMatches || sellerMatches) {
            results.push({
              id: userId,
              userId: userId,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              photoURL: userData.photoURL || "https://randomuser.me/api/portraits/lego/1.jpg",
              farmName: sellerData.farmName || '',
              accountName: sellerData.accountName || '',
              isOnline: userData.isOnline || false,
            });
          }
        }
        
        searchResults.value = results;
        console.log("Search query:", queryText);
        console.log("Search results:", results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        searching.value = false;
      }
    };

    const startNewChat = async (seller) => {
      // Check if conversation already exists using sellerId
      const existingConv = conversations.value.find(
        (conv) => conv.sellerId === seller.userId
      );
      
      if (existingConv) {
        openChat(existingConv);
        closeSearch();
        return;
      }
      
      // Create new conversation using seller's userId
      const conversationId = `${currentUserId}_${seller.userId}`;
      
      try {
        // Create conversation document
        await setDoc(doc(db, "conversations", conversationId), {
          participants: [currentUserId, seller.userId],
          lastMessage: "",
          lastMessageTime: serverTimestamp(),
          lastMessageSender: "",
          unreadCount: 0,
          type: "farmer",
          createdAt: serverTimestamp(),
        });
          // Add to local conversations
        const newConversation = {
          id: conversationId,
          conversationId,
          sellerId: seller.userId,
          sellerName: `${seller.firstName} ${seller.lastName}`.trim(),
          sellerFarm: seller.farmName,
          sellerPhoto: seller.photoURL,
          sellerOnline: seller.isOnline,
          lastMessage: "",
          lastMessageTime: null, // Set to null initially instead of new Date()
          lastMessageSender: "",
          unreadCount: 0,
          type: "farmer",
        };
        
        conversations.value.unshift(newConversation);
        openChat(newConversation);
        closeSearch();
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    };

    // Function to show notification
    const showNewMessageNotification = (message) => {
      notificationMessage.value = message;
      showNotification.value = true;
      
      // Try to play notification sound if available
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(() => {
          // Handle autoplay restrictions or missing file gracefully
          console.log('Could not play notification sound - autoplay prevented or file not found');
        });
      } catch (error) {
        console.log('Notification sound not available');
      }
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        showNotification.value = false;
      }, 5000);
    };

    // Add notification listener
    const setupNotificationListener = () => {
      const q = query(
        collection(db, "conversations"),
        where("participants", "array-contains", currentUserId)
      );
      
      return onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const conversation = change.doc.data();
            if (conversation.lastMessageSender === 'seller' && 
                conversation.unreadCount > 0 &&
                change.doc.id !== selectedConversation.value?.id) {
              
              // Get seller name for notification from existing conversations
              const existingConv = conversations.value.find(conv => conv.id === change.doc.id);
              if (existingConv) {
                showNewMessageNotification(`${existingConv.sellerName} sent you a message: ${conversation.lastMessage}`);
              } else {
                // Fallback: get seller data from Firestore
                const sellerId = conversation.participants.find(id => id !== currentUserId);
                getDoc(doc(db, "users", sellerId)).then((userDoc) => {
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
                    const sellerName = fullName || 'Seller';
                    
                    showNewMessageNotification(`${sellerName} sent you a message: ${conversation.lastMessage}`);
                  }
                });
              }
            }
          }
        });
      });
    };

    onMounted(() => {
      fetchConversations();
      setupNotificationListener();
    });

    onUnmounted(() => {
      if (conversationsUnsubscribe) {
        conversationsUnsubscribe();
      }
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    });

    return {
      activeTab,
      conversations,
      filteredConversations,
      selectedConversation,
      chatMessages,
      newMessage,
      loadingConversations,
      sendingMessage,
      currentUserId,
      currentUserPhoto,
      messagesContainer,
      openChat,
      closeChat,
      sendMessage,
      formatConversationTime,
      formatMessageTime,
      showSearch,
      searchQuery,
      searchResults,
      searching,
      toggleSearch,
      closeSearch,
      handleSearch,
      startNewChat,
      showNotification,
      notificationMessage,
    };
  }
};
</script>

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
  background: none;
  border: none;
  cursor: pointer;
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
  border: none;
  cursor: pointer;
}

.profile-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Search Container Styles */
.search-container {
  padding: 10px 15px;
  background-color: white;
  border-bottom: 1px solid #eee;
  position: relative;
  z-index: 10;
}

.search-box {
  display: flex;
  align-items: center;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #999;
}

.search-box input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border-radius: 20px;
  border: 1px solid #ddd;
  font-size: 14px;
}

.close-search {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  margin-top: 10px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 12px;
  object-fit: cover;
}

.result-info {
  flex: 1;
  position: relative;
}

.result-info h4 {
  margin: 0 0 3px 0;
  font-size: 14px;
  color: #333;
}

.result-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.account-name {
  color: #888 !important;
  font-style: italic;
}

.recent-tag {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #e8f3e8;
  color: #2e5c31;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.no-results {
  padding: 15px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.searching-state {
  padding: 15px;
  text-align: center;
  color: #666;
  font-size: 14px;
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
  cursor: pointer;
}

.tab-button.active {
  color: #2e5c31;
  background-color: rgba(46, 92, 49, 0.1);
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 30px;
  color: #666;
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

.farm-name {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
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
  border: none;
  cursor: pointer;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* Add notification styles */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #2e5c31;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
