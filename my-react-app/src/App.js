// App.jsx
import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { DoctorDashboard } from './components/dashboards/DoctorDashboard';
import { PatientDashboard } from './components/dashboards/PatientDashboard';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

/**
 * Auth Content Component
 * Handles routing between auth pages and dashboard
 */
const AuthContent = () => {
  const { isAuthenticated, loading, isAdmin, isDoctor, isPatient } = useAuth();
  const [authView, setAuthView] = useState('login');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Initializing..." />
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  // Show dashboard based on user role
 if (isAdmin) {
    return <AdminDashboard />;
  }

  // Doctor and Patient get standard layout with header
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isDoctor && <DoctorDashboard />}
        {isPatient && <PatientDashboard />}
      </main>
    </div>
  );
};

/**
 * Main App Component
 * Root component that provides authentication context
 */
function App() {
  return (
    <AuthProvider>
      <AuthContent />
    </AuthProvider>
  );
}

export default App;