// components/dashboards/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Calendar, Activity, TrendingUp, Shield, Settings,
  Search, UserCheck, Stethoscope, AlertCircle, CheckCircle, 
  XCircle, Clock, Mail, Award, BarChart3, Bell,  
  RefreshCw, X,  Phone,  Briefcase, FileText,
  ChevronDown, ChevronUp,  Menu, LogOut, User
} from 'lucide-react';
import apiService from '../../services/api.service';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../context/AuthContext';

/**
 * Enhanced Professional Admin Dashboard Component
 */
export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
//  const [selectedDoctor, setSelectedDoctor] = useState(null);
  //const [selectedPatient, setSelectedPatient] = useState(null);
  const [expandedDoctors, setExpandedDoctors] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const loadPatients = useCallback(async () => {
    try {
      const data = await apiService.getPatients();
      setPatients(data.data || data.patients || []);
    } catch (err) {
      console.error('Error loading patients from API:', err);
      setPatients([]);
    }
  }, []);

  const loadAllTimeSlots = useCallback(async () => {
    try {
      const allSlots = [];
      for (const doctor of doctors) {
        try {
          const slots = await apiService.getAvailableSlots(doctor._id);
          allSlots.push(...(slots || []).map(slot => ({ ...slot, doctor })));
        } catch (err) {
          console.error(`Error loading slots for doctor ${doctor._id}:`, err);
        }
      }
      setTimeSlots(allSlots);
    } catch (err) {
      console.error('Error loading time slots:', err);
      setTimeSlots([]);
    }
  }, [doctors]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadAppointments(),
        loadDoctors()
      ]);
      await loadPatients();
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [loadAppointments, loadDoctors, loadPatients]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (doctors.length > 0 && activeView === 'doctors') {
      loadAllTimeSlots();
    }
  }, [doctors, activeView, loadAllTimeSlots]);

  useEffect(() => {
    if (appointments.length > 0 && patients.length === 0) {
      const uniquePatients = new Map();
      appointments.forEach(apt => {
        if (apt.patientId && apt.patientId._id) {
          uniquePatients.set(apt.patientId._id, apt.patientId);
        }
      });
      const extracted = Array.from(uniquePatients.values());
      if (extracted.length > 0) {
        setPatients(extracted);
      }
    }
  }, [appointments, patients.length]);

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

  const toggleDoctorExpanded = (doctorId) => {
    setExpandedDoctors(prev => ({
      ...prev,
      [doctorId]: !prev[doctorId]
    }));
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  const doctorsBySpecialty = doctors.reduce((acc, doctor) => {
    const specialty = doctor.specialty || 'General';
    if (!acc[specialty]) {
      acc[specialty] = [];
    }
    acc[specialty].push(doctor);
    return acc;
  }, {});

  const getAppointmentsForDoctor = (doctorId) => {
    return appointments.filter(apt => 
      apt.doctorId?._id === doctorId || apt.doctorId === doctorId
    );
  };

  const getTimeSlotsForDoctor = (doctorId) => {
    return timeSlots.filter(slot => 
      slot.doctorId === doctorId || slot.doctor?._id === doctorId
    );
  };

  const getAppointmentsForPatient = (patientId) => {
    return appointments.filter(apt => 
      apt.patientId?._id === patientId || apt.patientId === patientId
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      apt.patientId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctorId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientId?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const appointmentsByDoctor = filteredAppointments.reduce((acc, apt) => {
    const doctorId = apt.doctorId?._id || apt.doctorId || 'unknown';
    const doctorName = apt.doctorId?.name || 'Unknown Doctor';
    const doctorSpecialty = apt.doctorId?.specialty || 'General';
    
    if (!acc[doctorId]) {
      acc[doctorId] = {
        doctor: apt.doctorId,
        doctorName,
        doctorSpecialty,
        appointments: []
      };
    }
    acc[doctorId].appointments.push(apt);
    return acc;
  }, {});

/*  const filteredDoctors = doctors.filter(doctor => {
    const matchesSpecialty = filterSpecialty === 'all' || doctor.specialty === filterSpecialty;
    const matchesSearch = searchTerm === '' ||
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSpecialty && matchesSearch;
  });*/

  const filteredPatients = patients.filter(patient => {
    return searchTerm === '' ||
      patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const stats = {
    totalAppointments: appointments.length,
    totalDoctors: doctors.length,
    totalPatients: patients.length,
    totalSlots: timeSlots.length,
    availableSlots: timeSlots.filter(slot => !slot.isBooked).length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
  };

  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];

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
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden w-full">
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Admin Panel</h2>
                  <p className="text-xs text-gray-500">Management</p>
                </div>
              </div>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => {
                setActiveView('overview');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'overview'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveView('doctors');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'doctors'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Stethoscope className="w-5 h-5" />
              <div className="flex-1 flex items-center justify-between">
                <span>Doctors</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {doctors.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('patients');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'patients'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Users className="w-5 h-5" />
              <div className="flex-1 flex items-center justify-between">
                <span>Patients</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {patients.length}
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveView('appointments');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeView === 'appointments'
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <div className="flex-1 flex items-center justify-between">
                <span>Appointments</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {appointments.length}
                </span>
              </div>
            </button>
          </nav>

          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-600 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-semibold"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>

            <div className="flex items-center gap-3 text-sm text-gray-600 px-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                  Complete system overview and management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {stats.pending > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              <button onClick={loadData} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 space-y-6">
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

      {activeView === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6" />
                </div>
                <TrendingUp className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalAppointments}</p>
              <p className="text-blue-100 text-sm">Total Appointments</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <Activity className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalDoctors}</p>
              <p className="text-green-100 text-sm">Active Doctors</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <UserCheck className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.totalPatients}</p>
              <p className="text-purple-100 text-sm">Total Patients</p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <AlertCircle className="w-5 h-5 opacity-80" />
              </div>
              <p className="text-3xl font-bold mb-1">{stats.pending}</p>
              <p className="text-yellow-100 text-sm">Pending Review</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Confirmed</h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.confirmed}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Completed</h3>
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Available Slots</h3>
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.availableSlots}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Cancelled</h3>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Doctor Distribution by Specialty</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(doctorsBySpecialty).map(([specialty, docs]) => (
                <div key={specialty} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="text-2xl font-bold text-gray-900">{docs.length}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{specialty}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeView === 'doctors' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Specialties</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>
          </div>

          {Object.entries(doctorsBySpecialty)
            .filter(([specialty]) => filterSpecialty === 'all' || filterSpecialty === specialty)
            .map(([specialty, docs]) => {
              const filteredDocs = docs.filter(doctor => {
                return searchTerm === '' ||
                  doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  doctor.email?.toLowerCase().includes(searchTerm.toLowerCase());
              });

              if (filteredDocs.length === 0) return null;

              return (
                <div key={specialty} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Award className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">{specialty}</h3>
                    <span className="text-sm text-gray-500">({filteredDocs.length} doctors)</span>
                  </div>

                  <div className="space-y-4">
                    {filteredDocs.map(doctor => {
                      const doctorAppointments = getAppointmentsForDoctor(doctor._id);
                      const doctorSlots = getTimeSlotsForDoctor(doctor._id);
                      const isExpanded = expandedDoctors[doctor._id];

                      return (
                        <div key={doctor._id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                                  {doctor.name?.charAt(0) || 'D'}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 mb-1">
                                    Dr. {doctor.name}
                                  </h4>
                                  <div className="space-y-1">
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Mail className="w-4 h-4" />
                                      {doctor.email}
                                    </p>
                                    {doctor.phone && (
                                      <p className="text-sm text-gray-600 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        {doctor.phone}
                                      </p>
                                    )}
                                    <p className="text-sm text-blue-600 flex items-center gap-2">
                                      <Briefcase className="w-4 h-4" />
                                      {doctor.specialty}
                                    </p>
                                  </div>
                                  {doctor.bio && (
                                    <p className="text-sm text-gray-600 mt-2 flex items-start gap-2">
                                      <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-2">{doctor.bio}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => toggleDoctorExpanded(doctor._id)}
                                className="ml-4 p-2 hover:bg-white rounded-lg transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-4">
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="text-xs text-gray-600 mb-1">Appointments</p>
                                <p className="text-xl font-bold text-gray-900">{doctorAppointments.length}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="text-xs text-gray-600 mb-1">Time Slots</p>
                                <p className="text-xl font-bold text-gray-900">{doctorSlots.length}</p>
                              </div>
                              <div className="bg-white rounded-lg p-3 border border-blue-100">
                                <p className="text-xs text-gray-600 mb-1">Available</p>
                                <p className="text-xl font-bold text-green-600">
                                  {doctorSlots.filter(s => !s.isBooked).length}
                                </p>
                              </div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="p-5 bg-white border-t border-gray-200">
                              <div className="mb-6">
                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Clock className="w-5 h-5 text-blue-600" />
                                  Time Slots ({doctorSlots.length})
                                </h5>
                                {doctorSlots.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No time slots created</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {doctorSlots.map(slot => (
                                      <div
                                        key={slot._id}
                                        className={`p-3 rounded-lg border-2 ${
                                          slot.isBooked
                                            ? 'border-red-200 bg-red-50'
                                            : 'border-green-200 bg-green-50'
                                        }`}
                                      >
                                        <div className={`text-xs font-medium mb-2 ${
                                          slot.isBooked ? 'text-red-700' : 'text-green-700'
                                        }`}>
                                          {slot.isBooked ? 'Booked' : 'Available'}
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatDateTime(slot.startTime)}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          to {new Date(slot.endTime).toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                          })}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                  Appointments ({doctorAppointments.length})
                                </h5>
                                {doctorAppointments.length === 0 ? (
                                  <p className="text-sm text-gray-500 italic">No appointments scheduled</p>
                                ) : (
                                  <div className="space-y-2">
                                    {doctorAppointments.map(apt => (
                                      <div key={apt._id} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <Badge variant={getStatusVariant(apt.status)}>
                                            {apt.status}
                                          </Badge>
                                          <span className="text-xs text-gray-500">
                                            {new Date(apt.createdAt).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">
                                          Patient: {apt.patientId?.name || 'Unknown'}
                                        </p>
                                        {apt.patientId?.email && (
                                          <p className="text-xs text-gray-600 mt-1">
                                            {apt.patientId.email}
                                          </p>
                                        )}
                                        {apt.timeSlotId && (
                                          <p className="text-xs text-blue-600 mt-2">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {formatDateTime(apt.timeSlotId.startTime)}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {activeView === 'patients' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-600" />
              All Patients ({filteredPatients.length})
            </h3>

            {filteredPatients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No patients found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPatients.map(patient => {
                  const patientAppointments = getAppointmentsForPatient(patient._id);

                  return (
                    <div key={patient._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            {patient.name?.charAt(0) || 'P'}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">
                              {patient.name}
                            </h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {patient.email}
                              </p>
                              {patient.phone && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Phone className="w-4 h-4" />
                                  {patient.phone}
                                </p>
                              )}
                              <p className="text-sm text-purple-600 font-medium">
                                {patientAppointments.length} appointments
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-white">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">
                          Recent Appointments
                        </h5>
                        {patientAppointments.length === 0 ? (
                          <p className="text-sm text-gray-500 italic">No appointments</p>
                        ) : (
                          <div className="space-y-2">
                            {patientAppointments.slice(0, 3).map(apt => (
                              <div key={apt._id} className="text-xs bg-gray-50 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant={getStatusVariant(apt.status)}>
                                    {apt.status}
                                  </Badge>
                                  <span className="text-gray-500">
                                    {new Date(apt.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                  Dr. {apt.doctorId?.name || 'Unknown'}
                                </p>
                                {apt.doctorId?.specialty && (
                                  <p className="text-gray-600">
                                    {apt.doctorId.specialty}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'appointments' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {Object.keys(appointmentsByDoctor).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No appointments found</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(appointmentsByDoctor).map(({ doctor, doctorName, doctorSpecialty, appointments: doctorApts }) => (
                <div key={doctor?._id || 'unknown'} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {doctorName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 truncate">
                          Dr. {doctorName}
                        </h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm text-blue-600 flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {doctorSpecialty}
                          </p>
                          <span className="text-sm text-gray-500">•</span>
                          <p className="text-sm text-gray-600">
                            {doctorApts.length} appointment{doctorApts.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {doctorApts.map(apt => (
                      <div key={apt._id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge variant={getStatusVariant(apt.status)}>
                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                              </Badge>
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

                            <div className="flex items-start gap-3 mb-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
                                {apt.patientId?.name?.charAt(0) || 'P'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 mb-1">Patient</p>
                                <p className="font-semibold text-gray-900 truncate">
                                  {apt.patientId?.name || 'Unknown'}
                                </p>
                                {apt.patientId?.email && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1 truncate">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{apt.patientId.email}</span>
                                  </p>
                                )}
                                {apt.patientId?.phone && (
                                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    {apt.patientId.phone}
                                  </p>
                                )}
                              </div>
                            </div>

                            {apt.timeSlotId && (
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="flex flex-wrap items-center gap-2 text-blue-700">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium">
                                    {formatDateTime(apt.timeSlotId.startTime)}
                                  </span>
                                  <span className="text-blue-400">→</span>
                                  <span className="text-sm font-medium">
                                    {new Date(apt.timeSlotId.endTime).toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex lg:flex-col items-center gap-2">
                            {apt.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(apt._id, 'confirmed')}
                                disabled={actionLoading === apt._id}
                                className="flex-1 lg:flex-none px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                                title="Confirm"
                              >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Confirm
                              </button>
                            )}
                            {apt.status === 'confirmed' && (
                              <button
                                onClick={() => handleUpdateStatus(apt._id, 'completed')}
                                disabled={actionLoading === apt._id}
                                className="flex-1 lg:flex-none px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                                title="Complete"
                              >
                                <CheckCircle className="w-4 h-4 inline mr-1" />
                                Complete
                              </button>
                            )}
                            {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                              <button
                                onClick={() => handleCancelAppointment(apt._id)}
                                disabled={actionLoading === apt._id}
                                className="flex-1 lg:flex-none px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                                title="Cancel"
                              >
                                {actionLoading === apt._id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 inline-block mr-1"></div>
                                ) : (
                                  <XCircle className="w-4 h-4 inline mr-1" />
                                )}
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;