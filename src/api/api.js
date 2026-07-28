const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

const apiCall = async (endpoint, options = {}) => {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });
  const data = await response.json();
  if (!response.ok)
    throw {
      status: response.status,
      message: data.message || "An error occurred",
      data
    };
  return data;
};

export const authAPI = {
  register: userData =>
    apiCall("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    }),
  login: credentials =>
    apiCall("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),
  forgotPassword: email =>
    apiCall("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }),
  verifyResetToken: token =>
    apiCall("/auth/verify-reset-token", {
      method: "POST",
      body: JSON.stringify({ token })
    }),
  resetPassword: (token, newPassword, confirmPassword) =>
    apiCall("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword, confirmPassword })
    })
};

export const productAPI = {
  getAllProducts: () => apiCall("/products"),
  getProductsByCategory: categoryId =>
    apiCall(`/products/category/${categoryId}`),
  getProductById: id => apiCall(`/products/${id}`),
  createProduct: data =>
    apiCall("/products", { method: "POST", body: JSON.stringify(data) }),
  getAdminProducts: () => apiCall("/admin/products")
};

export const categoryAPI = {
  getAllCategories: () => apiCall("/categories"),
  getCategoryById: id => apiCall(`/categories/${id}`),
  createCategory: data =>
    apiCall("/categories", { method: "POST", body: JSON.stringify(data) })
};

export const cartAPI = {
  addToCart: data =>
    apiCall("/cart", { method: "POST", body: JSON.stringify(data) }),
  getCart: () => apiCall("/cart"),
  updateCartItem: data =>
    apiCall("/cart", { method: "PUT", body: JSON.stringify(data) }),
  removeCartItem: data =>
    apiCall("/cart", { method: "DELETE", body: JSON.stringify(data) })
};

export const addressAPI = {
  addAddress: data =>
    apiCall("/address", { method: "POST", body: JSON.stringify(data) }),
  getAddresses: () => apiCall("/address"),
  updateAddress: data =>
    apiCall("/address", { method: "PUT", body: JSON.stringify(data) }),
  deleteAddress: data =>
    apiCall("/address", { method: "DELETE", body: JSON.stringify(data) })
};

export const orderAPI = {
  createOrder: data =>
    apiCall("/orders", { method: "POST", body: JSON.stringify(data) }),
  getUserOrders: () => apiCall("/orders"),
  getAllOrders: () => apiCall("/admin/orders"),
  getOrderById: id => apiCall(`/admin/orders/${id}`),
  updateOrderStatus: data =>
    apiCall("/admin/orders/status", {
      method: "PUT",
      body: JSON.stringify(data)
    })
};

export const updateProfile = data =>
  apiCall("/users/profile", {
    method: "PUT",
    body: JSON.stringify(data)
  });

export default {
  authAPI,
  productAPI,
  categoryAPI,
  cartAPI,
  addressAPI,
  orderAPI,
  updateProfile
};
