const API_URL = 'http://localhost:8000/api';

export const api = {
  setToken: (token) =>
    token ? localStorage.setItem('token', token) : localStorage.removeItem('token'),

  getToken: () => localStorage.getItem('token'),

  headers: () => ({
    'Content-Type': 'application/json',
    ...(localStorage.getItem('token')
      ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
      : {}),
  }),

  async request(endpoint, options = {}) {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: this.headers(),
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  login: (data) => api.request('/user/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => api.request('/user/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api.request('/user/me'),
  logout: () => api.request('/user/logout', { method: 'POST' }),

  getAppointments: () => api.request('/appointments'),
  updateAppointment: (id, status) =>
    api.request(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  createSlot: (data) =>
    api.request('/timeSlot/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSlot: (id) => api.request(`/timeSlot/${id}`, { method: 'DELETE' }),
};
