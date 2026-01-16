// components/dashboards/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Users, Activity, TrendingUp, Plus,
  Search, Filter, CheckCircle, XCircle, AlertCircle, Eye,
  Edit, Trash2, Save, X, RefreshCw, Bell, Settings,
  Stethoscope, Mail, Phone, Award, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Professional Doctor Dashboard Component
 */
export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview'); // overview, appointments, schedule
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [newSlot, setNewSlot] = useState({
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadAppointments(),
        loadTimeSlots()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      const allAppointments = data.data || data.appointments || [];
      // Filter appointments for this doctor
      const doctorAppointments = allAppointments.filter(
        apt => apt.doctorId?._id === user._id || apt.doctorId === user._id
      );
      setAppointments(doctorAppointments);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setAppointments([]);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const data = await apiService.getAvailableSlots(user._id);
      setTimeSlots(data || []);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setTimeSlots([]);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    if (!newSlot.startTime || !newSlot.endTime) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setActionLoading('create');
      await apiService.createTimeSlot({
        startTime: newSlot.startTime,
        endTime: newSlot.endTime
      });
      
      setNewSlot({ startTime: '', endTime: '' });
      setShowCreateSlot(false);
      await loadTimeSlots();
    } catch (err) {
      alert(err.message || 'Failed to create time slot');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this time slot?')) {
      return;
    }

    try {
      setActionLoading(slotId);
      await apiService.deleteTimeSlot(slotId);
      await loadTimeSlots();
    } catch (err) {
      alert(err.message || 'Failed to delete time slot');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, newStatus) => {
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

  // Filter appointments
  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate statistics
  const stats = {
    totalAppointments: appointments.length,
    totalSlots: timeSlots.length,
    availableSlots: timeSlots.filter(slot => !slot.isBooked).length,
    bookedSlots: timeSlots.filter(slot => slot.isBooked).length,
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
    return <LoadingSpinner message="Loading doctor dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Dr. {user.name}</p>
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
            <BarChart3 className="w-4 h-4 inline mr-2" />
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
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeView === 'schedule'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-2" />
            Manage Schedule ({timeSlots.length})
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
                  {stats.todayAppointments} scheduled today
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
              <p className="text-3xl font-bold mb-1">{stats.availableSlots}</p>
              <p className="text-green-100 text-sm">Available Slots</p>
              <div className="mt-3 pt-3 border-t border-green-400 border-opacity-30">
                <p className="text-xs text-green-100">
                  {stats.totalSlots} total time slots
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
                <Stethoscope className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.confirmed}</p>
              <p className="text-purple-100 text-sm">Confirmed Appointments</p>
              <div className="mt-3 pt-3 border-t border-purple-400 border-opacity-30">
                <p className="text-xs text-purple-100">
                  Ready for consultation
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <Clock className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.pending}</p>
              <p className="text-yellow-100 text-sm">Pending Review</p>
              <div className="mt-3 pt-3 border-t border-yellow-400 border-opacity-30">
                <p className="text-xs text-yellow-100">
                  Awaiting your confirmation
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <h3 className="text-sm font-semibold text-gray-700">Booked Slots</h3>
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.bookedSlots}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((stats.bookedSlots / stats.totalSlots) * 100 || 0).toFixed(1)}% utilization
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
                onClick={() => setActiveView('appointments')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">View Appointments</p>
                  <p className="text-xs text-gray-500">{stats.totalAppointments} total</p>
                </div>
              </button>

              <button 
                onClick={() => setActiveView('schedule')}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Manage Schedule</p>
                  <p className="text-xs text-gray-500">{stats.availableSlots} available</p>
                </div>
              </button>

              <button 
                onClick={() => {
                  setActiveView('schedule');
                  setShowCreateSlot(true);
                }}
                className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Add Time Slot</p>
                  <p className="text-xs text-gray-500">Create new slot</p>
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
                  placeholder="Search patients..."
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
                  : 'No appointments scheduled yet'}
              </p>
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
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Patient Info */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {apt.patientId?.name?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Patient</p>
                          <p className="font-semibold text-gray-900 text-lg">
                            {apt.patientId?.name || 'Unknown Patient'}
                          </p>
                          {apt.patientId?.email && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Mail className="w-4 h-4" />
                              {apt.patientId.email}
                            </p>
                          )}
                          {apt.patientId?.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <Phone className="w-4 h-4" />
                              {apt.patientId.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Time Slot Info */}
                      {apt.timeSlotId && (
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                          <div className="flex items-center gap-2 text-blue-700 font-medium">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm">
                              {formatDateTime(apt.timeSlotId.startTime)}
                            </span>
                            <span className="text-blue-400">→</span>
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

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      {apt.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(apt._id, 'confirmed')}
                          disabled={actionLoading === apt._id}
                          className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors font-medium text-sm"
                          title="Confirm Appointment"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Confirm
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateAppointmentStatus(apt._id, 'completed')}
                          disabled={actionLoading === apt._id}
                          className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors font-medium text-sm"
                          title="Mark as Complete"
                        >
                          <CheckCircle className="w-4 h-4 inline mr-1" />
                          Complete
                        </button>
                      )}
                      {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                        <button
                          onClick={() => handleCancelAppointment(apt._id)}
                          disabled={actionLoading === apt._id}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Cancel Appointment"
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
      )}

      {/* Schedule Management View */}
      {activeView === 'schedule' && (
        <div className="space-y-6">
          {/* Create Time Slot */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create Time Slot</h2>
              <button
                onClick={() => setShowCreateSlot(!showCreateSlot)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {showCreateSlot ? (
                  <>
                    <X className="w-4 h-4 inline mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 inline mr-1" />
                    Add Slot
                  </>
                )}
              </button>
            </div>

            {showCreateSlot && (
              <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={actionLoading === 'create'}
                    className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === 'create' ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (                      <>
                        <Save className="w-4 h-4 inline mr-2" />
                        Create Slot
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
          {/* Time Slots List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              My Time Slots
            </h3>

            {timeSlots.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  No time slots created yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <div
                    key={slot._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          slot.isBooked ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {formatDateTime(slot.startTime)} →{' '}
                          {new Date(slot.endTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {slot.isBooked ? 'Booked' : 'Available'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!slot.isBooked && (
                        <button
                          onClick={() => handleDeleteSlot(slot._id)}
                          disabled={actionLoading === slot._id}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Delete Slot"
                        >
                          {actionLoading === slot._id ? (
                            <div className="w-4 h-4 border-b-2 border-red-600 animate-spin rounded-full" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
