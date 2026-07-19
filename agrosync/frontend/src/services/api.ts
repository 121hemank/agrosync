import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';
const api = axios.create({ baseURL: BASE_URL + '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const auth = {
  sendOTP: (email: string) => api.post('/auth/send-otp', { email }),
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, otp, newPassword })
};

export const farms = {
  getAll: () => api.get('/farms'),
  get: (id: string) => api.get(`/farms/${id}`),
  create: (data: FormData) => api.post('/farms', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/farms/${id}`, data),
  delete: (id: string) => api.delete(`/farms/${id}`),
  getCrops: (id: string) => api.get(`/farms/${id}/crops`),
  plantCrop: (id: string, data: any) => api.post(`/farms/${id}/crops`, data),
  updateCropStatus: (farmId: string, cropId: string, status: string) => api.patch(`/farms/${farmId}/crops/${cropId}/status`, { status })
};

export const weather = {
  current: (farmId: string) => api.get(`/weather/current/${farmId}`),
  forecast: (farmId: string) => api.get(`/weather/forecast/${farmId}`),
  history: (farmId: string) => api.get(`/weather/history/${farmId}`)
};

export const marketplace = {
  getAll: (params?: any) => api.get('/marketplace', { params }),
  get: (id: string) => api.get(`/marketplace/${id}`),
  create: (data: FormData) => api.post('/marketplace', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.put(`/marketplace/${id}`, data),
  delete: (id: string) => api.delete(`/marketplace/${id}`),
  getMyListings: () => api.get('/marketplace/my/listings')
};

export const orders = {
  create: (data: any) => api.post('/orders', data),
  getMyOrders: () => api.get('/orders/my-orders'),
  getMySales: () => api.get('/orders/my-sales'),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  complete: (id: string) => api.put(`/orders/${id}/complete`),
  get: (id: string) => api.get(`/orders/${id}`)
};

export const ai = {
  recommendCrop: (data: any) => api.post('/ai/recommend-crop', data),
  predictHarvest: (data: any) => api.post('/ai/predict-harvest', data),
  predictYield: (data: any) => api.post('/ai/predict-yield', data),
  getRecommendations: (farmId: string) => api.get(`/ai/recommendations/${farmId}`),
  getHarvestPredictions: (farmId: string) => api.get(`/ai/harvest-predictions/${farmId}`)
};

export const analytics = {
  dashboard: () => api.get('/analytics/dashboard'),
  revenue: (year?: number, farm_id?: string) => api.get('/analytics/revenue', { params: { year, farm_id } }),
  crops: () => api.get('/analytics/crops'),
  marketTrends: () => api.get('/analytics/market-trends'),
  buyer: () => api.get('/analytics/buyer')
};

export const reportsAPI = {
  pdf: (data: any) => api.post('/reports/pdf', data, { responseType: 'blob' }),
  csv: (data: any) => api.post('/reports/csv', data, { responseType: 'blob' }),
  getAll: () => api.get('/reports')
};

export const notifications = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  unreadCount: () => api.get('/notifications/unread-count')
};

export const admin = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  updateUserStatus: (id: string, status: string) => api.put(`/admin/users/${id}/status`, { status }),
  products: () => api.get('/admin/products'),
  orders: () => api.get('/admin/orders'),
  analytics: () => api.get('/admin/analytics')
};

export const cropsAPI = {
  getAll: () => api.get('/crops')
};

export const calendar = {
  getAll: (params?: any) => api.get('/calendar', { params }),
  getUpcoming: () => api.get('/calendar/upcoming'),
  get: (id: string) => api.get(`/calendar/${id}`),
  create: (data: any) => api.post('/calendar', data),
  update: (id: string, data: any) => api.put(`/calendar/${id}`, data),
  delete: (id: string) => api.delete(`/calendar/${id}`),
  complete: (id: string) => api.patch(`/calendar/${id}/complete`),
  getAlerts: () => api.get('/calendar/alerts/weather'),
  markAlertRead: (id: string) => api.patch(`/calendar/alerts/${id}/read`),
  generateAlerts: (farm_id: string) => api.post('/calendar/alerts/generate', { farm_id })
};

export const expenses = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  get: (id: string) => api.get(`/expenses/${id}`),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  categorySummary: (params?: any) => api.get('/expenses/summary/by-category', { params }),
  monthlySummary: (params?: any) => api.get('/expenses/summary/monthly', { params }),
  profitability: (params?: any) => api.get('/expenses/summary/profitability', { params })
};

export const marketPrices = {
  getAll: (params?: any) => api.get('/market-prices', { params }),
  getCrops: () => api.get('/market-prices/crops'),
  getHistory: (cropName: string) => api.get(`/market-prices/history/${encodeURIComponent(cropName)}`),
  getSummary: () => api.get('/market-prices/summary'),
  refresh: () => api.post('/market-prices/refresh')
};

export const profile = {
  get: () => api.get('/profile'),
  update: (data: FormData) => api.put('/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/profile/change-password', { currentPassword, newPassword })
};

export default api;
