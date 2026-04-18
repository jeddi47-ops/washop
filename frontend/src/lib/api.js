import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('washop_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('washop_token');
      localStorage.removeItem('washop_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/v1/auth/register', data),
  login: (data) => api.post('/v1/auth/login', data),
  logout: () => api.post('/v1/auth/logout'),
  me: () => api.get('/v1/auth/me'),
  refresh: () => api.post('/v1/auth/refresh'),
  forgotPassword: (data) => api.post('/v1/auth/forgot-password', data),
  resetPassword: (data) => api.post('/v1/auth/reset-password', data),
};

export const vendors = {
  list: (params) => api.get('/v1/vendors', { params }),
  get: (id) => api.get(`/v1/vendors/${id}`),
  getBySlug: (slug) => api.get(`/v1/vendors/slug/${slug}`),
  me: () => api.get('/v1/vendors/me'),
  create: (data) => api.post('/v1/vendors', data),
  updateMe: (data) => api.put('/v1/vendors/me', data),
  stats: (id) => api.get(`/v1/vendors/${id}/stats`),
};

export const products = {
  list: (params) => api.get('/v1/products', { params }),
  get: (id, incrementClick) => api.get(`/v1/products/${id}`, { params: { increment_click: incrementClick } }),
  myProducts: (params) => api.get('/v1/products/vendor/me', { params }),
  create: (data) => api.post('/v1/products', data),
  update: (id, data) => api.put(`/v1/products/${id}`, data),
  delete: (id) => api.delete(`/v1/products/${id}`),
  uploadImages: (id, formData) => api.post(`/v1/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (productId, imageId) => api.delete(`/v1/products/${productId}/images/${imageId}`),
};

export const categories = {
  list: (params) => api.get('/v1/categories', { params }),
  get: (id) => api.get(`/v1/categories/${id}`),
};

export const orders = {
  create: (data) => api.post('/v1/orders', data),
  me: (params) => api.get('/v1/orders/me', { params }),
  get: (id) => api.get(`/v1/orders/${id}`),
  updateStatus: (id, data) => api.put(`/v1/orders/${id}/status`, data),
  whatsappRedirect: (id) => api.put(`/v1/orders/${id}/whatsapp-redirect`),
};

export const reviews = {
  create: (data) => api.post('/v1/reviews', data),
  product: (id, params) => api.get(`/v1/reviews/product/${id}`, { params }),
  vendor: (id, params) => api.get(`/v1/reviews/vendor/${id}`, { params }),
  list: (params) => api.get('/v1/reviews', { params }),
  moderate: (id, data) => api.put(`/v1/reviews/${id}/moderate`, data),
};

export const wishlist = {
  list: (params) => api.get('/v1/wishlist', { params }),
  add: (data) => api.post('/v1/wishlist', data),
  remove: (productId) => api.delete(`/v1/wishlist/${productId}`),
};

export const search = {
  query: (params) => api.get('/v1/search', { params }),
  suggestions: (q) => api.get('/v1/search/suggestions', { params: { q } }),
};

export const notifications = {
  list: (params) => api.get('/v1/notifications', { params }),
  unreadCount: () => api.get('/v1/notifications/unread-count'),
  markRead: (id) => api.put(`/v1/notifications/${id}/read`),
  markAllRead: () => api.put('/v1/notifications/read-all'),
  delete: (id) => api.delete(`/v1/notifications/${id}`),
};

export const flashSales = {
  list: (params) => api.get('/v1/flash-sales', { params }),
};

export const featuredProducts = {
  list: (params) => api.get('/v1/featured-products', { params }),
};

export const accessKeys = {
  activate: (data) => api.post('/v1/access-keys/activate', data),
  history: (vendorId, params) => api.get(`/v1/access-keys/history/${vendorId}`, { params }),
  list: (params) => api.get('/v1/access-keys', { params }),
  generate: (data) => api.post('/v1/access-keys/generate', data),
  blacklist: (id) => api.put(`/v1/access-keys/${id}/blacklist`),
};

export const claims = {
  create: (data) => api.post('/v1/claims', data),
  list: (params) => api.get('/v1/claims', { params }),
  get: (id) => api.get(`/v1/claims/${id}`),
  addMessage: (id, data) => api.post(`/v1/claims/${id}/messages`, data),
  assign: (id, data) => api.put(`/v1/claims/${id}/assign`, data),
  updateStatus: (id, data) => api.put(`/v1/claims/${id}/status`, data),
};

export const flashSalesAdmin = {
  list: (params) => api.get('/v1/flash-sales', { params }),
  create: (data) => api.post('/v1/flash-sales', data),
  deactivate: (id) => api.put(`/v1/flash-sales/${id}/deactivate`),
  delete: (id) => api.delete(`/v1/flash-sales/${id}`),
};

export const admin = {
  dashboard: () => api.get('/v1/admin/dashboard'),
  logs: (params) => api.get('/v1/admin/logs', { params }),
  history: (params) => api.get('/v1/admin/history', { params }),
  searchMisses: (params) => api.get('/v1/admin/search-misses', { params }),
};

export const users = {
  list: (params) => api.get('/v1/users', { params }),
  get: (id) => api.get(`/v1/users/${id}`),
  updateStatus: (id, data) => api.put(`/v1/users/${id}/status`, data),
  delete: (id) => api.delete(`/v1/users/${id}`),
};

export default api;
