import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BedDouble,
  Search,
  AlertCircle,
  CheckCircle,
  FileText,
  User,
  Plus,
  MapPin,
  Activity,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { toast } from "react-hot-toast";

// Get current Tanzania time for datetime-local input
const getTanzaniaDateTime = () => {
  const now = new Date();
  const tanzaniaTime = new Date(now.toLocaleString('en-US', {
    timeZone: 'Africa/Dar_es_Salaam'
  }));
  
  const year = tanzaniaTime.getFullYear();
  const month = String(tanzaniaTime.getMonth() + 1).padStart(2, '0');
  const day = String(tanzaniaTime.getDate()).padStart(2, '0');
  const hours = String(tanzaniaTime.getHours()).padStart(2, '0');
  const minutes = String(tanzaniaTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const IPD = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  // Wards and beds
  const [wards, setWards] = useState([]);
    const [availableBeds, setAvailableBeds] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  
  // Doctors and nurses
  const [doctors, setDoctors] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Inpatient records
  const [inpatientRecords, setInpatientRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  
  // Form data
  const [admissionData, setAdmissionData] = useState({
    patient: '',
    ward: '',
    bed: '',
    admissionDate: getTanzaniaDateTime(),
    admissionReason: '',
    admittingDoctor: '',
    attendingPhysician: '',
    assignedNurse: '',
    admissionType: 'elective',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
      email: ''
    },
    insurance: {
      provider: '',
      policyNumber: '',
      approvalNumber: ''
    },
    expectedDischargeDate: '',
    status: 'admitted',
    notes: ''
  });

  // Load wards, nurses and doctors on component mount
  useEffect(() => {
    loadWards();
    loadDoctors();
    loadNurses();
  }, []);

  // Load doctors
  const loadDoctors = async () => {
    setLoadingDoctors(true);
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data.data || response.data.users || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Load nurses
  const loadNurses = async () => {
    try {
      const response = await api.get('/nurses');
      setNurses(response.data.data || response.data.users || []);
    } catch (error) {
      console.error('Error loading nurses:', error);
      setNurses([]);
    }
  };

  // Search for patients
  const searchPatients = async () => {
    if (!patientSearch.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/patients/search?q=${patientSearch}`);
      setSearchResults(response.data.patients || response.data.data || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Failed to search patients. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Select patient and load data
  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setPatientSearch('');
    setAdmissionData(prev => ({ 
      ...prev, 
      patient: patient._id || patient.id,
      emergencyContact: {
        name: patient.emergencyContact?.name || '',
        phone: patient.emergencyContact?.phone || '',
        relationship: patient.emergencyContact?.relationship || '',
        email: patient.emergencyContact?.email || ''
      },
      insurance: {
        provider: patient.insurance?.provider || '',
        policyNumber: patient.insurance?.membershipNumber || '',
        approvalNumber: ''
      }
    }));
    await loadInpatientRecords(patient._id || patient.id);
  };

  // Load wards
  const loadWards = async () => {
    setLoadingWards(true);
    try {
      const response = await api.get('/wards?status=active');
      setWards(response.data.data || []);
    } catch (error) {
      console.error('Error loading wards:', error);
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  // Load beds when ward is selected
  const loadBedsInWard = async (wardId) => {
    if (!wardId) return;
    
    setLoadingBeds(true);
    try {
      const response = await api.get(`/beds/available/${wardId}`);
      setAvailableBeds(response.data.data || []);
    } catch (error) {
      console.error('Error loading beds:', error);
      setAvailableBeds([]);
    } finally {
      setLoadingBeds(false);
    }
  };

  // Handle ward selection
  const handleWardChange = (wardId) => {
    setAdmissionData(prev => ({ ...prev, ward: wardId, bed: '' }));
    loadBedsInWard(wardId);
  };

  // Load patient inpatient records
  const loadInpatientRecords = async (patientId) => {
    setLoadingRecords(true);
    try {
      const response = await api.get(`/ipd-records?patient=${patientId}`);
      setInpatientRecords(response.data.data || []);
    } catch (error) {
      console.error('Error loading inpatient records:', error);
      setInpatientRecords([]);
    } finally {
      setLoadingRecords(false);
    }
  };

  // Handle admission submission
  const handleSubmitAdmission = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient || !admissionData.ward || !admissionData.bed || !admissionData.admissionReason) {
      setError('Please fill in all required fields');
      return;
    }

    if (!admissionData.admittingDoctor) {
      setError('Please select an admitting doctor');
      return;
    }

    if (!admissionData.emergencyContact.name || !admissionData.emergencyContact.phone) {
      setError('Emergency contact information is required');
      return;
    }

    setLoading(true);
    
    try {
      const admissionPayload = {
        patient: admissionData.patient,
        ward: admissionData.ward,
        bed: admissionData.bed,
        admissionDate: admissionData.admissionDate,
        admissionReason: admissionData.admissionReason,
        admittingDoctor: admissionData.admittingDoctor,
        admissionType: admissionData.admissionType,
        emergencyContact: admissionData.emergencyContact,
        expectedDischargeDate: admissionData.expectedDischargeDate || undefined,
        status: admissionData.status,
        notes: admissionData.notes
      };

      // Add optional fields if present      
      if (admissionData.assignedNurse) {
        admissionPayload.assignedNurse = admissionData.assignedNurse;
      }

      // Only add insurance if provider is set
      if (admissionData.insurance.provider) {
        admissionPayload.insurance = admissionData.insurance;
      }

      const response = await api.post('/ipd-records', admissionPayload);
      
      if (response.status === 201) {
        toast.success(`Patient admitted successfully! Admission Number: ${response.data.data.admissionNumber}`);
        
        // Reset form
        setAdmissionData({
          patient: '',
          ward: '',
          bed: '',
          admissionDate: new Date().toISOString().slice(0, 16),
          admissionReason: '',
          admittingDoctor: '',
          attendingPhysician: '',
          assignedNurse: '',
          admissionType: 'elective',
          emergencyContact: {
            name: '',
            phone: '',
            relationship: '',
            email: ''
          },
          insurance: {
            provider: '',
            policyNumber: '',
            approvalNumber: ''
          },
          expectedDischargeDate: '',
          status: 'admitted',
          notes: ''
        });
        
        // Clear selection and reload data
        setSelectedPatient(null);
        setAvailableBeds([]);
        await loadWards();
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to admit patient. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Format date
  
  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-TZ', {
      timeZone: 'Africa/Dar_es_Salaam',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'admitted':
      case 'under_observation':
        return 'bg-blue-100 text-blue-800';
      case 'stable':
        return 'bg-green-100 text-green-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      case 'transferred':
        return 'bg-yellow-100 text-yellow-800';
      case 'deceased':
        return 'bg-red-100 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center w-full sm:w-auto">
              <div className="bg-blue-500 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <BedDouble className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">Inpatient Department (IPD)</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage patient admissions and ward assignments</p>
              </div>
            </div>
            <button
              onClick={() => {
                loadWards();
                loadDoctors();
                loadNurses();
              }}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-xs sm:text-sm w-full sm:w-auto justify-center flex-shrink-0"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 flex items-start justify-between text-xs sm:text-sm">
            <div className="flex items-start min-w-0 flex-1">
              <AlertCircle className="mr-2 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
              <div className="min-w-0 flex-1">
                <strong>Error:</strong> <span className="break-words">{error}</span>
              </div>
            </div>
            <button onClick={() => setError(null)} className="flex-shrink-0 ml-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 sm:px-4 py-2 sm:py-3 rounded mb-3 sm:mb-4 flex items-start justify-between text-xs sm:text-sm">
            <div className="flex items-start min-w-0 flex-1">
              <CheckCircle className="mr-2 flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
              <div className="min-w-0 flex-1">
                <strong>Success:</strong> <span className="break-words">{success}</span>
              </div>
            </div>
            <button onClick={() => setSuccess(null)} className="flex-shrink-0 ml-2">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Patient Search Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Search className="mr-1 sm:mr-2 text-blue-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Search Patient
            </h3>
            
            {/* Search Input */}
            <div className="mb-3 sm:mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Search by name, email, or phone"
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
                <Search className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <button
                onClick={searchPatients}
                disabled={loading || !patientSearch.trim()}
                className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
              >
                {loading ? 'Searching...' : 'Search Patient'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mb-3 sm:mb-4">
                <h4 className="font-medium text-gray-700 text-xs sm:text-sm">Search Results:</h4>
                <div className="max-h-48 sm:max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((patient) => (
                    <div
                      key={patient._id || patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    >
                      <div className="flex items-center">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                          <User className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                            {patient.fullName || `${patient.firstName} ${patient.lastName}`}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                            ID: {patient.patientId || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Patient Display */}
            {selectedPatient && (
              <div className="border-t pt-3 sm:pt-4">
                <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">Selected Patient:</h4>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                          {selectedPatient.fullName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          ID: {selectedPatient.patientId || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setAdmissionData(prev => ({ 
                          ...prev, 
                          patient: '',
                          emergencyContact: { name: '', phone: '', relationship: '', email: '' },
                          insurance: { provider: '', policyNumber: '', approvalNumber: '' }
                        }));
                      }}
                      className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 sm:space-y-1">
                    <p>Age: {selectedPatient.age || 'N/A'}</p>
                    <p>Gender: {selectedPatient.gender || 'N/A'}</p>
                    {selectedPatient.bloodType && <p>Blood Type: {selectedPatient.bloodType}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wards Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <MapPin className="mr-1 sm:mr-2 text-blue-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Available Wards
            </h3>

            {loadingWards ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500 text-xs sm:text-sm">Loading wards...</span>
              </div>
            ) : wards.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <BedDouble className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                <p className="text-xs sm:text-sm">No wards found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                {wards.map((ward) => (
                  <div
                    key={ward._id}
                    className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition ${
                      admissionData.ward === ward._id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => handleWardChange(ward._id)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">{ward.name}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{ward.wardNumber}</p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400">
                          Floor: {ward.floor} | Type: {ward.type}
                        </p>
                        <p className="text-[9px] sm:text-[10px] text-gray-400">
                          Available: {ward.availableBeds}/{ward.capacity} beds
                        </p>
                      </div>
                      <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${
                        ward.availableBeds > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {ward.availableBeds > 0 ? 'Available' : 'Full'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Records Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Activity className="mr-1 sm:mr-2 text-blue-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Patient IPD History
            </h3>

            {!selectedPatient ? (
              <div className="text-center py-6 sm:py-8">
                <Activity className="mx-auto h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 mb-3 sm:mb-4" />
                <p className="text-gray-500 text-xs sm:text-sm">Select a patient to view IPD history</p>
              </div>
            ) : (
              <div>
                {loadingRecords ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-500 text-xs sm:text-sm">Loading records...</span>
                  </div>
                ) : inpatientRecords.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="mx-auto h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                    <p className="text-xs sm:text-sm">No inpatient records found.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
                    {inpatientRecords.map((record) => (
                      <div
                        key={record._id}
                        className="p-2 sm:p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-medium text-gray-900 text-xs sm:text-sm truncate flex-1">
                              {record.admissionNumber}
                            </p>
                            <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0 ${getStatusColor(record.status)}`}>
                              {record.status}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                            Ward: {record.ward?.name || 'N/A'} - Bed: {record.bed?.bedNumber || 'N/A'}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-gray-500">
                            Admitted: {formatDateTime(record.admissionDate)}
                          </p>
                          {record.dischargeDate && (
                            <p className="text-[9px] sm:text-[10px] text-gray-500">
                              Discharged: {formatDateTime(record.dischargeDate)}
                            </p>
                          )}
                          <p className="text-[9px] sm:text-[10px] text-gray-500">
                            Length of Stay: {record.lengthOfStay} days
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Admit Patient Form */}
        {selectedPatient && (
          <div className="mt-3 sm:mt-4 md:mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Plus className="mr-1 sm:mr-2 text-blue-500 w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Admit Patient
            </h3>

            <form onSubmit={handleSubmitAdmission}>
              {/* Basic Admission Info */}
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">Admission Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Ward *
                    </label>
                    <select
                      value={admissionData.ward}
                      onChange={(e) => handleWardChange(e.target.value)}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    >
                      <option value="">Select Ward</option>
                      {wards.map((ward) => (
                        <option 
                          key={ward._id} 
                          value={ward._id}
                          disabled={ward.availableBeds === 0}
                        >
                          {ward.name} ({ward.availableBeds} available)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Bed *
                    </label>
                    <select
                      value={admissionData.bed}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, bed: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                      disabled={!admissionData.ward || loadingBeds}
                    >
                      <option value="">Select Bed</option>
                      {availableBeds.map((bed) => (
                        <option key={bed._id} value={bed._id}>
                          {bed.bedNumber} ({bed.type})
                        </option>
                      ))}
                    </select>
                    {loadingBeds && (
                      <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">Loading beds...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Admission Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={admissionData.admissionDate}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, admissionDate: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Admission Type *
                    </label>
                    <select
                      value={admissionData.admissionType}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, admissionType: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    >
                      <option value="elective">Elective</option>
                      <option value="emergency">Emergency</option>
                      <option value="transfer">Transfer</option>
                      <option value="observation">Observation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Admitting Doctor *
                    </label>
                    <select
                      value={admissionData.admittingDoctor}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, admittingDoctor: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    >
                      <option value="">Select Doctor</option>
                      {loadingDoctors ? (
                        <option disabled>Loading doctors...</option>
                      ) : (
                        doctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            {doc.fullName || `${doc.firstName} ${doc.lastName}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Assigned Nurse (Optional)
                    </label>
                    <select
                      value={admissionData.assignedNurse}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, assignedNurse: e.target.value }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    >
                      <option value="">Select Nurse</option>
                      {nurses.length === 0 ? (
                        <option disabled>No nurses found</option>
                      ) : (
                        nurses.map((nurse) => (
                          <option key={nurse._id} value={nurse._id}>
                            {nurse.fullName || `${nurse.firstName} ${nurse.lastName}`}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Expected Discharge Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={admissionData.expectedDischargeDate}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, expectedDischargeDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Admission Reason *
                    </label>
                    <textarea
                      value={admissionData.admissionReason}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, admissionReason: e.target.value }))}
                      rows={2}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Reason for admission..."
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="mb-4 sm:mb-6 border-t pt-4 sm:pt-6">
                <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">Emergency Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      value={admissionData.emergencyContact.name}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, name: e.target.value } }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      type="text"
                      value={admissionData.emergencyContact.phone}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, phone: e.target.value } }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={admissionData.emergencyContact.relationship}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, relationship: e.target.value } }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={admissionData.emergencyContact.email}
                      onChange={(e) => setAdmissionData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, email: e.target.value } }))}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-4 sm:mb-6 border-t pt-4 sm:pt-6">
                <h4 className="font-medium text-gray-700 mb-2 sm:mb-3 text-xs sm:text-sm">Admission Notes (Optional)</h4>
                <div>
                  <textarea
                    value={admissionData.notes}
                    onChange={(e) => setAdmissionData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    placeholder="Add any relevant admission notes..."
                  ></textarea>
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-4 sm:pt-6 text-right">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-xs sm:text-sm md:text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                      Admitting...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                      Admit Patient
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default IPD;