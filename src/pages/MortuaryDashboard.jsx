import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { PlusCircle } from 'lucide-react';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Service function to fetch all corpses
const corpseService = {
  getAll: async () => {
    const response = await api.get('/corpses');
    return response.data;
  },
};

const MortuaryDashboard = () => {
  const { data: corpsesData, isLoading, error } = useQuery('corpses', corpseService.getAll);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    toast.error('Failed to fetch mortuary records.');
    return <div className="text-red-500 text-center">Error loading data. Please try again.</div>;
  }

  const corpses = corpsesData?.data || [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Mortuary Management</h1>
        <Link to="/corpses/new" className="btn-primary inline-flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" />
          Register New Corpse
        </Link>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sex</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabinet Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {corpses.length > 0 ? (
                corpses.map(corpse => (
                  <tr key={corpse._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{`${corpse.firstName} ${corpse.lastName}`}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{corpse.sex}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{new Date(corpse.dateOfBirth).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{corpse.cabinetNumber || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-sm rounded-full font-semibold ${
                        corpse.status === 'In Storage' ? 'bg-blue-100 text-blue-800' :
                        corpse.status === 'Released' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {corpse.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/corpses/${corpse._id}/`} className="btn-primary">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    No records found.
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

export default MortuaryDashboard;