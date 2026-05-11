const API_BASE_URL = "http://localhost:5000/api";

// Helper function to get token from localStorage
const getToken = () => {
  return localStorage.getItem("token");
};

// Helper function for API calls with error handling
const apiCall = async (endpoint, options = {}) => {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add token to protected routes
  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || "An error occurred",
        data,
      };
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ============ AUTH APIs ============

export const authAPI = {
  register: (userData) =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};

// ============ PRODUCT APIs ============

export const productAPI = {
  getAllProducts: () => apiCall("/products", { method: "GET" }),

  getProductsByCategory: (categoryId) => apiCall(`/products/category/${categoryId}`, { method: "GET" }),

  getProductById: (id) => apiCall(`/products/${id}`, { method: "GET" }),

  createProduct: (productData) =>
    apiCall("/products", {
      method: "POST",
      body: JSON.stringify(productData),
    }),

  getAdminProducts: () => apiCall("/admin/products", { method: "GET" }),

  getAdminProductsByCategory: (categoryId) =>
    apiCall(`/admin/products/category/${categoryId}`, { method: "GET" }),
};

export const categoryAPI = {
  getAllCategories: () => apiCall("/categories", { method: "GET" }),

  getCategoryById: (id) => apiCall(`/categories/${id}`, { method: "GET" }),

  createCategory: (categoryData) =>
    apiCall("/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
    }),
};

// ============ CART APIs ============

export const cartAPI = {
  addToCart: (cartData) =>
    apiCall("/cart", {
      method: "POST",
      body: JSON.stringify(cartData),
    }),

  getCart: () => apiCall("/cart", { method: "GET" }),

  updateCartItem: (updateData) =>
    apiCall("/cart", {
      method: "PUT",
      body: JSON.stringify(updateData),
    }),

  removeCartItem: (itemData) =>
    apiCall("/cart", {
      method: "DELETE",
      body: JSON.stringify(itemData),
    }),
};

// ============ ADDRESS APIs ============

export const addressAPI = {
  addAddress: (addressData) =>
    apiCall("/address", {
      method: "POST",
      body: JSON.stringify(addressData),
    }),

  getAddresses: () => apiCall("/address", { method: "GET" }),

  updateAddress: (addressData) =>
    apiCall("/address", {
      method: "PUT",
      body: JSON.stringify(addressData),
    }),

  deleteAddress: (deleteData) =>
    apiCall("/address", {
      method: "DELETE",
      body: JSON.stringify(deleteData),
    }),
};

// ============ ORDER APIs ============

export const orderAPI = {
  createOrder: (orderData) =>
    apiCall("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    }),

  getUserOrders: () => apiCall("/orders", { method: "GET" }),

  getAllOrders: () => apiCall("/admin/orders", { method: "GET" }),

  getOrderById: (id) => apiCall(`/admin/orders/${id}`, { method: "GET" }),

  updateOrderStatus: (statusData) =>
    apiCall("/admin/orders/status", {
      method: "PUT",
      body: JSON.stringify(statusData),
    }),
};

export default {
  authAPI,
  productAPI,
  categoryAPI,
  cartAPI,
  addressAPI,
  orderAPI,
};
