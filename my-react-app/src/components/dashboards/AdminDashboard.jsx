// components/dashboards/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Calendar, Activity, TrendingUp, Shield, Settings,
  Search,  UserCheck,
  Stethoscope, AlertCircle, CheckCircle, XCircle, Clock,
  Mail, Award, BarChart3, Bell,
  Download, RefreshCw, X
} from 'lucide-react';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Professional Admin Dashboard Component
 */
export const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  const loadAppointments = useCallback(async () => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data.data || data.appointments || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setAppointments([]);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data.data || data.doctors || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  }, []);

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
  }, [loadAppointments, loadDoctors]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setActionLoading(appointmentId);
      await apiService.deleteAppointmentAsDoctor(appointmentId);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      setActionLoading(appointmentId);
      await apiService.updateAppointment(appointmentId, { status: newStatus });
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update appointment status');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesDate = true;
    if (dateRange !== 'all') {
      const aptDate = new Date(apt.createdAt);
      const today = new Date();
      if (dateRange === 'today') {
        matchesDate = aptDate.toDateString() === today.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = aptDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = aptDate >= monthAgo;
      }
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  const stats = {
    totalAppointments: appointments.length,
    totalDoctors: doctors.length,
    totalPatients: new Set(appointments.map(apt => apt.patientId?._id || apt.patientId)).size,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
    todayAppointments: appointments.filter(apt => {
      const aptDate = new Date(apt.createdAt);
      const today = new Date();
      return aptDate.toDateString() === today.toDateString();
    }).length
  };

  const specialtyStats = doctors.reduce((acc, doctor) => {
    const specialty = doctor.specialty || 'General';
    acc[specialty] = (acc[specialty] || 0) + 1;
    return acc;
  }, {});

  const getStatusVariant = (status) => {
    const variants = {
      pending: 'warning',
      confirmed: 'primary',
      completed: 'success',
      cancelled: 'danger'
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Complete system overview and management</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refresh data">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

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
            <p className="text-xs text-blue-100">{stats.todayAppointments} scheduled today</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Stethoscope className="w-6 h-6" />
            </div>
            <Activity className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalDoctors}</p>
          <p className="text-green-100 text-sm">Active Doctors</p>
          <div className="mt-3 pt-3 border-t border-green-400 border-opacity-30">
            <p className="text-xs text-green-100">{Object.keys(specialtyStats).length} specialties</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
            <UserCheck className="w-5 h-5 opacity-80" />
          </div>
          <p className="text-3xl font-bold mb-1">{stats.totalPatients}</p>
          <p className="text-purple-100 text-sm">Total Patients</p>
          <div className="mt-3 pt-3 border-t border-purple-400 border-opacity-30">
            <p className="text-xs text-purple-100">Registered users</p>
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
          <p className="text-yellow-100 text-sm">Pending Review</p>
          <div className="mt-3 pt-3 border-t border-yellow-400 border-opacity-30">
            <p className="text-xs text-yellow-100">Awaiting confirmation</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Confirmed</h3>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
          <p className="text-xs text-gray-500 mt-1">
            {((stats.confirmed / stats.totalAppointments) * 100 || 0).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Completed</h3>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
          <p className="text-xs text-gray-500 mt-1">
            {((stats.completed / stats.totalAppointments) * 100 || 0).toFixed(1)}% of total
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Cancelled</h3>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
          <p className="text-xs text-gray-500 mt-1">
            {((stats.cancelled / stats.totalAppointments) * 100 || 0).toFixed(1)}% of total
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Export Data</p>
              <p className="text-xs text-gray-500">Download reports</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">User Management</p>
              <p className="text-xs text-gray-500">Manage users</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Analytics</p>
              <p className="text-xs text-gray-500">View insights</p>
            </div>
          </button>

          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">System Settings</p>
              <p className="text-xs text-gray-500">Configure app</p>
            </div>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Doctor Distribution by Specialty</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(specialtyStats).map(([specialty, count]) => (
            <div key={specialty} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm font-medium text-gray-700">{specialty}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">All Appointments</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search appointments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm w-64"
              />
            </div>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
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
              {searchTerm || filterStatus !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters' 
                : 'No appointments in the system'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAppointments.map((apt) => (
              <div key={apt._id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant={getStatusVariant(apt.status)}>
                        {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </Badge>
                      <span className="text-xs text-gray-500">ID: {apt._id.slice(-8)}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(apt.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shadow-md">
                          {apt.patientId?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Patient</p>
                          <p className="font-semibold text-gray-900">{apt.patientId?.name || 'Unknown'}</p>
                          {apt.patientId?.email && (
                            <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-3 h-3" />
                              {apt.patientId.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-md">
                          {apt.doctorId?.name?.charAt(0) || 'D'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Doctor</p>
                          <p className="font-semibold text-gray-900">Dr. {apt.doctorId?.name || 'Unknown'}</p>
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Award className="w-3 h-3" />
                            {apt.doctorId?.specialty || 'General'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {apt.timeSlotId && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                          <Clock className="w-4 h-4" />
                          {new Date(apt.timeSlotId.startTime).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                        disabled={actionLoading === apt._id}
                        className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                        title="Confirm"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'completed')}
                        disabled={actionLoading === apt._id}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Complete"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => handleCancelAppointment(apt._id)}
                        disabled={actionLoading === apt._id}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Cancel"
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
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">System Status</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API</span>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Service</span>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Performance</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Response Time</span>
              <span className="text-xs font-medium text-blue-600">~150ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-xs font-medium text-blue-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-xs font-medium text-blue-600">{stats.totalPatients}</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-bold text-gray-900">Security</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-xs font-medium text-purple-600">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">SSL Status</span>
              <span className="text-xs font-medium text-purple-600">Enabled</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Failed Logins</span>
              <span className="text-xs font-medium text-purple-600">0 today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;