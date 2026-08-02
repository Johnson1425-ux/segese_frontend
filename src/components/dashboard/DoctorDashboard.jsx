import { useQuery } from 'react-query';
import { dashboardService } from '../../utils/dashboardService';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { Clock, CheckCircle, AlertCircle, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="bg-blue-100 text-blue-600 rounded-full p-3">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

const QueueItem = ({ patient }) => (
  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
    <div className="flex justify-between items-start">
      <div>
        <p className="font-bold text-gray-900">{patient.name}</p>
        <p className="text-sm text-gray-600">Check-in: {patient.checkInTime}</p>
        <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          {patient.type}
        </span>
      </div>
    </div>
  </div>
);

const DoctorDashboard = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery('doctorStats', () => dashboardService.getDoctorStats());
  const { data: queueData, isLoading: queueLoading } = useQuery('doctorQueue', () => dashboardService.getDoctorQueue());

  if (statsLoading || queueLoading) return <LoadingSpinner />;

  const stats = statsData?.data || {};
  const queue = queueData?.data || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Patients Today" value={stats.patientsToday ?? 0} icon={Users} />
        <StatCard title="Appointments Completed" value={stats.appointmentsCompleted ?? 0} icon={CheckCircle} />
        <StatCard title="Pending Appointments" value={stats.pendingAppointments ?? 0} icon={AlertCircle} />
        <StatCard title="Avg Wait Time" value={stats.averageWaitTime ?? '-'} icon={Clock} />
      </div>

      {/* Patient Queue */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Queue</h2>
        <div className="space-y-3">
          {queue.length > 0 ? (
            queue.map(patient => <QueueItem key={patient.id} patient={patient} />)
          ) : (
            <p className="text-gray-500">No patients in queue</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;