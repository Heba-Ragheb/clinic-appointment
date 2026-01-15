// components/dashboards/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, Stethoscope, XCircle,
  MapPin, Phone, Mail, Plus, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Patient Dashboard Component
 * View and manage patient appointments
 */
export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAppointments();
      setAppointments(data.data || data.appointments || data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
      if (!err.message?.includes('No data found')) {
        console.warn('Failed to load appointments, using empty array');
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const myAppointments = appointments.filter(apt => {
    const patientId = apt.patientId?._id || apt.patientId;
    const userId = user._id || user.id;
    return patientId && userId && patientId.toString() === userId.toString();
  });

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setActionLoading(id);
      await apiService.deleteAppointmentAsUser(id);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    total: myAppointments.length,
    upcoming: myAppointments.filter(apt => 
      apt.status === 'confirmed' || apt.status === 'pending'
    ).length,
    completed: myAppointments.filter(apt => apt.status === 'completed').length
  };

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'default';
  };

  const sortedAppointments = [...myAppointments].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (loading) {
    return <LoadingSpinner message="Loading your appointments..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hello, {user.name}</h1>
        <p className="text-gray-500 mt-1">Track and manage your health appointments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">All appointments</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcoming}</p>
              <p className="text-xs text-gray-500 mt-1">Scheduled visits</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">Past visits</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Need a checkup?</h3>
            <p className="text-blue-100 text-sm">Browse available doctors and book your next appointment</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2 shadow-md">
            Find Doctor
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Appointments Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
            <Plus className="w-4 h-4" />
            Book New
          </button>
        </div>
        
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
            <p className="text-gray-500 mb-6">Start your healthcare journey by booking your first appointment</p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Book First Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedAppointments.map((apt) => (
              <div 
                key={apt._id} 
                className="border border-gray-100 rounded-xl p-6 hover:border-blue-200 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant={getStatusVariant(apt.status)} size="lg">
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(apt.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {/* Doctor Information */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <Stethoscope className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          Dr. {apt.doctorId?.name || 'Unknown Doctor'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {apt.doctorId?.specialty || 'General Practitioner'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Appointment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-[72px]">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">
                          {new Date(apt.createdAt).toLocaleString('en-US', {
                            weekday: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {apt.doctorId?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{apt.doctorId.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                    <button
                      onClick={() => handleDeleteAppointment(apt._id)}
                      disabled={actionLoading === apt._id}
                      className="p-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                      title="Cancel appointment"
                    >
                      {actionLoading === apt._id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Tips Card */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Stay Healthy</h3>
            <p className="text-sm text-gray-600 mb-3">
              Regular checkups are important for maintaining good health. Schedule your next appointment today!
            </p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Annual physical examination
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Dental checkup every 6 months
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                Eye examination annually
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;