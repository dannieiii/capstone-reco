import { createRouter, createWebHistory } from 'vue-router';
import store from '../store'; // Import the store

// Import all your components
import Register from '../views/Register.vue';
import Login from '../views/Login.vue';
import ResetPassword from '../views/ResetPassword.vue';
import ChangePassword from '../views/ChangePassword.vue';
import HomeView from '../views/HomeView.vue';

// Admin components

import AddCategory from '../views/adminFolder/AddCategory.vue';
import AdminSeller from '../views/adminFolder/AdminSeller.vue';
import AdminCustomer from '../views/adminFolder/AdminCustomer.vue';
import AdminRegister from '../views/adminFolder/AdminRegister.vue';
import AdminDashboard from '../views/adminFolder/AdminDashboard.vue';
import Dashboard from '../views/adminFolder/Dashboard.vue'; 
import Sellers from '../views/adminFolder/Sellers.vue';
import Customers from '../views/adminFolder/Customers.vue';
import Products from '../views/adminFolder/Products.vue';
import ProductCategories from '../views/adminFolder/ProductCategories.vue';
import SellerDetails from '../views/adminFolder/SellerDetails.vue';
import AdminEditProfile from '../views/adminFolder/AdminEditProfile.vue';
import PriceMonitoring from '../views/adminFolder/PriceMonitoring.vue';
import Overpricing from '../views/adminFolder/Overpricing.vue';
import AddAdmin from '../views/adminFolder/AddAdmin.vue';



// Customer components
import Profile from '../views/customerFolder/Profile.vue';
import EditProfile from '../views/customerFolder/EditProfile.vue';
import CustomerDashboard from '../views/customerFolder/CustomerDashboard.vue';
import ProductDetails from '../views/customerFolder/ProductDetails.vue';
import Checkout from '../views/customerFolder/Checkout.vue';
import Messages from '../views/customerFolder/Messages.vue';
import CustomerOrders from '../views/customerFolder/CustomerOrders.vue';
import Cart from '../views/customerFolder/Cart.vue';
import FarmStore from '../views/customerFolder/FarmStore.vue';


// Seller components
import ProductManagement from '../views/sellerFolder/ProductManagement.vue';
import Product from '../views/sellerFolder/Product.vue';

import SellerDashboard from '../views/sellerFolder/SellerDashboard.vue';


import RegisterSeller from '../views/sellerFolder/RegisterSeller.vue';
import AddEditProduct from '@/views/sellerFolder/AddEditProduct.vue';
import Chat from '@/views/sellerFolder/Chat.vue';
import Orders from '../views/sellerFolder/Orders.vue';
import SellerHome from '@/views/sellerFolder/SellerHome.vue';
import SellerEditProfile from '@/views/sellerFolder/SellerEditProfile.vue';
import SellerChat from '@/views/sellerFolder/SellerChat.vue';
import Forecasting from '@/views/sellerFolder/Forecasting.vue';
import CropForecasting from '@/views/sellerFolder/CropForecasting.vue';
import CustomersTable from '@/views/sellerFolder/CustomersTable.vue';
import Analytics from '@/views/sellerFolder/Analytics.vue';
import HelpSeller from '@/views/sellerFolder/HelpSeller.vue';
import HarvestCalendarPage from '@/views/sellerFolder/HarvestCalendarPage.vue';


const routes = [
  {
    path: '/chat',
    name: 'Chat',
    component: Chat
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders
  },
  {
    path: '/edit-product/:id',
    name: 'EditProduct',
    component: AddEditProduct
  },
  {
    path: '/addproduct',
    name: 'AddProduct',
    component: AddEditProduct
  },

  {
    path: '/admin',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/admin/sellers',
    name: 'Sellers',
    component: Sellers
  },
  {
    path: '/admin/customers',
    name: 'Customers',
    component: Customers
  },
  {
    path: '/admin/categories',
    name: 'ProductCategories',
    component: ProductCategories
  },
  {
    path: '/admin/products',
    name: 'Products',
    component: Products
  },
  {
    path: '/admin/sellers/:id',
    name: 'SellerDetails',
    component: SellerDetails
  },
  {
    path: '/product-details',
    name: 'ProductDetails',
    component: ProductDetails,
    meta: { requiresAuth: false },
  },
  {
    path: '/product/:productId', // Your dynamic route (unchanged)
    component: ProductDetails,
    props: true // Your props: true (unchanged)
  },
  {
    path: '/',
    name: 'homeview',
    component: HomeView,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/registration',
    name: 'registration',
    component: Register,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/reset-password',
    name: 'resetpassword',
    component: ResetPassword,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/change-password',
    name: 'changepassword',
    component: ChangePassword,
    meta: { requiresAuth: true }, // Requires authentication
  },
  {
    path: '/register-seller',
    name: 'registerseller',
    component: RegisterSeller,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/admin-register',
    name: 'admin',
    component: AdminRegister,
    meta: { requiresAuth: false }, // Public route
  },
  {
    path: '/admin-dashboard',
    name: 'admindashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, allowedRoles: ['admin'] }, // Only admins can access
  },
  {
    path: '/admin-customer',
    name: 'AdminCcustomer',
    component: AdminCustomer,
    meta: { requiresAuth: true, allowedRoles: ['admin'] }, // Only admins can access
  },
  {
    path: '/admin-seller',
    name: 'AdminSeller',
    component: AdminSeller,
    meta: { requiresAuth: true, allowedRoles: ['admin'] }, // Only admins can access
  },
  {
    path: '/seller-dashboard',
    name: 'seller-dashboard',
    component: SellerDashboard,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }, // Only sellers can access
  },
  {
    path: '/customer-dashboard',
    name: 'CustomerDashboard',
    component: CustomerDashboard,
    meta: { requiresAuth: true, allowedRoles: ['customer'] }, // Only customers can access
  },
  {
    path: '/product',
    name: 'product',
    component: Product,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }, // Only sellers can access
  },
 
  {
    path: '/add-category',
    name: 'addcategory',
    component: AddCategory,
    meta: { requiresAuth: true, allowedRoles: ['admin'] }, // Only admins can access
  },
  {
    path: '/seller-home',
    name: 'sellerhome',
    component: SellerHome,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }, // Only sellers can access
  },
  {
    path: '/seller/edit-profile',
    name: 'sellereditprofile',
    component: SellerEditProfile,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }, // Only sellers can access
  },
  {
    path: '/edit-profile',
    name: 'editprofile',
    component: EditProfile,
    meta: { requiresAuth: true }, // Requires authentication
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }, // Requires authentication
  },
  {
    path: '/products',
    name: 'productmanagement',
    component: ProductManagement
  },
 
  {
    path: '/admin/edit-profile',
    name: 'admineditprofile',
    component: AdminEditProfile
  },
 {
    path: '/seller/forecasting',
    name: 'forecasting',
    component: Forecasting,
    meta: { requiresAuth: true, allowedRoles: ['seller'] },
  },
  {
    path: '/admin/price-monitoring',
    name: 'pricemonitoring',
    component: PriceMonitoring
  },
  {
    path: '/seller/chat',
    name: 'sellerchat',
    component: SellerChat
  },
  {
    path: '/messages',
    name: 'messages',
    component: Messages
  },
  {
    path: '/seller/crop-forecast',
    name: 'cropforecasting',
    component: CropForecasting
  },
  {
    path: '/seller/customer',
    name: 'customerstable',
    component: CustomersTable,
    meta: { requiresAuth: true, allowedRoles: ['seller'] },
  },
  {
    path: '/seller/analytics',
    name: 'analytics',
    component: Analytics,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }
  },
  {
    path: '/customer/orders',
    name: 'customerorders',
    component: CustomerOrders,
    meta: { requiresAuth: true, allowedRoles: ['customer'] },
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart,
    meta: { requiresAuth: true, allowedRoles: ['customer'] }
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: Checkout,
    props: (route) => ({
      orderData: {
        productId: route.query.productId,
        productName: route.query.productName,
        productImage: route.query.productImage,
        weight: parseFloat(route.query.weight),
        packagingType: route.query.packagingType,
        totalPrice: parseFloat(route.query.totalPrice),
        sellerId: route.query.sellerId
      }
    })
  },
  {
    path: '/overpricing',
    name: 'overpricing',
    component: Overpricing
  },
  {
    path: '/farmstore',
    name: 'farmStore',
    component: FarmStore
  },
  {
    path: '/sellerhelp',
    name: 'helpSeller',
    component: HelpSeller
  },
  {
    path: '/admin/add-admin',
    name: 'AddAdmin',
    component: AddAdmin,
    meta: { requiresAuth: true, allowedRoles: ['admin'] }, // Only admins can access
  },
  {
    path: '/harvest-calendar',
    name: 'HarvestCalendarPage',
    component: HarvestCalendarPage,
    meta: { requiresAuth: true, allowedRoles: ['seller'] }, // Only admins can access
  },
 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Route guard to check authentication and roles
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const allowedRoles = to.meta.allowedRoles;

  const user = store.state.user;
  const role = store.state.role;

  if (requiresAuth && !user) {
    // Redirect to login if the route requires authentication and the user is not logged in
    next('/login');
  } else if (requiresAuth && allowedRoles && !allowedRoles.includes(role)) {
    // Redirect to home or a "not authorized" page if the user's role is not allowed
    next('/');
  } else {
    // Proceed to the route
    next();
  }
});

export default router;