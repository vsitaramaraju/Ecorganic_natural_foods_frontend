export const RecentlyViewed = product => {
  const existing = JSON.parse(localStorage.getItem("recentProducts")) || [];

  const filtered = existing.filter(item => item.id !== product.id);

  const updated = [product, ...filtered].slice(0, 10);

  localStorage.setItem("recentProducts", JSON.stringify(updated));
};
