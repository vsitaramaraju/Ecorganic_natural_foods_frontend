import API from "../../api/axios";

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export const toArray = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
};

export const requestWithFallback = async (requests) => {
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

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

export const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const getOrderAmount = (order) => Number(order?.totalAmount ?? order?.total ?? order?.amount ?? 0);

export const getOrderItemsCount = (order) => {
  if (Array.isArray(order?.items)) {
    return order.items.reduce((sum, item) => sum + Number(item?.quantity ?? 1), 0);
  }

  return Number(order?.itemCount ?? 0);
};

export const getCategoryName = (product) => {
  if (typeof product?.category === "string") {
    return product.category;
  }

  return product?.category?.name || "-";
};

export const getProductCategoryId = (product) => {
  if (typeof product?.category === "object" && product?.category?.id) {
    return String(product.category.id);
  }

  return product?.categoryId ? String(product.categoryId) : "";
};

export const fetchOrders = async () => {
  const res = await requestWithFallback([() => API.get("/admin/orders"), () => API.get("/orders")]);
  return toArray(res?.data);
};

export const fetchProducts = async () => {
  const res = await API.get("/admin/products");
  return toArray(res?.data);
};

export const fetchProductsByCategory = async (categoryId) => {
  const res = await API.get(`/admin/products/category/${categoryId}`);
  return toArray(res?.data);
};

export const fetchCategories = async () => {
  const res = await API.get("/categories");
  return toArray(res?.data);
};

export const updateOrderStatus = async (orderId, status) => {
  await requestWithFallback([
    () => API.put("/admin/orders/status", { orderId, id: orderId, status }),
    () => API.put(`/admin/orders/${orderId}`, { status }),
  ]);
};

export const saveProduct = async (payload, editingProductId) => {
  if (editingProductId) {
    throw new Error("Product update API is not available in current backend");
  }

  await API.post("/products", payload);
};

export const deleteProduct = async (productId) => {
  throw new Error(`Product delete API is not available in current backend for product ${productId}`);
};

export const saveCategory = async (payload, editingCategoryId) => {
  if (editingCategoryId) {
    throw new Error("Category update API is not available in current backend");
  }

  await API.post("/categories", payload);
};

export const deleteCategory = async (categoryId) => {
  throw new Error(`Category delete API is not available in current backend for category ${categoryId}`);
};
