import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, User, Plus, Edit, Eye, FileText, Heart,
  Pill, Stethoscope, ClipboardList, Calendar, Clock,
  TrendingUp, AlertCircle, CheckCircle, XCircle, Search,
  Download, Filter, X, BedDouble, UserCheck,
  Scissors
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const TheatreProceduresManagement = () => {
  const { user, hasRole } = useAuth();
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  // const [showNursingNoteModal, setShowNursingNoteModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTheatre, setFilterTheatre] = useState('');
  const [theatres, setTheatres] = useState([]);

  // Form states
  const [vitalsData, setVitalsData] = useState({
    bloodPressure: { systolic: '', diastolic: '' },
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    notes: ''
  });

  const [medicationData, setMedicationData] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    notes: ''
  });

  const [nursingNoteData, setNursingNoteData] = useState({
    note: '',
    category: 'general'
  });

  const [diagnosisData, setDiagnosisData] = useState({
    condition: '',
    notes: ''
  });

  const [dischargeData, setDischargeData] = useState({
    dischargeReason: 'recovered',
    dischargeSummary: ''
  });

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'on-going', label: 'On-going' },
    { value: 'critical', label: 'Critical' },
    { value: 'completed', label: 'Completed' }
  ];

  const noteCategories = [
    { value: 'general', label: 'General' },
    { value: 'medication', label: 'Medication' },
    { value: 'vital_signs', label: 'Vital Signs' },
    { value: 'treatment', label: 'Treatment' },
    { value: 'observation', label: 'Observation' },
    { value: 'incident', label: 'Incident' }
  ];

  const dischargeReasons = [
    { value: 'completed', label: 'Completed' },
    { value: 'referred', label: 'Referred' },
    { value: 'against_medical_advice', label: 'Against Medical Advice' },
    { value: 'deceased', label: 'Deceased' },
    { value: 'absconded', label: 'Absconded' },
    { value: 'transferred', label: 'Transferred' }
  ];

  useEffect(() => {
    loadProcedures();
    loadTheatres();
  }, [filterStatus, filterTheatre]);

  const loadProcedures = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterTheatre) query += `theatre=${filterTheatre}&`;
      
      const response = await api.get(`/theatre-procedures${query}`);
      setProcedures(response.data.data || []);
    } catch (error) {
      console.error('Error loading procedures:', error);
      toast.error('Failed to load theatre procedures');
    } finally {
      setLoading(false);
    }
  };

  const loadTheatres = async () => {
    try {
      const response = await api.get('/theatres');
      setTheatres(response.data.data || []);
    } catch (error) {
      console.error('Error loading theatres:', error);
    }
  };

  const loadProcedureDetails = async (procedureId) => {
    try {
      const response = await api.get(`/theatre-procedures/${procedureId}`);
      setSelectedProcedure(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading procedure details:', error);
      toast.error('Failed to load procedure details');
    }
  };


  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/theatre-procedures/${selectedProcedure._id}/medications`, medicationData);
      toast.success('Medication added successfully');
      setShowMedicationModal(false);
      resetMedicationForm();
      loadProcedureDetails(selectedProcedure._id);
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
    }
  };


  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    try {
      // Was posting to /ipd-records/${selectedRecord._id}/diagnosis, but this
      // page has no selectedRecord — a theatre procedure is not linked to an
      // IPD record — so the handler threw a ReferenceError before it could
      // send anything. Diagnoses are recorded against the procedure itself.
      await api.post(`/theatre-procedures/${selectedProcedure._id}/diagnosis`, diagnosisData);
      toast.success('Diagnosis added successfully');
      setShowDiagnosisModal(false);
      resetDiagnosisForm();
      loadProcedureDetails(selectedProcedure._id);
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast.error('Failed to add diagnosis');
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to complete this procedure?')) {
      return;
    }

    try {
      const response = await api.put(`/theatre-procedures/${selectedProcedure._id}/discharge`, dischargeData);
      toast.success('Procedure completed successfully');
      setShowDischargeModal(false);
      setShowDetailModal(false);
      resetDischargeForm();
      loadProcedures();
    } catch (error) {
      console.error('Error completing procedure:', error);
      console.error('Error details:', error.response?.data);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to complete procedure';
      toast.error(errorMessage);
    }
  };

  const resetVitalsForm = () => {
    setVitalsData({
      bloodPressure: { systolic: '', diastolic: '' },
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: '',
      notes: ''
    });
  };

  const resetMedicationForm = () => {
    setMedicationData({
      medication: '',
      dosage: '',
      frequency: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      notes: ''
    });
  };

  const resetNursingNoteForm = () => {
    setNursingNoteData({
      note: '',
      category: 'general'
    });
  };

  const resetDiagnosisForm = () => {
    setDiagnosisData({
      condition: '',
      notes: ''
    });
  };

  const resetDischargeForm = () => {
    setDischargeData({
      dischargeReason: 'recovered',
      dischargeSummary: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-TZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
      case 'under_observation':
        return 'bg-blue-100 text-blue-800';
      case 'stable':
        return 'bg-green-100 text-green-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProcedures = procedures.filter(procedure => {
    const patientName = `${procedure.patient?.firstName || ''} ${procedure.patient?.lastName || ''}`.toLowerCase();
    const procedureNumber = procedure.procedureNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return patientName.includes(search) || procedureNumber.includes(search);
  });

  const canAddDiagnosis = hasRole('surgeon') || hasRole('admin');
  const canAddMedication = hasRole('doctor') || hasRole('admin');
  const canAddVitals = hasRole('doctor') || hasRole('nurse') || hasRole('admin');
  const canAddNursingNote = hasRole('nurse') || hasRole('admin');
  const canDischarge = hasRole('surgeon') || hasRole('admin');

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-3 rounded-lg mr-4">
              <Scissors className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Theatre Procedures Management</h1>
              <p className="text-gray-600">Manage theatre operations</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or procedure #..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filterTheatre}
              onChange={(e) => setFilterTheatre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Theatres</option>
              {theatres.map(theatre => (
                <option key={theatre._id} value={theatre._id}>{theatre.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Theatre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Procedure Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500">Loading procedures...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProcedures.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No procedures found
                    </td>
                  </tr>
                ) : (
                  filteredProcedures.map((procedure) => (
                    <tr key={procedure._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {procedure.procedureNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {procedure.patient?.firstName} {procedure.patient?.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {procedure.patient?.patientId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{procedure.theatre?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(procedure.procedure_date)}</div>
                        <div className="text-sm text-gray-500">{formatDateTime(procedure.procedure_date).split(',')[1]}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(procedure.status)}`}>
                          {procedure.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => loadProcedureDetails(procedure._id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedProcedure && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedProcedure.patient?.firstName} {selectedProcedure.patient?.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Procedure: {selectedProcedure.procedureNumber} |
                    {selectedProcedure.theatre?.name} | 
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {canAddDiagnosis && selectedProcedure.status !== 'completed' && (
                    <button
                      onClick={() => setShowDiagnosisModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                    >
                      <Stethoscope size={16} />
                      Add Notes
                    </button>
                  )}
                  {canDischarge && selectedProcedure.status !== 'completed' && (
                    <button
                      onClick={() => setShowDischargeModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition ml-auto"
                    >
                      <UserCheck size={16} />
                      Complete Procedure
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Patient Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <User size={18} />
                      Patient Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient ID:</span>
                        <span className="font-medium">{selectedProcedure.patient?.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{selectedProcedure.patient?.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{selectedProcedure.patient?.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Type:</span>
                        <span className="font-medium">{selectedProcedure.patient?.bloodType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Procedure Details */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Calendar size={18} />
                      Procedure Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Procedure Date:</span>
                        <span className="font-medium">{formatDateTime(selectedProcedure.procedure_date)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium capitalize">{selectedProcedure.procedure_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedProcedure.status)}`}>
                          {selectedProcedure.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-3">Emergency Contact</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedProcedure.emergencyContact?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedProcedure.emergencyContact?.phone}</span>
                      </div>
                      {selectedProcedure.emergencyContact?.relationship && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Relationship:</span>
                          <span className="font-medium">{selectedProcedure.patient.emergencyContact?.relationship}</span>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Medication Modal */}
        {showMedicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Add Medication</h3>
                <button onClick={() => setShowMedicationModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddMedication} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      value={medicationData.medication}
                      onChange={(e) => setMedicationData({ ...medicationData, medication: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={medicationData.dosage}
                      onChange={(e) => setMedicationData({ ...medicationData, dosage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={medicationData.frequency}
                      onChange={(e) => setMedicationData({ ...medicationData, frequency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Three times daily"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={medicationData.startDate}
                      onChange={(e) => setMedicationData({ ...medicationData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={medicationData.endDate}
                      onChange={(e) => setMedicationData({ ...medicationData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={medicationData.notes}
                      onChange={(e) => setMedicationData({ ...medicationData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                  >
                    Add Medication
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMedicationModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Diagnosis Modal */}
        {showDiagnosisModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Add Notes</h3>
                <button onClick={() => setShowDiagnosisModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddDiagnosis} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition/Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={diagnosisData.condition}
                      onChange={(e) => setDiagnosisData({ ...diagnosisData, condition: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Pneumonia (J18.9)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={diagnosisData.notes}
                      onChange={(e) => setDiagnosisData({ ...diagnosisData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Additional details about the diagnosis..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                  >
                    Add Diagnosis
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosisModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Discharge Patient Modal */}
        {showDischargeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Complete Procedure</h3>
                <button onClick={() => setShowDischargeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleDischarge} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Complete Reason *
                    </label>
                    <select
                      value={dischargeData.dischargeReason}
                      onChange={(e) => setDischargeData({ ...dischargeData, dischargeReason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {dischargeReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>{reason.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Procedure Summary *
                    </label>
                    <textarea
                      value={dischargeData.dischargeSummary}
                      onChange={(e) => setDischargeData({ ...dischargeData, dischargeSummary: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide a summary of the patient's stay, treatment, and discharge instructions..."
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition"
                  >
                    Complete Procedure
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDischargeModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TheatreProceduresManagement;