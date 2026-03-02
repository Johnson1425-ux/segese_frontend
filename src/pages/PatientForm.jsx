import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, User, Loader2, MapPin, Phone, ShieldCheck, Cross } from 'lucide-react';
import { patientService } from '../utils/patientService.js';

const PatientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: {
      country: 'Tanzania, United Republic of',
      region: '',
      district: '',
      ward: '',
      street: '',
    },
    bloodType: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    hasInsurance: false,
    insurance: {
      provider: '',
      membershipNumber: '',
    },
    maritalStatus: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(id);

  useEffect(() => {
    if (isEditing) {
      fetchPatient();
    }
  }, [id, isEditing]);

  const fetchPatient = async () => {
    try {
      setIsLoading(true);
      const response = await patientService.getPatientById(id);
      
      let patientData;
      if (response?.data?.patient) {
        patientData = response.data.patient;
      } else if (response?.data) {
        patientData = response.data;
      } else {
        patientData = response;
      }
      
      if (!patientData) {
        throw new Error('No patient data received from server');
      }
      
      const processedData = {
        firstName: patientData.firstName || '',
        middleName: patientData.middleName || '',
        lastName: patientData.lastName || '',
        email: patientData.email || undefined,
        phone: patientData.phone || '',
        dateOfBirth: patientData.dateOfBirth || '',
        gender: patientData.gender || '',
        bloodType: patientData.bloodType || '',
        maritalStatus: patientData.maritalStatus || '',
        medicalHistory: patientData.medicalHistory || '',
        allergies: patientData.allergies || '',
        currentMedications: patientData.currentMedications || '',
        hasInsurance: !!(patientData.insurance?.provider),
        address: {
          country: patientData.address?.country || 'Tanzania, United Republic of',
          region: patientData.address?.region || '',
          district: patientData.address?.district || '',
          ward: patientData.address?.ward || '',
          street: patientData.address?.street || '',
        },
        emergencyContact: {
          name: patientData.emergencyContact?.name || '',
          relationship: patientData.emergencyContact?.relationship || '',
          phone: patientData.emergencyContact?.phone || ''
        },
        insurance: {
          provider: patientData.insurance?.provider || '',
          membershipNumber: patientData.insurance?.membershipNumber || '',
        }
      };
      
      if (processedData.dateOfBirth) {
        try {
          processedData.dateOfBirth = new Date(processedData.dateOfBirth).toISOString().split('T')[0];
        } catch (dateError) {
          console.error('Error formatting date:', dateError);
          processedData.dateOfBirth = '';
        }
      }
      
      setFormData(processedData);
    } catch (error) {
      console.error('Error fetching patient:', error);
      const message = error.response?.data?.message || error.message || 'Failed to fetch patient data';
      toast.error(message);
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.middleName?.trim()) {
      newErrors.middleName = 'Middle name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      if (birthDate >= today) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
      }
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }
    
    if (!formData.address?.region?.trim()) {
      newErrors['address.region'] = 'Region is required';
    }

    if (!formData.address?.street?.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }

    if (!formData.emergencyContact?.name?.trim()) {
      newErrors['emergencyContact.name'] = 'Emergency contact name is required';
    }

    if (!formData.emergencyContact?.phone?.trim()) {
      newErrors['emergencyContact.phone'] = 'Emergency contact phone is required';
    }

    if (formData.hasInsurance) {
      if (!formData.insurance?.provider?.trim()) {
        newErrors['insurance.provider'] = 'Insurance provider is required';
      }

      if (!formData.insurance?.membershipNumber?.trim()) {
        newErrors['insurance.membershipNumber'] = 'Membership number is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submitData = { ...formData };
      
      if (!submitData.hasInsurance) {
        submitData.insurance = {
          provider: '',
          membershipNumber: '',
        };
      }

      if (!submitData.email || submitData.email.trim() === '') {
        delete submitData.email;
      }

      if (!submitData.phone || submitData.phone.trim() === '') {
        delete submitData.phone;
      }

      if (isEditing) {
        await patientService.updatePatient(id, submitData);
        toast.success('Patient updated successfully');
      } else {
        await patientService.createPatient(submitData);
        toast.success('Patient created successfully');
      }
      navigate('/patients/search');
    } catch (error) {
      const message = error.response?.data?.message || 
        (isEditing ? 'Failed to update patient' : 'Failed to create patient');
      toast.error(message);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const insuranceProvider = ['NHIF', 'NSSF', 'ASSEMBLE', 'BRITAM'];
  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];
  const maritalStatuses = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];
  const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Other'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {isEditing ? 'Edit Patient' : 'Add New Patient'}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isEditing ? 'Update patient information' : 'Enter patient details'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <User className="mr-2 text-blue-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"/>
            <span className="truncate">Client Basic Information</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName || ''}
                onChange={handleChange}
                className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name *
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName || ''}
                onChange={handleChange}
                className={`input-field ${errors.middleName ? 'border-red-500' : ''}`}
                placeholder="Enter middle name"
              />
              {errors.middleName && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.middleName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName || ''}
                onChange={handleChange}
                className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.lastName}</p>}
            </div>

            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth || ''}
                onChange={handleChange}
                className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
              />
              {errors.dateOfBirth && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.dateOfBirth}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className={`input-field ${errors.gender ? 'border-red-500' : ''}`}
              >
                <option value="">Select gender</option>
                {genderOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.gender && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Type
              </label>
              <select
                name="bloodType"
                value={formData.bloodType || ''}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select blood type</option>
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus || ''}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select marital status</option>
                {maritalStatuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <MapPin className="mr-2 text-blue-500 w-5 h-5 flex-shrink-0" />
            <span className="truncate">Address Information</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="address.country"
                value="Tanzania, United Republic of"
                readOnly
                className="input-field bg-gray-50 cursor-not-allowed text-sm"
                placeholder="Enter country"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region *
              </label>
              <input
                type="text"
                name="address.region"
                value={formData.address?.region || ''}
                onChange={handleChange}
                className={`input-field ${errors['address.region'] ? 'border-red-500' : ''}`}
                placeholder="Enter region"
              />
              {errors['address.region'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['address.region']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                District
              </label>
              <input
                type="text"
                name="address.district"
                value={formData.address?.district || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter district"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ward
              </label>
              <input
                type="text"
                name="address.ward"
                value={formData.address?.ward || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter ward"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address?.street || ''}
                onChange={handleChange}
                className={`input-field ${errors['address.street'] ? 'border-red-500' : ''}`}
                placeholder="Enter street address"
              />
              {errors['address.street'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['address.street']}</p>}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Phone className="mr-2 text-blue-500 w-5 h-5 flex-shrink-0" />
            <span className="truncate">Emergency Contact</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact?.name || ''}
                onChange={handleChange}
                className={`input-field ${errors['emergencyContact.name'] ? 'border-red-500' : ''}`}
                placeholder="Enter emergency contact name"
              />
              {errors['emergencyContact.name'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['emergencyContact.name']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                name="emergencyContact.phone"
                value={formData.emergencyContact?.phone || ''}
                onChange={handleChange}
                className={`input-field ${errors['emergencyContact.phone'] ? 'border-red-500' : ''}`}
                placeholder="Enter emergency contact phone"
              />
              {errors['emergencyContact.phone'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['emergencyContact.phone']}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship
              </label>
              <select
                name="emergencyContact.relationship"
                value={formData.emergencyContact?.relationship || ''}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select relationship</option>
                {relationships.map(relationship => (
                  <option key={relationship} value={relationship}>{relationship}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <Cross className="mr-2 text-blue-500 w-5 h-5 flex-shrink-0" />
            <span className="truncate">Medical Information</span>
          </h2>
          
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medical History
              </label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory || ''}
                onChange={handleChange}
                rows="3"
                className="input-field text-sm"
                placeholder="Enter medical history (conditions, surgeries, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allergies
              </label>
              <textarea
                name="allergies"
                value={formData.allergies || ''}
                onChange={handleChange}
                rows="3"
                className="input-field text-sm"
                placeholder="Enter allergies (medications, foods, environmental, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Medications
              </label>
              <textarea
                name="currentMedications"
                value={formData.currentMedications || ''}
                onChange={handleChange}
                rows="3"
                className="input-field text-sm"
                placeholder="Enter current medications and dosages"
              />
            </div>
          </div>
        </div>

        {/* Insurance Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
            <ShieldCheck className="mr-2 text-blue-500 w-5 h-5 flex-shrink-0" />
            <span className="truncate">Insurance Information</span>
          </h2>
          
          <div className="mb-4 sm:mb-6 flex items-center">
            <input
              type="checkbox"
              id="hasInsurance"
              name="hasInsurance"
              checked={formData.hasInsurance || false}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="hasInsurance" className="ml-2 block text-sm font-medium text-gray-700">
              Has Insurance?
            </label>
          </div>

          {formData.hasInsurance && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider *
                </label>
                <select
                  name="insurance.provider"
                  value={formData.insurance?.provider || ''}
                  onChange={handleChange}
                  className={`input-field ${errors['insurance.provider'] ? 'border-red-500' : ''}`}
                >
                  <option value="">Select insurance provider</option>
                  {insuranceProvider.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
                {errors['insurance.provider'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['insurance.provider']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Membership Number *
                </label>
                <input
                  type="text"
                  name="insurance.membershipNumber"
                  value={formData.insurance?.membershipNumber || ''}
                  onChange={handleChange}
                  className={`input-field ${errors['insurance.membershipNumber'] ? 'border-red-500' : ''}`}
                  placeholder="Enter membership number"
                />
                {errors['insurance.membershipNumber'] && <p className="mt-1 text-xs sm:text-sm text-red-600">{errors['insurance.membershipNumber']}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 sticky bottom-0  p-4 sm:p-0 -mx-4 sm:mx-0 border-t sm:border-t-0 border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/patients/search')}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto btn-primary flex items-center justify-center text-sm sm:text-base"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Patient' : 'Register Patient')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;