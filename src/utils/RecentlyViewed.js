const getStorageKey = userId => `recentProducts_${userId}`;

export const saveRecentProduct = (product, userId) => {
  if (!userId) return;

  const STORAGE_KEY = getStorageKey(userId);

  let recent = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  // Remove duplicate
  recent = recent.filter(item => item.id !== product.id);

  // Latest on top
  recent.unshift(product);

  // Keep only last 20
  recent = recent.slice(0, 20);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
};

export const getRecentProducts = userId => {
  if (!userId) return [];

  const STORAGE_KEY = getStorageKey(userId);

  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
};
