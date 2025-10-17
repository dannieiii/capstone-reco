<template>
  <div id="app-root">
    <OfflineBanner />
   
    <router-view />
  </div>
</template>


<script>
import OfflineBanner from '@/components/OfflineBanner.vue';
import GlobalNotification from '@/components/GlobalNotification.vue';
import { getSession } from './helpers/sessionHelper';

import { ref, provide } from "vue";

export default {
  components: { OfflineBanner, GlobalNotification },
  data() {
    return {
      userSession: null,
    };
  },
  created() {
    this.userSession = getSession();
  },
  setup() {
    const categories = ref([]);
    const products = ref([
      { name: "Sample Product", price: 100, image: "sample.jpg" }
    ]);

    // Function to add a new category
    const addCategory = (category) => {
      categories.value.push(category);
    };

    // Provide categories and addCategory function to child components
    provide("categories", categories);
    provide("addCategory", addCategory);

    // Provide products to child components
    provide("products", products);

    return { categories, addCategory, products };
  }
};


</script>

<style>
#app-root { min-height: 100vh; }

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #42b983;
}
</style>
