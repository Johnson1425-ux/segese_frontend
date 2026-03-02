import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, User, Plus, Edit, Eye, FileText, Heart,
  Pill, Stethoscope, ClipboardList, Calendar, Clock,
  TrendingUp, AlertCircle, CheckCircle, XCircle, Search,
  Download, Filter, X, BedDouble, UserCheck, ArrowRight, MoreHorizontal
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import TransferPatientModal from './TransferPatientModal.jsx';

const IPDRecordsManagement = () => {
  const { user, hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showNursingNoteModal, setShowNursingNoteModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterWard, setFilterWard] = useState('');
  const [wards, setWards] = useState([]);

  const dropDownRef = useRef(null);

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
    { value: 'admitted', label: 'Admitted' },
    { value: 'under_observation', label: 'Under Observation' },
    { value: 'critical', label: 'Critical' },
    { value: 'stable', label: 'Stable' },
    { value: 'discharged', label: 'Discharged' }
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
    { value: 'recovered', label: 'Recovered' },
    { value: 'referred', label: 'Referred' },
    { value: 'against_medical_advice', label: 'Against Medical Advice' },
    { value: 'deceased', label: 'Deceased' },
    { value: 'absconded', label: 'Absconded' },
    { value: 'transferred', label: 'Transferred' }
  ];

  useEffect(() => {
    loadRecords();
    loadWards();
  }, [filterStatus, filterWard]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterStatus) query += `status=${filterStatus}&`;
      if (filterWard) query += `ward=${filterWard}&`;
      
      const response = await api.get(`/ipd-records${query}`);
      setRecords(response.data.data || []);
    } catch (error) {
      console.error('Error loading records:', error);
      toast.error('Failed to load IPD records');
    } finally {
      setLoading(false);
    }
  };

  const loadWards = async () => {
    try {
      const response = await api.get('/wards');
      setWards(response.data.data || []);
    } catch (error) {
      console.error('Error loading wards:', error);
    }
  };

  const loadRecordDetails = async (recordId) => {
    try {
      const response = await api.get(`/ipd-records/${recordId}`);
      setSelectedRecord(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Error loading record details:', error);
      toast.error('Failed to load record details');
    }
  };

  const handleAddVitals = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ipd-records/${selectedRecord._id}/vitals`, vitalsData);
      toast.success('Vital signs recorded successfully');
      setShowVitalsModal(false);
      resetVitalsForm();
      loadRecordDetails(selectedRecord._id);
    } catch (error) {
      console.error('Error adding vitals:', error);
      toast.error('Failed to record vital signs');
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ipd-records/${selectedRecord._id}/medications`, medicationData);
      toast.success('Medication added successfully');
      setShowMedicationModal(false);
      resetMedicationForm();
      loadRecordDetails(selectedRecord._id);
    } catch (error) {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
    }
  };

  const handleAddNursingNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ipd-records/${selectedRecord._id}/nursing-notes`, nursingNoteData);
      toast.success('Nursing note added successfully');
      setShowNursingNoteModal(false);
      resetNursingNoteForm();
      loadRecordDetails(selectedRecord._id);
    } catch (error) {
      console.error('Error adding nursing note:', error);
      toast.error('Failed to add nursing note');
    }
  };

  const handleAddDiagnosis = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/ipd-records/${selectedRecord._id}/diagnosis`, diagnosisData);
      toast.success('Diagnosis added successfully');
      setShowDiagnosisModal(false);
      resetDiagnosisForm();
      loadRecordDetails(selectedRecord._id);
    } catch (error) {
      console.error('Error adding diagnosis:', error);
      toast.error('Failed to add diagnosis');
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to discharge this patient?')) {
      return;
    }

    try {
      const response = await api.put(`/ipd-records/${selectedRecord._id}/discharge`, dischargeData);
      toast.success('Patient discharged successfully');
      setShowDischargeModal(false);
      setShowDetailModal(false);
      resetDischargeForm();
      loadRecords();
    } catch (error) {
      console.error('Error discharging patient:', error);
      console.error('Error details:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
      error.response?.data?.error || 'Failed to discharge patient';
      toast.error(errorMessage);
    }
  };

  const handleTransferSuccess = (updatedRecord) => {
    // Update the record in the list
    setRecords(prevRecords =>
      prevRecords.map(record =>
        record._id === updatedRecord._id ? updatedRecord : record
      )
    );
    
    // If viewing details, update selected record
    if (selectedRecord?._id === updatedRecord._id) {
      setSelectedRecord(updatedRecord);
    }
  };

  const toggleDropdown = (recordId) => {
    setOpenDropdown(openDropdown === recordId ? null : recordId);
  }

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
      case 'admitted':
      case 'under_observation':
        return 'bg-blue-100 text-blue-800';
      case 'stable':
        return 'bg-green-100 text-green-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'discharged':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Actions Dropdown Component
  const ActionsDropdown = ({ record, isOpen, onToggle }) => {
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const dropdownMenuRef = useRef(null);

    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const dropdownWidth = 192; // 48 * 4 = 12rem
        const viewportHeight = window.innerHeight;
        const dropdownHeight = 140; // Approximate height of dropdown
        
        // Calculate if dropdown should appear above or below the button
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const shouldAppearAbove = spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight;
        
        setDropdownPosition({
          top: shouldAppearAbove ? buttonRect.top - dropdownHeight - 4 : buttonRect.bottom + 4,
          left: Math.max(8, buttonRect.right - dropdownWidth) // Ensure it doesn't go off-screen
        });
      }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target) && 
            buttonRef.current && !buttonRef.current.contains(event.target)) {
          setOpenDropdown(null);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(record._id);
          }}
          className="p-1 sm:p-2 text-black rounded-full hover:bg-gray-100 transition-colors duration-200"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-6 sm:w-4 sm:h-4" />
        </button>
        
        {isOpen && (
          <>
            {/* Higher z-index backdrop */}
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={() => setOpenDropdown(null)} 
            />
            
            {/* Dropdown menu with very high z-index */}
            <div 
              ref={dropdownMenuRef}
              className="fixed bg-white rounded-md shadow-2xl border border-gray-200 py-1 z-[9999] w-40 sm:w-48"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {canDischarge && selectedRecord.status !== 'discharged' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDischargeModal(true);
                  }}
                  className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-black hover:bg-gray-100 font-semibold transition-colors duration-200 cursor-pointer"
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                   Discharge Patient
                </button>
              )}

              <hr className="my-1 border-gray-200" />
              
              {canTransfer && selectedRecord.status !== 'discharged' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTransferModal(true);
                  }}
                  className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-black hover:bg-gray-100 font-semibold transition-colors duration-200 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  Transfer Patient
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const filteredRecords = records.filter(record => {
    const patientName = `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`.toLowerCase();
    const admissionNumber = record.admissionNumber?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    
    return patientName.includes(search) || admissionNumber.includes(search);
  });

  const canAddDiagnosis = hasRole('doctor') || hasRole('admin');
  const canAddMedication = hasRole('doctor') || hasRole('admin');
  const canAddVitals = hasRole('doctor') || hasRole('nurse') || hasRole('admin');
  const canAddNursingNote = hasRole('nurse') || hasRole('admin');
  const canDischarge = hasRole('doctor') || hasRole('admin');
  const canTransfer = hasRole('doctor') || hasRole('nurse') || hasRole('admin');

  return (
    <div className="bg-gray-50 min-h-screen p-2 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
          <div className="flex items-center">
            <div className="bg-blue-500 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
              <Activity className="text-white w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-800 truncate">IPD Records Management</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage inpatient records and patient care</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4 md:mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative sm:col-span-2 md:col-span-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by patient name or admission #..."
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
              />
              <Search className="absolute left-2 sm:left-3 top-2 sm:top-2.5 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            <select
              value={filterWard}
              onChange={(e) => setFilterWard(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
            >
              <option value="">All Wards</option>
              {wards.map(ward => (
                <option key={ward._id} value={ward._id}>{ward.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Admission #
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Ward / Bed
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Admission Date
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Length of Stay
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-500 text-xs">Loading records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 text-xs">
                      No records found
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs font-medium text-gray-900">
                          {record.admissionNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="text-xs font-medium text-gray-900">
                              {record.patient?.firstName} {record.patient?.lastName}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {record.patient?.patientId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{record.ward?.name || 'N/A'}</div>
                        <div className="text-[10px] text-gray-500">Bed: {record.bed?.bedNumber || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-xs text-gray-900">{formatDate(record.admissionDate)}</div>
                        <div className="text-[10px] text-gray-500">{formatDateTime(record.admissionDate).split(',')[1]}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-[10px] leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-900">
                        {record.lengthOfStay} days
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-medium">
                        <button
                          onClick={() => loadRecordDetails(record._id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
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

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-500 text-xs">Loading records...</span>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500 text-xs">
              No records found
            </div>
          ) : (
            filteredRecords.map((record) => (
              <div key={record._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                {/* Patient Info */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {record.patient?.firstName} {record.patient?.lastName}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {record.patient?.patientId}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[9px] font-semibold rounded-full flex-shrink-0 ml-2 ${getStatusColor(record.status)}`}>
                    {record.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center text-[10px] text-gray-600">
                    <FileText className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{record.admissionNumber}</span>
                  </div>
                  <div className="flex items-center text-[10px] text-gray-600">
                    <BedDouble className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{record.ward?.name || 'N/A'} - Bed {record.bed?.bedNumber || 'N/A'}</span>
                  </div>
                  <div className="flex items-center text-[10px] text-gray-600">
                    <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span>{formatDate(record.admissionDate)} ({record.lengthOfStay} days)</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => loadRecordDetails(record._id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-xs font-medium"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            ))
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-4 sm:my-8">
              {/* Modal Header */}
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="min-w-0 flex-1 mr-2">
                  <h2 className="text-base sm:text-lg md:text-2xl font-bold text-gray-800 truncate">
                    {selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}
                  </h2>
                  <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 truncate">
                    Admission: {selectedRecord.admissionNumber} | 
                    Ward: {selectedRecord.ward?.name} | 
                    Bed: {selectedRecord.bed?.bedNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {canAddVitals && selectedRecord.status !== 'discharged' && (
                    <button
                      onClick={() => setShowVitalsModal(true)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-[10px] sm:text-xs md:text-sm"
                    >
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add Vitals</span>
                      <span className="sm:hidden">Vitals</span>
                    </button>
                  )}
                  {canAddMedication && selectedRecord.status !== 'discharged' && (
                    <button
                      onClick={() => setShowMedicationModal(true)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-[10px] sm:text-xs md:text-sm"
                    >
                      <Pill className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add Medication</span>
                      <span className="sm:hidden">Meds</span>
                    </button>
                  )}
                  {canAddNursingNote && selectedRecord.status !== 'discharged' && (
                    <button
                      onClick={() => setShowNursingNoteModal(true)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-[10px] sm:text-xs md:text-sm"
                    >
                      <ClipboardList className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add Note</span>
                      <span className="sm:hidden">Note</span>
                    </button>
                  )}
                  {canAddDiagnosis && selectedRecord.status !== 'discharged' && (
                    <button
                      onClick={() => setShowDiagnosisModal(true)}
                      className="flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition text-[10px] sm:text-xs md:text-sm"
                    >
                      <Stethoscope className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Add Diagnosis</span>
                      <span className="sm:hidden">Diagnosis</span>
                    </button>
                  )}
                  <ActionsDropdown 
                    record={selectedRecord}
                    isOpen={openDropdown === selectedRecord._id}
                    onToggle={toggleDropdown}
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-3 sm:p-4 md:p-6 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {/* Patient Information */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                      Patient Information
                    </h3>
                    <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Patient ID:</span>
                        <span className="font-medium truncate ml-2">{selectedRecord.patient?.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{selectedRecord.patient?.age} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{selectedRecord.patient?.gender}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Blood Type:</span>
                        <span className="font-medium">{selectedRecord.patient?.bloodType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admission Details */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                      Admission Details
                    </h3>
                    <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admission Date:</span>
                        <span className="font-medium text-right ml-2">{formatDateTime(selectedRecord.admissionDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{selectedRecord.admissionType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Length of Stay:</span>
                        <span className="font-medium">{selectedRecord.lengthOfStay} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-semibold ${getStatusColor(selectedRecord.status)}`}>
                          {selectedRecord.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admission Reason */}
                  <div className="lg:col-span-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 text-xs sm:text-sm md:text-base">Admission Reason</h3>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-700">{selectedRecord.admissionReason}</p>
                  </div>

                  {/* Diagnoses */}
                  {selectedRecord.diagnosis && selectedRecord.diagnosis.length > 0 && (
                    <div className="lg:col-span-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />
                        Diagnoses
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {selectedRecord.diagnosis.map((diag, index) => (
                          <div key={index} className="bg-white p-2 sm:p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-gray-800 text-[10px] sm:text-xs md:text-sm">{diag.condition}</p>
                              <span className="text-[9px] sm:text-[10px] text-gray-500 flex-shrink-0 ml-2">{formatDate(diag.diagnosedDate)}</span>
                            </div>
                            {diag.notes && (
                              <p className="text-[10px] sm:text-xs text-gray-600">{diag.notes}</p>
                            )}
                            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                              By: {diag.diagnosedBy?.firstName} {diag.diagnosedBy?.lastName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Latest Vital Signs */}
                  {selectedRecord.vitalSigns && selectedRecord.vitalSigns.length > 0 && (
                    <div className="lg:col-span-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                        Latest Vital Signs
                      </h3>
                      <div className="space-y-2 sm:space-y-3">
                        {selectedRecord.vitalSigns.slice(-3).reverse().map((vital, index) => (
                          <div key={index} className="bg-white p-2 sm:p-3 rounded border border-gray-200">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-[10px] sm:text-xs">
                              <div>
                                <span className="text-gray-600">BP:</span>
                                <span className="font-medium ml-1">
                                  {vital.bloodPressure?.systolic}/{vital.bloodPressure?.diastolic}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">HR:</span>
                                <span className="font-medium ml-1">{vital.heartRate} bpm</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Temp:</span>
                                <span className="font-medium ml-1">{vital.temperature}°C</span>
                              </div>
                              <div>
                                <span className="text-gray-600">SpO2:</span>
                                <span className="font-medium ml-1">{vital.oxygenSaturation}%</span>
                              </div>
                            </div>
                            <div className="text-[9px] sm:text-[10px] text-gray-500 mt-2">
                              {formatDateTime(vital.recordedDate)} - 
                              By: {vital.recordedBy?.firstName} {vital.recordedBy?.lastName}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Medications */}
                  {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                    <div className="lg:col-span-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
                        Current Medications
                      </h3>
                      <div className="space-y-2">
                        {selectedRecord.medications.map((med, index) => (
                          <div key={index} className="bg-white p-2 sm:p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-gray-800 text-[10px] sm:text-xs md:text-sm truncate">{med.medication}</p>
                                <p className="text-[10px] sm:text-xs text-gray-600">
                                  {med.dosage} - {med.frequency}
                                </p>
                                {med.notes && (
                                  <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">{med.notes}</p>
                                )}
                              </div>
                              <div className="text-right text-[9px] sm:text-[10px] text-gray-500 flex-shrink-0">
                                {formatDate(med.startDate)} - {med.endDate ? formatDate(med.endDate) : 'Ongoing'}
                              </div>
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-2">
                              Prescribed by: {med.prescribedBy?.firstName} {med.prescribedBy?.lastName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nursing Notes */}
                  {selectedRecord.nursingNotes && selectedRecord.nursingNotes.length > 0 && (
                    <div className="lg:col-span-2 bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm md:text-base">
                        <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
                        Nursing Notes
                      </h3>
                      <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                        {selectedRecord.nursingNotes.slice().reverse().map((note, index) => (
                          <div key={index} className="bg-white p-2 sm:p-3 rounded border border-gray-200">
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-medium flex-shrink-0 ${
                                note.category === 'incident' ? 'bg-red-100 text-red-800' :
                                note.category === 'medication' ? 'bg-green-100 text-green-800' :
                                note.category === 'observation' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {note.category}
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-gray-500">{formatDateTime(note.recordedDate)}</span>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-700 mt-2">{note.note}</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                              By: {note.recordedBy?.firstName} {note.recordedBy?.lastName}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">Emergency Contact</h3>
                    <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium truncate ml-2">{selectedRecord.emergencyContact?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedRecord.emergencyContact?.phone}</span>
                      </div>
                      {selectedRecord.emergencyContact?.relationship && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Relationship:</span>
                          <span className="font-medium">{selectedRecord.emergencyContact?.relationship}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Insurance Info */}
                  {selectedRecord.insurance?.provider && (
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 text-xs sm:text-sm md:text-base">Insurance Information</h3>
                      <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs md:text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Provider:</span>
                          <span className="font-medium truncate ml-2">{selectedRecord.insurance?.provider}</span>
                        </div>
                        {selectedRecord.insurance?.policyNumber && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Membership No:</span>
                            <span className="font-medium">{selectedRecord.insurance?.policyNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Vitals Modal */}
        {showVitalsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Record Vital Signs</h3>
                <button onClick={() => setShowVitalsModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleAddVitals} className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Blood Pressure (Systolic)
                    </label>
                    <input
                      type="number"
                      value={vitalsData.bloodPressure.systolic}
                      onChange={(e) => setVitalsData({
                        ...vitalsData,
                        bloodPressure: { ...vitalsData.bloodPressure, systolic: e.target.value }
                      })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Blood Pressure (Diastolic)
                    </label>
                    <input
                      type="number"
                      value={vitalsData.bloodPressure.diastolic}
                      onChange={(e) => setVitalsData({
                        ...vitalsData,
                        bloodPressure: { ...vitalsData.bloodPressure, diastolic: e.target.value }
                      })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="80"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={vitalsData.heartRate}
                      onChange={(e) => setVitalsData({ ...vitalsData, heartRate: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="72"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={vitalsData.temperature}
                      onChange={(e) => setVitalsData({ ...vitalsData, temperature: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="37.0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Respiratory Rate
                    </label>
                    <input
                      type="number"
                      value={vitalsData.respiratoryRate}
                      onChange={(e) => setVitalsData({ ...vitalsData, respiratoryRate: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="18"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Oxygen Saturation (%)
                    </label>
                    <input
                      type="number"
                      value={vitalsData.oxygenSaturation}
                      onChange={(e) => setVitalsData({ ...vitalsData, oxygenSaturation: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="98"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={vitalsData.notes}
                      onChange={(e) => setVitalsData({ ...vitalsData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm"
                  >
                    Record Vitals
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVitalsModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Medication Modal */}
        {showMedicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Add Medication</h3>
                <button onClick={() => setShowMedicationModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleAddMedication} className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      value={medicationData.medication}
                      onChange={(e) => setMedicationData({ ...medicationData, medication: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={medicationData.dosage}
                      onChange={(e) => setMedicationData({ ...medicationData, dosage: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="e.g., 500mg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={medicationData.frequency}
                      onChange={(e) => setMedicationData({ ...medicationData, frequency: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="e.g., Three times daily"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={medicationData.startDate}
                      onChange={(e) => setMedicationData({ ...medicationData, startDate: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={medicationData.endDate}
                      onChange={(e) => setMedicationData({ ...medicationData, endDate: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={medicationData.notes}
                      onChange={(e) => setMedicationData({ ...medicationData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Special instructions..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm"
                  >
                    Add Medication
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMedicationModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Nursing Note Modal */}
        {showNursingNoteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Add Nursing Note</h3>
                <button onClick={() => setShowNursingNoteModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleAddNursingNote} className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={nursingNoteData.category}
                      onChange={(e) => setNursingNoteData({ ...nursingNoteData, category: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                    >
                      {noteCategories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Note *
                    </label>
                    <textarea
                      value={nursingNoteData.note}
                      onChange={(e) => setNursingNoteData({ ...nursingNoteData, note: e.target.value })}
                      rows={4}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm"
                  >
                    Add Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNursingNoteModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Add Diagnosis</h3>
                <button onClick={() => setShowDiagnosisModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleAddDiagnosis} className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Condition/Diagnosis *
                    </label>
                    <input
                      type="text"
                      value={diagnosisData.condition}
                      onChange={(e) => setDiagnosisData({ ...diagnosisData, condition: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="e.g., Pneumonia (J18.9)"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={diagnosisData.notes}
                      onChange={(e) => setDiagnosisData({ ...diagnosisData, notes: e.target.value })}
                      rows={3}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Additional details about the diagnosis..."
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-600 transition text-xs sm:text-sm"
                  >
                    Add Diagnosis
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDiagnosisModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60]">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">Discharge Patient</h3>
                <button onClick={() => setShowDischargeModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              <form onSubmit={handleDischarge} className="p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Discharge Reason *
                    </label>
                    <select
                      value={dischargeData.dischargeReason}
                      onChange={(e) => setDischargeData({ ...dischargeData, dischargeReason: e.target.value })}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      required
                    >
                      {dischargeReasons.map(reason => (
                        <option key={reason.value} value={reason.value}>{reason.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Discharge Summary *
                    </label>
                    <textarea
                      value={dischargeData.dischargeSummary}
                      onChange={(e) => setDischargeData({ ...dischargeData, dischargeSummary: e.target.value })}
                      rows={5}
                      className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                      placeholder="Provide a summary of the patient's stay, treatment, and discharge instructions..."
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-orange-600 transition text-xs sm:text-sm"
                  >
                    Discharge Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDischargeModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 sm:px-4 rounded-lg hover:bg-gray-300 transition text-xs sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {showTransferModal && selectedRecord && (
        <TransferPatientModal
          record={selectedRecord}
          onClose={() => setShowTransferModal(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </div>
  );
};

export default IPDRecordsManagement;