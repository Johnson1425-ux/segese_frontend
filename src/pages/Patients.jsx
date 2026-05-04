import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, Loader2, RefreshCw, MoreVertical, X } from 'lucide-react';
import { patientService } from '../utils/patientService.js';
import ConfirmationDialog from './ConfirmationDialog';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  
  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  
  const dropdownRef = useRef(null);
  
  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await patientService.getAllPatients();
      
      // Handle different possible response structures
      let patientsData = [];
      
      if (Array.isArray(response)) {
        patientsData = response;
      } else if (response && Array.isArray(response.patients)) {
        patientsData = response.patients;
      } else if (response && Array.isArray(response.data)) {
        patientsData = response.data;
      } else if (response && response.data && Array.isArray(response.data.patients)) {
        patientsData = response.data.patients;
      }
      
      setPatients(patientsData);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch patients';
      toast.error(message);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(patient =>
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm) ||
      patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const handleDeleteClick = (patient) => {
    setPatientToDelete(patient);
    setShowConfirmDialog(true);
    setOpenDropdown(null);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    try {
      setIsDeleting(patientToDelete._id);
      await patientService.deletePatient(patientToDelete._id);
      setPatients(prev => prev.filter(p => p._id !== patientToDelete._id));
      toast.success(`Patient ${patientToDelete.firstName} ${patientToDelete.lastName} deleted successfully`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete patient';
      toast.error(message);
    } finally {
      setIsDeleting(null);
      setShowConfirmDialog(false);
      setPatientToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmDialog(false);
    setPatientToDelete(null);
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setShowModal(true);
    setOpenDropdown(null);
  };

  const toggleDropdown = (patientId) => {
    setOpenDropdown(openDropdown === patientId ? null : patientId);
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get insurance provider name
  const getInsuranceProviderName = (insurance) => {
    if (!insurance) return 'N/A';
    
    // If provider is an object with a name property
    if (insurance.provider && typeof insurance.provider === 'object') {
      return insurance.provider.name || 'N/A';
    }
    
    // If provider is a string
    if (typeof insurance.provider === 'string') {
      return insurance.provider;
    }
    
    return 'N/A';
  };

  // Actions Dropdown Component
  const ActionsDropdown = ({ patient, isOpen, onToggle }) => {
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
            onToggle(patient._id);
          }}
          className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors duration-200"
          title="More actions"
        >
          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
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
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(patient);
                }}
                className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                View Details
              </button>
              
              <Link
                to={`/patients/edit/${patient._id}`}
                className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 no-underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(null);
                }}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                Edit Patient
              </Link>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(patient);
                }}
                className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                disabled={isDeleting === patient._id}
              >
                {isDeleting === patient._id ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 animate-spin flex-shrink-0" />
                ) : (
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                )}
                Delete Patient
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const PatientModal = ({ patient, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Patient Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* Personal Information */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Patient ID</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.patientId || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Full Name</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{`${patient.firstName} ${patient.lastName}`}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900 break-all">{patient.email || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.phone || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Date of Birth</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{formatDate(patient.dateOfBirth)}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Age</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{calculateAge(patient.dateOfBirth)} years</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Gender</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.gender || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Blood Type</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">
                  {patient.bloodType ? (
                    <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      {patient.bloodType}
                    </span>
                  ) : 'N/A'}
                </p>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Marital Status</label>
                <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.maritalStatus || 'N/A'}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Address</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">
                {patient.address ? 
                  `${patient.address.street}, ${patient.address.ward}, ${patient.address.district}, ${patient.address.region}, ${patient.address.country}`.replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '') 
                  : 'N/A'
                }
              </p>
            </div>
          </div>

          {/* Medical & Emergency Information */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 border-b pb-2">Medical & Emergency Information</h3>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Emergency Contact</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">
                {patient.emergencyContact?.name || 'N/A'}
                {patient.emergencyContact?.relationship && ` (${patient.emergencyContact.relationship})`}
              </p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">{patient.emergencyContact?.phone || 'N/A'}</p>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Medical History</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.medicalHistory || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Allergies</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.allergies || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Current Medications</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{patient.currentMedications || 'None recorded'}</p>
            </div>
            
            <div>
              <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700">Insurance Provider</label>
              <p className="mt-1 text-[11px] sm:text-xs md:text-sm text-gray-900">{getInsuranceProviderName(patient.insurance)}</p>
              {patient.insurance?.policyNumber && (
                <p className="text-[10px] sm:text-xs md:text-sm text-gray-500">Policy: {patient.insurance.policyNumber}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 md:gap-4">
          <Link
            to={`/patients/edit/${patient._id}`}
            className="btn-secondary flex items-center justify-center text-xs sm:text-sm"
            onClick={onClose}
          >
            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Edit Patient
          </Link>
          <button
            onClick={onClose}
            className="btn-primary text-xs sm:text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-xs sm:text-sm text-gray-600">Manage patient records and information</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={fetchPatients}
            className="flex-1 sm:flex-none btn-secondary flex items-center justify-center text-xs sm:text-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-8 sm:pl-10 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Total Patients</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{patients.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Active Patients</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{patients.filter(p => p.isActive !== false).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">New This Month</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">
                {patients.filter(p => {
                  const createdAt = new Date(p.createdAt);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Search Results</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Contact Info
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Age / DOB
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Blood Type
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Insurance
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Registration
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient._id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-[10px] sm:text-xs md:text-sm font-medium text-primary-700">
                            {`${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-3 md:ml-4 min-w-0 flex-1">
                        <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 truncate">
                          {`${patient.firstName} ${patient.lastName}`}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                          ID: {patient.patientId || 'N/A'}
                        </div>
                        {/* Show contact info on mobile */}
                        <div className="md:hidden text-[10px] text-gray-500 mt-0.5 truncate">
                          {patient.phone || patient.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 hidden md:table-cell">
                    <div className="text-[11px] sm:text-xs md:text-sm text-gray-900 truncate">{patient.email || 'N/A'}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 truncate">{patient.phone || 'N/A'}</div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 hidden sm:table-cell">
                    <div className="text-[11px] sm:text-xs md:text-sm text-gray-900">{calculateAge(patient.dateOfBirth)} yrs</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">{formatDate(patient.dateOfBirth)}</div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 hidden lg:table-cell">
                    {patient.bloodType ? (
                      <span className="inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {patient.bloodType}
                      </span>
                    ) : (
                      <span className="text-[11px] sm:text-xs text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900 hidden xl:table-cell truncate">
                    {getInsuranceProviderName(patient.insurance)}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[10px] sm:text-xs text-gray-500 hidden lg:table-cell">
                    {formatDate(patient.createdAt)}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs font-medium">
                    <ActionsDropdown 
                      patient={patient}
                      isOpen={openDropdown === patient._id}
                      onToggle={toggleDropdown}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredPatients.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <svg className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="mt-2 text-xs sm:text-sm font-medium text-gray-900">No patients found</h3>
            <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
              {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by creating a new patient.'}
            </p>
            {!searchTerm && (
              <div className="mt-4 sm:mt-6">
                <Link to="/patients/new" className="btn-primary text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Add Patient
                </Link>
              </div>
            )}
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

      {/* Custom Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Patient"
        message={
          patientToDelete 
            ? `Are you sure you want to delete ${patientToDelete.firstName} ${patientToDelete.lastName}? This action cannot be undone and will permanently remove all patient data including medical records, appointments, and history.`
            : "Are you sure you want to delete this patient?"
        }
        confirmText="Delete Patient"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting === patientToDelete?._id}
      />
    </div>
  );
};

export default Patients;