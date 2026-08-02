import { useState, useEffect } from "react";
import api from "../utils/api.js";
import { Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Dispensing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("quantification"); // "quantification", "dispensing", or "ipd-medications"
  const [filters] = useState({ search: "", patientId: "", status: "" });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDispensingPatient, setSelectedDispensingPatient] = useState(null);
  const [selectedIPDPatient, setSelectedIPDPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dispensingSearchTerm, setDispensingSearchTerm] = useState('');
  const [ipdSearchTerm, setIPDSearchTerm] = useState('');
  
  // Quantification state
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [selectedForQuantify, setSelectedForQuantify] = useState(null);
  const [quantifyData, setQuantifyData] = useState({
    quantifiedQuantity: "",
    notes: ""
  });
  
  // Dispensing state
  const [readyPrescriptions, setReadyPrescriptions] = useState([]);
  const [selectedForDispense, setSelectedForDispense] = useState(null);
  
  // IPD Medications state
  const [ipdMedications, setIpdMedications] = useState([]);
  const [selectedForIPDDispense, setSelectedForIPDDispense] = useState(null);
  const [ipdDispenseData, setIpdDispenseData] = useState({
    quantity: "",
    notes: ""
  });
  
  // Common state
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch functions
  const fetchPendingPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions/pending-quantification');
      setPendingPrescriptions(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch pending prescriptions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadyPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prescriptions/ready-for-dispensing');
      setReadyPrescriptions(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch ready prescriptions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      // Fetch medicines from the medicines endpoint for base info and prices
      const medicinesRes = await api.get('/medicines');
      const medicinesData = medicinesRes.data.data || medicinesRes.data;
      
      // Fetch stock balance for quantities (from batch system)
      const stockRes = await api.get('/stock/balance');
      const stockData = stockRes.data.data || stockRes.data;
      
      // Create a map of medicine ID to stock quantity
      const stockMap = {};
      stockData.forEach(item => {
        const medId = item.medicine?._id || item._id;
        stockMap[medId] = item.totalQuantity || item.quantity || item.balance || 0;
      });
      
      // Map medicines with their stock quantities from batch system
      const catalogWithStock = medicinesData.map(med => ({
        _id: med._id,
        name: med.name,
        type: med.type,
        strength: med.strength,
        sellingPrice: med.prices?.Pharmacy || med.sellingPrice || 0,
        quantity: stockMap[med._id] || 0, // Stock from batch system
      }));

      setMedicines(catalogWithStock);
    } catch (error) {
      console.error("Failed to fetch medicines", error);
    }
  };

  const fetchIPDMedications = async () => {
    try {
      setLoading(true);
      // Fetch medications from IPD records - filter for Pending Quantification by default
      let url = '/ipd-records/medications';
      const queryParams = new URLSearchParams();
      
      // Always fetch Pending Quantification status unless specifically filtered
      queryParams.append('medicationStatus', 'Pending Quantification');
      
      if (filters.patientId) {
        queryParams.append('patientId', filters.patientId);
      }
      
      const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
      const response = await api.get(fullUrl);
      setIpdMedications(response.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch IPD medications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
    if (activeTab === "quantification") {
      fetchPendingPrescriptions();
    } else if (activeTab === "dispensing") {
      fetchReadyPrescriptions();
    } else if (activeTab === "ipd-medications") {
      fetchIPDMedications();
    }
  }, [activeTab, filters]);

  const getMedicineDetails = (medicineId) => {
    return medicines.find(med => med._id === medicineId);
  };

  // Filtering
  
  
  
  // Group prescriptions by patient
  const groupPrescriptionsByPatient = () => {
    const grouped = {};
    pendingPrescriptions.forEach(pres => {
      const patientId = pres.patient?._id;
      if (patientId) {
        if (!grouped[patientId]) {
          grouped[patientId] = {
            patient: pres.patient,
            prescriptions: []
          };
        }
        grouped[patientId].prescriptions.push(pres);
      }
    });
    return Object.values(grouped);
  };

  const patientsWithTests = groupPrescriptionsByPatient();

  // Filter patients based on search term
  const filteredPatients = patientsWithTests.filter(item => {
    const fullName = `${item.patient?.firstName} ${item.patient?.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Group ready prescriptions by patient for dispensing
  const groupDispensingByPatient = () => {
    const grouped = {};
    readyPrescriptions.forEach(pres => {
      const patientId = pres.patient?._id;
      if (patientId) {
        if (!grouped[patientId]) {
          grouped[patientId] = {
            patient: pres.patient,
            prescriptions: []
          };
        }
        grouped[patientId].prescriptions.push(pres);
      }
    });
    return Object.values(grouped);
  };

  const patientsWithDispensing = groupDispensingByPatient();

  const filteredDispensingPatients = patientsWithDispensing.filter(item => {
    const fullName = `${item.patient?.firstName} ${item.patient?.lastName}`.toLowerCase();
    return fullName.includes(dispensingSearchTerm.toLowerCase());
  });

  // Group IPD medications by patient
  const groupIPDByPatient = () => {
    const grouped = {};
    ipdMedications.forEach(med => {
      const patientId = med.patient?._id;
      if (patientId) {
        if (!grouped[patientId]) {
          grouped[patientId] = {
            patient: med.patient,
            admissionNumber: med.admissionNumber,
            ward: med.ward,
            bed: med.bed,
            medications: []
          };
        }
        grouped[patientId].medications.push(med);
      }
    });
    return Object.values(grouped);
  };

  const patientsWithIPD = groupIPDByPatient();

  const filteredIPDPatients = patientsWithIPD.filter(item => {
    const fullName = `${item.patient?.firstName} ${item.patient?.lastName}`.toLowerCase();
    const admissionNum = item.admissionNumber?.toLowerCase() || '';
    return fullName.includes(ipdSearchTerm.toLowerCase()) || admissionNum.includes(ipdSearchTerm.toLowerCase());
  });

  
  // Quantification handlers
  const handleSelectForQuantify = (prescription) => {
    setSelectedForQuantify(prescription);
    setQuantifyData({
      quantifiedQuantity: 1,
      notes: ""
    });
  };

  // Delete prescription handler
  const handleDeletePrescription = async (prescriptionId) => {
    if (!window.confirm('Are you sure you want to permanently delete this prescription? This cannot be undone.')) return;

    try {
      setLoading(true);
      await api.delete(`/prescriptions/${prescriptionId}`);
      toast.success('Prescription deleted');

      // Update selectedPatient state so modal updates instantly
      setSelectedPatient((prev) => {
        if (!prev) return prev;
        const updatedPrescriptions = prev.prescriptions.filter((p) => p._id !== prescriptionId);
        // Close modal if no prescriptions left
        if (updatedPrescriptions.length === 0) return null;
        return { ...prev, prescriptions: updatedPrescriptions };
      });

      fetchPendingPrescriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete prescription');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantify = async () => {
    if (!quantifyData.quantifiedQuantity || quantifyData.quantifiedQuantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const medicine = getMedicineDetails(selectedForQuantify.medicineId);
    
    if (!medicine) {
      toast.error("Medicine not found in inventory");
      return;
    }

    if (quantifyData.quantifiedQuantity > medicine.quantity) {
      toast.error(`Insufficient stock. Available: ${medicine.quantity}`);
      return;
    }

    try {
      setLoading(true);
      
      // Step 1: Quantify the prescription
      await api.patch(`/prescriptions/${selectedForQuantify._id}/quantify`, {
        quantifiedQuantity: parseInt(quantifyData.quantifiedQuantity),
        notes: quantifyData.notes
      });

      toast.success("Prescription quantified successfully");

      // Step 2: Immediately send to billing
      await api.patch(`/prescriptions/${selectedForQuantify._id}/send-to-billing`);
      
      toast.success("Sent to billing department");

      // Reset and refresh
      setSelectedForQuantify(null);
      setQuantifyData({ quantifiedQuantity: "", notes: "" });
      fetchPendingPrescriptions();
      fetchMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to quantify prescription");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Dispensing handlers
  
  const completeDispensing = async () => {
    try {
      setLoading(true);

      // Create dispensing record
      const dispensingRecord = {
        patient: selectedForDispense.patient._id,
        medicine: selectedForDispense.medicineId,
        medicineName: selectedForDispense.medication,
        quantity: selectedForDispense.quantifiedQuantity,
        prescription: selectedForDispense._id,
        issuedBy: user._id,
        date: new Date(),
        price: selectedForDispense.quantifiedPrice,
        totalAmount: selectedForDispense.totalPrice,
      };

      // Save dispensing record
      await api.post("/dispensing", dispensingRecord);

      // Mark prescription as dispensed
      await api.patch(`/prescriptions/${selectedForDispense._id}`, {
        isActive: false,
        status: 'Dispensed'
      });

      toast.success(
        `Medicine dispensed successfully. Total: TZS ${selectedForDispense.totalPrice.toFixed(2)}`
      );
      
      fetchReadyPrescriptions();
      fetchMedicines();
      setSelectedForDispense(null);
    } catch (error) {
      toast.error("Failed to complete dispensing");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // IPD Medication dispensing handler
  const completeIPDDispensing = async () => {
    try {
      if (!ipdDispenseData.quantity || ipdDispenseData.quantity <= 0) {
        toast.error("Please enter a valid quantity to dispense");
        return;
      }

      setLoading(true);

      // Create dispensing record for IPD medication
      const dispensingRecord = {
        patient: selectedForIPDDispense.patient._id,
        medicine: selectedForIPDDispense.medicineId?._id || selectedForIPDDispense.medicineId,
        medicineName: selectedForIPDDispense.medication,
        quantity: parseInt(ipdDispenseData.quantity),
        prescription: selectedForIPDDispense._id,
        issuedBy: user._id,
        date: new Date(),
        notes: ipdDispenseData.notes
      };

      // Save dispensing record - this will automatically handle IPD invoice if applicable
      const response = await api.post("/dispensing", dispensingRecord);

      // Update the medication status to "Dispensed" in the IPD record
      await api.patch(
        `/ipd-records/${selectedForIPDDispense.ipdRecordId}/medications/${selectedForIPDDispense._id}`,
        { status: 'Dispensed' }
      );

      toast.success(
        `IPD medication dispensed successfully. ${
          response.data.ipdBilling?.addedToInvoice 
            ? `Charged to invoice ${response.data.ipdBilling.invoiceNumber}` 
            : ''
        }`
      );
      
      fetchIPDMedications();
      fetchMedicines();
      setSelectedForIPDDispense(null);
      setIpdDispenseData({ quantity: "", notes: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dispense IPD medication");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header with Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold">Pharmacy Management</h1>
          <p className="text-gray-600 mt-1">
            Manage prescription quantification and dispensing
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("quantification")}
            className={`px-6 py-4 font-semibold transition-colors relative ${
              activeTab === "quantification"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Quantification
            {pendingPrescriptions.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {pendingPrescriptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("dispensing")}
            className={`px-6 py-4 font-semibold transition-colors relative ${
              activeTab === "dispensing"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Dispensing
            {readyPrescriptions.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                {readyPrescriptions.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("ipd-medications")}
            className={`px-6 py-4 font-semibold transition-colors relative ${
              activeTab === "ipd-medications"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            IPD Medications
            {ipdMedications.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {ipdMedications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          {activeTab === "quantification" ? (
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full border"
            />
          ) : activeTab === "dispensing" ? (
            <input
              type="text"
              placeholder="Search patients by name..."
              value={dispensingSearchTerm}
              onChange={(e) => setDispensingSearchTerm(e.target.value)}
              className="input-field pl-10 w-full border"
            />
          ) : (
            <input
              type="text"
              placeholder="Search patients by name or admission number..."
              value={ipdSearchTerm}
              onChange={(e) => setIPDSearchTerm(e.target.value)}
              className="input-field pl-10 w-full border"
            />
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "quantification" ? (
        // QUANTIFICATION TAB - Patient-Grouped View
        <div>
          {loading && filteredPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500">Loading prescriptions...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">✓</div>
              <p className="text-xl text-gray-500">No pending prescriptions</p>
              <p className="text-gray-400 mt-2">All prescriptions have been quantified</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View - Hidden on mobile */}
              <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Prescriptions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Names</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((item) => (
                        <tr key={item.patient._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.patient.firstName} {item.patient.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.patient.patientId || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {item.prescriptions.length} {item.prescriptions.length === 1 ? 'prescription' : 'prescriptions'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {item.prescriptions.slice(0, 2).map((pres, idx) => (
                                <div key={idx} className="truncate max-w-xs">
                                  • {pres.medication}
                                </div>
                              ))}
                              {item.prescriptions.length > 2 && (
                                <div className="text-primary font-medium text-xs mt-1">
                                  +{item.prescriptions.length - 2} more prescriptions
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedPatient(item)}
                              className="btn-primary text-sm font-medium px-4 py-2 rounded-lg inline-block"
                            >
                              View All Prescriptions
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View - Hidden on desktop */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredPatients.map((item) => (
                  <div
                    key={item.patient._id}
                    onClick={() => setSelectedPatient(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.patient.firstName} {item.patient.lastName}
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {item.prescriptions.length} {item.prescriptions.length === 1 ? 'prescription' : 'prescriptions'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Patient ID: {item.patient.patientId || 'N/A'}
                    </p>
                    <div className="text-sm text-gray-500">
                      <p className="font-medium mb-1">Pending Prescriptions:</p>
                      <ul className="list-disc list-inside mt-1">
                        {item.prescriptions.slice(0, 3).map((pres, idx) => (
                          <li key={idx} className="truncate">{pres.medication}</li>
                        ))}
                        {item.prescriptions.length > 3 && (
                          <li className="text-primary font-medium">+{item.prescriptions.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                    <button className="mt-4 w-full btn-primary text-sm py-2">
                      View All Prescriptions
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : activeTab === "dispensing" ? (
        // DISPENSING TAB - Patient-Grouped View
        <div>
          {loading && filteredDispensingPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500">Loading prescriptions...</p>
            </div>
          ) : filteredDispensingPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-xl text-gray-500">No prescriptions ready for dispensing</p>
              <p className="text-gray-400 mt-2">
                Patients need to complete payment before medications can be dispensed
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ready Prescriptions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Names</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDispensingPatients.map((item) => {
                        const totalAmount = item.prescriptions.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
                        return (
                          <tr key={item.patient._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {item.patient.firstName} {item.patient.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {item.patient.patientId || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {item.prescriptions.length} {item.prescriptions.length === 1 ? 'prescription' : 'prescriptions'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">
                                {item.prescriptions.slice(0, 2).map((pres, idx) => (
                                  <div key={idx} className="truncate max-w-xs">
                                    • {pres.medication}
                                  </div>
                                ))}
                                {item.prescriptions.length > 2 && (
                                  <div className="text-primary font-medium text-xs mt-1">
                                    +{item.prescriptions.length - 2} more prescriptions
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-semibold text-green-600">
                                TZS {totalAmount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => setSelectedDispensingPatient(item)}
                                className="bg-green-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-green-700 inline-block"
                              >
                                View All Prescriptions
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredDispensingPatients.map((item) => {
                  const totalAmount = item.prescriptions.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
                  return (
                    <div
                      key={item.patient._id}
                      onClick={() => setSelectedDispensingPatient(item)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.patient.firstName} {item.patient.lastName}
                        </h3>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {item.prescriptions.length} {item.prescriptions.length === 1 ? 'prescription' : 'prescriptions'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Patient ID: {item.patient.patientId || 'N/A'}
                      </p>
                      <div className="text-sm text-gray-500 mb-3">
                        <p className="font-medium mb-1">Ready Prescriptions:</p>
                        <ul className="list-disc list-inside mt-1">
                          {item.prescriptions.slice(0, 3).map((pres, idx) => (
                            <li key={idx} className="truncate">{pres.medication}</li>
                          ))}
                          {item.prescriptions.length > 3 && (
                            <li className="text-primary font-medium">+{item.prescriptions.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="text-sm text-gray-500">Total Amount:</span>
                        <span className="text-base font-semibold text-green-600">
                          TZS {totalAmount.toFixed(2)}
                        </span>
                      </div>
                      <button className="mt-4 w-full bg-green-600 text-white text-sm py-2 rounded-lg" onClick={() => setSelectedDispensingPatient(item)}>
                        View All Prescriptions
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        // IPD MEDICATIONS TAB - Patient-Grouped View
        <div>
          {loading && filteredIPDPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <p className="text-gray-500">Loading IPD medications...</p>
            </div>
          ) : filteredIPDPatients.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏥</div>
              <p className="text-xl text-gray-500">No medications awaiting quantification</p>
              <p className="text-gray-400 mt-2">
                All IPD medications have been quantified and dispensed
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Medications</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Names</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredIPDPatients.map((item) => (
                        <tr key={item.patient._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.patient.firstName} {item.patient.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.admissionNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {item.ward?.name || 'N/A'} / {item.bed?.bedNumber || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                              {item.medications.length} {item.medications.length === 1 ? 'medication' : 'medications'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {item.medications.slice(0, 2).map((med, idx) => (
                                <div key={idx} className="truncate max-w-xs">
                                  • {med.medication}
                                </div>
                              ))}
                              {item.medications.length > 2 && (
                                <div className="text-primary font-medium text-xs mt-1">
                                  +{item.medications.length - 2} more medications
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedIPDPatient(item)}
                              className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 inline-block"
                            >
                              View All Medications
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredIPDPatients.map((item) => (
                  <div
                    key={item.patient._id}
                    onClick={() => setSelectedIPDPatient(item)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {item.patient.firstName} {item.patient.lastName}
                      </h3>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {item.medications.length} {item.medications.length === 1 ? 'medication' : 'medications'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Admission #: {item.admissionNumber || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      Ward/Bed: {item.ward?.name || 'N/A'} / {item.bed?.bedNumber || 'N/A'}
                    </p>
                    <div className="text-sm text-gray-500">
                      <p className="font-medium mb-1">Pending Medications:</p>
                      <ul className="list-disc list-inside mt-1">
                        {item.medications.slice(0, 3).map((med, idx) => (
                          <li key={idx} className="truncate">{med.medication}</li>
                        ))}
                        {item.medications.length > 3 && (
                          <li className="text-primary font-medium">+{item.medications.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                    <button className="mt-4 w-full bg-purple-600 text-white text-sm py-2 rounded-lg" onClick={() => setSelectedIPDPatient(item)}>
                      View All Medications
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {selectedForQuantify && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedForQuantify(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-6">Quantify Prescription</h2>

            {/* Prescription Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Patient</p>
                  <p className="font-semibold">
                    {selectedForQuantify.patient.firstName} {selectedForQuantify.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visit ID</p>
                  <p className="font-semibold">{selectedForQuantify.visit.visitId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Medication</p>
                  <p className="font-semibold">{selectedForQuantify.medication}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dosage</p>
                  <p className="font-semibold">{selectedForQuantify.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-semibold">{selectedForQuantify.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{selectedForQuantify.duration || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Stock Information */}
            {(() => {
              const medicine = getMedicineDetails(selectedForQuantify.medicineId);
              return medicine ? (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-3">Stock Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Available Stock</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {medicine.quantity || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unit Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        TZS {medicine.sellingPrice?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  {medicine.quantity === 0 && (
                    <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">
                      ⚠️ Out of stock
                    </div>
                  )}
                  {medicine.quantity > 0 && medicine.quantity < 10 && (
                    <div className="mt-3 p-2 bg-yellow-100 text-yellow-700 rounded">
                      ⚠️ Low stock warning
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <p className="text-red-700">⚠️ Medicine not found in inventory</p>
                </div>
              );
            })()}

            {/* Quantification Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Dispense *
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantifyData.quantifiedQuantity}
                  onChange={(e) =>
                    setQuantifyData({ ...quantifyData, quantifiedQuantity: e.target.value })
                  }
                  placeholder="Enter quantity"
                  className="w-full border rounded-lg p-3 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pharmacist Notes (Optional)
                </label>
                <textarea
                  value={quantifyData.notes}
                  onChange={(e) =>
                    setQuantifyData({ ...quantifyData, notes: e.target.value })
                  }
                  placeholder="Add any notes or comments..."
                  className="w-full border rounded-lg p-3"
                  rows="3"
                />
              </div>

              {/* Estimated Total */}
              {(() => {
                const medicine = getMedicineDetails(selectedForQuantify.medicineId);
                const qty = parseInt(quantifyData.quantifiedQuantity) || 0;
                const price = medicine?.sellingPrice || 0;
                const total = qty * price;

                return qty > 0 && price > 0 ? (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-green-900">Estimated Total:</p>
                      <p className="text-2xl font-bold text-green-700">
                        TZS {total.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      {qty} × TZS {price.toFixed(2)}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedForQuantify(null)}
                className="px-6 py-2 rounded-lg border hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleQuantify}
                disabled={
                  loading ||
                  !quantifyData.quantifiedQuantity ||
                  quantifyData.quantifiedQuantity <= 0 ||
                  !getMedicineDetails(selectedForQuantify.medicineId)
                }
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Quantify & Send to Billing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensing Modal */}
      {selectedForDispense && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedForDispense(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-6">Dispense Medication</h2>

            {/* Patient Info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold">
                    {selectedForDispense.patient.firstName} {selectedForDispense.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Visit ID</p>
                  <p className="font-semibold">{selectedForDispense.visit.visitId}</p>
                </div>
              </div>
            </div>

            {/* Prescription Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Prescription Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Medication</p>
                  <p className="font-semibold">{selectedForDispense.medication}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dosage</p>
                  <p className="font-semibold">{selectedForDispense.dosage}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-semibold">{selectedForDispense.frequency}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{selectedForDispense.duration || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Dispensing Summary */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-3">Dispensing Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Quantity</p>
                  <p className="text-2xl font-bold text-green-700">{selectedForDispense.quantifiedQuantity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unit Price</p>
                  <p className="text-2xl font-bold text-blue-700">TZS {(selectedForDispense.quantifiedPrice || 0).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-700">TZS {(selectedForDispense.totalPrice || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Stock Check */}
            {(() => {
              const medicine = getMedicineDetails(selectedForDispense.medicineId);
              return medicine ? (
                <div className="bg-yellow-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Current Stock</p>
                      <p className="text-xl font-bold">
                        {medicine.quantity || 0} units
                      </p>
                    </div>
                    {medicine.quantity < selectedForDispense.quantifiedQuantity && (
                      <div className="text-red-600 font-semibold">
                        ⚠️ Insufficient Stock
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}

            {/* Quantified By Info */}
            {selectedForDispense.quantifiedBy && (
              <div className="bg-gray-100 rounded-lg p-3 mb-6 text-sm">
                <p className="text-gray-600">
                  Quantified by:{" "}
                  <span className="font-semibold">
                    {selectedForDispense.quantifiedBy.firstName}{" "}
                    {selectedForDispense.quantifiedBy.lastName}
                  </span>
                  {" "}on{" "}
                  {new Date(selectedForDispense.quantifiedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedForDispense(null)}
                className="px-6 py-2 rounded-lg border hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={completeDispensing}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Dispensing..." : "Complete Dispensing"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IPD Dispensing Modal */}
      {selectedForIPDDispense && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[600px] max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setSelectedForIPDDispense(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-6">Dispense IPD Medication</h2>

            {/* Admission Info */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">Admission Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Admission #</p>
                  <p className="font-semibold">{selectedForIPDDispense.admissionNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient Name</p>
                  <p className="font-semibold">
                    {selectedForIPDDispense.patient.firstName} {selectedForIPDDispense.patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ward</p>
                  <p className="font-semibold">{selectedForIPDDispense.ward?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bed</p>
                  <p className="font-semibold">{selectedForIPDDispense.bed?.bedNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Medication Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Medication Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Medication</p>
                  <p className="font-semibold">{selectedForIPDDispense.medication}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dosage</p>
                  <p className="font-semibold">{selectedForIPDDispense.dosage || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="font-semibold">{selectedForIPDDispense.frequency || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Status</p>
                  <p className="font-semibold">{selectedForIPDDispense.status}</p>
                </div>
              </div>
            </div>

            {/* Stock Check */}
            {(() => {
              const medicine = medicines.find(med => med._id === selectedForIPDDispense.medicineId?._id || med._id === selectedForIPDDispense.medicineId);
              return medicine ? (
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Available Stock</p>
                      <p className="text-2xl font-bold text-blue-600">{medicine.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unit Price</p>
                      <p className="text-2xl font-bold text-green-600">
                        TZS {medicine.sellingPrice?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                  {medicine.quantity === 0 && (
                    <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">
                      ⚠️ Out of stock
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 rounded-lg p-4 mb-6">
                  <p className="text-red-700">⚠️ Medicine not found in inventory</p>
                </div>
              );
            })()}

            {/* Dispensing Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Dispense *
                </label>
                <input
                  type="number"
                  min="1"
                  value={ipdDispenseData.quantity}
                  onChange={(e) =>
                    setIpdDispenseData({ ...ipdDispenseData, quantity: e.target.value })
                  }
                  placeholder="Enter quantity"
                  className="w-full border rounded-lg p-3 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={ipdDispenseData.notes}
                  onChange={(e) =>
                    setIpdDispenseData({ ...ipdDispenseData, notes: e.target.value })
                  }
                  placeholder="Add any dispensing notes..."
                  className="w-full border rounded-lg p-3"
                  rows="3"
                />
              </div>

              {/* Estimated Total */}
              {(() => {
                const medicine = medicines.find(med => med._id === selectedForIPDDispense.medicineId?._id || med._id === selectedForIPDDispense.medicineId);
                const qty = parseInt(ipdDispenseData.quantity) || 0;
                const price = medicine?.sellingPrice || 0;
                const total = qty * price;

                return qty > 0 && price > 0 ? (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-green-900">Estimated Total:</p>
                      <p className="text-2xl font-bold text-green-700">
                        TZS {total.toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      {qty} × TZS {price.toFixed(2)} (will be added to patient invoice)
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedForIPDDispense(null)}
                className="px-6 py-2 rounded-lg border hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={completeIPDDispensing}
                disabled={loading || !ipdDispenseData.quantity || ipdDispenseData.quantity <= 0}
                className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Dispensing..." : "Dispense & Charge to Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensing Patient Modal */}
      {selectedDispensingPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {selectedDispensingPatient.patient.firstName} {selectedDispensingPatient.patient.lastName}
                  </h2>
                  <p className="text-green-100 text-sm">
                    Patient ID: {selectedDispensingPatient.patient.patientId || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDispensingPatient(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Badge */}
            <div className="px-6 py-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="text-green-900 font-semibold">
                  {selectedDispensingPatient.prescriptions.length} Ready {selectedDispensingPatient.prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
                </span>
                <span className="ml-auto text-green-800 font-bold text-sm">
                  Total: TZS {selectedDispensingPatient.prescriptions.reduce((sum, p) => sum + (p.totalPrice || 0), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage / Frequency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDispensingPatient.prescriptions.map((pres) => (
                        <tr key={pres._id} className="hover:bg-green-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{pres.medication}</div>
                                <div className="text-xs text-gray-500">{pres.visit?.visitId || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div>{pres.dosage || 'N/A'}</div>
                            <div className="text-xs text-gray-400">{pres.frequency || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {pres.quantifiedQuantity || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            TZS {(pres.quantifiedPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                            TZS {(pres.totalPrice || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedForDispense(pres);
                              }}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Dispense
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {selectedDispensingPatient.prescriptions.map((pres) => (
                  <div key={pres._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{pres.medication}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          Ready to Dispense
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-700">TZS {(pres.totalPrice || 0).toFixed(2)}</span>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quantity:</span>
                        <span className="font-medium">{pres.quantifiedQuantity || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Unit Price:</span>
                        <span className="font-medium">TZS {(pres.quantifiedPrice || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dosage:</span>
                        <span className="font-medium">{pres.dosage || 'N/A'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedForDispense(pres)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Dispense
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedDispensingPatient(null)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IPD Patient Medications Modal */}
      {selectedIPDPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {selectedIPDPatient.patient.firstName} {selectedIPDPatient.patient.lastName}
                  </h2>
                  <p className="text-purple-100 text-sm">
                    Admission #: {selectedIPDPatient.admissionNumber || 'N/A'} &nbsp;|&nbsp; Ward: {selectedIPDPatient.ward?.name || 'N/A'} &nbsp;|&nbsp; Bed: {selectedIPDPatient.bed?.bedNumber || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIPDPatient(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Badge */}
            <div className="px-6 py-3 bg-purple-50 border-b border-purple-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-purple-900 font-semibold">
                  {selectedIPDPatient.medications.length} Pending {selectedIPDPatient.medications.length === 1 ? 'Medication' : 'Medications'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedIPDPatient.medications.map((med) => (
                        <tr key={med._id} className="hover:bg-purple-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{med.medication}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {med.dosage || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {med.frequency || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {med.prescribedBy
                              ? `Dr. ${med.prescribedBy.firstName} ${med.prescribedBy.lastName}`
                              : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-400"></span>
                              {med.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedForIPDDispense(med);
                                setIpdDispenseData({ quantity: "", notes: "" });
                              }}
                              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm text-sm"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Dispense
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {selectedIPDPatient.medications.map((med) => (
                  <div key={med._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{med.medication}</h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                          {med.status}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dosage:</span>
                        <span className="font-medium">{med.dosage || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Frequency:</span>
                        <span className="font-medium">{med.frequency || 'N/A'}</span>
                      </div>
                      {med.prescribedBy && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Ordered By:</span>
                          <span className="font-medium">Dr. {med.prescribedBy.firstName} {med.prescribedBy.lastName}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedForIPDDispense(med);
                        setIpdDispenseData({ quantity: "", notes: "" });
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Dispense
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedIPDPatient(null)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Prescriptions Modal (Quantification Tab) */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">
                    {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Patient ID: {selectedPatient.patient.patientId || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatient(null)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Prescription Count Badge */}
            <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-blue-900 font-semibold">
                  {selectedPatient.prescriptions.length} Pending {selectedPatient.prescriptions.length === 1 ? 'Prescription' : 'Prescriptions'}
                </span>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Medicine
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ordered On
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prescribed By
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
                      {selectedPatient.prescriptions.map((pres) => (
                        <tr key={pres._id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {pres.medication}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(pres.sentToPharmacyAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {pres.duration}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            Dr. {pres.prescribedBy.firstName} {pres.prescribedBy.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <span className="w-2 h-2 mr-1.5 rounded-full bg-yellow-400"></span>
                              {pres.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleSelectForQuantify(pres)}
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Quantify
                              </button>
                              {user?.role === 'pharmacist' && (
                                <button
                                  onClick={() => handleDeletePrescription(pres._id)}
                                  disabled={loading}
                                  className="inline-flex items-center px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete prescription"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {selectedPatient.prescriptions.map((pres) => (
                  <div key={pres._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{pres.medication}</h3>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                            {pres.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ordered On:</span>
                        <span className="text-gray-900 font-medium">
                          {new Date(pres.sentToPharmacyAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="text-gray-900 font-medium">{pres.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prescribed By:</span>
                        <span className="text-gray-900 font-medium">
                          Dr. {pres.prescribedBy.firstName} {pres.prescribedBy.lastName}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSelectForQuantify(pres)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Quantify
                      </button>
                      {user?.role === 'pharmacist' && (
                        <button
                          onClick={() => handleDeletePrescription(pres._id)}
                          disabled={loading}
                          className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete prescription"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedPatient(null)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
