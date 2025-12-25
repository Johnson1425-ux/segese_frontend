import React from 'react';
import { useQuery } from 'react-query';
import { dashboardService } from '../../utils/dashboardService';
import LoadingSpinner from '../common/LoadingSpinner.jsx';
import { User, Bed, Stethoscope, FileText, DollarSign, AlertCircle } from 'lucide-react';

const colorMap = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-100',
    text: 'text-blue-600'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-100',
    text: 'text-green-600'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-100',
    text: 'text-purple-600'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-100',
    text: 'text-orange-600'
  },
  emerald: {
    border: 'border-emerald-500',
    bg: 'bg-emerald-100',
    text: 'text-emerald-600'
  },
  red: {
    border: 'border-red-500',
    bg: 'bg-red-100',
    text: 'text-red-600'
  }
};

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className={`bg-white rounded-lg shadow p-4 md:p-6 border-l-4 ${colors.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-xs md:text-sm font-medium">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1 md:mt-2">{value}</p>
        </div>
        <div className={`${colors.bg} ${colors.text} rounded-full p-2 md:p-3`}>
          <Icon className="w-5 h-5 md:w-6 md:h-6" />
        </div>
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
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          title="Total Patients"
          value={stats.totalPatients ?? 0}
          icon={User}
          color="blue"
        />
        <StatCard
          title="Active Visits"
          value={stats.activeVisits ?? 0}
          icon={Bed}
          color="green"
        />
        <StatCard
          title="Available Doctors"
          value={stats.totalDoctors ?? 0}
          icon={Stethoscope}
          color="purple"
        />
        <StatCard
          title="Appointments Today"
          value={stats.appointmentsToday ?? 0}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Total Revenue"
          value={`TSh ${stats.totalRevenue ? stats.totalRevenue.toLocaleString() : 0}`}
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Pending Bills"
          value={stats.pendingBills ?? 0}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
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