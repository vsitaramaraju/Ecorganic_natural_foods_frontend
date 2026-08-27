import API from "../../api/axios";

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED"
];

export const toArray = payload => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const requestWithFallback = async requests => {
  let lastError = null;
  for (const fn of requests) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const formatCurrency = value =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(Number(value || 0));

export const formatDate = value => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export const getOrderAmount = order =>
  Number(order?.totalAmount ?? order?.total ?? order?.amount ?? 0);

export const getOrderItemsCount = order => {
  if (Array.isArray(order?.items))
    return order.items.reduce(
      (sum, item) => sum + Number(item?.quantity ?? 1),
      0
    );
  return Number(order?.itemCount ?? 0);
};

export const getCategoryName = product => {
  if (typeof product?.category === "string") return product.category;
  return product?.category?.name || "-";
};

export const getProductCategoryId = product => {
  if (typeof product?.category === "object" && product?.category?.id)
    return String(product.category.id);
  return product?.categoryId ? String(product.categoryId) : "";
};

/* ── Shared CSV export utility (removes duplication across Sales/Reports) ── */
export const exportToCSV = (headers, rows, filename) => {
  const csv = [headers, ...rows]
    .map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename
  });
  a.click();
  URL.revokeObjectURL(url);
};

/* ── API helpers ── */
export const fetchOrders = async () => {
  const res = await requestWithFallback([
    () => API.get("/admin/orders"),
    () => API.get("/orders")
  ]);
  return toArray(res?.data);
};

export const fetchProducts = async () => {
  const res = await API.get("/admin/products");
  return toArray(res?.data);
};

export const fetchProductsByCategory = async categoryId => {
  const res = await API.get(`/admin/products/category/${categoryId}`);
  return toArray(res?.data);
};

export const fetchCategories = async () => {
  const res = await API.get("/categories");
  return toArray(res?.data);
};

export const fetchUsers = async () => {
  const res = await requestWithFallback([
    () => API.get("/admin/users"),
    () => API.get("/users")
  ]);
  return toArray(res?.data);
};

export const updateOrderStatus = async (orderId, status) => {
  await requestWithFallback([
    () => API.put("/admin/orders/status", { orderId, id: orderId, status }),
    () => API.put(`/admin/orders/${orderId}`, { status })
  ]);
};

export const saveProduct = async (payload, editingProductId) => {
  // Check if payload is FormData (for multipart file uploads)
  const isFormData = payload instanceof FormData;

  // Axios will automatically handle Content-Type for FormData
  // Don't explicitly set it to let axios set the boundary
  const config = isFormData ? {} : {};

  if (editingProductId) {
    const res = await API.put(
      `/admin/products/${editingProductId}`,
      payload,
      config
    );
    return res?.data;
  }
  const res = await API.post("/products", payload, config);
  return res?.data;
};

export const deleteProduct = async productId => {
  const res = await API.delete(`/admin/products/${productId}`);
  return res?.data;
};

export const saveCategory = async (payload, editingCategoryId) => {
  // Check if payload is FormData (for multipart file uploads)
  const isFormData = payload instanceof FormData;

  // Axios will automatically handle Content-Type for FormData
  const config = isFormData ? {} : {};

  if (editingCategoryId) {
    const res = await API.put(
      `/categories/${editingCategoryId}`,
      payload,
      config
    );
    return res?.data;
  }
  const res = await API.post("/categories", payload, config);
  return res?.data;
};

export const deleteCategory = async categoryId => {
  const res = await API.delete(`/categories/${categoryId}`);
  return res?.data;
};

export const updateUserRole = async (userId, role) => {
  const res = await requestWithFallback([
    () => API.put(`/admin/users/${userId}/role`, { role }),
    () => API.put(`/admin/users/${userId}`, { role })
  ]);
  return res?.data;
};

export const updateUser = async (userId, payload) => {
  const res = await API.put(`/admin/users/${userId}`, payload);
  return res?.data;
};

export const deleteUser = async userId => {
  const res = await API.delete(`/admin/users/${userId}`);
  return res?.data;
};
