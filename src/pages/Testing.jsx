import { useState, useMemo, useEffect } from "react";
import api from "../utils/api.js";
import { Search, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Dispensing() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("quantification"); // "quantification", "dispensing", or "ipd-medications"
  const [filters, setFilters] = useState({ search: "", patientId: "", status: "" });
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
  const filteredPendingPrescriptions = useMemo(() => {
    return pendingPrescriptions.filter((p) => {
      const patientName = p.patient
        ? `${p.patient.firstName || ""} ${p.patient.lastName || ""}`
        : "";
      
      const matchesSearch =
        filters.search.trim() === "" ||
        patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.medication && p.medication.toLowerCase().includes(filters.search.toLowerCase())) ||
        (p.visit.visitId && p.visit.visitId.toLowerCase().includes(filters.search.toLowerCase()));

      return matchesSearch;
    });
  }, [filters, pendingPrescriptions]);

  const filteredReadyPrescriptions = useMemo(() => {
    return readyPrescriptions.filter((p) => {
      const patientName = p.patient
        ? `${p.patient.firstName || ""} ${p.patient.lastName || ""}`
        : "";
      
      const matchesSearch =
        filters.search.trim() === "" ||
        patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (p.medication && p.medication.toLowerCase().includes(filters.search.toLowerCase())) ||
        (p.visit.visitId && p.visit.visitId.toLowerCase().includes(filters.search.toLowerCase()));

      return matchesSearch;
    });
  }, [filters, readyPrescriptions]);

  const filteredIPDMedications = useMemo(() => {
    return ipdMedications.filter((med) => {
      const patientName = med.patient
        ? `${med.patient.firstName || ""} ${med.patient.lastName || ""}`
        : "";
      
      const matchesSearch =
        filters.search.trim() === "" ||
        patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        (med.medication && med.medication.toLowerCase().includes(filters.search.toLowerCase())) ||
        (med.admissionNumber && med.admissionNumber.toLowerCase().includes(filters.search.toLowerCase()));

      return matchesSearch;
    });
  }, [filters, ipdMedications]);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Quantification handlers
  const handleSelectForQuantify = (prescription) => {
    setSelectedForQuantify(prescription);
    setQuantifyData({
      quantifiedQuantity: 1,
      notes: ""
    });
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
  const handleSelectForDispense = (prescription) => {
    setSelectedForDispense(prescription);
  };

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

  // Patient list view
  if (!selectedPatient) {
    return (
      <div className="p-4 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-6">Prescriptions - Patients</h1>
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
              />
          </div>
        </div>

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
        {filteredPatients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No patients with pending prescriptions found.</p>
          </div>
        )}
      </div>
    );
  }

  // Patient's All Precriptions View
  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setSelectedPatient(null)}
          className="text-black rounded hover:bg-gray-200"
        >
          <ArrowLeft className="h-6 w-6 mr-2" />
        </button>
        Back to Patients
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {selectedPatient.patient.firstName} {selectedPatient.patient.lastName}
        </h2>
        <p className="text-gray-600">
          Patient ID: {selectedPatient.patient.patientId || 'N/A'}
        </p>
        <p className="text-gray-600">
          Total Pending Prescriptions: <span className="font-semibold text-primary">{selectedPatient.prescriptions.length}</span>
        </p>
      </div>

      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Medicine Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ordered On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prescribed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedPatient.prescriptions.map((pres) => (
                <tr key={pres._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {pres.medication}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {new Date(pres.sentToPharmacyAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {pres.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {`Dr. ${pres.prescribedBy.firstName} ${pres.prescribedBy.lastName}`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-sm rounded-full bg-yellow-100 text-yellow-800">
                      {pres.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSelectForQuantify(pres)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Quantify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* {selectedPatient.precriptions.length === 0 && (
            <p className="text-gray-500 text-center py-8">No prescriptions found.</p>
          )} */}
        </div>
      </div>
    </div>
  );
}
