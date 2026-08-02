import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { User, ChevronRight } from 'lucide-react';
import { doctorService } from '../utils/doctorService';

const DoctorQueue = () => {
  const { user } = useAuth();

  // Get the query client instance
  
  const { data, isLoading, error } = useQuery(
    ['doctorQueue', user._id],
    () => doctorService.getDoctorQueue(),
    {
      enabled: user?.role === 'doctor',
    }
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-500">Could not load patient queue.</p>;

  const queue = data?.data || [];

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Your Patient Queue</h2>
      {queue.length > 0 ? (
        <ul className="divide-y divide-gray-200">
          {queue.map((visit) => (
            <li key={visit._id}>
              <Link to={`/visits/${visit._id}`} className="block hover:bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-indigo-100 text-indigo-600 rounded-full p-3 mr-4">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        {visit.patient.firstName} {visit.patient.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Reason: {visit.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Arrived: {new Date(visit.createdAt).toLocaleString('en-TZ', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    <ChevronRight className="w-5 h-5 ml-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 py-8">
          Your patient queue is currently empty.
        </p>
      )}
    </div>
  );
};

export default DoctorQueue;