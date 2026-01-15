
import { 
  STATUS_COLORS, 
  PRIORITY_COLORS, 
  DATE_FORMAT_OPTIONS,
  VALIDATION 
} from './constants';

/**
 * Format date with specified options
 */
export const formatDate = (date, format = 'SHORT') => {
  if (!date) return 'N/A';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleString('en-US', DATE_FORMAT_OPTIONS[format]);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Get status badge styling
 */
export const getStatusBadge = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS.pending;
};

/**
 * Get priority badge styling
 */
export const getPriorityBadge = (priority) => {
  return PRIORITY_COLORS[priority] || PRIORITY_COLORS.moderate;
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number format
 */
export const validatePhone = (phone) => {
  return VALIDATION.PHONE_REGEX.test(phone);
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Debounce function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

/**
 * Sort array by date
 */
export const sortByDate = (array, dateKey, order = 'desc') => {
  return [...array].sort((a, b) => {
    const dateA = new Date(a[dateKey]);
    const dateB = new Date(b[dateKey]);
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
};

/**
 * Filter appointments by status
 */
export const filterByStatus = (appointments, status) => {
  if (status === 'all') return appointments;
  return appointments.filter(apt => apt.status === status);
};

/**
 * Search in appointments
 */
export const searchAppointments = (appointments, searchTerm) => {
  if (!searchTerm) return appointments;
  
  const term = searchTerm.toLowerCase();
  return appointments.filter(apt => 
    apt.patientId?.name?.toLowerCase().includes(term) ||
    apt.patientId?.email?.toLowerCase().includes(term) ||
    apt.doctorId?.name?.toLowerCase().includes(term) ||
    apt.doctorId?.email?.toLowerCase().includes(term) ||
    apt.doctorId?.specialty?.toLowerCase().includes(term)
  );
};

/**
 * Calculate appointment statistics
 */
export const calculateStats = (appointments) => {
  return {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    todayCount: appointments.filter(a => {
      const today = new Date().toDateString();
      return new Date(a.createdAt).toDateString() === today;
    }).length
  };
};

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format time slot
 */
export const formatTimeSlot = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  const timeFormat = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return `${start.toLocaleTimeString('en-US', timeFormat)} - ${end.toLocaleTimeString('en-US', timeFormat)}`;
};

/**
 * Check if appointment is today
 */
export const isToday = (date) => {
  const today = new Date().toDateString();
  return new Date(date).toDateString() === today;
};

/**
 * Check if appointment is upcoming
 */
export const isUpcoming = (date) => {
  return new Date(date) > new Date();
};

/**
 * Get time difference
 */
export const getTimeDifference = (date) => {
  const now = new Date();
  const appointmentDate = new Date(date);
  const diff = appointmentDate - now;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (diff > 0) {
    return 'soon';
  } else {
    return 'past';
  }
};