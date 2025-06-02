<template>
  <div class="community-page">
    <div class="header">
      <div class="search-container">
        <div class="search-bar">
          <Search size="18" />
          <input 
            type="text" 
            placeholder='Search community posts...' 
            v-model="searchQuery"
          >
        </div>
        <div class="header-buttons">
          <button class="icon-button" @click="navigateToPath('/cart')">
            <ShoppingCart size="18" />
            <span v-if="cartItems.length > 0" class="cart-badge">{{ cartItems.length }}</span>
          </button>
          <button class="icon-button profile-icon" @click="toggleProfileMenu" ref="profileRef">
            <User size="18" />
          </button>
          
          <div class="profile-dropdown" v-if="showProfileMenu">
            <div class="dropdown-header">
              <div class="user-avatar">
                <img v-if="currentUser?.photoURL" :src="currentUser.photoURL" alt="User avatar">
                <User v-else size="24" />
              </div>
              <div class="user-info">
                <h4>{{ currentUser?.displayName || 'Anonymous' }}</h4>
                <p>{{ currentUser?.email }}</p>
              </div>
            </div>
            <div class="dropdown-menu">
              <button @click="navigateToPath('/profile')">
                <User size="16" />
                <span>My Profile</span>
              </button>
              <button @click="navigateToPath('/my-posts')" v-if="currentUser">
                <FileText size="16" />
                <span>My Posts</span>
              </button>
              <button @click="signOut">
                <LogOut size="16" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="community-header">
        <h2>Community Forum</h2>
        <p>Connect with other farmers - ask questions, share updates, and discuss</p>
      </div>
    </div>
    
    <div class="content">
      <!-- Create New Post Button -->
      <button class="create-post-button" @click="openNewPostModal">
        <Plus size="18" />
        <span>Create Post</span>
      </button>
      
      <!-- Post Type Toggle -->
      <div class="post-type-toggle">
        <button 
          :class="{ active: showQuestions }"
          @click="showQuestions = true"
        >
          Questions
        </button>
        <button 
          :class="{ active: !showQuestions }"
          @click="showQuestions = false"
        >
          Community Posts
        </button>
      </div>
      
      <!-- Active Filters -->
      <div class="active-filters" v-if="hasActiveFilters">
        <div class="filter-tag" v-if="searchQuery">
          Search: "{{ searchQuery }}"
          <button class="clear-filter" @click="clearSearch">
            <X size="12" />
          </button>
        </div>
        <button class="clear-all-filters" @click="clearAllFilters">
          Clear All
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading community posts...</p>
      </div>
      
      <!-- Empty State -->
      <div v-else-if="filteredPosts.length === 0" class="no-posts">
        <img src="https://cdn-icons-png.flaticon.com/512/4076/4076478.png" alt="No posts" class="no-posts-icon">
        <h3>No posts found</h3>
        <p v-if="hasActiveFilters">Try adjusting your filters</p>
        <p v-else>Be the first to create a post!</p>
        <button class="browse-all-btn" @click="clearAllFilters" v-if="hasActiveFilters">
          Reset Filters
        </button>
        <button class="create-post-btn" @click="openNewPostModal" v-else>
          Create Post
        </button>
      </div>
      
      <!-- Posts List -->
      <div v-else class="posts-list">
        <div 
          class="post-card" 
          v-for="post in filteredPosts" 
          :key="post.id"
        >
          <div class="post-header">
            <div class="user-info">
              <div class="avatar">
                <img v-if="post.userPhoto" :src="post.userPhoto" alt="User avatar">
                <User v-else size="24" class="default-avatar" />
              </div>
              <div class="user-details">
                <h4>{{ post.userName }}</h4>
                <p class="post-time">{{ formatTime(post.createdAt) }}</p>
              </div>
            </div>
            <div class="post-category" v-if="post.category">
              {{ getCategoryLabel(post.category) }}
              <span v-if="post.isQuestion" class="question-badge">Question</span>
            </div>
          </div>
          
          <div class="post-content" @click="viewPost(post)">
            <h3 v-if="post.title">{{ post.title }}</h3>
            <p class="post-text">{{ truncateText(post.content, 150) }}</p>
            
            <div v-if="post.image" class="post-image">
              <img :src="post.image" alt="Post image" @error="handleImageError">
            </div>
          </div>
          
  <div class="post-stats">
    <div class="stat" @click.stop="toggleReactionMenu(post.id)">
      <ThumbsUp v-if="!getUserReaction(post.id)" size="14" />
      <ThumbsUp v-else size="14" fill="#4a90e2" color="#4a90e2" />
      <span>{{ post.likeCount || 0 }}</span>
    
    <!-- Reaction menu -->
  <div class="reaction-menu" v-if="activeReactionMenu === post.id">
        <button @click.stop="addReaction(post.id, 'like')">👍 Like</button>
        <button @click.stop="addReaction(post.id, 'love')">❤️ Love</button>
        <button @click.stop="addReaction(post.id, 'laugh')">😂 Haha</button>
      </div>
    </div>
  
    <div class="stat" @click.stop="openCommentModal(post)">
      <MessageSquare size="14" />
      <span>{{ post.replyCount || 0 }} {{ post.replyCount === 1 ? 'reply' : 'replies' }}</span>
    </div>
  </div>
        </div>
      </div>
    </div>
    
    <!-- New Post Modal -->
    <div class="modal-overlay" v-if="showNewPostModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ newPost.isQuestion ? 'Ask a Question' : 'Create Post' }}</h3>
          <button class="close-modal" @click="closeNewPostModal">
            <X size="20" />
          </button>
        </div>
        <!-- Comment Modal -->
<div class="modal-overlay" v-if="showCommentModal">
  <div class="modal-content">
    <div class="modal-header">
      <h3>Add Comment</h3>
      <button class="close-modal" @click="closeCommentModal">
        <X size="20" />
      </button>
    </div>
    
    <div class="modal-body">
      <div class="form-group">
        <textarea v-model="commentText" placeholder="Write your comment..." rows="4"></textarea>
      </div>
    </div>
    
    <div class="modal-footer">
      <button class="cancel-btn" @click="closeCommentModal">
        Cancel
      </button>
      <button class="submit-btn" @click="submitComment" :disabled="!commentText.trim()">
        Post Comment
      </button>
    </div>
  </div>
</div>
        
        <div class="modal-body">
    <div class="post-type-switch">
      <button 
        :class="{ active: newPost.isQuestion }"
        @click="newPost.isQuestion = true"
      >
        Question
      </button>
      <button 
        :class="{ active: !newPost.isQuestion }"
        @click="newPost.isQuestion = false"
      >
        General Post
      </button>
    </div>

    <!-- Add anonymous toggle -->
    <div class="form-group anonymous-toggle">
      <label>Post as:</label>
      <div class="toggle-options">
        <button 
          :class="{ active: !newPost.isAnonymous }"
          @click="newPost.isAnonymous = false"
        >
          <User size="14" />
          <span>My Username</span>
        </button>
        <button 
          :class="{ active: newPost.isAnonymous }"
          @click="newPost.isAnonymous = true"
        >
          <EyeOff size="14" />
          <span>Anonymous</span>
        </button>
      </div>
    </div>


          <div class="form-group" v-if="newPost.isQuestion">
            <label>Question Title*</label>
            <input 
              type="text" 
              v-model="newPost.title" 
              placeholder="What's your question?"
              maxlength="100"
            >
          </div>
          
          <div class="form-group">
            <label>{{ newPost.isQuestion ? 'Question Details*' : 'Post Content*' }}</label>
            <textarea 
              v-model="newPost.content" 
              :placeholder="newPost.isQuestion ? 'Provide more details about your question...' : 'Share your thoughts with the community...'"
              rows="5"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Add Image (Optional)</label>
            <div class="image-upload-container">
              <div 
                class="image-preview" 
                :class="{ 'has-image': newPost.image }"
                @click="triggerFileInput"
              >
                <img v-if="newPost.image" :src="newPost.image" alt="Post preview" />
                <div v-else class="upload-placeholder">
                  <Image :size="24" />
                  <p>Click to upload image</p>
                </div>
              </div>
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleImageUpload" 
                accept="image/*" 
                class="file-input"
              />
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="cancel-btn" @click="closeNewPostModal">
            Cancel
          </button>
          <button 
            class="submit-btn" 
            @click="submitPost"
            :disabled="!isValidPost"
          >
            {{ newPost.isQuestion ? 'Post Question' : 'Share Post' }}
          </button>
        </div>
      </div>
    </div>
    
    <bottom-navigation active-tab="/community" @navigate="handleBottomNavigation" />
  </div>
</template>
<script>
import BottomNavigation from '@/components/BottomNavigation.vue';
import { 
  Search, 
  ShoppingCart, 
  User, 
  Plus, 
  X, 
  MessageSquare, 
  ThumbsUp, 
  Star,
  Image,
  LogOut,
  FileText,
  EyeOff
} from 'lucide-vue-next';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, db, storage } from '@/firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default {
  components: {
    BottomNavigation,
    Search,
    ShoppingCart,
    User,
    Plus,
    X,
    MessageSquare,
    ThumbsUp,
    Star,
    Image,
    LogOut,
    FileText,
    EyeOff
  },
  setup() {
    const router = useRouter();
    const showProfileMenu = ref(false);
    const profileRef = ref(null);
    const cartItems = ref([]);
    const isLoading = ref(true);
    const posts = ref([]);
    const searchQuery = ref('');
    const showNewPostModal = ref(false);
    const fileInput = ref(null);
    const currentUser = ref(null);
    const showQuestions = ref(true);
    const activeReactionMenu = ref(null);
    const showCommentModal = ref(false);
    const selectedPost = ref(null);
    const commentText = ref('');

    const triggerFileInput = () => {
      fileInput.value.click();
    };
    
    const postCategories = [
      { value: 'general', label: 'General Farming' }
    ];
    
    const newPost = ref({
      title: '',
      content: '',
      category: 'general',
      image: null,
      imageFile: null,
      isQuestion: true,
      isAnonymous: false
    });
    
    const isValidPost = computed(() => {
      if (newPost.value.isQuestion) {
        return newPost.value.title.trim() && newPost.value.content.trim();
      }
      return newPost.value.content.trim();
    });
    
    const filteredPosts = computed(() => {
      let result = [...posts.value];
      
      result = result.filter(post => post.isQuestion === showQuestions.value);
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(post => 
          (post.title && post.title.toLowerCase().includes(query)) || 
          post.content.toLowerCase().includes(query)
        );
      }
      
      return result.sort((a, b) => {
        if (a.isFeatured !== b.isFeatured) {
          return a.isFeatured ? -1 : 1;
        }
        return b.createdAt - a.createdAt;
      });
    });
    
    const hasActiveFilters = computed(() => {
      return searchQuery.value;
    });
    
    const getCategoryLabel = (value) => {
      const category = postCategories.find(cat => cat.value === value);
      return category ? category.label : 'General';
    };
    
    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        let date;
        
        if (typeof timestamp === 'object' && timestamp.toDate) {
          // Firestore timestamp
          date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          // Date object
          date = timestamp;
        } else if (typeof timestamp === 'number') {
          // Unix timestamp (ms)
          date = new Date(timestamp);
        } else {
          return '';
        }
        
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        console.error('Error formatting timestamp:', error);
        return '';
      }
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };
    
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      if (!file.type.match('image.*')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should not exceed 2MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        newPost.value.image = e.target.result;
      };
      reader.readAsDataURL(file);
    };
    
    const handleImageError = (event) => {
      event.target.style.display = 'none';
    };
    
    const clearSearch = () => {
      searchQuery.value = '';
    };
    
    const clearAllFilters = () => {
      searchQuery.value = '';
    };
    
    const openNewPostModal = () => {
      if (!currentUser.value) {
        router.push('/login');
        return;
      }
      showNewPostModal.value = true;
    };
    
    const closeNewPostModal = () => {
      showNewPostModal.value = false;
      newPost.value = {
        title: '',
        content: '',
        category: 'general',
        image: null,
        imageFile: null,
        isQuestion: true,
        isAnonymous: false
      };
      if (fileInput.value) {
        fileInput.value.value = '';
      }
    };
    
    const submitPost = async () => {
      if (!isValidPost.value) return;
      
      const user = auth.currentUser;
      if (!user) {
        alert('Please sign in to post');
        return;
      }
      
      try {
        let imageUrl = newPost.value.image;
        
        const postData = {
          title: newPost.value.isQuestion ? newPost.value.title : null,
          content: newPost.value.content,
          category: newPost.value.category,
          userId: user.uid,
          userName: newPost.value.isAnonymous ? 'Anonymous Farmer' : (user.displayName || 'Anonymous Farmer'),
          userPhoto: newPost.value.isAnonymous ? null : (user.photoURL || null),
          userRole: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isQuestion: newPost.value.isQuestion,
          isFeatured: false,
          image: imageUrl,
          replyCount: 0,
          reactionCount: 0,
          viewCount: 0,
          isAnonymous: newPost.value.isAnonymous,
          reactions: []
        };
        
        const docRef = await addDoc(collection(db, 'communityPosts'), postData);
        console.log('Post created with ID: ', docRef.id);
        
        closeNewPostModal();
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Error creating post. Please try again.');
      }
    };
    
    const toggleReactionMenu = (postId) => {
      if (!currentUser.value) {
        router.push('/login');
        return;
      }
      activeReactionMenu.value = activeReactionMenu.value === postId ? null : postId;
    };
    
const addReaction = async (postId, reactionType) => {
      if (!currentUser.value) {
        router.push('/login');
        return;
      }
      
      try {
        const postRef = doc(db, 'communityPosts', postId);
        const post = posts.value.find(p => p.id === postId);
        
        // Check if user already reacted
        const existingReactionIndex = post.reactions?.findIndex(
          r => r.userId === currentUser.value.uid
        ) ?? -1;
        
        if (existingReactionIndex >= 0) {
          const existingReaction = post.reactions[existingReactionIndex];
          // Remove existing reaction by decrementing its counter
          const updateData = {
            reactions: arrayRemove(existingReaction),
            [`${existingReaction.reactionType}Count`]: increment(-1)
          };
          
          await updateDoc(postRef, updateData);
          
          // If same reaction type, just remove it and return
          if (existingReaction.reactionType === reactionType) {
            activeReactionMenu.value = null;
            return;
          }
        }
        
        // Add new reaction
        const newReaction = {
          userId: currentUser.value.uid,
          reactionType,
          timestamp: Date.now()
        };
        
        await updateDoc(postRef, {
          reactions: arrayUnion(newReaction),
          [`${reactionType}Count`]: increment(1)
        });
        
        activeReactionMenu.value = null;
      } catch (error) {
        console.error('Error adding reaction:', error);
      }
    };
    
    const openCommentModal = (post) => {
      if (!currentUser.value) {
        router.push('/login');
        return;
      }
      selectedPost.value = post;
      showCommentModal.value = true;
    };
    
    const closeCommentModal = () => {
      showCommentModal.value = false;
      commentText.value = '';
      selectedPost.value = null;
    };
    
    const submitComment = async () => {
      if (!commentText.value.trim() || !selectedPost.value) return;
      
      try {
        const user = auth.currentUser;
        const commentData = {
          content: commentText.value,
          userId: user.uid,
          userName: user.displayName || 'Anonymous Farmer',
          userPhoto: user.photoURL || null,
          createdAt: Date.now() // Using client-side timestamp
        };
        
        const postRef = doc(db, 'communityPosts', selectedPost.value.id);
        await updateDoc(postRef, {
          replies: arrayUnion(commentData),
          replyCount: increment(1)
        });
        
        closeCommentModal();
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Failed to submit comment. Please try again.');
      }
    };
    
    const viewPost = (post) => {
      router.push(`/community/${post.id}`);
    };
    
    const getUserReaction = (postId) => {
      if (!currentUser.value) return null;
      const post = posts.value.find(p => p.id === postId);
      if (!post || !post.reactions) return null;
      return post.reactions.find(r => r.userId === currentUser.value.uid)?.reactionType || null;
    };
    
    const navigateToPath = (path, query = null) => {
      showProfileMenu.value = false;
      if (query) {
        router.push({ path, query });
      } else {
        router.push(path);
      }
    };
    
    const toggleProfileMenu = () => {
      showProfileMenu.value = !showProfileMenu.value;
    };
    
    const handleBottomNavigation = (path) => {
      router.push(path);
    };
    
    const handleClickOutside = (event) => {
      if (profileRef.value && !profileRef.value.contains(event.target)) {
        showProfileMenu.value = false;
      }
    };
    
    const signOut = async () => {
      try {
        await firebaseSignOut(auth);
        router.push('/login');
      } catch (error) {
        console.error('Error signing out:', error);
      }
    };
    
    let unsubscribePosts = null;
    
const fetchPosts = async () => {
      try {
        isLoading.value = true;
        
        const q = query(collection(db, 'communityPosts'));
        unsubscribePosts = onSnapshot(q, (querySnapshot) => {
          const allPosts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt || serverTimestamp(),
              replies: data.replies || [],
              likeCount: data.likeCount || 0,
              loveCount: data.loveCount || 0,
              laughCount: data.laughCount || 0,
              replyCount: data.replyCount || 0,
              viewCount: data.viewCount || 0,
              isFeatured: data.isFeatured || false,
              isQuestion: data.isQuestion || false,
              isAnonymous: data.isAnonymous || false,
              reactions: data.reactions || []
            };
          });
          
          posts.value = allPosts;
          isLoading.value = false;
        });
        
        onAuthStateChanged(auth, (user) => {
          currentUser.value = user;
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        isLoading.value = false;
      }
    };

    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      fetchPosts();
    });
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      if (unsubscribePosts) unsubscribePosts();
    });
    
    return {
      showProfileMenu,
      profileRef,
      cartItems,
      isLoading,
      posts,
      searchQuery,
      postCategories,
      filteredPosts,
      hasActiveFilters,
      showNewPostModal,
      newPost,
      fileInput,
      currentUser,
      showQuestions,
      isValidPost,
      getCategoryLabel,
      formatTime,
      truncateText,
      handleImageUpload,
      handleImageError,
      clearSearch,
      clearAllFilters,
      openNewPostModal,
      closeNewPostModal,
      submitPost,
      viewPost,
      navigateToPath,
      toggleProfileMenu,
      handleBottomNavigation,
      signOut,
      getUserReaction,
      triggerFileInput,
      toggleReactionMenu,
      activeReactionMenu,
      addReaction,
      showCommentModal,
      selectedPost,
      commentText,
      openCommentModal,
      closeCommentModal,
      submitComment
    };
  }
};
</script>


<style scoped>
/* Previous styles remain the same, add these new styles */
.community-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px;
  background-color: #f8f9fa;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  overflow-x: hidden;
}

/* Header Styles */
.header {
  background: linear-gradient(135deg, #2e5c31, #1e3e21);
  padding: 15px;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  width: 100%;
}

.search-bar {
  flex: 1;
  min-width: 0;
  background-color: white;
  border-radius: 20px;
  display: flex;
  align-items: center;
  padding: 0 15px;
  height: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-bar svg {
  color: #9e9e9e;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-bar input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  min-width: 0;
  width: 100%;
}

.header-buttons {
  display: flex;
  gap: 8px;
  position: relative;
  flex-shrink: 0;
}

.icon-button {
  width: 40px;
  height: 40px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  overflow: hidden;
  position: relative;
  border: none;
  cursor: pointer;
}

.icon-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
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

.profile-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Profile Dropdown Menu (same as HomeView) */
.profile-dropdown {
  position: absolute;
  top: 45px;
  right: 0;
  width: 280px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.community-header {
  color: white;
  padding: 0 5px 10px;
}

.community-header h2 {
  font-size: 20px;
  margin: 0 0 5px 0;
}

.community-header p {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

/* Content Styles */
.content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  width: 100%;
  box-sizing: border-box;
}

.create-post-button {
  width: 100%;
  padding: 12px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(46, 92, 49, 0.3);
}

.create-post-button:hover {
  background-color: #26492a;
  transform: translateY(-2px);
}

.categories-filter {
  display: flex;
  overflow-x: auto;
  gap: 8px;
  padding: 10px 0;
  margin-bottom: 15px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.categories-filter::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.categories-filter button {
  padding: 8px 12px;
  border-radius: 20px;
  border: 1px solid #ddd;
  background-color: white;
  color: #555;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.categories-filter button.active {
  background-color: #2e5c31;
  color: white;
  border-color: #2e5c31;
}

/* Active Filters */
.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.filter-tag {
  background-color: #e9f7e9;
  color: #2e5c31;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.clear-filter {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: #2e5c31;
}

.clear-all-filters {
  background-color: #f5f5f5;
  color: #666;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(46, 92, 49, 0.1);
  border-radius: 50%;
  border-top-color: #2e5c31;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* No Posts State */
.no-posts {
  text-align: center;
  padding: 30px 0;
  color: #666;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-posts-icon {
  width: 80px;
  height: 80px;
  opacity: 0.7;
}

.no-posts h3 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.browse-all-btn, .create-post-btn {
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 10px;
}

.browse-all-btn:hover, .create-post-btn:hover {
  background-color: #26492a;
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.post-card {
  background-color: white;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  color: #2e5c31;
}

.user-details h4 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: #333;
}

.post-time {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.post-category {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  background-color: #e9f7e9;
  color: #2e5c31;
}

.post-category.crops {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.post-category.livestock {
  background-color: #e3f2fd;
  color: #1565c0;
}

.post-category.pests {
  background-color: #fce4ec;
  color: #c2185b;
}

.post-category.weather {
  background-color: #e1f5fe;
  color: #0277bd;
}

.post-category.equipment {
  background-color: #ede7f6;
  color: #4527a0;
}

.post-category.market {
  background-color: #fff3e0;
  color: #e65100;
}

.post-content {
  margin-bottom: 15px;
}

.post-content h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #333;
}

.post-text {
  font-size: 14px;
  color: #555;
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.post-image {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  max-height: 200px;
}

.post-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 13px;
  color: #666;
}

.stat {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background-color: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.2);
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.close-modal {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  background-color: white;
}

.form-group textarea {
  resize: vertical;
}

.image-upload-container {
  position: relative;
  margin-top: 8px;
}

.image-preview {
  width: 100%;
  height: 200px;
  border: 2px dashed #e9ecef;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.image-preview:hover {
  border-color: #3498db;
}

.image-preview.has-image {
  border-style: solid;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #6c757d;
  gap: 8px;
}

.upload-placeholder p {
  margin: 0;
  font-size: 14px;
}

.file-input {
  display: none;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 10px 20px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background-color: #eee;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #2e5c31;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background-color: #26492a;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 320px) {
  .post-card {
    padding: 12px;
  }
  
  .post-content h3 {
    font-size: 15px;
  }
  
  .post-text {
    font-size: 13px;
  }
}

@media (min-width: 375px) {
  .community-header h2 {
    font-size: 22px;
  }
  
  .create-post-button {
    padding: 14px;
  }
}

@media (min-width: 414px) {
  .categories-filter button {
    padding: 8px 15px;
    font-size: 14px;
  }
}

@media (min-width: 640px) {
  .posts-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
}

@media (min-width: 768px) {
  .content {
    padding: 20px;
  }
  
  .community-header {
    padding: 0 10px 15px;
  }
  
  .community-header h2 {
    font-size: 24px;
  }
}

@media (min-width: 1024px) {
  .posts-list {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .content {
    padding: 25px;
  }
  
  .header {
    border-bottom-left-radius: 25px;
    border-bottom-right-radius: 25px;
  }
}

.post-type-toggle {
  display: flex;
  margin-bottom: 15px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.post-type-toggle button {
  flex: 1;
  padding: 10px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-type-toggle button.active {
  background-color: #2e5c31;
  color: white;
}

.post-type-switch {
  display: flex;
  margin-bottom: 15px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f0f0f0;
}

.post-type-switch button {
  flex: 1;
  padding: 8px;
  border: none;
  background: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-type-switch button.active {
  background-color: #2e5c31;
  color: white;
}

.question-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 6px;
  background-color: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.reaction-menu {
  display: flex;
  gap: 5px;
  padding: 5px;
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: absolute;
  bottom: 40px;
  z-index: 10;
}

.reaction-menu button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.reaction-menu button:hover {
  transform: scale(1.2) translateY(-5px);
}

.stat {
  cursor: pointer;
  position: relative;
}

.stat:hover {
  color: #2e5c31;
}

.anonymous-toggle {
  margin-bottom: 1rem;
}

.toggle-options {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.toggle-options button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-options button.active {
  background: #f0f7ff;
  border-color: #4a90e2;
  color: #4a90e2;
}

/* Add any additional styles you need */
</style>