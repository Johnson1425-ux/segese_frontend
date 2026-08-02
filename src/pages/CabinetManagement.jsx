import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Plus, Settings, Thermometer, Calendar, AlertTriangle, Edit2, Trash2, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Service functions
const cabinetService = {
  getAll: () => api.get('/cabinets'),
  getStats: () => api.get('/cabinets/stats'),
  create: (data) => api.post('/cabinets', data),
  update: (id, data) => api.put(`/cabinets/${id}`, data),
  release: (id) => api.post(`/cabinets/${id}/release`),
  delete: (id) => api.delete(`/cabinets/${id}`)
};

const CabinetManagement = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCabinet, setEditingCabinet] = useState(null);

  // Queries
  const { data: cabinetsData, isLoading } = useQuery('cabinets', cabinetService.getAll);
  const { data: statsData } = useQuery('cabinetStats', cabinetService.getStats);

  // Mutations
  const createMutation = useMutation(cabinetService.create, {
    onSuccess: () => {
      toast.success('Cabinet created successfully');
      queryClient.invalidateQueries('cabinets');
      queryClient.invalidateQueries('cabinetStats');
      setShowAddForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create cabinet');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => cabinetService.update(id, data),
    {
      onSuccess: () => {
        toast.success('Cabinet updated successfully');
        queryClient.invalidateQueries('cabinets');
        queryClient.invalidateQueries('cabinetStats');
        setEditingCabinet(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update cabinet');
      }
    }
  );

  const deleteMutation = useMutation(cabinetService.delete, {
    onSuccess: () => {
      toast.success('Cabinet deleted successfully');
      queryClient.invalidateQueries('cabinets');
      queryClient.invalidateQueries('cabinetStats');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete cabinet');
    }
  });

  const releaseMutation = useMutation(cabinetService.release, {
    onSuccess: () => {
      toast.success('Cabinet released successfully');
      queryClient.invalidateQueries('cabinets');
      queryClient.invalidateQueries('cabinetStats');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to release cabinet');
    }
  });

  if (isLoading) return <LoadingSpinner />;

  const cabinets = cabinetsData?.data?.data || [];
  const stats = statsData?.data?.data || {};

  const handleCreateCabinet = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      number: formData.get('number'),
      location: formData.get('location'),
      capacity: parseInt(formData.get('capacity')) || 1,
      temperature: parseFloat(formData.get('temperature')) || 4.0,
      nextMaintenance: formData.get('nextMaintenance') || null
    };
    createMutation.mutate(data);
  };

  const handleUpdateCabinet = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      location: formData.get('location'),
      capacity: parseInt(formData.get('capacity')),
      temperature: parseFloat(formData.get('temperature')),
      status: formData.get('status'),
      notes: formData.get('notes'),
      nextMaintenance: formData.get('nextMaintenance') || null
    };
    updateMutation.mutate({ id: editingCabinet._id, data });
  };

  const handleDeleteCabinet = (cabinet) => {
    if (window.confirm(`Are you sure you want to delete cabinet ${cabinet.number}?`)) {
      deleteMutation.mutate(cabinet._id);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'Maintenance': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      'Out of Service': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return `px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`;
  };

  const getOccupancyBadge = (isOccupied) => {
    return isOccupied 
      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-1 rounded-full text-sm font-semibold'
      : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Cabinet Management</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Cabinet
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cabinets</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.available || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.maintenance || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Thermometer className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Out of Service</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.outOfService || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Cabinet Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Add New Cabinet</h2>
            <button 
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreateCabinet} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cabinet Number
              </label>
              <input
                type="text"
                name="number"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., CAB-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="e.g., Room A1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                defaultValue="1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                name="temperature"
                step="0.1"
                defaultValue="4.0"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next Maintenance
              </label>
              <input
                type="date"
                name="nextMaintenance"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={createMutation.isLoading}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {createMutation.isLoading ? 'Creating...' : 'Create Cabinet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Cabinet Form */}
      {editingCabinet && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Edit Cabinet {editingCabinet.number}
            </h2>
            <button 
              onClick={() => setEditingCabinet(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleUpdateCabinet} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location
              </label>
              <input
                type="text"
                name="location"
                defaultValue={editingCabinet.location}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                min="1"
                defaultValue={editingCabinet.capacity}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature (°C)
              </label>
              <input
                type="number"
                name="temperature"
                step="0.1"
                defaultValue={editingCabinet.temperature}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                defaultValue={editingCabinet.status}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Next Maintenance
              </label>
              <input
                type="date"
                name="nextMaintenance"
                defaultValue={editingCabinet.nextMaintenance ? editingCabinet.nextMaintenance.split('T')[0] : ''}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                defaultValue={editingCabinet.notes}
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {updateMutation.isLoading ? 'Updating...' : 'Update Cabinet'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cabinets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Cabinets</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cabinet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Occupancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Temperature
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cabinets.map((cabinet) => (
                <tr key={cabinet._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{cabinet.number}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Capacity: {cabinet.capacity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {cabinet.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getStatusBadge(cabinet.status)}>
                      {cabinet.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={getOccupancyBadge(cabinet.isOccupied)}>
                      {cabinet.isOccupied ? 'Occupied' : 'Available'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Thermometer className="w-4 h-4 mr-1 text-blue-500" />
                      {cabinet.temperature}°C
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-500" />
                      {formatDate(cabinet.nextMaintenance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingCabinet(cabinet)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {cabinet.isOccupied && (
                        <button
                          onClick={() => releaseMutation.mutate(cabinet._id)}
                          disabled={releaseMutation.isLoading}
                          className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          title="Release"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCabinet(cabinet)}
                        disabled={cabinet.isOccupied || deleteMutation.isLoading}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cabinets.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No cabinets found. Add your first cabinet to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CabinetManagement;