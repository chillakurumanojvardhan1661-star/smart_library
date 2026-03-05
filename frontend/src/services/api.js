import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

export const bookAPI = {
  getAll: (params) => api.get('/books', { params }),
  getById: (id) => api.get(`/books/${id}`),
  create: (data) => api.post('/books', data),
  update: (id, data) => api.put(`/books/${id}`, data),
  delete: (id) => api.delete(`/books/${id}`),
};

export const memberAPI = {
  getAll: () => api.get('/members'),
  getById: (id) => api.get(`/members/${id}`),
  getHistory: (id) => api.get(`/members/${id}/history`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
};

export const issueAPI = {
  getAll: (params) => api.get('/issues', { params }),
  getOverdue: () => api.get('/issues/overdue'),
  issue: (data) => api.post('/issues', data),
  return: (id) => api.put(`/issues/${id}/return`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getActivities: () => api.get('/admin/activities'),
};

export const reservationAPI = {
  create: (data) => api.post('/reservations', data),
  getUserReservations: () => api.get('/reservations/my-reservations'),
  getAllReservations: (params) => api.get('/reservations', { params }),
  approve: (id) => api.patch(`/reservations/${id}/approve`),
  reject: (id) => api.patch(`/reservations/${id}/reject`),
  cancel: (id) => api.patch(`/reservations/${id}/cancel`),
};

export const fineAPI = {
  getAll: () => api.get('/fines'),
  getStats: () => api.get('/fines/stats'),
  getMyBalance: () => api.get('/fines/my-balance'),
  getMyFines: () => api.get('/fines/my-fines'),
  getById: (id) => api.get(`/fines/${id}`),
  getDetails: (id) => api.get(`/fines/${id}/details`),
  recordPayment: (id, data) => api.post(`/fines/${id}/payment`, data),
  waive: (id, data) => api.post(`/fines/${id}/waive`, data),
  createManual: (data) => api.post('/fines/manual', data),
  updateAmount: (id, data) => api.patch(`/fines/${id}/amount`, data),
  updateStatus: (id, data) => api.patch(`/fines/${id}/status`, data),
  deleteFine: (id) => api.delete(`/fines/${id}`),
  bulkWaive: (data) => api.post('/fines/bulk/waive', data),
};

export const uploadAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
