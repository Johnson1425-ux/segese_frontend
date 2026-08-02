import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Plus, Eye, Check, X, FileText, Building } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Service functions
const releaseService = {
  getAll: () => api.get('/releases'),
  getPending: () => api.get('/releases/pending'),
  getById: (id) => api.get(`/releases/${id}`),
  create: (data) => api.post('/releases', data),
  update: (id, data) => api.put(`/releases/${id}`, data),
  approve: (id) => api.post(`/releases/${id}/approve`),
  complete: (id) => api.post(`/releases/${id}/complete`),
  cancel: (id, reason) => api.post(`/releases/${id}/cancel`, { reason })
};

const corpseService = {
  getAll: () => api.get('/corpses')
};

const ReleaseManagement = () => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRelease, setSelectedRelease] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all', 'pending'

  // Queries
  const { data: releasesData, isLoading } = useQuery(
    ['releases', viewMode], 
    viewMode === 'pending' ? releaseService.getPending : releaseService.getAll
  );
  const { data: corpsesData } = useQuery('corpses', corpseService.getAll);

  // Mutations
  const createMutation = useMutation(releaseService.create, {
    onSuccess: () => {
      toast.success('Release request created successfully');
      queryClient.invalidateQueries('releases');
      setShowCreateForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create release request');
    }
  });

  const approveMutation = useMutation(releaseService.approve, {
    onSuccess: () => {
      toast.success('Release approved successfully');
      queryClient.invalidateQueries('releases');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to approve release');
    }
  });

  const completeMutation = useMutation(releaseService.complete, {
    onSuccess: () => {
      toast.success('Release completed successfully');
      queryClient.invalidateQueries('releases');
      queryClient.invalidateQueries('corpses');
      queryClient.invalidateQueries('cabinets');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete release');
    }
  });

  const cancelMutation = useMutation(
    ({ id, reason }) => releaseService.cancel(id, reason),
    {
      onSuccess: () => {
        toast.success('Release cancelled successfully');
        queryClient.invalidateQueries('releases');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to cancel release');
      }
    }
  );

  if (isLoading) return <LoadingSpinner />;

  // Extract data from React Query response
  // Handle both nested structures: releasesData.data.data or releasesData.data
  const releasesArray = releasesData?.data?.data || releasesData?.data || [];
  const corpsesArray = corpsesData?.data?.data || corpsesData?.data || [];
  
  const releases = Array.isArray(releasesArray) ? releasesArray : [];
  const corpses = Array.isArray(corpsesArray) ? corpsesArray : [];
  const availableCorpses = corpses.filter(corpse => corpse.status !== 'Released');

  const handleCreateRelease = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      corpseId: formData.get('corpseId'),
      releaseType: formData.get('releaseType'),
      releaseDate: formData.get('releaseDate'),
      releasedTo: {
        name: formData.get('releasedToName'),
        relationship: formData.get('relationship'),
        idNumber: formData.get('idNumber'),
        phone: formData.get('phone'),
        address: formData.get('address')
      },
      funeralHome: formData.get('funeralHomeName') ? {
        name: formData.get('funeralHomeName'),
        contactPerson: formData.get('funeralContact'),
        phone: formData.get('funeralPhone'),
        address: formData.get('funeralAddress'),
        licenseNumber: formData.get('licenseNumber')
      } : undefined,
      releaseNotes: formData.get('releaseNotes')
    };
    createMutation.mutate(data);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-blue-100 text-blue-800',
      'Released': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return `px-3 py-1 rounded-full text-sm font-semibold ${statusColors[status]}`;
  };

  const getReleaseTypeBadge = (type) => {
    const typeColors = {
      'Burial': 'bg-gray-100 text-gray-800',
      'Cremation': 'bg-orange-100 text-orange-800',
      'Transfer': 'bg-purple-100 text-purple-800',
      'Repatriation': 'bg-indigo-100 text-indigo-800'
    };
    return `px-2 py-1 rounded text-xs font-medium ${typeColors[type]}`;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Release Management</h1>
          <div className="flex space-x-4 mt-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              All Releases
            </button>
            <button
              onClick={() => setViewMode('pending')}
              className={`px-4 py-2 rounded-lg ${viewMode === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Pending Approval
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Release Request
        </button>
      </div>

      {/* Create Release Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b z-10">
              <h2 className="text-xl font-bold">Create Release Request</h2>
            </div>
            
            <form onSubmit={handleCreateRelease} className="p-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Corpse *</label>
                    <select 
                      name="corpseId" 
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a corpse</option>
                      {availableCorpses.map(corpse => (
                        <option key={corpse._id} value={corpse._id}>
                          {corpse.firstName} {corpse.lastName} - {corpse.cabinetNumber || 'No cabinet'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Release Type *</label>
                    <select 
                      name="releaseType" 
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select type</option>
                      <option value="Burial">Burial</option>
                      <option value="Cremation">Cremation</option>
                      <option value="Transfer">Transfer</option>
                      <option value="Repatriation">Repatriation</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Release Date *</label>
                  <input 
                    name="releaseDate" 
                    type="datetime-local"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Released To</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input 
                        name="releasedToName" 
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input 
                        name="relationship"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                      <input 
                        name="idNumber"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input 
                        name="phone"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea 
                      name="address"
                      rows="2"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Funeral Home (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Funeral Home Name</label>
                      <input 
                        name="funeralHomeName"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                      <input 
                        name="funeralContact"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input 
                        name="funeralPhone"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                      <input 
                        name="licenseNumber"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea 
                      name="funeralAddress"
                      rows="2"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea 
                    name="releaseNotes"
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t flex justify-end space-x-2">
                <button 
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {createMutation.isLoading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Releases Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corpse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Released To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {releases.length > 0 ? (
                releases.map(release => (
                  <tr key={release._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {release.corpseId?.firstName} {release.corpseId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Receipt: {release.receiptNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getReleaseTypeBadge(release.releaseType)}>
                        {release.releaseType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{release.releasedTo.name}</div>
                      <div className="text-sm text-gray-500">{release.releasedTo.relationship}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(release.releaseDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(release.status)}>
                        {release.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedRelease(release)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {release.status === 'Pending' && (
                          <button 
                            onClick={() => approveMutation.mutate(release._id)}
                            disabled={approveMutation.isLoading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Approve Release"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        
                        {release.status === 'Approved' && (
                          <button 
                            onClick={() => completeMutation.mutate(release._id)}
                            disabled={completeMutation.isLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                            title="Complete Release"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(release.status === 'Pending' || release.status === 'Approved') && (
                          <button 
                            onClick={() => {
                              const reason = prompt('Enter cancellation reason:');
                              if (reason) {
                                cancelMutation.mutate({ id: release._id, reason });
                              }
                            }}
                            disabled={cancelMutation.isLoading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Cancel Release"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No releases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Release Details Modal */}
      {selectedRelease && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-6 pb-4 border-b z-10 flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">Release Details</h2>
                <p className="text-gray-600">Receipt: {selectedRelease.receiptNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedRelease(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 pt-4 space-y-6">
              {/* Corpse Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Deceased Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedRelease.corpseId?.firstName} {selectedRelease.corpseId?.lastName}
                  </div>
                  <div>
                    <span className="font-medium">Date of Death:</span> {selectedRelease.corpseId?.dateOfDeath ? new Date(selectedRelease.corpseId?.dateOfDeath).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Release Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Release Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> 
                    <span className={`ml-2 ${getReleaseTypeBadge(selectedRelease.releaseType)}`}>
                      {selectedRelease.releaseType}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 ${getStatusBadge(selectedRelease.status)}`}>
                      {selectedRelease.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Release Date:</span> {new Date(selectedRelease.releaseDate).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Authorized By:</span> {selectedRelease.authorizedBy?.firstName} {selectedRelease.authorizedBy?.lastName}
                  </div>
                </div>
              </div>

              {/* Released To Information */}
              <div className="border-b pb-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Released To
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedRelease.releasedTo.name}
                  </div>
                  <div>
                    <span className="font-medium">Relationship:</span> {selectedRelease.releasedTo.relationship || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">ID Number:</span> {selectedRelease.releasedTo.idNumber || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedRelease.releasedTo.phone || 'N/A'}
                  </div>
                </div>
                {selectedRelease.releasedTo.address && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Address:</span> {selectedRelease.releasedTo.address}
                  </div>
                )}
              </div>

              {/* Funeral Home Information */}
              {selectedRelease.funeralHome?.name && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Funeral Home
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedRelease.funeralHome.name}
                    </div>
                    <div>
                      <span className="font-medium">Contact Person:</span> {selectedRelease.funeralHome.contactPerson || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {selectedRelease.funeralHome.phone || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">License:</span> {selectedRelease.funeralHome.licenseNumber || 'N/A'}
                    </div>
                  </div>
                  {selectedRelease.funeralHome.address && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Address:</span> {selectedRelease.funeralHome.address}
                    </div>
                  )}
                </div>
              )}

              {/* Approval Information */}
              {selectedRelease.approvedBy && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Approval Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Approved By:</span> {selectedRelease.approvedBy.firstName} {selectedRelease.approvedBy.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Approval Date:</span> {new Date(selectedRelease.approvalDate).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRelease.releaseNotes && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Notes</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedRelease.releaseNotes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t sticky bottom-0 bg-white">
                {selectedRelease.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => {
                        approveMutation.mutate(selectedRelease._id);
                        setSelectedRelease(null);
                      }}
                      disabled={approveMutation.isLoading}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      Approve Release
                    </button>
                    <button 
                      onClick={() => {
                        const reason = prompt('Enter cancellation reason:');
                        if (reason) {
                          cancelMutation.mutate({ id: selectedRelease._id, reason });
                          setSelectedRelease(null);
                        }
                      }}
                      disabled={cancelMutation.isLoading}
                      className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                    >
                      Cancel Release
                    </button>
                  </>
                )}
                
                {selectedRelease.status === 'Approved' && (
                  <button 
                    onClick={() => {
                      completeMutation.mutate(selectedRelease._id);
                      setSelectedRelease(null);
                    }}
                    disabled={completeMutation.isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    Complete Release
                  </button>
                )}
                
                <button 
                  onClick={() => setSelectedRelease(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReleaseManagement;
