import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from "../utils/api.js";
import toast from "react-hot-toast";

const CATEGORIES = [
  "BRITAM",
  "NSSF",
  "NHIF",
  "ASSEMBLE",
  "Pharmacy",
  "HospitalShop",
];

const DISPLAY = {
  BRITAM: "BRITAM",
  NSSF: "NSSF",
  NHIF: "NHIF",
  ASSEMBLE: "ASSEMBLE",
  Pharmacy: "Pharmacy",
  HospitalShop: "Hospital Shop",
};

export default function ItemPricing() {
  const [medicines, setMedicines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadData, setUploadData] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchMedicines = async () => {
    try {
      const response = await api.get("/stock");
      setMedicines(response.data.data);
    } catch (error) {
      toast.error("Failed to load medicines.");
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Download template Excel file
  const downloadTemplate = () => {
    const templateData = [
      {
        'Medicine Name': 'Example Medicine',
        'Generic Name': 'Generic Example',
        'Type': 'Tablet',
        'Strength': '500mg',
        'Category': 'Analgesic',
        'Manufacturer': 'Example Pharma',
        'Base Selling Price': 5000,
        'Reorder Level': 10,
        'BRITAM': 4500,
        'NSSF': 4500,
        'NHIF': 4500,
        'ASSEMBLE': 4500,
        'Pharmacy': 5000,
        'Hospital Shop': 5000,
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicine Pricing Template");
    XLSX.writeFile(wb, "medicine_pricing_template.xlsx");
    toast.success("Template downloaded!");
  };

  // Download current medicines as Excel
  const downloadCurrentData = () => {
    if (medicines.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = medicines.map(item => ({
      'Medicine Name': item.name,
      'Generic Name': item.genericName || '',
      'Type': item.type,
      'Strength': item.strength || '',
      'Category': item.category || '',
      'Manufacturer': item.manufacturer || '',
      'Base Selling Price': item.sellingPrice || 0,
      'Reorder Level': item.reorderLevel || 10,
      'BRITAM': item.prices?.BRITAM || 0,
      'NSSF': item.prices?.NSSF || 0,
      'NHIF': item.prices?.NHIF || 0,
      'ASSEMBLE': item.prices?.ASSEMBLE || 0,
      'Pharmacy': item.prices?.Pharmacy || 0,
      'Hospital Shop': item.prices?.HospitalShop || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Current Medicines");
    XLSX.writeFile(wb, `medicines_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Data exported!");
  };

  // Handle Excel file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Validate and transform data
        const transformedData = data.map((row, index) => {
          if (!row['Medicine Name'] || !row['Type'] || !row['Base Selling Price']) {
            throw new Error(`Row ${index + 2}: Medicine Name, Type, and Base Selling Price are required`);
          }

          return {
            name: String(row['Medicine Name']).trim(),
            genericName: row['Generic Name'] ? String(row['Generic Name']).trim() : '',
            type: String(row['Type']).trim(),
            strength: row['Strength'] ? String(row['Strength']).trim() : '',
            category: row['Category'] ? String(row['Category']).trim() : 'Other',
            manufacturer: row['Manufacturer'] ? String(row['Manufacturer']).trim() : '',
            sellingPrice: parseFloat(row['Base Selling Price']) || 0,
            reorderLevel: parseInt(row['Reorder Level']) || 10,
            prices: {
              BRITAM: parseFloat(row['BRITAM']) || 0,
              NSSF: parseFloat(row['NSSF']) || 0,
              NHIF: parseFloat(row['NHIF']) || 0,
              ASSEMBLE: parseFloat(row['ASSEMBLE']) || 0,
              Pharmacy: parseFloat(row['Pharmacy']) || 0,
              HospitalShop: parseFloat(row['Hospital Shop']) || 0,
            }
          };
        });

        setUploadData(transformedData);
        setShowUploadModal(true);
        toast.success(`${transformedData.length} items loaded. Review before importing.`);
      } catch (error) {
        toast.error(error.message || "Failed to parse Excel file");
        console.error(error);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  // Import validated data
  const handleImport = async () => {
    if (uploadData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const item of uploadData) {
      try {
        // Check if medicine already exists
        const existing = medicines.find(m => 
          m.name.toLowerCase() === item.name.toLowerCase() &&
          m.type.toLowerCase() === item.type.toLowerCase()
        );

        if (existing) {
          // Update existing medicine
          await api.put(`/stock/${existing._id}`, item);
        } else {
          // Create new medicine
          await api.post("/stock", item);
        }
        successCount++;
      } catch (error) {
        console.error(`Failed to import ${item.name}:`, error);
        errorCount++;
      }
    }

    setUploading(false);
    setShowUploadModal(false);
    setUploadData([]);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} items`);
      fetchMedicines();
    }
    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} items`);
    }
  };

  const openAddModal = () => {
    setForm({
      name: "",
      genericName: "",
      type: "",
      strength: "",
      category: "",
      manufacturer: "",
      sellingPrice: "",
      reorderLevel: 10,
      prices: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: "" }), {}),
    });
    setEditId(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name,
      genericName: item.genericName || "",
      type: item.type,
      strength: item.strength || "",
      category: item.category || "",
      manufacturer: item.manufacturer || "",
      sellingPrice: item.sellingPrice || "",
      reorderLevel: item.reorderLevel || 10,
      prices: item.prices || CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat]: "" }), {}),
    });
    setEditId(item._id);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceChange = (category, value) => {
    setForm((prev) => ({
      ...prev,
      prices: {
        ...prev.prices,
        [category]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!form.name || form.name.trim() === "") {
      toast.error("Medicine name is required");
      return;
    }

    if (!form.type) {
      toast.error("Medicine type is required");
      return;
    }

    if (!form.sellingPrice || parseFloat(form.sellingPrice) <= 0) {
      toast.error("Valid selling price is required");
      return;
    }

    const priceData = CATEGORIES.reduce((acc, cat) => {
      const val = parseFloat(form.prices[cat]);
      acc[cat] = Number.isFinite(val) ? val : 0;
      return acc;
    }, {});

    const medicineData = {
      name: form.name.trim(),
      genericName: form.genericName?.trim(),
      type: form.type,
      strength: form.strength?.trim(),
      category: form.category || 'Other',
      manufacturer: form.manufacturer?.trim(),
      sellingPrice: parseFloat(form.sellingPrice),
      reorderLevel: parseInt(form.reorderLevel) || 10,
      prices: priceData,
    };

    try {
      setLoading(true);
      if (editId) {
        await api.put(`/medicines/${editId}`, medicineData);
        toast.success("Medicine updated successfully");
      } else {
        await api.post("/medicines", medicineData);
        toast.success("Medicine added successfully");
      }
      fetchMedicines();
      setShowModal(false);
      setEditId(null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save medicine.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete ${name}? This will fail if there are existing batches.`)) {
      try {
        await api.delete(`/medicines/${id}`);
        toast.success(`${name} deleted`);
        fetchMedicines();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete medicine.");
        console.error(error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800">Medicine Pricing</h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Manage medicine catalog and insurance prices</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={downloadTemplate}
              className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-[10px] sm:text-xs md:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <button
              onClick={downloadCurrentData}
              className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-[10px] sm:text-xs md:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </button>
            <label className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors cursor-pointer text-[10px] sm:text-xs md:text-sm">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Upload Excel</span>
              <span className="sm:hidden">Upload</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={openAddModal}
              className="flex items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-[10px] sm:text-xs md:text-sm"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Add Medicine
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-2 sm:p-4 md:p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Medicine</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Base Price</th>
                {CATEGORIES.map((cat) => (
                  <th key={cat} className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                    {DISPLAY[cat]}
                  </th>
                ))}
                <th className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {medicines.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + CATEGORIES.length + 1}
                    className="p-4 text-center text-gray-500 text-[10px] sm:text-xs md:text-sm"
                  >
                    No medicines yet. Add your first medicine to get started.
                  </td>
                </tr>
              )}

              {medicines.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
                    <div className="text-[11px] sm:text-xs md:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-[150px] md:max-w-none">
                      {item.name}
                    </div>
                    {item.strength && (
                      <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 truncate">{item.strength}</div>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-[11px] sm:text-xs md:text-sm text-gray-600">{item.type}</td>
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-[11px] sm:text-xs md:text-sm font-medium text-gray-900">
                    {item.sellingPrice?.toLocaleString()}
                  </td>
                  {CATEGORIES.map((cat) => (
                    <td key={cat} className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-right text-[11px] sm:text-xs md:text-sm text-gray-600">
                      {Number.isFinite(item.prices?.[cat])
                        ? item.prices[cat].toLocaleString()
                        : '-'}
                    </td>
                  ))}
                  <td className="px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 text-center">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-center">
                      <button
                        onClick={() => openEditModal(item)}
                        className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-blue-600 text-white text-[10px] sm:text-xs rounded-lg hover:bg-blue-700"
                      >
                        <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        className="inline-flex items-center justify-center px-2 sm:px-3 py-1 bg-red-600 text-white text-[10px] sm:text-xs rounded-lg hover:bg-red-700"
                      >
                        <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 sm:mr-1" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upload Preview Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4">Review Import Data</h2>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-3 sm:mb-4">
                {uploadData.length} items ready to import. Existing medicines will be updated.
              </p>

              <div className="overflow-x-auto mb-3 sm:mb-4 max-h-80 sm:max-h-96">
                <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500">Medicine</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs font-medium text-gray-500">Type</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500">Base Price</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500">BRITAM</th>
                      <th className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[10px] sm:text-xs font-medium text-gray-500">NHIF</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadData.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs">{item.name}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs">{item.type}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs">{item.sellingPrice}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs">{item.prices.BRITAM}</td>
                        <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-right text-[11px] sm:text-xs">{item.prices.NHIF}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadData([]);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg hover:bg-gray-50 text-[10px] sm:text-xs md:text-sm"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={uploading}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-[10px] sm:text-xs md:text-sm"
                >
                  {uploading ? 'Importing...' : `Import ${uploadData.length} Items`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4">
                {editId ? "Edit Medicine" : "Add Medicine"}
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Medicine Name *
                    </label>
                    <input
                      name="name"
                      value={form.name || ""}
                      onChange={handleChange}
                      placeholder="e.g., Paracetamol"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Generic Name
                    </label>
                    <input
                      name="genericName"
                      value={form.genericName || ""}
                      onChange={handleChange}
                      placeholder="e.g., Acetaminophen"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={form.type || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Strength
                    </label>
                    <input
                      name="strength"
                      value={form.strength || ""}
                      onChange={handleChange}
                      placeholder="e.g., 500mg"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category || ""}
                      onChange={handleChange}
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    >
                      <option value="">Select category</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antiviral">Antiviral</option>
                      <option value="Antifungal">Antifungal</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Diabetic">Diabetic</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      name="manufacturer"
                      value={form.manufacturer || ""}
                      onChange={handleChange}
                      placeholder="e.g., Pfizer"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Base Selling Price (TZS) *
                    </label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={form.sellingPrice || ""}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      name="reorderLevel"
                      value={form.reorderLevel || ""}
                      onChange={handleChange}
                      placeholder="10"
                      className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                      min="0"
                    />
                  </div>
                </div>

                <div className="border-t pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 sm:mb-3">Insurance Prices</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {CATEGORIES.map((cat) => (
                      <div key={cat}>
                        <label className="block text-[10px] sm:text-xs md:text-sm text-gray-700 mb-1">
                          {DISPLAY[cat]}
                        </label>
                        <input
                          type="number"
                          value={form.prices?.[cat] || ""}
                          onChange={(e) => handlePriceChange(cat, e.target.value)}
                          placeholder="0"
                          className="w-full border rounded-lg p-1.5 sm:p-2 text-[11px] sm:text-xs md:text-sm"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg hover:bg-gray-50 text-[10px] sm:text-xs md:text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-[10px] sm:text-xs md:text-sm"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}