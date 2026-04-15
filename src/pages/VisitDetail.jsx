import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import VitalsForm from '../components/visit/VitalsForm';
import DiagnosisForm from '../components/visit/DiagnosisForm';
import LabOrderForm from '../components/visit/LabOrderForm';
import PrescriptionForm from '../components/visit/PrescriptionForm';
import RadiologyOrderForm from '../components/visit/RadiologyOrderForm';

export default function VisitDetail() {
  const { id } = useParams();
  const { user } = useAuth(); // Get current user
  const [visit, setVisit] = useState(null);
  const [activeTab, setActiveTab] = useState('vitals'); // Default to vitals for receptionist
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVisit = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/visits/${id}`);
        setVisit(data.data);
      } catch (err) {
        console.error('Error fetching visit:', err);
        setError('Failed to load visit details');
      } finally {
        setLoading(false);
      }
    };
    fetchVisit();
  }, [id]);

  // Set default tab based on user role
  useEffect(() => {
    if (user?.role === 'receptionist') {
      setActiveTab('vitals');
    } else if (user?.role === 'doctor') {
      setActiveTab('diagnosis');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-gray-500">Loading visit details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 md:p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 text-xs sm:text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!visit) return null;

  // Define tabs based on user role
  const allTabs = [
    { id: 'vitals', label: 'Vitals', allowedRoles: ['admin', 'doctor', 'nurse', 'receptionist'] },
    { id: 'diagnosis', label: 'Diagnosis', allowedRoles: ['admin', 'doctor'] },
    { id: 'labs', label: 'Lab Tests', allowedRoles: ['admin', 'doctor'] },
    { id: 'radiology', label: 'Radiology', allowedRoles: ['admin', 'doctor'] },
    { id: 'prescription', label: 'Prescription', allowedRoles: ['admin', 'doctor'] }
  ];

  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => 
    tab.allowedRoles.includes(user?.role)
  );

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-3 sm:mb-4 md:mb-6">
        <Link 
          to="/visits" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-2 sm:mb-3 text-xs sm:text-sm"
        >
          <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          Back to Visits
        </Link>
        <h1 className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 break-words">
          Visit Details for {visit.patient?.firstName} {visit.patient?.lastName}
        </h1>
        <div className="mt-2 text-[10px] sm:text-xs md:text-sm text-gray-600">
          <p>Visit Date: 
            {new Date(visit.visitDate).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p>Doctor: Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}</p>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-3 sm:mb-4 md:mb-6">
        <nav className="flex space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6">
        {activeTab === 'vitals' && (
          <div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Vitals
            </h2>
            <VitalsForm visitId={id} patientId={visit.patient?._id} />
            
            {/* List existing vitals */}
            {visit.vitalSigns && visit.vitalSigns.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Previous Vitals
                </h3>
                <div className="space-y-2">
                  {visit.vitalSigns.map((vitals, index) => (
                    <div 
                      key={vitals._id || index} 
                      className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200"
                    >
                      <div className="grid grid-cols-2 gap-2 text-[11px] sm:text-xs md:text-sm">
                        <p><strong>Temperature:</strong> {vitals.temperature}°C</p>
                        <p><strong>BP:</strong> {vitals.bloodPressure}</p>
                        <p><strong>Heart Rate:</strong> {vitals.heartRate} bpm</p>
                        <p><strong>O2 Sat:</strong> {vitals.oxygenSaturation}%</p>
                        <p><strong>Body weight:</strong> {vitals.weight} kg</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200 flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-gray-500">
                        {vitals.recordedAt && (
                          <p>
                            <strong>Recorded:</strong> {new Date(vitals.recordedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        {vitals.recordedBy && (
                          <p>
                            <strong>By:</strong> {vitals.recordedBy.firstName} {vitals.recordedBy.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnosis' && (
          <div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Diagnosis
            </h2>
            <DiagnosisForm visitId={id} patientId={visit.patient?._id} />
            
            {/* List existing diagnoses */}
            {visit.diagnosis && visit.diagnosis.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Previous Diagnoses
                </h3>
                <div className="space-y-2">
                  {visit.diagnosis.map((diagnosis, index) => (
                    <div 
                      key={diagnosis._id || index} 
                      className="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-200"
                    >
                      <p className="text-[11px] sm:text-xs md:text-sm text-gray-800 font-medium">
                        {diagnosis.condition}
                      </p>
                      {diagnosis.icd10Code && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                          <strong>ICD-10:</strong> {diagnosis.icd10Code}
                        </p>
                      )}
                      {diagnosis.notes && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                          {diagnosis.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'labs' && (
          <div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Lab Orders & Results
            </h2>
            <LabOrderForm visitId={id} patientId={visit.patient?._id} />
            
            {/* List existing lab orders and their results */}
            {visit.labOrders && visit.labOrders.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Lab Orders
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {visit.labOrders.map(order => (
                    <li 
                      key={order._id} 
                      className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                        <span className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-800">
                          {order.testName}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded-full flex-shrink-0 ${
                          order.status === 'completed' || order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'pending' || order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      {order.results && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2">
                          <strong>Result:</strong> {order.results}
                        </p>
                      )}
                      {order.createdAt && (
                        <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                          Requested: {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'radiology' && (
          <div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Radiology Orders
            </h2>
            <RadiologyOrderForm visitId={id} patientId={visit.patient?._id} />
            
            {/* List existing radiology orders */}
            {visit.radiologyOrders && visit.radiologyOrders.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Radiology Orders
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {visit.radiologyOrders.map(order => (
                    <li 
                      key={order._id} 
                      className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1 sm:mb-2">
                        <span className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-800">
                          {order.scanType} - {order.bodyPart}
                        </span>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded-full flex-shrink-0 ${
                          order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      {order.reason && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                          <strong>Reason:</strong> {order.reason}
                        </p>
                      )}
                      {order.findings && (
                        <p className="text-[10px] sm:text-xs text-gray-600 mt-1 sm:mt-2">
                          <strong>Findings:</strong> {order.findings}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'prescription' && (
          <div>
            <h2 className="text-sm sm:text-base md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
              Prescriptions
            </h2>
            <PrescriptionForm visitId={id} patientId={visit.patient?._id} />
            
            {/* List existing prescriptions */}
            {visit.prescriptions && visit.prescriptions.length > 0 && (
              <div className="mt-4 sm:mt-6">
                <h3 className="text-xs sm:text-sm md:text-base font-medium text-gray-700 mb-2 sm:mb-3">
                  Prescribed Medications
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {visit.prescriptions.map(prescription => (
                    <li 
                      key={prescription._id} 
                      className="bg-gray-50 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-200"
                    >
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-800">
                          {prescription.medication}
                        </div>
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold rounded-full flex-shrink-0 ${
                          prescription.status === 'Dispensed' ? 'bg-green-100 text-green-800' :
                          prescription.status === 'Quantified' ? 'bg-blue-100 text-blue-800' :
                          prescription.status === 'Pending Quantification' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                        {prescription.dosage && (
                          <p><strong>Dosage:</strong> {prescription.dosage}</p>
                        )}
                        {prescription.frequency && (
                          <p><strong>Frequency:</strong> {prescription.frequency}</p>
                        )}
                        {prescription.duration && (
                          <p><strong>Duration:</strong> {prescription.duration}</p>
                        )}
                        {prescription.notes && (
                          <p><strong>Notes:</strong> {prescription.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}