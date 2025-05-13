// services/productService.js
export async function fetchProductById(productId) {
    const response = await fetch(`/api/products/${productId}`);
    if (!response.ok) {
      throw new Error('Product not found');
    }
    return response.json();
  }