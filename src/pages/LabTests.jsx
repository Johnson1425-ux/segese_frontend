import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import api from '../utils/api';

export default function LabTests() {
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLabTests = async () => {
      try {
        const { data } = await api.get('/lab-tests');
        // Filter to show only pending tests
        const pendingTests = data.data.filter(test => test.status === 'Pending');
        setLabTests(pendingTests);
      } catch (error) {
        console.error("Failed to fetch lab tests", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabTests();
  }, []);

  // Group lab tests by patient
  const groupTestsByPatient = () => {
    const grouped = {};
    labTests.forEach(test => {
      const patientId = test.patient?._id;
      if (patientId) {
        if (!grouped[patientId]) {
          grouped[patientId] = {
            patient: test.patient,
            tests: []
          };
        }
        grouped[patientId].tests.push(test);
      }
    });
    return Object.values(grouped);
  };

  const patientsWithTests = groupTestsByPatient();

  // Filter patients based on search term
  const filteredPatients = patientsWithTests.filter(item => {
    const fullName = `${item.patient?.firstName} ${item.patient?.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;

  // Patient List View
  if (!selectedPatient) {
    return (
      <div className="p-4 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-6">Lab Test Orders - Patients</h1>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
              />
          </div>
        </div>

        <>
          {/* Desktop Table View - Hidden on mobile */}
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Names</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPatients.map((item) => (
                    <tr key={item.patient._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.patient.firstName} {item.patient.lastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {item.patient.patientId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {item.tests.length} {item.tests.length === 1 ? 'test' : 'tests'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {item.tests.slice(0, 2).map((test, idx) => (
                            <div key={idx} className="truncate max-w-xs">
                              • {test.testName}
                            </div>
                          ))}
                          {item.tests.length > 2 && (
                            <div className="text-primary font-medium text-xs mt-1">
                              +{item.tests.length - 2} more tests
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedPatient(item)}
                          className="btn-primary text-sm font-medium px-4 py-2 rounded-lg inline-block"
                        >
                          View All Tests
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="md:hidden grid grid-cols-1 gap-4">
            {filteredPatients.map((item) => (
              <div
                key={item.patient._id}
                onClick={() => setSelectedPatient(item)}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {item.patient.firstName} {item.patient.lastName}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {item.tests.length} {item.tests.length === 1 ? 'test' : 'tests'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Patient ID: {item.patient.patientId || 'N/A'}
                </p>
                <div className="text-sm text-gray-500">
                  <p className="font-medium mb-1">Pending Tests:</p>
                  <ul className="list-disc list-inside mt-1">
                    {item.tests.slice(0, 3).map((test, idx) => (
                      <li key={idx} className="truncate">{test.testName}</li>
                    ))}
                    {item.tests.length > 3 && (
                      <li className="text-primary font-medium">+{item.tests.length - 3} more</li>
                    )}
                  </ul>
                </div>
                <button className="mt-4 w-full btn-primary text-sm py-2">
                  View All Tests
                </button>
              </div>
            ))}
          </div>
        </>
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No patients with pending lab tests found.</p>
          </div>
        )}
      </div>
    );
  }

  // Patient's All Tests View
  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <button
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-gray-700 hover:text-primary hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Patients</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
        </h2>
        <p className="text-gray-600">
          Patient ID: {selectedPatient.patient.patientId || 'N/A'}
        </p>
        <p className="text-gray-600">
          Total Pending Tests: <span className="font-semibold text-primary">{selectedPatient.tests.length}</span>
        </p>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedPatient.tests.map((test) => (
                <tr key={test._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {test.testName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(test.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      to={`/lab-tests/${test._id}`} 
                      className="btn-primary text-sm font-medium inline-block px-4 py-2 rounded-lg"
                      >
                      Add Result
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {selectedPatient.tests.length === 0 && (
            <p className="text-gray-500 text-center py-8">No lab tests found.</p>
          )}
        </div>
      </div>

      {/* Mobile Card View - Hidden on desktop */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {selectedPatient.tests.map((test) => (
          <div
            key={test._id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {test.testName}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-600">
                  Ordered: {new Date(test.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mb-3">
                <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                  {test.status}
                </span>
              </div>
            </div>
            <Link 
              to={`/lab-tests/${test._id}`} 
              className="btn-primary text-sm font-medium inline-block px-4 py-2 rounded-lg w-full text-center"
            >
              Add Result
            </Link>
          </div>
        ))}
        {selectedPatient.tests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No lab tests found.</p>
          </div>
        )}
      </div>
    </div>
  );
}