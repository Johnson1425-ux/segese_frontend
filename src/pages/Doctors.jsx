import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Calendar, Mail, Phone, User } from 'lucide-react';
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
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">Manage Doctor Schedules</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.map((doctor) => (
                <tr key={doctor._id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {doctor.firstName} {doctor.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/doctors/schedule/${doctor._id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Schedule
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredDoctors.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No doctors found.</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredDoctors.map((doctor) => (
          <div 
            key={doctor._id} 
            className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
          >
            {/* Doctor Header */}
            <div className="flex items-start mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900">
                  {doctor.firstName} {doctor.lastName}
                </h3>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <a 
                  href={`tel:${doctor.phone}`} 
                  className="text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {doctor.phone}
                </a>
              </div>
              <div className="flex items-center text-sm">
                <Mail className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                <a 
                  href={`mailto:${doctor.email}`} 
                  className="text-gray-600 hover:text-blue-600 transition-colors break-all"
                >
                  {doctor.email}
                </a>
              </div>
            </div>

            {/* Action Button */}
            <Link
              to={`/doctors/schedule/${doctor._id}`}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Schedule
            </Link>
          </div>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No doctors found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;