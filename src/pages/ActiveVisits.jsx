import { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { toast } from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function ActiveVisits() {
  const [visits, setVisits] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500); 

  const fetchActiveVisits = async () => {
    setLoading(true);
    try {
      // Use the updated /api/visits endpoint with the search query
      const response = await api.get(`/visits?search=${debouncedSearch}`);
      setVisits(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch active visits.");
      console.error("Fetch visits error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveVisits();
  }, [debouncedSearch]); // Refetch when the debounced search term changes

  const handleEndVisit = async (visitId) => {
    if (!window.confirm("Are you sure you want to end this visit?")) 
      return;

    try {
      // Use the existing patch route to toggle isActive
      await api.patch(`/visits/${visitId}/end-visit`);

      toast.success("Visit ended successfully.");
      // Refresh the list
      fetchActiveVisits(); 
    } catch (error) {
      toast.error("Failed to end visit.");
      console.error("End visit error:", error);
    }
  };

  const getPatientName = (patient) => {
    return patient 
      ? patient.fullName || `${patient.firstName || ""} ${patient.lastName || ""}` 
      : "N/A";
  };
  
  if (loading) return <div className="text-center p-6 text-gray-500 dark:text-gray-400">Loading active visits...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Active Visits Tracker</h1>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Visits Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visit ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Patient Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Doctor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {visits.length > 0 ? (
              visits.map((visit) => (
                <tr key={visit._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{visit.visitId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{getPatientName(visit.patient)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{getPatientName(visit.doctor)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{visit.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{visit.status}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEndVisit(visit._id)}
                      className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                    >
                      End Visit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-6 text-center text-gray-500 dark:text-gray-400">
                  No active visits found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Simple useDebounce hook (You'll need to define this or use a utility)
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}