import API from "../api/axios";

export const wishlistAPI = {
  // Add product to wishlist
  addToWishlist: productId => API.post("/wishlist", { productId }),

  // Get all wishlist items
  getWishlist: () => API.get("/wishlist"),

  // Check if product is in wishlist
  checkInWishlist: productId => API.get(`/wishlist/check/${productId}`),

  // Remove product from wishlist
  removeFromWishlist: productId => API.delete(`/wishlist/${productId}`),

  // Clear entire wishlist
  clearWishlist: () => API.delete("/wishlist")
};
