import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spendwise_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login/register
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('spendwise_token');
        localStorage.removeItem('spendwise_user');
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Income Services
export const incomeService = {
  getAll: (params) => api.get('/income', { params }),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

// Expense Services
export const expenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Category Services
export const categoryService = {
  getAll: () => api.get('/categories'),
};

// Budget Services
export const budgetService = {
  getAll: (params) => api.get('/budgets', { params }),
  createOrUpdate: (data) => api.post('/budgets', data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

// Savings Goal Services
export const savingsService = {
  getAll: () => api.get('/savings-goals'),
  create: (data) => api.post('/savings-goals', data),
  update: (id, data) => api.put(`/savings-goals/${id}`, data),
  delete: (id) => api.delete(`/savings-goals/${id}`),
};

// Analytics Services
export const analyticsService = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getWeekly: () => api.get('/analytics/weekly'),
  getMonthly: (params) => api.get('/analytics/monthly', { params }),
  getYearly: (params) => api.get('/analytics/yearly', { params }),
  getCategories: (params) => api.get('/analytics/categories', { params }),
  getComparison: (params) => api.get('/analytics/comparison', { params }),
};

// Report Services
export const reportService = {
  getWeekly: () => api.get('/reports/weekly'),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getYearly: (params) => api.get('/reports/yearly', { params }),
};

// Profile Services
export const profileService = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
};

export default api;
