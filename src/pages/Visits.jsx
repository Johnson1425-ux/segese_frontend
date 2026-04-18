import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Plus, Search, Filter, Eye, ChevronLeft, ChevronRight, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { visitService } from '../utils/visitService.js';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const Visits = () => {
  const { hasAnyRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  const canCreateVisit = hasAnyRole(['admin', 'receptionist']);
  const dropdownRef = useRef(null);

  const toggleDropdown = (visitId) => {
    setOpenDropdown(openDropdown === visitId ? null : visitId);
  }

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

  const {
    data: visitsData,
    isLoading,
    isError,
  } = useQuery(
    ['visits', currentPage, statusFilter, searchTerm],
    () => visitService.getAllVisits({ page: currentPage, limit: 10, status: statusFilter, search: searchTerm }),
    { keepPreviousData: true }
  );

  const visits = visitsData?.data || [];
  const totalResults = visitsData?.total || 0;
  const limit =10;
  
  //Calculate total pages manually
  const totalPages = Math.ceil(totalResults / limit) || 1;

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <div className="text-red-500 p-4 text-xs sm:text-sm">Error loading visits.</div>;

  // Actions Dropdown Component
  const ActionsDropdown = ({ visit, isOpen, onToggle }) => {
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
            onToggle(visit._id);
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
              <Link
                to={`/visits/${visit._id}`}
                className="flex items-center w-full px-3 sm:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 no-underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(null);
                }}
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                View Details
              </Link>
              
              <hr className="my-1 border-gray-200" />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteClick(patient);
                }}
                className="flex items-center w-full px-3 sm:px-4 py-2 text-[10px] sm:text-xs md:text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
                disabled={isDeleting === visit._id}
              >
                {isDeleting === visit._id ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 animate-spin flex-shrink-0" />
                ) : (
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 flex-shrink-0" />
                )}
                Delete Visit
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-4">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800">Patient Visits</h1>
        {canCreateVisit && (
          <Link to="/visits/new" className="btn-primary inline-flex items-center w-full sm:w-auto text-xs sm:text-sm justify-center px-3 sm:px-4 py-2">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            Start New Visit
          </Link>
        )}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-3 sm:mb-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-8 sm:pl-10 w-full text-xs sm:text-sm py-2"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field pl-8 sm:pl-10 w-full sm:w-auto text-xs sm:text-sm py-2"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Date</th>
                <th className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="relative px-2 sm:px-4 md:px-6 py-2 sm:py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visits.length > 0 ? (
                visits.map((visit) => (
                  <tr key={visit._id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                        {visit.patient?.firstName} {visit.patient?.lastName}
                      </div>
                      {/* Show doctor on mobile below name */}
                      <div className="sm:hidden text-[9px] text-gray-500 truncate max-w-[120px]">
                        Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900 truncate max-w-[150px]">
                      Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900">
                      {new Date(visit.visitDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: window.innerWidth < 640 ? '2-digit' : 'numeric'
                      })}
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900 truncate max-w-[200px]">
                      {visit.reason}
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 inline-flex text-[9px] sm:text-[10px] md:text-xs leading-4 sm:leading-5 font-semibold rounded-full ${
                        visit.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        visit.status === 'In-Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {visit.status}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-xs sm:text-sm font-medium">
                      <ActionsDropdown 
                        visit={visit}
                        isOpen={openDropdown === visit._id}
                        onToggle={toggleDropdown}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 sm:py-5 text-gray-500 text-xs sm:text-sm">
                    No visits found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-3 sm:mt-4 gap-2">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="btn-secondary disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        <span className="text-[10px] sm:text-xs md:text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="btn-secondary disabled:opacity-50 text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Visits;