// services/api.service.js

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  ENDPOINTS: {
    USER: {
      LOGIN: '/user/login',
      REGISTER: '/user/register',
      ME: '/user/me',
      LOGOUT: '/user/logout',
      ALL_DOCTORS: '/user/allDoctors',
      ALL_PATIENTS: '/user/allPatients',
      ALL_USERS: '/user/all',
      DOCTORS_BY_SPECIALTY: '/user/doctors'
    },
    APPOINTMENTS: {
      BASE: '/appointments',
      BY_ID: (id) => `/appointments/${id}`,
      CREATE: (doctorId) => `/appointments/doctor/${doctorId}`,
      DELETE_USER: (id) => `/appointments/user/${id}`,
      DELETE_DOCTOR: (id) => `/appointments/doctor/${id}`
    },
    TIME_SLOTS: {
      CREATE: '/timeSlot/create',
      BASE: '/timeSlot',
      AVAILABLE: '/timeSlot/available', // For patient booking (unbooked only)
      BY_DOCTOR: (doctorId) => `/timeSlot/doctor/${doctorId}`,
      DELETE: (id) => `/timeSlot/${id}`
    }
  }
};

/**
 * API Service Class
 * Handles all API communication with the backend
 */
class ApiService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.baseURL = API_CONFIG.BASE_URL;
  }

  /**
   * Token Management
   */
  setToken(token) {
    if (token) {
      sessionStorage.setItem(this.tokenKey, token);
    } else {
      sessionStorage.removeItem(this.tokenKey);
    }
  }

  getToken() {
    return sessionStorage.getItem(this.tokenKey);
  }

  /**
   * Get request headers with authentication
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  /**
   * Generic request handler
   */
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * Authentication Methods
   */
  async login(credentials) {
    return this.request(API_CONFIG.ENDPOINTS.USER.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async register(userData) {
    return this.request(API_CONFIG.ENDPOINTS.USER.REGISTER, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getCurrentUser() {
    return this.request(API_CONFIG.ENDPOINTS.USER.ME);
  }

  async logout() {
    return this.request(API_CONFIG.ENDPOINTS.USER.LOGOUT, {
      method: 'POST'
    });
  }

  /**
   * Doctor Methods
   */
  async getDoctors() {
    return this.request(API_CONFIG.ENDPOINTS.USER.ALL_DOCTORS);
  }

  async getDoctorsBySpecialty(specialty) {
    const queryParams = new URLSearchParams({ specialty });
    return this.request(`${API_CONFIG.ENDPOINTS.USER.DOCTORS_BY_SPECIALTY}?${queryParams}`);
  }

  /**
   * Patient Methods
   */
  async getPatients() {
    try {
      return this.request(API_CONFIG.ENDPOINTS.USER.ALL_PATIENTS);
    } catch (error) {
      // If endpoint doesn't exist, return empty array instead of throwing
      console.warn('Patients endpoint not available:', error.message);
      return { data: [], patients: [] };
    }
  }

  /**
   * Get all users (for admin)
   */
  async getAllUsers() {
    return this.request(API_CONFIG.ENDPOINTS.USER.ALL_USERS);
  }

  /**
   * Appointment Methods
   */
  async getAppointments(page = 1, filters = {}) {
    const queryParams = new URLSearchParams({ page, ...filters });
    return this.request(`${API_CONFIG.ENDPOINTS.APPOINTMENTS.BASE}?${queryParams}`);
  }

  async getAppointment(id) {
    return this.request(API_CONFIG.ENDPOINTS.APPOINTMENTS.BY_ID(id));
  }

  async createAppointment(doctorId, slotId) {
    return this.request(API_CONFIG.ENDPOINTS.APPOINTMENTS.CREATE(doctorId), {
      method: 'POST',
      body: JSON.stringify({ slotId })
    });
  }

  async updateAppointment(id, updates) {
    return this.request(API_CONFIG.ENDPOINTS.APPOINTMENTS.BY_ID(id), {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteAppointmentAsUser(id) {
    return this.request(API_CONFIG.ENDPOINTS.APPOINTMENTS.DELETE_USER(id), {
      method: 'DELETE'
    });
  }

  async deleteAppointmentAsDoctor(id) {
    return this.request(API_CONFIG.ENDPOINTS.APPOINTMENTS.DELETE_DOCTOR(id), {
      method: 'DELETE'
    });
  }

  /**
   * Time Slot Methods
   */
  async createTimeSlot(slotData) {
    console.log('Creating time slot:', slotData);
    return this.request(API_CONFIG.ENDPOINTS.TIME_SLOTS.CREATE, {
      method: 'POST',
      body: JSON.stringify(slotData)
    });
  }

  /**
   * Get all slots for a doctor (for doctor dashboard - shows ALL slots)
   * @param {string} doctorId - Doctor's ID
   * @param {string} date - Optional date filter
   */
  async getAvailableSlots(doctorId, date) {
    const params = new URLSearchParams({ doctorId });
    if (date) params.append("date", date);

    return this.request(`${API_CONFIG.ENDPOINTS.TIME_SLOTS.BASE}?${params.toString()}`);
  }

  /**
   * Get only unbooked slots (for patient booking)
   * @param {string} doctorId - Doctor's ID
   * @param {string} date - Optional date filter
   */
  async getUnbookedSlots(doctorId, date) {
    const params = new URLSearchParams({ doctorId });
    if (date) params.append("date", date);

    return this.request(`${API_CONFIG.ENDPOINTS.TIME_SLOTS.AVAILABLE}?${params.toString()}`);
  }

  async deleteTimeSlot(id) {
    return this.request(API_CONFIG.ENDPOINTS.TIME_SLOTS.DELETE(id), {
      method: 'DELETE'
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;