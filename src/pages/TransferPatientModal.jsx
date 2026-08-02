import { useState, useEffect } from "react";
import { X, ArrowRight, AlertCircle, Info } from "lucide-react";
import api from "../utils/api.js";
import { toast } from "react-hot-toast";

export default function TransferPatientModal({ record, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [nurses, setNurses] = useState([]);
  const [formData, setFormData] = useState({
    newWard: "",
    newBed: "",
    transferReason: "",
    assignedNurse: "",
    notes: ""
  });

  useEffect(() => {
    fetchWards();
    fetchNurses();
  }, []);

  useEffect(() => {
    if (formData.newWard) {
      fetchAvailableBeds(formData.newWard);
    } else {
      setBeds([]);
    }
  }, [formData.newWard]);

  const fetchWards = async () => {
    try {
      const response = await api.get('/wards?status=active');
      setWards(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch wards", error);
      toast.error("Failed to load wards");
    }
  };

  const fetchAvailableBeds = async (wardId) => {
    try {
      const response = await api.get(`/wards/${wardId}`);
      const wardData = response.data.data;
      
      // Filter only available beds
      const availableBeds = wardData.beds?.filter(bed => bed.status === 'available') || [];
      setBeds(availableBeds);
      
      if (availableBeds.length === 0) {
        toast.error("No available beds in selected ward");
      }
    } catch (error) {
      console.error("Failed to fetch beds", error);
      toast.error("Failed to load beds");
    }
  };

  const fetchNurses = async () => {
    try {
      const response = await api.get('/nurses');
      setNurses(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch nurses", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset bed selection if ward changes
    if (name === "newWard") {
      setFormData(prev => ({ ...prev, newBed: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newWard || !formData.newBed || !formData.transferReason) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(`/ipd-records/${record._id}/transfer`, formData);

      toast.success("Patient transferred successfully");
      onSuccess(response.data.data.record);
      onClose();
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error.response?.data?.message || "Failed to transfer patient");
    } finally {
      setLoading(false);
    }
  };

  const selectedWard = wards.find(w => w._id === formData.newWard);
  const selectedBed = beds.find(b => b._id === formData.newBed);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <ArrowRight className="w-6 h-6" />
              Transfer Patient
            </h2>
            <p className="text-blue-100 mt-1">
              {record.patient?.firstName} {record.patient?.lastName} - {record.patient?.patientId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Current Location */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
          <div className="flex items-center gap-2 text-blue-900 font-semibold mb-2">
            <Info className="w-5 h-5" />
            Current Location
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Ward</p>
              <p className="font-semibold text-gray-900">
                {record.ward?.name} ({record.ward?.wardNumber})
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bed</p>
              <p className="font-semibold text-gray-900">
                Bed {record.bed?.bedNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {/* New Ward Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Ward *
              </label>
              <select
                name="newWard"
                value={formData.newWard}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Select ward...</option>
                {wards.map(ward => (
                  <option key={ward._id} value={ward._id}>
                    {ward.name} ({ward.wardNumber}) - {ward.type.toUpperCase()} - Floor {ward.floor}
                    {' - '}Available: {ward.availableBeds || 0}/{ward.capacity}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward Info */}
            {selectedWard && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ward Type</p>
                    <p className="font-semibold text-gray-900 uppercase">
                      {selectedWard.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Floor</p>
                    <p className="font-semibold text-gray-900">
                      Floor {selectedWard.floor}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Capacity</p>
                    <p className="font-semibold text-gray-900">
                      {selectedWard.capacity} beds
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Available Beds</p>
                    <p className={`font-semibold ${
                      selectedWard.availableBeds > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedWard.availableBeds || 0}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bed Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Bed *
              </label>
              <select
                name="newBed"
                value={formData.newBed}
                onChange={handleChange}
                required
                disabled={!formData.newWard || beds.length === 0}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!formData.newWard 
                    ? "Select ward first..." 
                    : beds.length === 0 
                    ? "No available beds" 
                    : "Select bed..."}
                </option>
                {beds.map(bed => (
                  <option key={bed._id} value={bed._id}>
                    Bed {bed.bedNumber} - {bed.type}
                    {bed.features && bed.features.length > 0 && 
                      ` (${bed.features.join(', ')})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Bed Info */}
            {selectedBed && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Bed Number</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBed.bedNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Bed Type</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {selectedBed.type}
                    </p>
                  </div>
                  {selectedBed.features && selectedBed.features.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-gray-600">Features</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedBed.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transfer Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transfer Reason *
              </label>
              <select
                name="transferReason"
                value={formData.transferReason}
                onChange={handleChange}
                required
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">Select reason...</option>
                <option value="Medical necessity">Medical necessity</option>
                <option value="Upgraded care">Upgraded care (ICU/CCU)</option>
                <option value="Downgraded care">Downgraded care (stable)</option>
                <option value="Bed availability">Bed availability</option>
                <option value="Patient request">Patient request</option>
                <option value="Specialized care">Specialized care required</option>
                <option value="Isolation required">Isolation required</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Assigned Nurse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Nurse (Optional)
              </label>
              <select
                name="assignedNurse"
                value={formData.assignedNurse}
                onChange={handleChange}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="">No change</option>
                {nurses.map(nurse => (
                  <option key={nurse._id} value={nurse._id}>
                    {nurse.firstName} {nurse.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional information about the transfer..."
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
            </div>

            {/* Warning for ICU/CCU */}
            {selectedWard && (selectedWard.type === 'icu' || selectedWard.type === 'ccu') && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900">Critical Care Ward</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Patient status will be automatically updated to &quot;Critical&quot; when transferred to {selectedWard.type.toUpperCase()}.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.newWard || !formData.newBed || !formData.transferReason}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  Transfer Patient
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}