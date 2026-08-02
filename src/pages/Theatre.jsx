import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Stethoscope,
  User,
  Search,
  AlertCircle,
  CheckCircle,
  FileText,
  Plus,
  Scissors,
  MapPin,
  XCircle,
  RefreshCw,
  BedDouble,
} from 'lucide-react';
import toast from 'react-hot-toast';

const Theatre = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Patient search
  const [patientSearch, setPatientSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Theatres
  const [theatres, setTheatres] = useState([]);
  const [loadingTheatres, setLoadingTheatres] = useState(false);

  // Selections
  const [selections, setSelections] = useState([]);
  const [, setLoadingSelections] = useState(false);

  // Surgeons
  const [surgeons, setSurgeons] = useState([]);
  const [loadingSurgeons, setLoadingSurgeons] = useState(false);
  
  // Theatre schedules
  const [, setTheatreSchedules] = useState([]);
  const [, setLoadingSchedules] = useState(false);
  
  // Theatre procedures
  const [theatreProcedures, setTheatreProcedures] = useState([]);
  const [loadingProcedures, setLoadingProcedures] = useState(false);
  
  // Form data
  const [procedureData, setProcedureData] = useState({
    patient: '',
    procedure_name: '',
    procedure_date: '',
    theatre_room: '',
    surgeon: '',
    anesthesiologist: '',
    procedure_type: '',
    estimated_duration: '',
    priority: 'normal',
    status: 'scheduled',
    notes: '',
    pre_op_notes: '',
    post_op_notes: ''
  });

  // Load theatre rooms and surgeons on component mount
  useEffect(() => {
    loadTheatres();
    loadSurgeons();
    loadSelections();
  }, []);

  // Common procedures
  const loadSelections = async () => {
    setLoadingSelections(true);
    try {
      // Fetch all active services
      const response = await api.get('/services');
      const allServices = response.data.data || response.data || [];
      
      // Filter for only Procedure category services
      const procedureServices = allServices.filter(
        service => service.category === 'Procedure'
      );
      
      setSelections(procedureServices);
    } catch (error) {
      console.error('Error loading selections:', error);
      setSelections([]);
    } finally {
      setLoadingSelections(false);
    }
  };

  const loadSurgeons = async () => {
    setLoadingSurgeons(true);
    try {
      const response = await api.get('/surgeons');
      setSurgeons(response.data.data || response.data.users || []);
    } catch {
      console.error('Error loading surgeons:', error);
      setSurgeons([]);
    } finally {
      setLoadingSurgeons(false);
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

  // Select patient and load theatre data
  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setPatientSearch('');
    setProcedureData(prev => ({ 
      ...prev, 
      patient: patient._id || patient.id
    }));
    await loadTheatreSchedules();
    await loadTheatreProcedures(patient._id || patient.id);
  };

  const loadTheatres = async () => {
    setLoadingTheatres(true);
    try {
      const response = await api.get('/theatres?status=active');
      setTheatres(response.data.data || []);
    } catch {
      console.error('Error loading theatres', error);
      setTheatres([]);
    } finally {
      setLoadingTheatres(false);
    }
  };

  // Load theatre schedules
  const loadTheatreSchedules = async () => {
    setLoadingSchedules(true);
    try {
      const response = await api.get('/theatre-procedures');
      setTheatreSchedules(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading theatre schedules:', error);
      setTheatreSchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Handle theatre selection
  const handleTheatreChange = (theatreId) => {
    setProcedureData(prev => ({ ...prev, theatre: theatreId }));
  }

  // Load patient theatre procedures
  const loadTheatreProcedures = async (patientId) => {
    setLoadingProcedures(true);
    try {
      const response = await api.get(`/theatre-procedures/?patient=${patientId}`);
      setTheatreProcedures(response.data.data || []);
    } catch (error) {
      console.error('Error loading theatre procedures:', error);
      setTheatreProcedures([]);
    } finally {
      setLoadingProcedures(false);
    }
  };

  // Handle procedure submission
  const handleSubmitProcedure = async (e) => {
    e.preventDefault();
    
    if (!selectedPatient || !procedureData.procedure_name || !procedureData.procedure_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const procedurePayload = {
        patient: procedureData.patient,
        procedure_name: procedureData.procedure_name,
        procedure_date: procedureData.procedure_date,
        theatre: procedureData.theatre_room,
        surgeon: procedureData.surgeon,
        anesthesiologist: procedureData.anesthesiologist,
        estimated_duration: procedureData.estimated_duration,
        priority: procedureData.priority,
        status: procedureData.status,
        notes: procedureData.notes,
        pre_op_notes: procedureData.pre_op_notes,
        post_op_notes: procedureData.post_op_notes
      };

      const response = await api.post('/theatre-procedures/', procedurePayload);
      
      if (response.status === 201) {
        toast.success('Theatre procedure scheduled successfully!');
        
        // Reset form
        setProcedureData({
          patient: '',
          procedure_name: '',
          procedure_date: '',
          theatre_room: '',
          surgeon: '',
          anesthesiologist: '',
          procedure_type: '',
          estimated_duration: '',
          priority: 'normal',
          status: 'scheduled',
          notes: '',
          pre_op_notes: '',
          post_op_notes: ''
        });
        
        // Reload data
        setSelectedPatient(null);
        await loadTheatres();
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (error) {
      console.error('Error scheduling theatre procedure:', error);
      toast.error('Failed to schedule theatre procedure. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  
  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'postponed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority color
  
  return (
    <div className="bg-gray-50 min-h-screen p-3 md:p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="bg-indigo-500 p-2 md:p-3 rounded-lg mr-3 md:mr-4">
                <Stethoscope className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Theatre Management</h1>
                <p className="text-xs md:text-sm text-gray-600">Schedule and manage surgical procedures</p>
              </div>
            </div>
            <button
              onClick={() => {
                loadTheatres();
                loadSurgeons();
              }}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm w-full sm:w-auto justify-center"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-3 rounded mb-4 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center min-w-0">
              <AlertCircle className="mr-2 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <strong>Error:</strong> <span className="break-words">{error}</span>
              </div>
            </div>
            <button onClick={() => setError(null)} className="flex-shrink-0 ml-2">
              <XCircle size={18} />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-3 md:px-4 py-3 rounded mb-4 flex items-center justify-between text-xs md:text-sm">
            <div className="flex items-center min-w-0">
              <CheckCircle className="mr-2 flex-shrink-0" size={18} />
              <div className="min-w-0">
                <strong>Success:</strong> <span className="break-words">{success}</span>
              </div>
            </div>
            <button onClick={() => setSuccess(null)} className="flex-shrink-0 ml-2">
              <XCircle size={18} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Patient Search Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Search className="mr-2 text-indigo-500" size={18} />
              Search Patient
            </h3>
            
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Search by name, email or phone"
                  className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              </div>
              <button
                onClick={searchPatients}
                disabled={loading || !patientSearch.trim()}
                className="mt-2 w-full bg-indigo-500 text-white py-2 px-4 rounded-md text-sm md:text-base hover:bg-indigo-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Patient'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="font-medium text-gray-700 text-sm md:text-base">Search Results:</h4>
                <div className="max-h-48 md:max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((patient) => (
                    <div
                      key={patient._id || patient.id}
                      onClick={() => handlePatientSelect(patient)}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition"
                    >
                      <div className="flex items-center">
                        <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                          <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                            {patient.fullName || `${patient.firstName} ${patient.lastName}`}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
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
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-2 md:mb-3 text-sm md:text-base">Selected Patient:</h4>
                <div className="bg-indigo-50 p-3 md:p-4 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center min-w-0 flex-1 mr-2">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                          {selectedPatient.fullName || `${selectedPatient.firstName} ${selectedPatient.lastName}`}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          ID: {selectedPatient.patientId || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setProcedureData(prev => ({
                          ...prev,
                          patient: ''
                        }));
                      }}
                      className="text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                  <div className="text-xs md:text-sm text-gray-600 space-y-1">
                    <p>Age: {selectedPatient.age || 'N/A'}</p>
                    <p>Gender: {selectedPatient.gender || 'N/A'}</p>
                    {selectedPatient.bloodType && <p>Blood Type: {selectedPatient.bloodType}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theatre Schedule Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <MapPin className="mr-2 text-blue-500" size={18} />
              Available Theatre Rooms
            </h3>

            {loadingTheatres ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500 text-sm md:text-base">Loading theatres...</span>
              </div>
            ) : theatres.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <BedDouble className="mx-auto h-7 w-7 md:h-8 md:w-8 mb-2" />
                <p className="text-sm md:text-base">No theatres found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 md:max-h-96 overflow-y-auto">
                {theatres.map((theatre) => (
                  <div
                    key={theatre._id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      procedureData.ward === theatre._id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                    onClick={() => handleTheatreChange(theatre._id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm md:text-base truncate">{theatre.name}</p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">{theatre.theatreNumber}</p>
                        <p className="text-xs text-gray-400 truncate">
                          Floor: {theatre.floor} | Type: {theatre.type}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Procedures Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Scissors className="mr-2 text-indigo-500" size={18} />
              Patient Procedures
            </h3>

            {!selectedPatient ? (
              <div className="text-center py-6 md:py-8">
                <Scissors className="mx-auto h-10 w-10 md:h-12 md:w-12 text-gray-400 mb-3 md:mb-4" />
                <p className="text-gray-500 text-sm md:text-base">Select a patient to view procedures</p>
              </div>
            ) : (
              <div>
                {loadingProcedures ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 md:h-6 md:w-6 border-b-2 border-indigo-500"></div>
                    <span className="ml-2 text-gray-500 text-sm md:text-base">Loading procedures...</span>
                  </div>
                ) : theatreProcedures.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <FileText className="mx-auto h-7 w-7 md:h-8 md:w-8 mb-2" />
                    <p className="text-sm md:text-base">No procedures found for this patient.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 md:max-h-96 overflow-y-auto">
                    {theatreProcedures.map((procedure) => (
                      <div
                        key={procedure._id || procedure.id}
                        className="p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs text-gray-900 truncate flex-1">
                              {procedure.procedureNumber}
                            </p>
                            <span className={`inline-flex items-center px-2 py-0.5 md:py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(procedure.status)}`}>
                              <CheckCircle size={10} className="mr-1" />
                              {procedure.status}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                            {procedure.procedure_name}
                          </p>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {procedure.theatre?.name || 'N/A'} • {procedure.surgeon?.firstName}
                          </p>
                          <p className="text-xs text-gray-400">
                            Date: {formatDateTime(procedure.procedure_date)}
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

        {/* Schedule Theatre Procedure Section */}
        {selectedPatient && (
          <div className="mt-4 md:mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4 flex items-center">
              <Plus className="mr-2 text-indigo-500" size={18} />
              Schedule Theatre Procedure
            </h3>

            <form onSubmit={handleSubmitProcedure} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Procedure Name *
                </label>
                <select
                  value={procedureData.procedure_name}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, procedure_name: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Procedure</option>
                  {selections.map((selection) => (
                    <option 
                      key={selection._id} 
                      value={selection.name}
                    >
                      {selection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Procedure Date *
                </label>
                <input
                  type="datetime-local"
                  value={procedureData.procedure_date}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, procedure_date: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Theatre Room
                </label>
                <select
                  value={procedureData.theatre_room}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, theatre_room: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Theatre Room</option>
                  {theatres.map((theatre) => (
                    <option
                      key={theatre._id} 
                      value={theatre._id}
                    >
                      {theatre.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Surgeon
                </label>
                <select
                  value={procedureData.surgeon}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, surgeon: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Surgeon</option>
                  {loadingSurgeons ? (
                    <option disabled>Loading surgeons...</option>
                  ) : (
                    surgeons.map((surgeon) => (
                      <option key={surgeon._id} value={surgeon._id}>
                        {surgeon.fullName || `${surgeon.firstName} ${surgeon.lastName}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Anesthesiologist
                </label>
                <input
                  type="text"
                  value={procedureData.anesthesiologist}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, anesthesiologist: e.target.value }))}
                  placeholder="Anesthesiologist name"
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={procedureData.priority}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="emergency">Emergency</option>
                  <option value="urgent">Urgent</option>
                  <option value="normal">Normal</option>
                  <option value="elective">Elective</option>
                </select>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (hours)
                </label>
                <input
                  type="number"
                  value={procedureData.estimated_duration}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, estimated_duration: e.target.value }))}
                  placeholder="e.g., 2.5"
                  step="0.5"
                  min="0.5"
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={procedureData.status}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="postponed">Postponed</option>
                </select>
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={procedureData.notes}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="General notes about the procedure..."
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Pre-operative Notes
                </label>
                <textarea
                  value={procedureData.pre_op_notes}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, pre_op_notes: e.target.value }))}
                  rows={2}
                  placeholder="Pre-operative instructions and notes..."
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Post-operative Notes
                </label>
                <textarea
                  value={procedureData.post_op_notes}
                  onChange={(e) => setProcedureData(prev => ({ ...prev, post_op_notes: e.target.value }))}
                  rows={2}
                  placeholder="Post-operative care instructions..."
                  className="w-full px-2 md:px-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <button
                  type="submit"
                  disabled={loading || !procedureData.procedure_name || !procedureData.procedure_date}
                  className="w-full bg-indigo-500 text-white py-2.5 md:py-3 px-4 rounded-md text-sm md:text-base hover:bg-indigo-600 transition disabled:bg-gray-400 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scheduling Procedure...
                    </>
                  ) : (
                    <>
                      <Stethoscope size={16} className="mr-2" />
                      Schedule Theatre Procedure
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

export default Theatre;