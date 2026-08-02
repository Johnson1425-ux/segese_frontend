import { useQuery } from 'react-query';
import { dashboardService } from '../../utils/dashboardService';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { Calendar, UserCheck, Users, XCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="bg-green-100 text-green-600 rounded-full p-3">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const AppointmentRow = ({ appointment }) => {
  const statusColor = {
    'Checked-in': 'bg-green-100 text-green-800',
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Completed': 'bg-blue-100 text-blue-800',
    'Cancelled': 'bg-red-100 text-red-800',
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4 text-sm font-medium text-gray-900">{appointment.patient}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{appointment.doctor}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{appointment.time}</td>
      <td className="px-6 py-4">
        <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${statusColor[appointment.status]}`}>
          {appointment.status}
        </span>
      </td>
    </tr>
  );
};

const ReceptionistDashboard = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery('receptionistStats', () => dashboardService.getReceptionistStats());
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery('receptionistAppointments', () => dashboardService.getReceptionistAppointments());

  if (statsLoading || appointmentsLoading) return <LoadingSpinner />;

  const stats = statsData?.data || {};
  const appointments = appointmentsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Appointments" value={stats.todayAppointments ?? 0} icon={Calendar} />
        <StatCard title="Check-ins Today" value={stats.checkInsToday ?? 0} icon={UserCheck} />
        <StatCard title="Pending Registrations" value={stats.pendingRegistrations ?? 0} icon={Users} />
        <StatCard title="Cancelled Appointments" value={stats.cancelledAppointments ?? 0} icon={XCircle} />
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Appointments</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length > 0 ? (
                appointments.map(apt => <AppointmentRow key={apt.id} appointment={apt} />)
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;