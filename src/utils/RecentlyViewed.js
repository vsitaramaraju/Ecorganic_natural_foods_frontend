const STORAGE_KEY = "recentProducts";

export const saveRecentProduct = product => {
  let recent = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  // Remove duplicate if already exists
  recent = recent.filter(item => item.id !== product.id);

  // Add latest product to the beginning
  recent.unshift(product);

  // Keep only last 20 products
  recent = recent.slice(0, 20);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
};

export const getRecentProducts = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};
