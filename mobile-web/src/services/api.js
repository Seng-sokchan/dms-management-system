import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dms-mobile-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dms-mobile-token');
      localStorage.removeItem('dms-mobile-user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/users/me'),
};

// ── Dashboard ──
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

// ── Orders ──
export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getOrderGroups: () => api.get('/order-groups'),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  assign: (id, data) => api.post(`/orders/${id}`, data),
  updateStatus: (id, data) => api.post(`/orders/${id}/status`, data),
  confirmDelivery: (id, data) => api.post(`/orders/${id}/delivery-confirmation`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getMobileOrders: (params) => api.get('/mobile/orders', { params }),
  mobileUpdateStatus: (id, data) => api.post(`/mobile/orders/${id}/status`, data),
  getStatuses: () => api.get('/statuses'),
};

// ── Customers ──
export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.post(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// ── Catalogs ──
export const catalogsApi = {
  getAll: () => api.get('/catalogs'),
  create: (data) => api.post('/catalogs', data),
  update: (id, data) => api.post(`/catalogs/${id}`, data),
  delete: (id) => api.delete(`/catalogs/${id}`),
};

// ── Items ──
export const itemsApi = {
  getAll: (params) => api.get('/items', { params }),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.post(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// ── Payments ──
export const paymentsApi = {
  getAll: (params) => api.get('/payments', { params }),
  create: (data) => api.post('/payments', data),
  getMethods: () => api.get('/payment-methods'),
  generateKHQR: (data) => api.post('/payments/khqr', data),
  checkKHQR: (data) => api.post('/payments/khqr/check-md5-list', data),
  confirmKHQR: (data) => api.post('/payments/khqr/confirm-transaction', data),
  getBakongToken: () => api.get('/payments/bakong-token'),
};

// ── Delivery Agents ──
export const deliveryApi = {
  getAll: () => api.get('/delivery-agents'),
  create: (data) => api.post('/delivery-agents', data),
  update: (id, data) => api.post(`/delivery-agents/${id}`, data),
  delete: (id) => api.delete(`/delivery-agents/${id}`),
};

// ── Producers ──
export const producersApi = {
  getAll: () => api.get('/producers'),
  create: (data) => api.post('/producers', data),
  update: (id, data) => api.post(`/producers/${id}`, data),
  delete: (id) => api.delete(`/producers/${id}`),
};

// ── Trucks ──
export const trucksApi = {
  getAll: () => api.get('/trucks'),
  create: (data) => api.post('/trucks', data),
  update: (id, data) => api.post(`/trucks/${id}`, data),
  delete: (id) => api.delete(`/trucks/${id}`),
};
