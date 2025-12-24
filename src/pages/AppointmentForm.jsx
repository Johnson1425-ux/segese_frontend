import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Calendar, Search, X, User, ChevronDown, Loader2, Stethoscope } from 'lucide-react';
import { patientService } from '../utils/patientService.js';
import { doctorService } from '../utils/doctorService.js';
import { appointmentService } from '../utils/appointmentService.js';
// import { apiHelpers } from '../utils/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const AppointmentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const patientSearchRef = useRef(null);
  const doctorSearchRef = useRef(null);
  
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    patientName: '',
    doctorName: '',
    date: '',
    time: '',
    type: '',
    status: 'Scheduled',
    notes: '',
    duration: '30 minutes'
  });
  
  // State for patient search
  const [patients, setPatients] = useState([]);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // State for doctor search
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [doctorSearchResults, setDoctorSearchResults] = useState([]);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [patientsRes, doctorsRes] = await Promise.all([
          patientService.getAllPatients(),
          doctorService.getAllDoctors()
        ]);
        setPatients(patientsRes.data || []);
        setDoctors(doctorsRes.data || []);

        if (isEditing) {
          const appointment = await appointmentService.getAppointmentById(id);
          const { patient, doctor, date, ...rest } = appointment.data;
          const formattedDate = new Date(date).toISOString().split('T')[0];
          const formattedTime = new Date(date).toTimeString().slice(0, 5);

          setFormData({
            ...rest,
            patientId: patient._id,
            doctorId: doctor._id,
            patientName: `${patient.firstName} ${patient.lastName}`,
            doctorName: `${doctor.firstName} ${doctor.lastName}`,
            date: formattedDate,
            time: formattedTime
          });
          setSelectedPatient(patient);
          setSelectedDoctor(doctor);
          setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
          setDoctorSearchTerm(`${doctor.firstName} ${doctor.lastName}`);
        }
      } catch (error) {
        toast.error('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  // Effect for patient search
  useEffect(() => {
    if (patientSearchTerm) {
      const results = patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase())
      );
      setPatientSearchResults(results);
    } else {
      setPatientSearchResults([]);
    }
  }, [patientSearchTerm, patients]);

  // Effect for doctor search
  useEffect(() => {
    if (doctorSearchTerm) {
      const results = doctors.filter(d =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(doctorSearchTerm.toLowerCase())
      );
      setDoctorSearchResults(results);
    } else {
      setDoctorSearchResults([]);
    }
  }, [doctorSearchTerm, doctors]);


  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (patientSearchRef.current && !patientSearchRef.current.contains(event.target)) {
        setShowPatientDropdown(false);
      }
      if (doctorSearchRef.current && !doctorSearchRef.current.contains(event.target)) {
        setShowDoctorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePatientSearchChange = (e) => {
    setPatientSearchTerm(e.target.value);
    setShowPatientDropdown(true);
  };
  
  const handleDoctorSearchChange = (e) => {
    setDoctorSearchTerm(e.target.value);
    setShowDoctorDropdown(true);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setFormData(prev => ({ ...prev, patientId: patient._id, patientName: `${patient.firstName} ${patient.lastName}` }));
    setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
  };
  
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData(prev => ({ ...prev, doctorId: doctor._id, doctorName: `${doctor.firstName} ${doctor.lastName}` }));
    setDoctorSearchTerm(`${doctor.firstName} ${doctor.lastName}`);
    setShowDoctorDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const appointmentData = {
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      status: formData.status,
      notes: formData.notes, // This will be mapped to 'reason' on the backend
      duration: formData.duration
    };

    try {
      if (isEditing) {
        await appointmentService.updateAppointment(id, appointmentData);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentService.createAppointment(appointmentData);
        toast.success('Appointment booked successfully');
      }
      navigate('/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          {isEditing ? 'Edit Appointment' : 'Book New Appointment'}
        </h1>
        <button
          onClick={() => navigate('/appointments')}
          className="btn-secondary flex items-center text-sm md:text-base w-full sm:w-auto justify-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Patient Search */}
          <div ref={patientSearchRef} className="relative">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Patient *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                value={patientSearchTerm}
                onChange={handlePatientSearchChange}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Search for a patient..."
                className="input-field pl-9 md:pl-10 text-sm md:text-base h-10 md:h-auto"
              />
              {showPatientDropdown && patientSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 md:max-h-60 overflow-y-auto">
                  {patientSearchResults.map(patient => (
                    <div
                      key={patient._id}
                      onClick={() => handlePatientSelect(patient)}
                      className="px-3 md:px-4 py-2 md:py-2.5 hover:bg-gray-100 cursor-pointer text-sm md:text-base active:bg-gray-200"
                    >
                      {patient.firstName} {patient.lastName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Search */}
          <div ref={doctorSearchRef} className="relative">
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Doctor *
            </label>
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="text"
                value={doctorSearchTerm}
                onChange={handleDoctorSearchChange}
                onFocus={() => setShowDoctorDropdown(true)}
                placeholder="Search for a doctor..."
                className="input-field pl-9 md:pl-10 text-sm md:text-base h-10 md:h-auto"
              />
              {showDoctorDropdown && doctorSearchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 md:max-h-60 overflow-y-auto">
                  {doctorSearchResults.map(doctor => (
                    <div
                      key={doctor._id}
                      onClick={() => handleDoctorSelect(doctor)}
                      className="px-3 md:px-4 py-2 md:py-2.5 hover:bg-gray-100 cursor-pointer active:bg-gray-200"
                    >
                      <div className="text-sm md:text-base font-medium">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 truncate">
                        {doctor.specialization}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Appointment Date */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Appointment Date *
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input-field text-sm md:text-base h-10 md:h-auto"
            />
          </div>

          {/* Appointment Time */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Appointment Time *
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="input-field text-sm md:text-base h-10 md:h-auto"
            />
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Appointment Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field text-sm md:text-base h-10 md:h-auto"
            >
              <option value="">Select Type</option>
              {/* Values are now lowercase to match the schema */}
              <option value="consultation">Consultation</option>
              <option value="follow-up">Follow-up</option>
              <option value="check-up">Check-up</option>
              <option value="emergency">Emergency</option>
              <option value="routine">Routine</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Duration *
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="input-field text-sm md:text-base h-10 md:h-auto"
            >
              <option value="15 minutes">15 minutes</option>
              <option value="30 minutes">30 minutes</option>
              <option value="45 minutes">45 minutes</option>
              <option value="1 hour">1 hour</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 md:mt-6">
          <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
            Notes *
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            className="input-field text-sm md:text-base min-h-[80px] md:min-h-[100px]"
            placeholder="Enter appointment notes, symptoms, or special instructions..."
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-4 md:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 md:py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm md:text-base w-full sm:w-auto"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base px-4 py-2 md:py-2.5 w-full sm:w-auto"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting 
              ? (isEditing ? 'Updating...' : 'Booking...') 
              : (isEditing ? 'Update Appointment' : 'Book Appointment')
            }
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;