import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import DoctorDashboard from '../components/dashboard/DoctorDashboard';
import ReceptionistDashboard from '../components/dashboard/ReceptionistDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.firstName}!</h1>
        <p className="text-gray-600">Here&apos;s what&apos;s happening in the hospital today.</p>
      </div>

      {user?.role === 'admin' && <AdminDashboard />}
      {user?.role === 'doctor' && <DoctorDashboard />}
      {user?.role === 'receptionist' && <ReceptionistDashboard />}
    </div>
  );
};

export default Dashboard;