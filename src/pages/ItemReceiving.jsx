import { useState, useEffect } from "react";
import api from "../utils/api.js";
import { toast } from "react-hot-toast";
import { Package, Plus, X, CheckCircle, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ItemReceiving() {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showPOModal, setShowPOModal] = useState(false);
  const [newPO, setNewPO] = useState({ 
    number: "", 
    date: "", 
    supplier: "",
    supplierContact: "",
    supplierEmail: "",
    supplierPhone: ""
  });
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    purchaseOrder: "",
    date: "",
    medicine: "",
    genericName: "",
    type: "",
    strength: "",
    expiry: "",
    qty: "",
    price: "",
    sellingPrice: "",
    batchNumber: "",
    manufacturer: "",
    category: "",
    receiveTo: "MAIN STORE",
    description: "",
  });

  const [preview, setPreview] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedData, setUploadedData] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/item-receiving/purchase-orders');
      const poData = res.data?.data?.purchaseOrders || [];
      setPurchaseOrders(Array.isArray(poData) ? poData : []);
    } catch (error) {
      console.error("Failed to fetch purchase orders", error);
      toast.error("Failed to load purchase orders");
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "purchaseOrder") {
      const po = purchaseOrders.find((p) => p.poNumber === value);
      if (po) {
        setForm((prev) => ({ 
          ...prev, 
          date: new Date(po.createdAt).toISOString().split('T')[0] 
        }));
      }
    }

    // Auto-calculate selling price (30% markup)
    if (name === "price" && value) {
      const markup = parseFloat(value) * 1.3;
      setForm((prev) => ({ 
        ...prev, 
        sellingPrice: markup.toFixed(2) 
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // Validation
    if (!form.purchaseOrder || !form.medicine || !form.type || !form.qty || !form.price || !form.expiry) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setPreview(form);
  };

  const confirmSave = async () => {
    try {
      await api.post("/item-receiving", preview);
      toast.success(`Medicine ${preview.medicine} received successfully!`);

      setPreview(null);
      setForm({
        purchaseOrder: "",
        date: "",
        medicine: "",
        genericName: "",
        type: "",
        strength: "",
        expiry: "",
        qty: "",
        price: "",
        sellingPrice: "",
        batchNumber: "",
        manufacturer: "",
        category: "",
        receiveTo: "MAIN STORE",
        description: "",
      });

      fetchPurchaseOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to receive item");
      console.error(error);
    }
  };

  const addPurchaseOrder = async () => {
    if (!newPO.number || !newPO.date || !newPO.supplier) {
      toast.error("Please fill in PO number, date, and supplier name");
      return;
    }

    try {
      await api.post("/item-receiving/purchase-orders", newPO);
      fetchPurchaseOrders();
      setNewPO({ 
        number: "", 
        date: "",
        supplier: "",
        supplierContact: "",
        supplierEmail: "",
        supplierPhone: ""
      });
      setShowPOModal(false);
      toast.success("Purchase order added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add purchase order");
      console.error(error);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Purchase Order": "PO-2025-001",
        "Medicine Name": "Amoxicillin",
        "Generic Name": "Amoxicillin trihydrate",
        "Type": "Capsule",
        "Strength": "500mg",
        "Category": "Antibiotic",
        "Manufacturer": "Pfizer",
        "Batch Number": "BATCH001",
        "Expiry Date": "2026-12-31",
        "Quantity": "100",
        "Buying Price": "500",
        "Selling Price": "650",
        "Receive To": "MAIN STORE",
        "Description": "Sample medicine entry"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Medicine Items");

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 15 }, { wch: 30 }
    ];

    XLSX.writeFile(wb, "medicine_receiving_template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error("Excel file is empty");
          return;
        }

        // Transform data to match form structure
        const transformedData = jsonData.map((row, index) => ({
          purchaseOrder: row["Purchase Order"] || "",
          medicine: row["Medicine Name"] || "",
          genericName: row["Generic Name"] || "",
          type: row["Type"] || "",
          strength: row["Strength"] || "",
          category: row["Category"] || "",
          manufacturer: row["Manufacturer"] || "",
          batchNumber: row["Batch Number"] || "",
          expiry: row["Expiry Date"] ? formatExcelDate(row["Expiry Date"]) : "",
          qty: row["Quantity"] ? String(row["Quantity"]) : "",
          price: row["Buying Price"] ? String(row["Buying Price"]) : "",
          sellingPrice: row["Selling Price"] ? String(row["Selling Price"]) : "",
          receiveTo: row["Receive To"] || "MAIN STORE",
          description: row["Description"] || "",
          rowIndex: index + 1
        }));

        setUploadedData(transformedData);
        setShowUploadModal(true);
        toast.success(`${transformedData.length} items loaded from Excel`);
      } catch (error) {
        console.error("Error reading Excel file:", error);
        toast.error("Failed to read Excel file. Please check the format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const formatExcelDate = (excelDate) => {
    // Handle Excel date serial number or string date
    if (typeof excelDate === 'number') {
      const date = new Date((excelDate - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    // If it's already a string, try to parse it
    const date = new Date(excelDate);
    return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
  };

  const uploadBulkItems = async () => {
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const item of uploadedData) {
      try {
        // Validate required fields
        if (!item.purchaseOrder || !item.medicine || !item.type || !item.qty || !item.price || !item.expiry) {
          errors.push(`Row ${item.rowIndex}: Missing required fields`);
          errorCount++;
          continue;
        }

        await api.post("/item-receiving", item);
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push(`Row ${item.rowIndex}: ${error.response?.data?.message || "Failed to save"}`);
      }
    }

    setUploading(false);
    setShowUploadModal(false);
    setUploadedData([]);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} items`);
      fetchPurchaseOrders();
    }

    if (errorCount > 0) {
      toast.error(`Failed to import ${errorCount} items. Check console for details.`);
      console.error("Import errors:", errors);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <Package className="mr-3" size={32} />
              Item Receiving
            </h1>
            <p className="text-gray-600 mt-1">Receive and manage pharmacy inventory</p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download size={20} />
              <span>Download Template</span>
            </button>
            <label className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
              <Upload size={20} />
              <span>Upload Excel</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Receiving Form */}
        {!preview && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Record New Supply</h2>
            <form className="space-y-6" onSubmit={handleSave}>
              {/* PO and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Order Number *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      name="purchaseOrder"
                      value={form.purchaseOrder}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select purchase order</option>
                      {purchaseOrders.map((po) => (
                        <option key={po._id} value={po.poNumber}>
                          {po.poNumber} - {po.supplier.name} ({po.status})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowPOModal(true)}
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Receiving Date
                  </label>
                  <input
                    type="text"
                    name="date"
                    value={form.date}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100"
                  />
                </div>
              </div>

              {/* Medicine Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Medicine Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      name="medicine"
                      value={form.medicine}
                      onChange={handleChange}
                      placeholder="e.g., Amoxicillin"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      name="genericName"
                      value={form.genericName}
                      onChange={handleChange}
                      placeholder="e.g., Amoxicillin trihydrate"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="Syrup">Syrup</option>
                      <option value="Injection">Injection</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Cream">Cream</option>
                      <option value="Drops">Drops</option>
                      <option value="Inhaler">Inhaler</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strength
                    </label>
                    <input
                      type="text"
                      name="strength"
                      value={form.strength}
                      onChange={handleChange}
                      placeholder="e.g., 500mg, 10ml"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Analgesic">Analgesic</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Antifungal">Antifungal</option>
                      <option value="Antihypertension">Antihypertension</option>
                      <option value="Antimalaria">Antimalaria</option>
                      <option value="Antiviral">Antiviral</option>
                      <option value="Antiworms">Antiworms</option>
                      <option value="Cardiovascular">Cardiovascular</option>
                      <option value="Fluid">Fluid</option>
                      <option value="Diabetic">Diabetic</option>
                      <option value="Respiratory">Respiratory</option>
                      <option value="Vitamin Drug">Vitamin Drug</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={form.manufacturer}
                      onChange={handleChange}
                      placeholder="e.g., Pfizer"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Batch Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={form.batchNumber}
                      onChange={handleChange}
                      placeholder="Auto-generated if left empty"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="qty"
                      value={form.qty}
                      onChange={handleChange}
                      placeholder="Enter quantity"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buying Price (per unit) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Enter buying price"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (per unit)
                    </label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={form.sellingPrice}
                      onChange={handleChange}
                      placeholder="Auto-calculated with 30% markup"
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for automatic 30% markup</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receive To
                    </label>
                    <input
                      type="text"
                      name="receiveTo"
                      value={form.receiveTo}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description / Notes
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional information about this medicine..."
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Preview</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
              <CheckCircle className="mr-2 text-green-600" size={24} />
              Preview Supply
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Purchase Order:</span>
                  <span className="ml-2 text-gray-900">{preview.purchaseOrder}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">{preview.date}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Medicine:</span>
                  <span className="ml-2 text-gray-900">{preview.medicine}</span>
                </div>
                {preview.genericName && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-700">Generic Name:</span>
                    <span className="ml-2 text-gray-900">{preview.genericName}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Type:</span>
                  <span className="ml-2 text-gray-900">{preview.type}</span>
                </div>
                {preview.strength && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-700">Strength:</span>
                    <span className="ml-2 text-gray-900">{preview.strength}</span>
                  </div>
                )}
                {preview.manufacturer && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-700">Manufacturer:</span>
                    <span className="ml-2 text-gray-900">{preview.manufacturer}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {preview.category && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-900">{preview.category}</span>
                  </div>
                )}
                {preview.batchNumber && (
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="font-semibold text-gray-700">Batch Number:</span>
                    <span className="ml-2 text-gray-900">{preview.batchNumber}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Expiry Date:</span>
                  <span className="ml-2 text-gray-900">{preview.expiry}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Quantity:</span>
                  <span className="ml-2 text-gray-900">{preview.qty} units</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Buying Price:</span>
                  <span className="ml-2 text-gray-900">{preview.price} TZS per unit</span>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <span className="font-semibold text-gray-700">Selling Price:</span>
                  <span className="ml-2 text-gray-900">{preview.sellingPrice} TZS per unit</span>
                </div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <span className="font-semibold text-blue-700">Total Cost:</span>
                  <span className="ml-2 text-blue-900 font-bold">
                    {(parseFloat(preview.price) * parseInt(preview.qty)).toFixed(2)} TZS
                  </span>
                </div>
              </div>
            </div>

            {preview.description && (
              <div className="mt-4 bg-gray-50 p-3 rounded">
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="ml-2 text-gray-900 mt-1">{preview.description}</p>
              </div>
            )}

            <div className="mt-6 flex space-x-3">
              <button
                onClick={confirmSave}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <CheckCircle size={20} />
                <span>Confirm & Save</span>
              </button>
              <button
                onClick={() => setPreview(null)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Review Imported Items</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                <div className="text-sm text-gray-600 mb-3">
                  Found {uploadedData.length} items. Review and confirm to import.
                </div>
                
                <div className="space-y-3">
                  {uploadedData.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">{item.medicine || "No name"}</h3>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Row {item.rowIndex}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium">PO:</span> {item.purchaseOrder || "Missing"}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {item.type || "Missing"}
                        </div>
                        <div>
                          <span className="font-medium">Qty:</span> {item.qty || "Missing"}
                        </div>
                        <div>
                          <span className="font-medium">Price:</span> {item.price || "Missing"} TZS
                        </div>
                        <div>
                          <span className="font-medium">Expiry:</span> {item.expiry || "Missing"}
                        </div>
                        <div>
                          <span className="font-medium">Batch:</span> {item.batchNumber || "Auto"}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Generic:</span> {item.genericName || "N/A"}
                        </div>
                      </div>

                      {(!item.purchaseOrder || !item.medicine || !item.type || !item.qty || !item.price || !item.expiry) && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          ⚠️ Missing required fields. This item will be skipped.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedData([]);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={uploadBulkItems}
                  disabled={uploading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 flex items-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>Confirm Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Purchase Order Modal */}
        {showPOModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowPOModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl font-bold mb-4 text-gray-800">Add Purchase Order</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PO-2025-001"
                    value={newPO.number}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, number: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newPO.date}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC Pharmaceuticals"
                    value={newPO.supplier}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplier: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={newPO.supplierContact}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierContact: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@example.com"
                    value={newPO.supplierEmail}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierEmail: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+255 XXX XXX XXX"
                    value={newPO.supplierPhone}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierPhone: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPOModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addPurchaseOrder}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
