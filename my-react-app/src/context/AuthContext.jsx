// context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/api.service';

/**
 * Authentication Context
 */
const AuthContext = createContext(null);

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

/**
 * Authentication Provider Component
 * Manages user authentication state and operations
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Verify user authentication
   */
  const checkAuth = useCallback(async () => {
    const token = apiService.getToken();
    
    if (token) {
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData.user || userData);
      } catch (err) {
        console.error('Authentication check failed:', err);
        apiService.setToken(null);
        setUser(null);
      }
    }
    
    setLoading(false);
  }, []);

  /**
   * Login user
   */
  const login = useCallback(async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await apiService.login(credentials);
      apiService.setToken(data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const data = await apiService.register(userData);
      apiService.setToken(data.token);
      setUser(data.user);
      
      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      apiService.setToken(null);
      setUser(null);
      setError(null);
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback((updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Context value
   */
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    checkAuth,
    
    // Computed properties
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isDoctor: user?.role === 'Doctor',
    isPatient: user?.role === 'Patient',
    isNurse: user?.role === 'Nurse'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;