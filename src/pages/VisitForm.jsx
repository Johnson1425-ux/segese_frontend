import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, User, Stethoscope, Search, Loader2, Plus, X, DollarSign, MessageSquare, Activity } from 'lucide-react';
import { patientService } from '../utils/patientService.js';
import { doctorService } from '../utils/doctorService.js';
import { visitService } from '../utils/visitService.js';
import serviceService from '../utils/serviceService.js';
import { billingService } from '../utils/billingService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

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

const VisitForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;
    const patientSearchRef = useRef(null);
    
    // Form data state
    const [formData, setFormData] = useState({
        patientId: '',
        doctorId: '',
        visitDate: getTanzaniaDateTime(),
        reason: '',
        status: 'Pending Payment',
        type: 'consultation', // Default type to satisfy backend validation
    });

    // State for services
    const [consultationService, setConsultationService] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    // State for patient search and doctor selection
    const [patients, setPatients] = useState([]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);
    const [doctors, setDoctors] = useState([]);
    
    // UI states
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [patientsRes, doctorsRes, servicesRes] = await Promise.all([
                    patientService.getAllPatients(),
                    doctorService.getAllDoctors(),
                    serviceService.getAllServices(),
                ]);
                setPatients(patientsRes.data || []);
                setDoctors(doctorsRes.data || []);
                
                // Filter for consultation service only
                const allServices = servicesRes.data.data || [];
                const consultation = allServices.find(service => 
                    service.name.toLowerCase() === 'consultation fees'
                );
                
                if (consultation) {
                    setConsultationService(consultation);
                    // Automatically add consultation service
                    setSelectedServices([consultation]);
                } else {
                    toast.error('No consultation service found. Please create one first.');
                }
            } catch (error) {
                toast.error('Failed to load initial data.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Effect for patient search
    useEffect(() => {
        if (patientSearchTerm) {
            const results = patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase()));
            setPatientSearchResults(results);
        } else {
            setPatientSearchResults([]);
        }
    }, [patientSearchTerm, patients]);

    // Calculate total amount when services change
    useEffect(() => {
        const total = selectedServices.reduce((sum, service) => sum + service.price, 0);
        setTotalAmount(total);
    }, [selectedServices]);

    // Click outside handler for patient search
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (patientSearchRef.current && !patientSearchRef.current.contains(event.target)) {
                setShowPatientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePatientSearchChange = (e) => {
        setPatientSearchTerm(e.target.value);
        setShowPatientDropdown(true);
    };

    const handlePatientSelect = (patient) => {
        setFormData({ ...formData, patientId: patient._id });
        setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
        setShowPatientDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.patientId || !formData.doctorId) {
            toast.error("Please select a patient and a doctor.");
            return;
        }
        if (selectedServices.length === 0) {
            toast.error("Consultation service is required.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const visitData = { ...formData, status: 'Pending Payment' };
            
            const visitRes = await visitService.startVisit(visitData);
            const newVisitId = visitRes.data._id;

            const invoiceData = {
                patient: formData.patientId,
                visit: newVisitId,
                items: selectedServices.map(s => {
                    return {
                        description: s.name, 
                        quantity: 1, 
                        unitPrice: s.price, 
                        total: s.price,
                        type: s.category.toLowerCase().replace(' ', '_')
                    };
                }),
                paymentTerms: 'immediate',
            };
            
            const invoiceRes = await billingService.createInvoice(invoiceData);
            
            // Handle different possible invoice response structures
            let invoiceId, invoiceNumber;
            invoiceId = invoiceRes.data.data._id;
            invoiceNumber = invoiceRes.data.data.invoiceNumber;
            
            toast.success(`Invoice #${invoiceNumber || 'Unknown'} created successfully.`);
            navigate(`/billing/invoices/${invoiceId}`);

        } catch (error) {
            // More specific error messages
            if (error.message === 'Failed to get visit ID from response') {
                toast.error('Visit was not created properly. Please try again.');
            } else if (error.message === 'Failed to get invoice ID from response') {
                toast.error('Invoice was not created properly. Please try again.');
            } else {
                toast.error(error.response?.data?.message || error.message || 'Operation failed');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    if (!consultationService) {
        return (
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <div className="text-center py-8">
                    <p className="text-red-600 font-semibold">No consultation service available.</p>
                    <p className="text-gray-600 mt-2">Please create a consultation service in the Services section first.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Invoice and Start Visit</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Patient and Doctor Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div ref={patientSearchRef}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Patient</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input type="text" value={patientSearchTerm} onChange={handlePatientSearchChange} onFocus={() => setShowPatientDropdown(true)} placeholder="Type to search..." className="input-field pl-10" />
                            {showPatientDropdown && patientSearchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                    {patientSearchResults.map((patient) => (
                                        <div key={patient._id} onClick={() => handlePatientSelect(patient)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{patient.firstName} {patient.lastName}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-2">Assign Doctor</label>
                        <div className="relative">
                            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select id="doctorId" name="doctorId" value={formData.doctorId} onChange={handleChange} className="input-field pl-10">
                                <option value="">Select a doctor</option>
                                {doctors.map((doctor) => (<option key={doctor._id} value={doctor._id}>Dr. {doctor.firstName} {doctor.lastName}</option>))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Visit Type Dropdown */}
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
                    <div className="relative">
                        <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select id="type" name="type" value={formData.type} onChange={handleChange} className="input-field pl-10">
                            <option value="consultation">Consultation</option>
                            <option value="emergency">Emergency</option>
                            <option value="follow-up">Follow-up</option>
                            <option value="routine">Routine</option>
                        </select>
                    </div>
                </div>

                {/* Reason for Visit Section */}
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit *</label>
                    <div className="relative">
                        <MessageSquare className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                        <textarea id="reason" name="reason" rows="3" value={formData.reason} onChange={handleChange} className="input-field pl-10" placeholder="Describe the primary reason for the patient's visit..."/>
                    </div>
                </div>

                {/* Consultation Service Display (Read-only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{consultationService.name}</p>
                                <p className="text-sm text-gray-600">{consultationService.category}</p>
                            </div>
                            <p className="font-bold text-lg text-gray-800">{consultationService.price.toLocaleString()} TZS</p>
                        </div>
                    </div>
                </div>

                {/* Total Amount */}
                <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-gray-800">Total Amount</span>
                        <span className="font-bold text-xl text-blue-600">{totalAmount.toLocaleString()} TZS</span>
                    </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <DollarSign className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Processing...' : 'Generate Invoice & Proceed to Payment'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VisitForm;