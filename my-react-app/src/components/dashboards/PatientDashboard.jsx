// components/dashboards/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, Stethoscope, XCircle,
  MapPin, Phone, Mail, Plus, ArrowRight, Search, Filter,
  User, Star, Award, BookOpen, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

/**
 * Patient Dashboard Component
 * View and manage patient appointments + Browse and book doctors
 */
export const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showDoctorBrowser, setShowDoctorBrowser] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadAppointments(),
        loadDoctors()
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const data = await apiService.getAppointments();
      setAppointments(data.data || data.appointments || data || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setAppointments([]);
    }
  };

  const loadDoctors = async () => {
    try {
      const data = await apiService.getDoctors();
      setDoctors(data.data || data.doctors || data || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  };

  const loadDoctorSlots = async (doctorId) => {
    try {
      setActionLoading('loading-slots');
      const data = await apiService.getAvailableSlots(doctorId);
      // Filter out already booked slots
      const availableSlots = (data.data || data.slots || data || [])
        .filter(slot => !slot.isBooked);
      setTimeSlots(availableSlots);
    } catch (err) {
      console.error('Error loading slots:', err);
      setTimeSlots([]);
      setError('Failed to load available time slots');
    } finally {
      setActionLoading(null);
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
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment');
      alert(err.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectDoctor = async (doctor) => {
    setSelectedDoctor(doctor);
    setError(null);
    await loadDoctorSlots(doctor._id);
  };

  const handleBookAppointment = async (slotId) => {
    if (!selectedDoctor) return;

    try {
      setActionLoading(slotId);
      setError(null);
      await apiService.createAppointment(selectedDoctor._id, slotId);
      alert('Appointment booked successfully!');
      setShowDoctorBrowser(false);
      setSelectedDoctor(null);
      setTimeSlots([]);
      await loadAppointments();
    } catch (err) {
      const errorMessage = err.message || 'Failed to book appointment';
      setError(errorMessage);
      alert(errorMessage);
      // Reload slots to get updated availability
      await loadDoctorSlots(selectedDoctor._id);
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

  // Get unique specialties
  const specialties = ['all', ...new Set(doctors.map(d => d.specialty).filter(Boolean))];

  // Filter doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = searchTerm === '' || 
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = specialtyFilter === 'all' || doctor.specialty === specialtyFilter;
    return matchesSearch && matchesSpecialty;
  });

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

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
          <button 
            onClick={() => setShowDoctorBrowser(true)}
            className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2 shadow-md"
          >
            Find Doctor
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Doctor Browser Modal */}
      {showDoctorBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedDoctor ? 'Select Time Slot' : 'Find a Doctor'}
                  </h2>
                  <p className="text-gray-500 mt-1">
                    {selectedDoctor 
                      ? `Book an appointment with Dr. ${selectedDoctor.name}`
                      : 'Browse our network of healthcare professionals'
                    }
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowDoctorBrowser(false);
                    setSelectedDoctor(null);
                    setTimeSlots([]);
                    setError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              {/* Back button when slot selection is active */}
              {selectedDoctor && (
                <button
                  onClick={() => {
                    setSelectedDoctor(null);
                    setTimeSlots([]);
                    setError(null);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                >
                  ← Back to doctors
                </button>
              )}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedDoctor ? (
                <>
                  {/* Filters */}
                  <div className="mb-6 flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search doctors by name or specialty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <select
                      value={specialtyFilter}
                      onChange={(e) => setSpecialtyFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {specialties.map(specialty => (
                        <option key={specialty} value={specialty}>
                          {specialty === 'all' ? 'All Specialties' : specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctors Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDoctors.map((doctor) => (
                      <div
                        key={doctor._id}
                        className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                        onClick={() => handleSelectDoctor(doctor)}
                      >
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md flex-shrink-0">
                            <Stethoscope className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-lg mb-1">
                              Dr. {doctor.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Award className="w-4 h-4 text-blue-600" />
                              <p className="text-sm text-blue-600 font-medium">
                                {doctor.specialty || 'General Practitioner'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {doctor.email && (
                          <div className="flex items-center gap-2 text-gray-600 mb-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm truncate">{doctor.email}</span>
                          </div>
                        )}

                        <button className="w-full mt-4 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          View Availability
                        </button>
                      </div>
                    ))}
                  </div>

                  {filteredDoctors.length === 0 && (
                    <div className="text-center py-12">
                      <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No doctors found</p>
                      <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Selected Doctor Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                        <Stethoscope className="w-10 h-10 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          Dr. {selectedDoctor.name}
                        </h3>
                        <p className="text-blue-600 font-medium mb-2">
                          {selectedDoctor.specialty || 'General Practitioner'}
                        </p>
                        {selectedDoctor.email && (
                          <p className="text-sm text-gray-600">{selectedDoctor.email}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Loading Slots */}
                  {actionLoading === 'loading-slots' && (
                    <div className="text-center py-12">
                      <LoadingSpinner message="Loading available time slots..." />
                    </div>
                  )}

                  {/* Time Slots */}
                  {actionLoading !== 'loading-slots' && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        Available Time Slots ({timeSlots.length})
                      </h3>
                      {timeSlots.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl">
                          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">No available slots</p>
                          <p className="text-gray-400 text-sm mt-1">Please check back later or contact the doctor directly</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {timeSlots.map((slot) => (
                            <div
                              key={slot._id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 text-gray-900 font-medium mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    {new Date(slot.startTime).toLocaleDateString('en-US', {
                                      weekday: 'long',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </div>
                                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                                    <Clock className="w-4 h-4" />
                                    {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })} - {new Date(slot.endTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleBookAppointment(slot._id)}
                                  disabled={actionLoading === slot._id}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] flex items-center justify-center"
                                >
                                  {actionLoading === slot._id ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                  ) : "Book"}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointments Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">My Appointments</h2>
          <button 
            onClick={() => setShowDoctorBrowser(true)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
          >
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
            <button 
              onClick={() => setShowDoctorBrowser(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
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
                    
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <Stethoscope className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          Dr. {apt.doctorId?.name || 'Unknown Doctor'}
                        </h3>
                        <p className="text-sm text-blue-600 font-medium mb-2">
                          {apt.doctorId?.specialty || 'General Practitioner'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-[72px]">
                      {apt.timeSlotId && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">
                            {new Date(apt.timeSlotId.startTime).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      
                      {apt.doctorId?.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm truncate">{apt.doctorId.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

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