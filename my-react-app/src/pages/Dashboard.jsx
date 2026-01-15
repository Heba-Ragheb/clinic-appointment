import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import DoctorDashboard from '../components/dashboards/DoctorDashboard';
import PatientDashboard from '../components/dashboards/PatientDashboard';

export default function Dashboard() {
  const { isAdmin, isDoctor, isPatient } = useAuth();

  if (isAdmin) return <AdminDashboard />;
  if (isDoctor) return <DoctorDashboard />;
  return <PatientDashboard />;
}
