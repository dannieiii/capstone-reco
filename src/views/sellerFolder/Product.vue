<template>
    <div class="product">
        <OfflineBanner />
        <!-- Header -->
        <div class="header">
            <h1 class="app-title">FarmXpress</h1>
            <div class="icons">
                <i class="fas fa-comments"></i>
                <i class="fas fa-user-circle"></i>
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <h2>Manage Your Products</h2>
            <p>You currently have {{ products.length }} products.</p>

            <!-- Table for Web, Cards for Mobile -->
            <div v-if="isMobile" class="product-list">
                <div v-for="(product, index) in products" :key="index" class="product-item">
                    <img :src="product.image" alt="Product Image" class="product-image" />
                    <div class="product-details">
                        <p class="product-name">{{ product.productName }}</p>
                        <p class="product-price">₱{{ product.price.toFixed(2) }}</p>
                        <p class="product-category">{{ product.category }}</p>
                        <p class="product-stock">Stock: {{ product.stock }}</p>
                    </div>
                    <div class="options">
                        <i class="fas fa-ellipsis-v" @click="toggleMenu(index)"></i>
                        <div v-if="menuIndex === index" class="menu">
                            <p @click="editProduct(product)">Edit</p>
                            <p @click="hideProduct(product)">Hide</p>
                            <p @click="deleteProduct(product.id)">Delete</p>
                        </div>
                    </div>
                </div>
            </div>

            <table v-else class="product-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(product, index) in products" :key="index">
                        <td><img :src="product.image" alt="Product Image" class="table-image" /></td>
                        <td>{{ product.productName }}</td>
                        <td>₱{{ product.price.toFixed(2) }}</td>
                        <td>{{ product.category }}</td>
                        <td>{{ product.stock }}</td>
                        <td>
                            <i class="fas fa-ellipsis-v" @click="toggleMenu(index)"></i>
                            <div v-if="menuIndex === index" class="menu">
                                <p @click="editProduct(product)">Edit</p>
                                <p @click="hideProduct(product)">Hide</p>
                                <p @click="deleteProduct(product.id)">Delete</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            <button class="add-product-btn" @click="goToAddProduct">Add Product</button>
        </div>

        <!-- Bottom Navigation -->
        <div class="bottom-nav">
            <router-link to="/seller-home"><i class="fas fa-home"></i></router-link>
            <router-link to="/add-product"><i class="fas fa-plus-circle"></i></router-link>
            <router-link to="/orders"><i class="fas fa-shopping-cart"></i></router-link>
            <router-link to="/sales"><i class="fas fa-chart-line"></i></router-link>
            <router-link to="/notifications"><i class="fas fa-bell"></i></router-link>
        </div>
    </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import OfflineBanner from '@/components/OfflineBanner.vue';

export default {
    name: "Product",
    components: { OfflineBanner },
    setup() {
        const router = useRouter();
        const products = ref([]);
        const menuIndex = ref(null);
        const isMobile = ref(window.innerWidth <= 768);
        const auth = getAuth(); // Initialize Firebase Auth

        // Check both localStorage and sessionStorage for userId
        const getUserIdFromStorage = () => {
            return localStorage.getItem("userId") || sessionStorage.getItem("userId"); // Check both storages
        };

        // Save userId to both localStorage and sessionStorage
        const saveUserIdToStorage = (userId) => {
            localStorage.setItem("userId", userId);
            sessionStorage.setItem("userId", userId);
        };

        // Clear userId from both localStorage and sessionStorage
        const clearUserIdFromStorage = () => {
            localStorage.removeItem("userId");
            sessionStorage.removeItem("userId");
        };

        // Check if the user is logged in and fetch products
        const fetchProducts = async () => {
            const userId = getUserIdFromStorage(); // Get userId from either localStorage or sessionStorage
            if (!userId) {
                alert("You must be logged in to view products.");
                router.push("/login"); // Redirect to login if no userId is found
                return;
            }

            try {
                // Fetch products only for the logged-in user
                const q = query(collection(db, "products"), where("userId", "==", userId));
                const querySnapshot = await getDocs(q);
                products.value = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
            } catch (error) {
                console.error("Error fetching products:", error);
                alert("Failed to fetch products.");
            }
        };

        // Listen for authentication state changes
        const checkAuthState = () => {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    // User is logged in, save userId to both localStorage and sessionStorage
                    saveUserIdToStorage(user.uid);
                } else {
                    // User is logged out, clear userId from both localStorage and sessionStorage
                    clearUserIdFromStorage();
                    router.push("/login"); // Redirect to login page
                }
            });
        };

        const goToAddProduct = () => {
            router.push("/add-product");
        };

        const toggleMenu = (index) => {
            menuIndex.value = menuIndex.value === index ? null : index;
        };

        const editProduct = (product) => {
            console.log("Edit product:", product);
            router.push(`/edit-product/${product.id}`); // Example: Navigate to edit page
        };

        const hideProduct = (product) => {
            console.log("Hide product:", product);
            // Implement hide functionality if needed
        };

        const deleteProduct = async (id) => {
            if (confirm("Are you sure you want to delete this product?")) {
                try {
                    await deleteDoc(doc(db, "products", id));
                    fetchProducts(); // Refresh the product list after deletion
                } catch (error) {
                    console.error("Error deleting product:", error);
                    alert("Failed to delete product.");
                }
            }
        };

        onMounted(() => {
            checkAuthState(); // Check authentication state on component mount
            fetchProducts(); // Fetch products after checking auth state
            window.addEventListener("resize", () => {
                isMobile.value = window.innerWidth <= 768;
            });
        });

        return { products, menuIndex, isMobile, goToAddProduct, toggleMenu, editProduct, hideProduct, deleteProduct };
    },
};
</script>

<style scoped>
.product {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    background: #f2f2f2;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #2e5c31;
    color: white;
}

.icons i {
    font-size: 24px;
    margin-left: 15px;
}

.main-content {
    text-align: center;
    padding: 20px;
}

.product-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.product-item {
    display: flex;
    align-items: center;
    background: white;
    padding: 10px;
    border-radius: 5px;
    margin: 5px;
    position: relative;
}

.product-image {
    width: 60px;
    height: 60px;
    border-radius: 5px;
    margin-right: 10px;
}

.product-details {
    flex-grow: 1;
    text-align: left;
}

.product-name {
    font-size: 16px;
    font-weight: bold;
}

.product-price {
    color: #2e5c31;
    font-weight: bold;
}

.options {
    position: relative;
}

.options i {
    cursor: pointer;
    font-size: 18px;
}

.menu {
    position: absolute;
    top: 20px;
    right: 0;
    background: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    border-radius: 5px;
    width: 100px;
}

.menu p {
    padding: 10px;
    cursor: pointer;
    text-align: left;
}

.menu p:hover {
    background: #f2f2f2;
}

.product-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    margin-top: 10px;
}

.product-table th, .product-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

.table-image {
    width: 50px;
    height: 50px;
    border-radius: 5px;
}

.add-product-btn {
    background: #2e5c31;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
    margin-top: 20px;
}

.add-product-btn:hover {
    background: #256127;
}

.bottom-nav {
    display: flex;
    justify-content: space-around;
    padding: 10px;
    background: white;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
}

.bottom-nav a {
    text-decoration: none;
}

.bottom-nav i {
    font-size: 24px;
    color: #2e5c31;
}
</style>
