import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import api from '../utils/api';

export default function CompletedLabTests() {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const { data } = await api.get('/lab-tests');
        console.log('All lab tests:', data.data);
        console.log('Current user:', user);
        
        // Get all active visits (using isActive field)
        const visitsResponse = await api.get('/visits');
        const activeVisitIds = visitsResponse.data.data
          .filter(visit => visit.isActive === true)
          .map(visit => visit._id);
        
        console.log('Active visit IDs:', activeVisitIds);
        
        // Filter to show only completed tests ordered by the current doctor for active visits
        const myCompletedTests = data.data.filter(test => {
          console.log('Test orderedBy:', test.orderedBy);
          console.log('Test visit:', test.visit);
          console.log('Comparing:', test.orderedBy?._id, 'with', user?.id || user?._id);
          
          const isMyOrder = test.orderedBy?._id === user?.id || test.orderedBy?._id === user?._id;
          const isCompleted = test.status === 'Completed';
          const isActiveVisit = activeVisitIds.includes(test.visit?._id || test.visit);
          
          return isCompleted && isMyOrder && isActiveVisit;
        });
        
        console.log('Filtered completed tests:', myCompletedTests);
        setLabTests(myCompletedTests);
      } catch (error) {
        console.error("Failed to fetch lab tests", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabTests();
  }, [user]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">My Completed Lab Test Results</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        {labTests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completed lab tests found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {labTests.map((test) => (
                <tr key={test._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {test.patient?.firstName} {test.patient?.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {test.testName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/lab-tests/${test._id}`} className="btn-primary text-sm font-medium">
                      View Results
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
