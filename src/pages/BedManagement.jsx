// src/pages/BedManagement.jsx
import { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BedDouble, Plus, Edit, Trash2, Search, X, 
  CheckCircle, AlertCircle, Clock, Wrench, Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const BedManagement = () => {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [statistics, setStatistics] = useState(null);

  const [formData, setFormData] = useState({
    bedNumber: '',
    ward: '',
    type: 'standard',
    features: [],
    status: 'available',
    notes: ''
  });

  const bedTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'icu', label: 'ICU' },
    { value: 'isolation', label: 'Isolation' },
    { value: 'private', label: 'Private' },
    { value: 'semi-private', label: 'Semi-Private' },
    { value: 'pediatric', label: 'Pediatric' },
    { value: 'maternity', label: 'Maternity' }
  ];

  const bedStatuses = [
    { value: 'available', label: 'Available', icon: CheckCircle, color: 'text-green-600' },
    { value: 'occupied', label: 'Occupied', icon: AlertCircle, color: 'text-red-600' },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-yellow-600' },
    { value: 'reserved', label: 'Reserved', icon: Clock, color: 'text-blue-600' },
    { value: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-purple-600' }
  ];

  const featureOptions = [
    'adjustable', 'electric', 'manual', 'oxygen_outlet', 
    'monitor', 'suction', 'call_button'
  ];

  useEffect(() => {
    loadWards();
    loadBeds();
    loadStatistics();
  }, [filterWard, filterStatus]);

  const loadWards = async () => {
    try {
      const response = await api.get('/wards?status=active');
      setWards(response.data.data || []);
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const loadBeds = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterWard) query += `ward=${filterWard}&`;
      if (filterStatus) query += `status=${filterStatus}&`;
      
      const response = await api.get(`/beds${query}`);
      setBeds(response.data.data || []);
    } catch (error) {
      console.error('Error loading beds:', error);
      toast.error('Failed to load beds');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await api.get('/beds/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingBed) {
        await api.put(`/beds/${editingBed._id}`, formData);
        toast.success('Bed updated successfully');
      } else {
        await api.post('/beds', formData);
        toast.success('Bed created successfully');
      }
      
      setShowModal(false);
      resetForm();
      loadBeds();
      loadStatistics();
    } catch (error) {
      console.error('Error saving bed:', error);
      toast.error(error.response?.data?.message || 'Failed to save bed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bed) => {
    setEditingBed(bed);
    setFormData({
      bedNumber: bed.bedNumber,
      ward: bed.ward?._id || bed.ward,
      type: bed.type,
      features: bed.features || [],
      status: bed.status,
      notes: bed.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (bedId) => {
    if (!window.confirm('Are you sure you want to delete this bed?')) {
      return;
    }

    try {
      await api.delete(`/beds/${bedId}`);
      toast.success('Bed deleted successfully');
      loadBeds();
      loadStatistics();
    } catch (error) {
      console.error('Error deleting bed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete bed');
    }
  };

  const handleMarkCleaned = async (bedId) => {
    try {
      await api.put(`/beds/${bedId}/cleaned`);
      toast.success('Bed marked as cleaned and available');
      loadBeds();
      loadStatistics();
    } catch (error) {
      console.error('Error marking bed as cleaned:', error);
      toast.error('Failed to update bed status');
    }
  };

  const resetForm = () => {
    setFormData({
      bedNumber: '',
      ward: '',
      type: 'standard',
      features: [],
      status: 'available',
      notes: ''
    });
    setEditingBed(null);
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const filteredBeds = beds.filter(bed =>
    bed.bedNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusInfo = bedStatuses.find(s => s.value === status);
    if (!statusInfo) return null;

    const Icon = statusInfo.icon;
    return (
      <span className={`flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
        status === 'available' ? 'bg-green-100 text-green-800' :
        status === 'occupied' ? 'bg-red-100 text-red-800' :
        status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
        status === 'reserved' ? 'bg-blue-100 text-blue-800' :
        'bg-purple-100 text-purple-800'
      }`}>
        <Icon className="w-2 h-2 sm:w-3 sm:h-3" />
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="mb-3 sm:mb-4 md:mb-6">
        <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <BedDouble className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
          Bed Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage hospital beds and their availability</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
          <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 rounded-lg shadow">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{statistics.total}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Total Beds</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 md:p-4 rounded-lg shadow">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{statistics.available}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Available</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 md:p-4 rounded-lg shadow">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{statistics.occupied}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Occupied</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 sm:p-3 md:p-4 rounded-lg shadow">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600">{statistics.maintenance}</div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Maintenance</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 md:p-4 rounded-lg shadow col-span-2 sm:col-span-1">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">
              {statistics.occupancyRate ? `${statistics.occupancyRate.toFixed(1)}%` : '0%'}
            </div>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400">Occupancy Rate</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow mb-3 sm:mb-4 md:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative sm:col-span-2 md:col-span-1">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search bed number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          <select
            value={filterWard}
            onChange={(e) => setFilterWard(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Wards</option>
            {wards.map(ward => (
              <option key={ward._id} value={ward._id}>
                {ward.name}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            {bedStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add Bed
          </button>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bed Number
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ward
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-4 py-2 text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 text-xs">
                    Loading beds...
                  </td>
                </tr>
              ) : filteredBeds.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 text-xs">
                    No beds found
                  </td>
                </tr>
              ) : (
                filteredBeds.map((bed) => (
                  <tr key={bed._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <BedDouble className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">{bed.bedNumber}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-xs">
                      {bed.ward?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="capitalize text-gray-900 dark:text-gray-100 text-xs">{bed.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {bed.features?.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] rounded"
                          >
                            {feature.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(bed.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 text-xs">
                      {bed.currentPatient?.firstName || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {bed.status === 'cleaning' && (
                          <button
                            onClick={() => handleMarkCleaned(bed._id)}
                            className="text-green-600 hover:text-green-900"
                            title="Mark as Cleaned"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(bed)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(bed._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400 text-xs">
            Loading beds...
          </div>
        ) : filteredBeds.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center text-gray-500 dark:text-gray-400 text-xs">
            No beds found
          </div>
        ) : (
          filteredBeds.map((bed) => (
            <div key={bed._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <BedDouble className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{bed.bedNumber}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{bed.ward?.name || 'N/A'}</div>
                  </div>
                </div>
                {getStatusBadge(bed.status)}
              </div>

              {/* Details */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{bed.type}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-600">Patient:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{bed.currentPatient?.firstName || '-'}</span>
                </div>
                {bed.features && bed.features.length > 0 && (
                  <div className="text-[10px]">
                    <span className="text-gray-600 dark:text-gray-400">Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bed.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[9px] rounded"
                        >
                          {feature.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                {bed.status === 'cleaning' && (
                  <button
                    onClick={() => handleMarkCleaned(bed._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Clean
                  </button>
                )}
                <button
                  onClick={() => handleEdit(bed)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bed._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 dark:text-white">
                {editingBed ? 'Edit Bed' : 'Add New Bed'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bed Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bedNumber}
                    onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., A-101"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ward *
                  </label>
                  <select
                    required
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Ward</option>
                    {wards.map(ward => (
                      <option key={ward._id} value={ward._id}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Bed Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {bedTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {bedStatuses.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Features
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {featureOptions.map(feature => (
                    <label
                      key={feature}
                      className="flex items-center gap-2 p-2 border dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={() => handleFeatureToggle(feature)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-[10px] sm:text-xs capitalize">{feature.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {loading ? 'Saving...' : editingBed ? 'Update Bed' : 'Add Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BedManagement;