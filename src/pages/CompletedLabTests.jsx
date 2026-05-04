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
        
        // Get all active visits (using isActive field)
        const visitsResponse = await api.get('/visits');
        const activeVisitIds = visitsResponse.data.data
          .filter(visit => visit.isActive === true)
          .map(visit => visit._id);
        
        // Filter to show only completed tests ordered by the current doctor for active visits
        const myCompletedTests = data.data.filter(test => {          
          const isMyOrder = test.orderedBy?._id === user?.id || test.orderedBy?._id === user?._id;
          const isCompleted = test.status === 'Completed';
          const isActiveVisit = activeVisitIds.includes(test.visit?._id || test.visit);
          
          return isCompleted && isMyOrder && isActiveVisit;
        });
        
        setLabTests(myCompletedTests);
      } catch (error) {
        console.error("Failed to fetch lab tests", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabTests();
  }, [user]);

  if (loading) return <LoadingSpinner />

  return (
    <div className="p-4 sm:p-6 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-primary dark:text-white mb-6">Completed Lab Test Results</h1>
      <div className="md-block bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          {labTests.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No completed lab tests found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Test Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ordered On</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {labTests.map((test) => (
                  <tr key={test._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">
                      {test.patient?.firstName} {test.patient?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">
                      {test.testName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
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
    </div>
  );
}