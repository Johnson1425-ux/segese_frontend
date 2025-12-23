import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Filter, Calendar, User, MapPin, Mail, Phone, Eye, Edit, AlertCircle, X } from 'lucide-react';
import { patientService } from '../utils/patientService.js';

const PatientSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const searchPatients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let searchParams = {
        page: currentPage,
        limit: 10
      };

      if (searchQuery.trim()) {
        searchParams.q = searchQuery.trim();
      }
      
      const response = await patientService.searchPatients(searchParams);

      if (response.status === 'success') {
        const patientsData = response.patients || [];
        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setTotalResults(response.count || patientsData.length || 0);
        setTotalPages(Math.ceil((response.count || patientsData.length || 0) / 10));
      } else {
        throw new Error(response.message || 'Search failed');
      }
      
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to search patients. Please try again.';
      setError(message);
      toast.error(message);
      setPatients([]);
      setTotalResults(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      searchPatients();
    }
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query');
      return;
    }
    
    setCurrentPage(1);
    searchPatients();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setPatients([]);
    setTotalResults(0);
    setTotalPages(1);
    setError(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const PatientModal = ({ patient, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Patient Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Patient ID</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.patientId || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{`${patient.firstName} ${patient.lastName}`}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900 break-all">{patient.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.phone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Date of Birth</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Age</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{calculateAge(patient.dateOfBirth)} years</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Gender</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.gender || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Blood Type</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">
                  {patient.bloodType ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {patient.bloodType}
                    </span>
                  ) : 'N/A'}
                </p>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">Marital Status</label>
                <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.maritalStatus || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">
                {patient.address ? 
                  `${patient.address.street}, ${patient.address.ward}, ${patient.address.district}, ${patient.address.region}, ${patient.address.country}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') 
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {/* Medical & Emergency Information */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 border-b pb-2">Medical & Emergency Information</h3>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Emergency Contact</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">
                {patient.emergencyContact?.name || 'N/A'}
                {patient.emergencyContact?.relationship && ` (${patient.emergencyContact.relationship})`}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">{patient.emergencyContact?.phone || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Medical History</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.medicalHistory || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Allergies</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.allergies || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Current Medications</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.currentMedications || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">Insurance Provider</label>
              <p className="mt-1 text-xs sm:text-sm text-gray-900">{patient.insurance?.provider || 'N/A'}</p>
              {patient.insurance?.policyNumber && (
                <p className="text-xs sm:text-sm text-gray-500">Policy: {patient.insurance.policyNumber}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <Link
            to={`/patients/${patient._id}/edit`}
            className="btn-secondary flex items-center justify-center text-sm sm:text-base"
            onClick={onClose}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Patient
          </Link>
          <button
            onClick={onClose}
            className="btn-primary text-sm sm:text-base"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
            <Search className="text-white w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">Manage Patients</h1>
            <p className="text-sm sm:text-base text-gray-600">Search and manage patients in the system</p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4'>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <Filter className="mr-2 text-blue-600 w-5 h-5 flex-shrink-0" />
            Patient Search
          </h3>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 sm:px-12 py-2 rounded-md hover:bg-blue-700 transition flex items-center justify-center disabled:bg-gray-400 text-sm sm:text-base"
          >
            <Search size={16} className="mr-2" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className='relative flex-1'>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or phone"
                className="input-field w-full text-sm sm:text-base"
                required
              />
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={!searchQuery.trim() && patients.length === 0}
              className="w-full sm:w-auto bg-gray-300 text-gray-700 px-6 sm:px-10 py-2 rounded-md hover:bg-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
            >
              Clear Search
            </button>
          </div>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center text-sm sm:text-base">
            <AlertCircle className="mr-2 flex-shrink-0" size={20} />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
          <button 
            onClick={() => {
              setError(null);
              if (searchQuery.trim()) {
                searchPatients();
              }
            }}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Birth Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
                      <span className="ml-2">Loading patients...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 && !searchQuery.trim() ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Patient Search</h3>
                      <p>Enter a patient's name, email, or phone number in the search field above to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No patients found matching "{searchQuery}". Try adjusting your search term.
                  </td>
                </tr>
              ) : (
                patients.map((patient, index) => (
                  <tr key={patient._id || patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * 10 + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {patient.firstName && patient.lastName 
                              ? `${patient.firstName} ${patient.lastName}`
                              : patient.fullName || 'N/A'
                            }
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.phone || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {patient.gender || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(patient.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {calculateAge(patient.dateOfBirth)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(patient)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                          title="View Patient"
                        >
                          <Eye size={16} />
                        </button>
                        <Link
                          to={`/patients/${patient._id || patient.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-blue-50"
                          title="Edit Patient"
                        >
                          <Edit size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
              <span className="ml-2 text-gray-500">Loading patients...</span>
            </div>
          </div>
        ) : patients.length === 0 && !searchQuery.trim() ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Patient Search</h3>
            <p className="text-sm text-gray-500">Enter a patient's name, email, or phone number to get started.</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">No patients found matching "{searchQuery}".</p>
          </div>
        ) : (
          patients.map((patient, index) => (
            <div key={patient._id || patient.id} className="bg-white shadow-md rounded-lg p-4 border border-gray-200">
              {/* Patient Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {patient.firstName && patient.lastName 
                        ? `${patient.firstName} ${patient.lastName}`
                        : patient.fullName || 'N/A'
                      }
                    </h3>
                    <p className="text-xs text-gray-500">#{(currentPage - 1) * 10 + index + 1}</p>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-2 mb-3 text-sm">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-600 break-all">{patient.email || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">{patient.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">
                    {formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)} years)
                  </span>
                </div>
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-600">{patient.gender || 'N/A'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleView(patient)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View
                </button>
                <Link
                  to={`/patients/${patient._id || patient.id}/edit`}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showModal && selectedPatient && (
        <PatientModal
          patient={selectedPatient}
          onClose={() => {
            setShowModal(false);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
};

export default PatientSearch;