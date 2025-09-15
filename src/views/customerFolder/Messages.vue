<template>
  <div class="messages-page">
    <div class="header">
      <button class="back-button" @click="goHome">
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

      <div v-if="searching" class="searching-state">Searching...</div>

      <div v-else-if="searchResults.length > 0" class="search-results">
        <div
          v-for="result in searchResults"
          :key="result.userId"
          class="search-result-item"
          @click="startNewChat(result)"
        >
          <img :src="result.photoURL || fallbackAvatar" alt="" class="result-avatar" />
          <div class="result-info">
            <h4>{{ result.fullName || result.farmName || 'Seller' }}</h4>
            <p class="account-name">@{{ result.username || result.userId }}</p>
            <span v-if="result.isRecent" class="recent-tag">Recent</span>
          </div>
        </div>
      </div>

      <div v-else-if="searchQuery && !searching" class="no-results">
        No sellers or farms found matching "{{ searchQuery }}"
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
            <img :src="conversation.sellerPhoto || fallbackAvatar" alt="avatar" />
            <span class="status-dot" :class="{ online: conversation.sellerOnline }"></span>
          </div>
          <div class="message-content">
            <div class="message-header">
              <h3>{{ conversation.sellerName || conversation.farmName || 'Seller' }}</h3>
              <span class="message-time">{{ formatConversationTime(conversation.lastMessageTime) }}</span>
            </div>
            <div class="message-preview">{{ conversation.lastMessage || 'Tap to start chatting' }}</div>
            <div v-if="conversation.farmName" class="farm-name">{{ conversation.farmName }}</div>
          </div>
          <div class="message-indicators">
            <div v-if="conversation.unreadCount > 0 && conversation.lastMessageSender !== 'customer'" class="unread-badge">{{ conversation.unreadCount }}</div>
            <div v-else class="read-indicator"><CheckCheck size="16" /></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Window -->
    <div v-if="selectedConversation" class="chat-window">
      <div class="chat-header">
        <button class="back-button" @click="closeChat">
          <ChevronLeft size="22" />
        </button>
        <div class="chat-user">
          <div class="chat-avatar">
            <img :src="selectedConversation.otherUserPhoto || fallbackAvatar" alt="" />
          </div>
          <div>
            <h3>{{ selectedConversation.otherUserName || 'Seller' }}</h3>
            <p>{{ selectedConversation.otherUserOnline ? 'Online' : 'Offline' }}</p>
          </div>
        </div>
      </div>

      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(message, index) in chatMessages"
          :key="message.id || index"
          class="chat-message"
          :class="{ outgoing: message.senderId === currentUserId }"
        >
          <div class="message-bubble">{{ message.text }}</div>
          <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
        </div>
      </div>

      <div class="chat-input">
        <input
          type="text"
          placeholder="Type a message..."
          v-model="newMessage"
          @keyup.enter="sendMessage"
          @focus="onChatInputFocus"
          :disabled="sendingMessage"
          class="chat-input-input"
        />
        <button class="send-button" @click="sendMessage" :disabled="!newMessage.trim() || sendingMessage">
          <Send size="18" />
        </button>
      </div>
    </div>

    <div v-if="showNotification" class="notification">
      <Bell size="20" />
      <span>{{ notificationMessage }}</span>
    </div>

    <!-- Added BottomNavigation component, only show when not in individual chat view -->
    <BottomNavigation v-if="!selectedConversation" />
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
  Bell,
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
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
  getDocs,
  limit,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase/firebaseConfig';
import { useRouter } from 'vue-router';
import BottomNavigation from '@/components/BottomNavigation.vue';

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
    Bell,
    BottomNavigation
  },
  setup() {
    const router = useRouter();

    // UI state
    const activeTab = ref('all');
    const selectedConversation = ref(null);
    const newMessage = ref('');
    const chatMessages = ref([]);
    const conversations = ref([]);
    const loadingConversations = ref(true);
    const sendingMessage = ref(false);
    const messagesContainer = ref(null);
    const fallbackAvatar = 'https://ui-avatars.com/api/?name=F&background=E8F3E8&color=2e5c31&rounded=true&bold=true';

    // Search
    const showSearch = ref(false);
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searching = ref(false);

    // Auth-aware current user
    const currentUserId = ref(null);
    const currentUserPhoto = ref('');

    let conversationsUnsubscribe = null;
    let messagesUnsubscribe = null;
    let authUnsubscribe = null;

    // Notifications
    const showNotification = ref(false);
    const notificationMessage = ref('');

    const filteredConversations = computed(() => {
      const list = conversations.value || [];
      if (activeTab.value === 'farmers') return list.filter((c) => c.type === 'farmer');
      if (activeTab.value === 'support') return list.filter((c) => c.type === 'support');
      return list;
    });

    const formatConversationTime = (timestamp) => {
      if (!timestamp) return 'No messages';
      let date;
      if (timestamp && typeof timestamp.toDate === 'function') date = timestamp.toDate();
      else if (timestamp instanceof Date) date = timestamp;
      else if (typeof timestamp === 'number') date = new Date(timestamp);
      else if (typeof timestamp === 'string') date = new Date(timestamp);
      else return 'No messages';

      const now = new Date();
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      if (diffInDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const formatMessageTime = (timestamp) => {
      if (!timestamp) return '';
      let date;
      if (timestamp && typeof timestamp.toDate === 'function') date = timestamp.toDate();
      else if (timestamp instanceof Date) date = timestamp;
      else if (typeof timestamp === 'number') date = new Date(timestamp);
      else if (typeof timestamp === 'string') date = new Date(timestamp);
      else return '';
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    const onChatInputFocus = () => {
      scrollToBottom();
    };

    // --- Firestore helpers ---
    const isGenericName = (name) => {
      if (!name || typeof name !== 'string') return true;
      const n = name.trim().toLowerCase();
      return n === 'user' || n === 'seller' || n === 'customer' || n === 'unknown';
    };

    const bestSellerName = (u) => {
      if (!u) return '';
      const fullNameField = u.fullName || u.name;
      const composed = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      const username = u.username || '';
      const displayName = u.displayName || '';
      // Prefer explicit full names over generic display names
      if (fullNameField && !isGenericName(fullNameField)) return fullNameField;
      if (composed && !isGenericName(composed)) return composed;
      if (displayName && !isGenericName(displayName)) return displayName;
      if (username) return username;
      return '';
    };

    const buildConversationObject = async (docSnapshot) => {
      const data = docSnapshot.data() || {};
      const participants = data.participants || [];
      const otherId = participants.find((id) => id !== currentUserId.value) || data.sellerId;

      // Fetch seller data once and cache via a simple in-memory map
      if (!buildConversationObject._cache) buildConversationObject._cache = new Map();
      const cache = buildConversationObject._cache;

      let sellerData = cache.get(otherId);
      if (!sellerData && otherId) {
        try {
          const userRef = doc(db, 'users', otherId);
          const userDoc = await getDoc(userRef);
          sellerData = userDoc.exists() ? userDoc.data() : {};
          cache.set(otherId, sellerData);
        } catch (e) {
          sellerData = {};
        }
      }

      const sellerNameResolved = bestSellerName(sellerData);
      const sellerName = sellerNameResolved || sellerData.farmName || 'Seller';

      return {
        id: docSnapshot.id,
        ...data,
        type: data.type || (sellerData.role === 'support' ? 'support' : 'farmer'),
        sellerId: otherId,
        sellerName,
        farmName: sellerData.farmName || '',
        sellerPhoto: sellerData.profileImageUrl || sellerData.photoURL || '',
        sellerOnline: !!sellerData.online,
        lastMessage: data.lastMessage || '',
        lastMessageTime: data.lastMessageTime || data.updatedAt || data.createdAt || null,
        lastMessageSender: data.lastMessageSender || '',
        unreadCount: Number(data.unreadCount || 0),
      };
    };

    const fetchConversations = () => {
      if (!currentUserId.value) return; // wait for auth

      // Real-time conversations ordered by recent activity
      // Remove orderBy to avoid composite index requirement; we'll sort client-side
      const qConv = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', currentUserId.value)
      );

      if (conversationsUnsubscribe) conversationsUnsubscribe();

      conversationsUnsubscribe = onSnapshot(
        qConv,
        async (snapshot) => {
          if (snapshot.empty) {
            conversations.value = [];
            loadingConversations.value = false;
            return;
          }

          // Build all conversations with batched seller fetch (handled in helper cache)
          const promises = snapshot.docs.map((d) => buildConversationObject(d));
          const convs = await Promise.all(promises);
          // Sort by lastMessageTime desc on client
          const toMillis = (t) => {
            if (!t) return 0;
            try {
              if (t && typeof t.toDate === 'function') return t.toDate().getTime();
              if (t instanceof Date) return t.getTime();
              if (typeof t === 'number') return t;
              if (typeof t === 'string') return new Date(t).getTime();
            } catch (_) {}
            return 0;
          };
          conversations.value = convs.sort((a, b) => toMillis(b.lastMessageTime) - toMillis(a.lastMessageTime));
          loadingConversations.value = false;
        },
        (error) => {
          console.error('Conversations listener error:', error);
          loadingConversations.value = false;
        }
      );
    };

    const openChat = async (conversation) => {
      selectedConversation.value = {
        ...conversation,
        otherUserId: conversation.sellerId,
        otherUserName: conversation.sellerName,
        otherUserPhoto: conversation.sellerPhoto,
        otherUserOnline: conversation.sellerOnline,
      };

      // Mark as read for customer-side if the last message was from seller
      try {
        if (conversation.unreadCount > 0 && conversation.lastMessageSender !== 'customer') {
          await updateDoc(doc(db, 'conversations', conversation.id), {
            unreadCount: 0,
          });
        }
      } catch (e) {
        // non-blocking
      }

      loadMessages(conversation.id);
    };

    const loadMessages = (conversationId) => {
      if (messagesUnsubscribe) messagesUnsubscribe();
      const q = query(collection(db, 'conversations', conversationId, 'messages'), orderBy('timestamp', 'asc'));
      messagesUnsubscribe = onSnapshot(
        q,
        (snapshot) => {
          chatMessages.value = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          scrollToBottom();
        },
        (error) => console.error('Messages listener error:', error)
      );
    };

    const closeChat = () => {
      selectedConversation.value = null;
      chatMessages.value = [];
      if (messagesUnsubscribe) messagesUnsubscribe();
    };

    const ensureConversation = async (sellerId) => {
      const conversationId = `${currentUserId.value}_${sellerId}`;
      const convRef = doc(db, 'conversations', conversationId);
      const snap = await getDoc(convRef);
      if (!snap.exists()) {
        await setDoc(
          convRef,
          {
            participants: [currentUserId.value, sellerId],
            type: 'farmer',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: '',
            lastMessageTime: serverTimestamp(),
            lastMessageSender: '',
            unreadCount: 0,
          },
          { merge: true }
        );
      }
      return conversationId;
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !selectedConversation.value || sendingMessage.value) return;
      sendingMessage.value = true;

      const conversationId = selectedConversation.value.id;
      const message = {
        senderId: currentUserId.value,
        text: newMessage.value.trim(),
        timestamp: serverTimestamp(),
        read: false,
      };

      try {
        // Add message
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), message);

        // Update parent conversation
        await updateDoc(doc(db, 'conversations', conversationId), {
          lastMessage: message.text,
          lastMessageTime: serverTimestamp(),
          lastMessageSender: 'customer',
          unreadCount: increment(1), // mark as unread for seller
        });

        newMessage.value = '';
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        sendingMessage.value = false;
      }
    };

    // Recent sellers for suggestions
    const getRecentSellers = async () => {
      if (!currentUserId.value) return [];
      try {
        const qConv = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', currentUserId.value),
          orderBy('lastMessageTime', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(qConv);
        const ids = new Set();
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const otherId = (data.participants || []).find((id) => id !== currentUserId.value);
          if (otherId) ids.add(otherId);
        });
        return Array.from(ids).slice(0, 5);
      } catch (error) {
        console.error('Error fetching recent sellers:', error);
        return [];
      }
    };

    const showRecentSellers = async () => {
      if (searchQuery.value) return;
      const recentSellerIds = await getRecentSellers();
      const suggestions = [];
      for (const sellerId of recentSellerIds) {
        try {
          const uRef = doc(db, 'users', sellerId);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            const u = uSnap.data();
            suggestions.push({
              userId: sellerId,
              fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.displayName,
              farmName: u.farmName || '',
              photoURL: u.profileImageUrl || u.photoURL || '',
              username: u.username || '',
              isRecent: true,
            });
          }
        } catch (e) {
          // continue
        }
      }
      searchResults.value = suggestions;
    };

    const toggleSearch = () => {
      showSearch.value = !showSearch.value;
      if (!showSearch.value) {
        searchQuery.value = '';
        searchResults.value = [];
      } else {
        showRecentSellers();
      }
    };

    const closeSearch = () => {
      showSearch.value = false;
      searchQuery.value = '';
      searchResults.value = [];
    };

    const handleSearch = async () => {
      const qText = searchQuery.value.trim().toLowerCase();
      if (!qText) {
        await showRecentSellers();
        return;
      }
      searching.value = true;
      try {
        // Fetch all sellers (basic filter by role); then client-side fuzzy match
        const usersQ = query(collection(db, 'users'), where('role', '==', 'seller'));
        const usersSnap = await getDocs(usersQ);
        const results = [];
        usersSnap.docs.forEach((uDoc) => {
          const u = uDoc.data();
          const name = `${u.firstName || ''} ${u.lastName || ''}`.trim();
          const display = u.displayName || name;
          const farm = u.farmName || '';
          const username = u.username || '';
          const hay = [display, farm, username].join(' ').toLowerCase();
          if (hay.includes(qText)) {
            results.push({
              userId: uDoc.id,
              fullName: display,
              farmName: farm,
              photoURL: u.profileImageUrl || u.photoURL || '',
              username,
            });
          }
        });
        searchResults.value = results;
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        searching.value = false;
      }
    };

    const startNewChat = async (seller) => {
      if (!seller || !seller.userId) return;
      const existingConv = conversations.value.find((c) => c.sellerId === seller.userId);
      if (existingConv) {
        openChat(existingConv);
        closeSearch();
        return;
      }
      try {
        const convId = await ensureConversation(seller.userId);
        // Prime minimal seller info into conversation (optional)
        await updateDoc(doc(db, 'conversations', convId), {
          sellerId: seller.userId,
          lastMessageTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        // Add to local list optimistically
        conversations.value.unshift({
          id: convId,
          participants: [currentUserId.value, seller.userId],
          sellerId: seller.userId,
          sellerName: seller.fullName || 'Seller',
          farmName: seller.farmName || '',
          sellerPhoto: seller.photoURL || '',
          lastMessage: '',
          lastMessageTime: new Date(),
          lastMessageSender: '',
          unreadCount: 0,
          type: 'farmer',
        });
        openChat(conversations.value[0]);
        closeSearch();
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    };

    const showNewMessageNotification = (message) => {
      notificationMessage.value = message;
      showNotification.value = true;
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
      setTimeout(() => (showNotification.value = false), 5000);
    };

    const setupNotificationListener = () => {
      if (!currentUserId.value) return () => {};
      const qConv = query(collection(db, 'conversations'), where('participants', 'array-contains', currentUserId.value));
      return onSnapshot(qConv, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            if (data.lastMessage && data.lastMessageSender !== 'customer') {
              showNewMessageNotification(`New message: ${data.lastMessage}`);
            }
          }
        });
      });
    };

    let notificationsUnsubscribe = null;

    onMounted(() => {
      // Prevent body/page from scrolling while in Messages view
      document.body.classList.add('no-scroll');
      loadingConversations.value = true;
      // Robust auth listener that uses the user param directly
      authUnsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUserId.value = user.uid;
          currentUserPhoto.value = user.photoURL || '';
          fetchConversations();
          if (notificationsUnsubscribe) notificationsUnsubscribe();
          notificationsUnsubscribe = setupNotificationListener();
        } else {
          currentUserId.value = null;
          conversations.value = [];
          if (conversationsUnsubscribe) conversationsUnsubscribe();
          conversationsUnsubscribe = null;
          if (messagesUnsubscribe) messagesUnsubscribe();
          messagesUnsubscribe = null;
          if (notificationsUnsubscribe) notificationsUnsubscribe();
          notificationsUnsubscribe = null;
          loadingConversations.value = false;
        }
      });
    });

    onUnmounted(() => {
      document.body.classList.remove('no-scroll');
      if (conversationsUnsubscribe) conversationsUnsubscribe();
      if (messagesUnsubscribe) messagesUnsubscribe();
      if (notificationsUnsubscribe) notificationsUnsubscribe();
      if (authUnsubscribe) authUnsubscribe();
    });

    return {
      // navigation
      goHome: () => router.push({ name: 'homeview' }),

      // state
      activeTab,
      conversations,
      filteredConversations,
      selectedConversation,
      chatMessages,
      newMessage,
      loadingConversations,
      sendingMessage,
      currentUserId: currentUserId,
      currentUserPhoto,
      messagesContainer,
      fallbackAvatar,

      // actions
      openChat,
      closeChat,
      sendMessage,
      onChatInputFocus,
      formatConversationTime,
      formatMessageTime,

      // search
      showSearch,
      searchQuery,
      searchResults,
      searching,
      toggleSearch,
      closeSearch,
      handleSearch,
      startNewChat,

      // notifications
      showNotification,
      notificationMessage,
    };
  },
};
</script>

<style scoped>
/* Lock page scroll when Messages view is active */
:global(body.no-scroll) {
  overflow: hidden !important;
  position: fixed;
  width: 100%;
}
.messages-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 0; /* avoid extra outer height that could scroll */
  position: relative;
  overflow: hidden; /* lock the outer page from scrolling */
  overscroll-behavior: none; /* prevent rubber-band/bounce on mobile */
  -webkit-overflow-scrolling: auto; /* disable momentum on the container */
}

/* Prefer dynamic viewport on modern mobile browsers */
@supports (height: 100dvh) {
  .messages-page {
    height: 100dvh;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 15px;
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
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
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
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
  padding: 20px 15px; /* mirror CustomerOrders spacing */
  background-color: #f5f5f5;
  overflow-y: auto; /* scroll only the conversation list, not the page */
  -webkit-overflow-scrolling: touch; /* smooth scrolling on iOS */
  overscroll-behavior: contain; /* don't bubble scroll to body */
  min-height: 0;
  /* Equal horizontal padding with safe-areas - FIXED: Added right padding */
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
}

@media (max-width: 768px) {
  .content {
  /* Preserve equal left/right spacing with safe-areas on mobile */
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: calc(12px + env(safe-area-inset-left));
  padding-right: calc(12px + env(safe-area-inset-right));
  }
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
  padding-left: calc(0px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right)); /* visibly match right spacing like left */
}

.message-item {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 10px;
  padding: 15px 20px; /* extra right padding for visible whitespace */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden; /* avoid any child overflow hiding side margins */
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
  background-color: #4caf50;
}

.message-content {
  flex: 1;
  /* Ensure text never sits under right-side indicators; provide visible right spacing */
  padding-right: 56px; /* more room to clearly show right whitespace */
  text-align: left;
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
  text-align: left;
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
  text-align: left;
}

.farm-name {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  text-align: left;
}

.message-indicators {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-left: 10px;
  margin-right: 8px; /* buffer so badges don't hug the card edge */
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
  height: 100vh;
  overflow: hidden; /* lock overlay; only inner messages scroll */
}

@supports (height: 100dvh) {
  .chat-window {
    height: 100dvh;
  }
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: flex-start; /* keep back button, avatar, name all on the left */
  gap: 10px; /* spacing between back button and user block */
  padding: 15px;
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
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
  text-align: left;
}

.chat-user p {
  font-size: 12px;
  margin: 0;
  opacity: 0.8;
  text-align: left;
}

.chat-messages {
  flex: 1;
  padding: 15px;
  background-color: #f5f5f5;
  overflow-y: auto; /* scroll messages here */
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  /* Add proper padding for both sides with safe area support */
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
}

.chat-message {
  display: flex;
  flex-direction: column;
  max-width: 80%; /* Reduced from 70% to allow more space for padding */
  align-self: flex-start;
  margin-left: 0;
  margin-right: 0;
}

.chat-message.outgoing {
  align-self: flex-end;
  margin-right: 0;
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
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 101;
  /* Respect iOS safe area */
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  padding-left: calc(15px + env(safe-area-inset-left));
  padding-right: calc(15px + env(safe-area-inset-right));
}

.chat-input-input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  margin-right: 10px;
  background-color: #f8f9fa;
}

.chat-input-input:focus {
  border-color: #2e5c31;
  background-color: white;
}

/* No media query needed: input is fixed on all screens */

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

/* Notification */
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
