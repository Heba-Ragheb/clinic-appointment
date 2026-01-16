// components/dashboards/PatientDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Clock, Users, Activity, TrendingUp, Plus,
  Search, AlertCircle, Eye, Trash2, X, RefreshCw, 
  Bell, Settings, Stethoscope, Mail, Award, 
  CheckCircle, XCircle, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Professional Patient Dashboard Component
 */
export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadAppointments(),
        loadDoctors()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      const allAppointments = data.data || data.appointments || [];
      const patientAppointments = allAppointments.filter(
        apt => apt.patientId?._id === user._id || apt.patientId === user._id
      );
      setAppointments(patientAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setAppointments([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data.data || data.doctors || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setActionLoading(appointmentId);
      await apiService.deleteAppointmentAsUser(appointmentId);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorId?.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    const matchesSearch = searchTerm === '' || 
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSpecialty && matchesSearch;
  });

  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  const stats = {
    totalAppointments: appointments.length,
    totalDoctors: doctors.length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    upcomingAppointments: appointments.filter(apt => 
      apt.status === 'confirmed' || apt.status === 'pending'
    ).length
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

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading patient dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            {stats.pending > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button 
            onClick={loadData}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* View Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'overview'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveView('appointments')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'appointments'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveView('doctors')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'doctors'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Stethoscope className="w-4 h-4 inline mr-2" />
            Find Doctors ({doctors.length})
          </button>
        </div>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalAppointments}</p>
              <p className="text-blue-100 text-sm">Total Appointments</p>
              <div className="mt-3 pt-3 border-t border-blue-400 border-opacity-30">
                <p className="text-xs text-blue-100">
                  {stats.upcomingAppointments} upcoming
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <Activity className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.confirmed}</p>
              <p className="text-green-100 text-sm">Confirmed Appointments</p>
              <div className="mt-3 pt-3 border-t border-green-400 border-opacity-30">
                <p className="text-xs text-green-100">
                  Ready for visit
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <Users className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalDoctors}</p>
              <p className="text-purple-100 text-sm">Available Doctors</p>
              <div className="mt-3 pt-3 border-t border-purple-400 border-opacity-30">
                <p className="text-xs text-purple-100">
                  {specialties.length} specialties
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-6 h-6" />
                </div>
                <AlertCircle className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.pending}</p>
              <p className="text-yellow-100 text-sm">Pending Appointments</p>
              <div className="mt-3 pt-3 border-t border-yellow-400 border-opacity-30">
                <p className="text-xs text-yellow-100">
                  Awaiting confirmation
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Completed</h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.completed / stats.totalAppointments) * 100 || 0).toFixed(1)}% completion rate
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Cancelled</h3>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.cancelled / stats.totalAppointments) * 100 || 0).toFixed(1)}% cancellation rate
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button 
                onClick={() => setActiveView('doctors')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Book Appointment</p>
                  <p className="text-xs text-gray-500">Find a doctor</p>
                </div>
              </button>

              <button 
                onClick={() => setActiveView('appointments')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">View Appointments</p>
                  <p className="text-xs text-gray-500">{stats.totalAppointments} total</p>
                </div>
              </button>

              <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Health Records</p>
                  <p className="text-xs text-gray-500">View history</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Appointments View */}
      {activeView === 'appointments' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No appointments found</p>
              <p className="text-gray-400 text-sm mt-1">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Book your first appointment'}
              </p>
              <button
                onClick={() => setActiveView('doctors')}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Find a Doctor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant={getStatusVariant(apt.status)}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          ID: {apt._id.slice(-8)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(apt.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {apt.doctorId?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Doctor</p>
                          <p className="font-semibold text-gray-900 text-lg">
                            Dr. {apt.doctorId?.name || 'Unknown'}
                          </p>
                          {apt.doctorId?.specialty && (
                            <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                              <Award className="w-4 h-4" />
                              {apt.doctorId.specialty}
                            </p>
                          )}
                          {apt.doctorId?.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-4 h-4" />
                              {apt.doctorId.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {apt.timeSlotId && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center gap-2 text-blue-700 font-medium">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm">
                              {formatDateTime(apt.timeSlotId.startTime)}
                            </span>
                            <ArrowRight className="w-4 h-4 text-blue-400" />
                            <span className="text-sm">
                              {new Date(apt.timeSlotId.endTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelAppointment(apt._id)}
                        disabled={actionLoading === apt._id}
                        className="ml-4 p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Cancel Appointment"
                      >
                        {actionLoading === apt._id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Doctors View */}
      {activeView === 'doctors' && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Find Doctors</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
                />
              </div>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All Specialties</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredDoctors.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No doctors found</p>
              <p className="text-gray-400 text-sm mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDoctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                      {doctor.name?.charAt(0) || 'D'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Dr. {doctor.name}
                      </h3>
                      <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                        <Award className="w-4 h-4" />
                        {doctor.specialty || 'General'}
                      </p>
                    </div>
                  </div>

                  {doctor.email && (
                    <p className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {doctor.email}
                    </p>
                  )}

                  <button
                    onClick={() => window.location.href = `/book-appointment/${doctor._id}`}
                    className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;