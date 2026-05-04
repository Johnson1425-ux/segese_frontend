import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { Calendar, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ConfirmationDialog from './ConfirmationDialog.jsx';

const Appointments = () => {
  const { hasAnyRole, user, role, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const canManage = hasAnyRole(['admin', 'receptionist', 'doctor']);

  // Fetch appointments with detailed logging
  const { data: appointments, isLoading, isError, error } = useQuery(
    'appointments', 
    async () => {      
      const response = await api.get('/appointments');      
      return response.data.data;
    },
  );

  // Delete appointment mutation
  const deleteMutation = useMutation(
    (id) => {
      return api.delete(`/appointments/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('appointments');
        toast.success('Appointment deleted successfully');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete appointment');
        setDialogOpen(false);
      },
    }
  );

  const handleDeleteClick = (appointment) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedAppointment) {
      deleteMutation.mutate(selectedAppointment._id);
    }
  };

  // Handle permission check
  if (!isAuthenticated) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
          <h3 className="text-base md:text-lg font-medium text-yellow-800 dark:text-yellow-300">Authentication Required</h3>
          <p className="text-sm md:text-base text-yellow-700 dark:text-yellow-400">Please log in to view appointments.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (isError) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <h3 className="text-base md:text-lg font-medium text-red-800 dark:text-red-300">Error Loading Appointments</h3>
          <p className="text-sm md:text-base text-red-700 dark:text-red-400">{error?.response?.data?.message || error?.message || 'Unknown error occurred'}</p>
          <p className="text-xs md:text-sm text-red-600 dark:text-red-500 mt-2">Status: {error?.response?.status}</p>
          <button
            onClick={() => { queryClient.invalidateQueries('appointments'); }}
            className="mt-4 px-3 py-1.5 md:px-4 md:py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">Appointments</h1>
        {canManage && (
          <Link
            to="/appointments/new"
            className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5 mr-2" />
            Add New Appointment
          </Link>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                {canManage && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {appointments && appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {appointment.patient?.firstName} {appointment.patient?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {new Date(appointment.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {appointment.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        appointment.status === 'Scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        appointment.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {appointment.status}
                      </span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="relative inline-block text-left">
                          <Link to={`/appointments/edit/${appointment._id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4">
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button onClick={() => handleDeleteClick(appointment)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No appointments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {appointments && appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div key={appointment._id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              {/* Header with Status and Actions */}
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                  appointment.status === 'Scheduled' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                  appointment.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}>
                  {appointment.status}
                </span>
                {canManage && (
                  <div className="flex gap-2">
                    <Link
                      to={`/appointments/edit/${appointment._id}`}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(appointment)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Patient & Doctor Info */}
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Patient</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 font-medium truncate">
                    {appointment.patient?.firstName} {appointment.patient?.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Doctor</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(appointment.date).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {appointment.reason}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No appointments found</p>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
      />
    </div>
  );
};

export default Appointments;