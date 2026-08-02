import { useQuery } from 'react-query';
import { dashboardService } from '../../utils/dashboardService';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { User, Bed, Stethoscope, FileText, DollarSign, AlertCircle } from 'lucide-react';

const colorMap = {
  blue: {
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    valueBg: 'bg-white',
    valueText: 'text-gray-900'
  },
  green: {
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    valueBg: 'bg-white',
    valueText: 'text-green-600'
  },
  purple: {
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    valueBg: 'bg-white',
    valueText: 'text-gray-900'
  },
  orange: {
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    valueBg: 'bg-white',
    valueText: 'text-orange-600'
  },
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    valueBg: 'bg-white',
    valueText: 'text-gray-900'
  },
  red: {
    iconBg: 'bg-red-100',
    iconText: 'text-red-600',
    valueBg: 'bg-white',
    valueText: 'text-red-600'
  }
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 md:p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-gray-600 text-sm md:text-base font-medium">{title}</h3>
        <div className={`${colors.iconBg} rounded-full p-2 md:p-2.5`}>
          <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colors.iconText}`} />
        </div>
      </div>
      <div className="space-y-2">
        <p className={`text-2xl md:text-3xl lg:text-4xl font-bold ${colors.valueText}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-gray-500 text-xs md:text-sm">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

const ActivityItem = ({ activity }) => (
  <div className="py-3 md:py-4 border-b border-gray-200 last:border-b-0">
    <div className="flex items-start">
      <div
        className={`w-2 h-2 rounded-full mt-2 mr-2 md:mr-3 flex-shrink-0 ${
          activity.type === 'admission'
            ? 'bg-green-500'
            : activity.type === 'discharge'
            ? 'bg-blue-500'
            : 'bg-yellow-500'
        }`}
      ></div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm md:text-base">{activity.description}</p>
        <p className="text-xs md:text-sm text-gray-500">
          {new Date(activity.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery(
    'adminStats',
    () => dashboardService.getAdminStats()
  );
  const { data: activityData, isLoading: activityLoading, error: activityError } = useQuery(
    'adminActivity',
    () => dashboardService.getAdminActivity()
  );

  if (statsLoading || activityLoading) return <LoadingSpinner />;

  if (statsError || activityError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
        <p className="text-red-700 text-sm md:text-base">
          Error loading dashboard: {statsError?.message || activityError?.message}
        </p>
      </div>
    );
  }

  const stats = statsData?.data.data || {};
  const activities = activityData?.data.data || [];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients ?? 0}
          subtitle={`${stats.totalPatients ?? 0} registered`}
          icon={User}
          color="blue"
        />
        <StatCard
          title="Active Visits"
          value={stats.activeVisits ?? 0}
          subtitle={`${stats.activeVisits ?? 0} ongoing`}
          icon={Bed}
          color="green"
        />
        <StatCard
          title="Available Doctors"
          value={stats.totalDoctors ?? 0}
          subtitle={`${stats.totalDoctors ?? 0} on duty`}
          icon={Stethoscope}
          color="purple"
        />
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday ?? 0}
          subtitle={`${stats.appointmentsToday ?? 0} scheduled`}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`TSh ${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : 0}`}
          subtitle={`${stats.totalInvoices ?? 0} invoices`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Pending Bills"
          value={stats.pendingBills ?? 0}
          subtitle="Pending collection"
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 border border-gray-100">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Recent Activity</h2>
        <div className="divide-y divide-gray-200">
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))
          ) : (
            <p className="text-gray-500 text-sm md:text-base">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;