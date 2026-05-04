import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const unwrap = async (promise) => {
  const response = await promise;
  return response.data;
};

export const authAPI = {
  register: (payload) => unwrap(api.post("/auth/register", payload)),
  registerSeller: (payload) => unwrap(api.post("/auth/register-seller", payload)),
  login: (payload) => unwrap(api.post("/auth/login", payload)),
  me: () => unwrap(api.get("/auth/me")),
  logout: () => unwrap(api.post("/auth/logout"))
};

export const productsAPI = {
  list: (params = {}) => unwrap(api.get("/products", { params })),
  details: (id) => unwrap(api.get(`/products/${id}`)),
  reviews: (id) => unwrap(api.get(`/products/${id}/reviews`)),
  categories: () => unwrap(api.get("/categories"))
};

export const cartAPI = {
  get: () => unwrap(api.get("/cart")),
  add: (payload) => unwrap(api.post("/cart/add", payload)),
  remove: (payload) => unwrap(api.post("/cart/remove", payload)),
  updateItem: (itemId, payload) => unwrap(api.put(`/cart/item/${itemId}`, payload)),
  deleteItem: (itemId) => unwrap(api.delete(`/cart/item/${itemId}`)),
  clear: () => unwrap(api.delete("/cart/clear"))
};

export const ordersAPI = {
  create: (payload) => unwrap(api.post("/orders/create", payload)),
  history: (params = {}) => unwrap(api.get("/orders/history", { params })),
  details: (orderId) => unwrap(api.get(`/orders/${orderId}`))
};

export const customerAPI = {
  dashboard: () => unwrap(api.get("/customer/dashboard")),
  profile: () => unwrap(api.get("/customer/profile")),
  updateProfile: (payload) => unwrap(api.put("/customer/profile", payload)),
  wishlist: () => unwrap(api.get("/customer/wishlist")),
  addWishlist: (payload) => unwrap(api.post("/customer/wishlist/add", payload)),
  removeWishlist: (productId) => unwrap(api.delete(`/customer/wishlist/${productId}`)),
  addReview: (payload) => unwrap(api.post("/customer/reviews", payload)),
  deleteReview: (reviewId) => unwrap(api.delete(`/customer/reviews/${reviewId}`))
};

export const sellerAPI = {
  dashboard: () => unwrap(api.get("/seller/dashboard")),
  analytics: () => unwrap(api.get("/seller/analytics")),
  products: (params = {}) => unwrap(api.get("/seller/products", { params })),
  addProduct: (formData) =>
    unwrap(
      api.post("/seller/products", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    ),
  updateProduct: (id, formData) =>
    unwrap(
      api.put(`/seller/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
    ),
  deleteProduct: (id) => unwrap(api.delete(`/seller/products/${id}`)),
  orders: () => unwrap(api.get("/seller/orders")),
  updateOrderStatus: (id, payload) => unwrap(api.put(`/seller/orders/${id}/status`, payload))
};

export const adminAPI = {
  dashboard: () => unwrap(api.get("/admin/dashboard")),
  users: (params = {}) => unwrap(api.get("/admin/users", { params })),
  updateUserStatus: (id, payload) => unwrap(api.put(`/admin/users/${id}/status`, payload)),
  approveSeller: (sellerId) => unwrap(api.put(`/admin/sellers/${sellerId}/approve`)),
  products: (params = {}) => unwrap(api.get("/admin/products", { params })),
  deleteProduct: (id) => unwrap(api.delete(`/admin/products/${id}`)),
  orders: (params = {}) => unwrap(api.get("/admin/orders", { params })),
  categories: () => unwrap(api.get("/admin/categories")),
  addCategory: (payload) => unwrap(api.post("/admin/categories", payload)),
  updateCategory: (id, payload) => unwrap(api.put(`/admin/categories/${id}`, payload)),
  deleteCategory: (id) => unwrap(api.delete(`/admin/categories/${id}`)),
  exportReport: async (type) => {
    const response = await api.get("/admin/reports/export", {
      params: { type },
      responseType: "blob"
    });
    return response.data;
  }
};

export default api;
