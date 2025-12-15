import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import api from '../utils/api';

export default function LabTestDetail() {
  const { id } = useParams();
  const [labTest, setLabTest] = useState(null);
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get(`/lab-tests/${id}`);
        setLabTest(data.data);
        if (data.data.results) {
          setResults(data.data.results);
        }
      } catch (error) {
        console.error("Failed to fetch lab test details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { results, status: 'Completed' };
      await api.patch(`/lab-tests/${id}/results`, payload);
      toast.success('Results submitted successfully!');
      fetchTest(); // Refresh the data
    } catch (error) {
      toast.error('Failed to submit results.');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!labTest) {
    return <div>Lab test not found.</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Lab Result for {labTest.testName}</h1>
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4">
          <p><strong>Patient:</strong> {labTest.patient?.firstName} {labTest.patient?.lastName}</p>
          <p><strong>Status:</strong> {labTest.status}</p>
        </div>
        
        {labTest.status === 'Pending' ? (
          <form onSubmit={handleSubmit}>
            <label htmlFor="results" className="block text-sm font-medium text-gray-700">Test Results</label>
            <textarea
              id="results"
              value={results}
              onChange={(e) => setResults(e.target.value)}
              rows="5"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            ></textarea>
            <button type="submit" className="mt-4 inline-flex justify-center py-2 px-4 border shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Submit Results
            </button>
          </form>
        ) : (
          <div>
            <h3 className="text-xl font-semibold">Results</h3>
            <p className="mt-2 p-4 bg-gray-50 rounded">{labTest.results}</p>
          </div>
        )}
      </div>
    </div>
  );
}
