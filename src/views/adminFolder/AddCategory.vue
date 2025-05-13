<template>
    <div class="dashboard-container">
      <AdminSidebar />
      <div class="main-content">
        <div class="header-actions">
          <button class="back-btn" @click="goBack">
            <i class="fas fa-arrow-left"></i> Back to Categories
          </button>
        </div>
  
        <div class="form-container">
          <h1 class="page-title">{{ isEditMode ? 'Edit Category' : 'Add New Category' }}</h1>
          
          <form @submit.prevent="saveCategory" class="category-form">
            <div class="form-group">
              <label for="categoryName">Category Name</label>
              <input 
                type="text" 
                id="categoryName" 
                v-model="category.categoryName" 
                placeholder="Enter category name" 
                required
                :class="{ 'error': errors.categoryName }"
              />
              <span v-if="errors.categoryName" class="error-message">{{ errors.categoryName }}</span>
            </div>
  
            <div class="form-group">
              <label for="description">Description</label>
              <textarea 
                id="description" 
                v-model="category.description" 
                placeholder="Enter category description"
                rows="4"
              ></textarea>
            </div>
  
            <div class="form-group">
              <label>Category Image</label>
              <div class="image-upload-container">
                <div 
                  class="image-preview" 
                  :class="{ 'has-image': imagePreview }"
                  @click="triggerFileInput"
                >
                  <img v-if="imagePreview" :src="imagePreview" alt="Category preview" />
                  <div v-else class="upload-placeholder">
                    <i class="fas fa-cloud-upload-alt"></i>
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
              <span v-if="errors.image" class="error-message">{{ errors.image }}</span>
            </div>
  
            <div class="form-group">
              <label class="checkbox-container">
                <input type="checkbox" v-model="category.isActive" />
                <span class="checkmark"></span>
                Active Category
              </label>
            </div>
  
            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="goBack">Cancel</button>
              <button 
                type="submit" 
                class="save-btn" 
                :disabled="isSubmitting"
              >
                <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
                <span v-else>{{ isEditMode ? 'Update Category' : 'Save Category' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </template>
 <script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AdminSidebar from '@/components/AdminSidebar.vue';
import { db, storage } from '@/firebase/firebaseConfig'; // Ensure storage is imported
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export default {
  components: {
    AdminSidebar
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const fileInput = ref(null);
    const imagePreview = ref(null);
    const isSubmitting = ref(false);
    const selectedFile = ref(null);
    const isEditMode = ref(false);
    const categoryId = ref(null);

    const category = reactive({
      categoryName: '',
      description: '',
      image: '',
      isActive: true,
      productCount: 0,
      createdAt: new Date().toISOString()
    });

    const errors = reactive({
      categoryName: '',
      image: ''
    });

    // Check if we're in edit mode
    onMounted(async () => {
      console.log('AddCategory component mounted');
      
      // Check if we have an ID in the query params
      const id = route.query.id;
      if (id) {
        isEditMode.value = true;
        categoryId.value = id;
        await fetchCategoryDetails(id);
      }
    });

    const fetchCategoryDetails = async (id) => {
      try {
        console.log(`Fetching category details for ID: ${id}`);
        const categoryDoc = await getDoc(doc(db, 'categories', id));
        
        if (categoryDoc.exists()) {
          const data = categoryDoc.data();
          console.log('Category data:', data);
          
          // Update the reactive category object
          Object.keys(data).forEach(key => {
            if (key in category) {
              category[key] = data[key];
            }
          });
          
          // Set image preview if there's an image
          if (data.image) {
            imagePreview.value = data.image;
          }
        } else {
          console.error('Category not found');
          alert('Category not found');
          router.push('/category');
        }
      } catch (error) {
        console.error('Error fetching category:', error);
        alert('Failed to load category details');
      }
    };

    const triggerFileInput = () => {
      fileInput.value.click();
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validate file type
      if (!file.type.match('image.*')) {
        errors.image = 'Please select an image file';
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        errors.image = 'Image size should not exceed 2MB';
        return;
      }
      
      errors.image = '';
      selectedFile.value = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const uploadImage = async () => {
      if (!selectedFile.value) return null;
      
      const storage = getStorage();
      const filename = `categories/${Date.now()}-${selectedFile.value.name}`;
      const imageRef = storageRef(storage, filename);
      
      try {
        console.log('Uploading image to Firebase Storage...');
        const snapshot = await uploadBytes(imageRef, selectedFile.value);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Image uploaded successfully:', downloadURL);
        return downloadURL;
      } catch (error) {
        console.error("Error uploading image:", error);
        throw new Error('Failed to upload image');
      }
    };

    const validateForm = () => {
      let isValid = true;
      
      // Validate category name
      if (!category.categoryName.trim()) {
        errors.categoryName = 'Category name is required';
        isValid = false;
      } else if (category.categoryName.length < 2) {
        errors.categoryName = 'Category name must be at least 2 characters';
        isValid = false;
      } else {
        errors.categoryName = '';
      }
      
      return isValid;
    };

    const saveCategory = async () => {
      if (!validateForm()) return;
      
      isSubmitting.value = true;
      console.log('Starting category save process...');
      
      try {
        // Upload image if selected
        if (selectedFile.value) {
          console.log('Uploading image...');
          category.image = await uploadImage();
          console.log('Image uploaded successfully:', category.image);
        }
        
        // Make sure we have the current timestamp for new categories
        if (!isEditMode.value) {
          category.createdAt = new Date().toISOString();
        }
        
        // Add updatedAt timestamp for tracking changes
        category.updatedAt = new Date().toISOString();
        
        console.log('Saving category data to Firestore:', category);
        
        if (isEditMode.value && categoryId.value) {
          // Update existing category
          console.log('Updating existing category with ID:', categoryId.value);
          await updateDoc(doc(db, "categories", categoryId.value), category);
          console.log('Category updated successfully');
        } else {
          // Add new category
          console.log('Adding new category');
          const docRef = await addDoc(collection(db, "categories"), category);
          console.log('Category added successfully with ID:', docRef.id);
        }
        
        alert(isEditMode.value ? 'Category updated successfully!' : 'Category added successfully!');
        
        // Navigate back to categories list
        router.push('/category');
      } catch (error) {
        console.error("Error saving category:", error);
        alert(`Failed to save category: ${error.message}`);
      } finally {
        isSubmitting.value = false;
        console.log('Category save process completed');
      }
    };

    const goBack = () => {
      console.log('Navigating back to categories page');
      router.push('/category');
    };

    return {
      fileInput,
      imagePreview,
      isSubmitting,
      selectedFile,
      isEditMode,
      categoryId,
      category,
      errors,
      triggerFileInput,
      handleImageUpload,
      saveCategory,
      goBack
    };
  }
};
</script>

  
  <style scoped>
  @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css');
  
  .dashboard-container {
    display: flex;
    min-height: 100vh;
    background-color: #f5f7fa;
  }
  
  .main-content {
  flex: 1;
  padding: 2rem;
  margin-left: 260px; /* Add margin-left equal to sidebar width */
  width: calc(100% - 260px); /* Calculate width minus sidebar */
  position: relative;
}
  
  .header-actions {
    margin-bottom: 2rem;
  }
  
  .back-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background-color: #f8f9fa;
    color: #2c3e50;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-btn:hover {
    background-color: #e9ecef;
  }
  
  .form-container {
    background-color: white;
    border-radius: 10px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  }
  
  .page-title {
    font-size: 1.75rem;
    color: #2c3e50;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }
  
  .category-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    font-weight: 600;
    color: #2c3e50;
  }
  
  input[type="text"],
  textarea {
    padding: 0.75rem;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
  }
  
  input[type="text"]:focus,
  textarea:focus {
    border-color: #3498db;
    outline: none;
  }
  
  input[type="text"].error,
  textarea.error {
    border-color: #e74c3c;
  }
  
  .error-message {
    color: #e74c3c;
    font-size: 0.875rem;
  }
  
  .image-upload-container {
    position: relative;
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
  }
  
  .upload-placeholder i {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .upload-placeholder p {
    margin: 0;
  }
  
  .file-input {
    display: none;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .cancel-btn, .save-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .cancel-btn {
    background-color: #f8f9fa;
    color: #2c3e50;
    border: 1px solid #e9ecef;
  }
  
  .cancel-btn:hover {
    background-color: #e9ecef;
  }
  
  .save-btn {
    background-color: #3498db;
    color: white;
    min-width: 150px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .save-btn:hover:not(:disabled) {
    background-color: #2980b9;
  }
  
  .save-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
/* Update the media query to adjust for mobile */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .cancel-btn, .save-btn {
    width: 100%;
  }
  }
  </style>
