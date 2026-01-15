
// utils/constants.js

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'Admin',
  DOCTOR: 'Doctor',
  PATIENT: 'Patient',
  NURSE: 'Nurse'
};

/**
 * Appointment Statuses
 */
export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

/**
 * Appointment Priorities
 */
export const APPOINTMENT_PRIORITY = {
  MODERATE: 'moderate',
  IMPORTANT: 'important',
  CRITICAL: 'critical'
};

/**
 * Status Badge Colors
 */
export const STATUS_COLORS = {
  [APPOINTMENT_STATUS.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    variant: 'warning'
  },
  [APPOINTMENT_STATUS.CONFIRMED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    variant: 'primary'
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    variant: 'success'
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    variant: 'danger'
  }
};

/**
 * Priority Badge Colors
 */
export const PRIORITY_COLORS = {
  [APPOINTMENT_PRIORITY.MODERATE]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    variant: 'default'
  },
  [APPOINTMENT_PRIORITY.IMPORTANT]: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    variant: 'warning'
  },
  [APPOINTMENT_PRIORITY.CRITICAL]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    variant: 'danger'
  }
};

/**
 * Form Validation Rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
};

/**
 * Date Format Options
 */
export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  },
  LONG: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  WITH_TIME: {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  },
  FULL: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
};
