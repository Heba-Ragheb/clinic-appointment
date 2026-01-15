// components/dashboards/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, User, Plus, XCircle, 
  X, AlertCircle, CalendarClock, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Doctor Dashboard Component
 * Manage appointments and availability slots
 */
export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [activeTab, setActiveTab] = useState('appointments');
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [slotForm, setSlotForm] = useState({ startTime: '', endTime: '' });
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
    const doctorId = apt.doctorId?._id || apt.doctorId;
    const userId = user._id || user.id;
    return doctorId && userId && doctorId.toString() === userId.toString();
  });

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    
    if (!slotForm.startTime || !slotForm.endTime) {
      alert('Please fill in all fields');
      return;
    }

    const startDate = new Date(slotForm.startTime);
    const endDate = new Date(slotForm.endTime);

    if (endDate <= startDate) {
      alert('End time must be after start time');
      return;
    }

    try {
      await apiService.createTimeSlot(slotForm);
      setSlotForm({ startTime: '', endTime: '' });
      setShowCreateSlot(false);
      alert('Time slot created successfully!');
    } catch (err) {
      alert(err.message || 'Failed to create time slot');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      setActionLoading(id);
      await apiService.updateAppointment(id, { status });
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to update appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      setActionLoading(id);
      await apiService.deleteAppointmentAsDoctor(id);
      await loadAppointments();
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const stats = {
    today: myAppointments.filter(apt => {
      const today = new Date().toDateString();
      return new Date(apt.createdAt).toDateString() === today;
    }).length,
    pending: myAppointments.filter(apt => apt.status === 'pending').length,
    confirmed: myAppointments.filter(apt => apt.status === 'confirmed').length
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

  const getPriorityVariant = (priority) => {
    const variants = {
      critical: 'danger',
      important: 'warning',
      moderate: 'default'
    };
    return variants[priority] || 'default';
  };

  if (loading) {
    return <LoadingSpinner message="Loading your dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Dr. {user.name}</h1>
        <p className="text-gray-500 mt-1">Manage your appointments and availability</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.today}</p>
              <p className="text-xs text-gray-500 mt-1">Appointments</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pending}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting confirmation</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmed</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.confirmed}</p>
              <p className="text-xs text-gray-500 mt-1">Ready to go</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 inline-flex">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'appointments'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Appointments
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
            activeTab === 'slots'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Time Slots
        </button>
      </div>

      {/* Content */}
      {activeTab === 'appointments' ? (
        <div className="space-y-4">
          {myAppointments.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments yet</h3>
              <p className="text-gray-500">Your scheduled appointments will appear here</p>
            </div>
          ) : (
            myAppointments.map((apt) => (
              <div key={apt._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant={getStatusVariant(apt.status)}>
                        {apt.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(apt.priority)}>
                        {apt.priority || 'moderate'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-lg">
                          {apt.patientId?.name || 'Unknown Patient'}
                        </p>
                        <p className="text-sm text-gray-500">{apt.patientId?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{new Date(apt.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {apt.status === 'confirmed' && (
                      <button
                        onClick={() => handleUpdateStatus(apt._id, 'completed')}
                        disabled={actionLoading === apt._id}
                        className="p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                      <button
                        onClick={() => handleDeleteAppointment(apt._id)}
                        disabled={actionLoading === apt._id}
                        className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Cancel appointment"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Create Slot Section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Availability Slots</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your available time slots for appointments</p>
              </div>
              <button
                onClick={() => setShowCreateSlot(!showCreateSlot)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  showCreateSlot
                    ? 'bg-gray-100 text-gray-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {showCreateSlot ? (
                  <>
                    <X className="w-5 h-5" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    New Slot
                  </>
                )}
              </button>
            </div>

            {/* Create Slot Form */}
            {showCreateSlot && (
              <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Create Availability Slot</h3>
                    <p className="text-sm text-gray-600">Set a time range when you're available for appointments</p>
                  </div>
                </div>

                <form onSubmit={handleCreateSlot}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={slotForm.startTime}
                        onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={slotForm.endTime}
                        onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Create Slot
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateSlot(false)}
                      className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Slots List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your time slots will appear here</h3>
            <p className="text-gray-500">Create slots to let patients book appointments</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;