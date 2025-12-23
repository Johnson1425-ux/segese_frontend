import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Calendar } from 'lucide-react';
import { doctorService } from '../utils/doctorService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await doctorService.getAllDoctors();
        setDoctors(response.data || []);
      } catch (error) {
        toast.error('Failed to fetch doctors.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor =>
    `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
          Manage Doctor Schedules
        </h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-8 sm:pl-10 w-full text-xs sm:text-sm md:text-base"
          />
        </div>
      </div>

      {/* Table - Minified for all screen sizes */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Phone
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  Email
                </th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor._id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                    <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900">
                      {doctor.firstName} {doctor.lastName}
                    </div>
                    {/* Show phone on mobile below name */}
                    <div className="text-[10px] text-gray-500 sm:hidden mt-0.5">
                      {doctor.phone}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900 hidden sm:table-cell">
                    {doctor.phone}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-900 hidden md:table-cell">
                    {doctor.email}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right">
                    <Link
                      to={`/doctors/schedule/${doctor._id}`}
                      className="inline-flex items-center justify-center px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-blue-600 text-white text-[10px] sm:text-xs md:text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 sm:mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Schedule</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDoctors.length === 0 && (
          <div className="text-center py-6 sm:py-8">
            <p className="text-xs sm:text-sm text-gray-500">No doctors found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;