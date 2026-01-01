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
        <div className="text-gray-500 text-xs sm:text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6 gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Package className="mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8" />
              Item Receiving
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 mt-1">Receive and manage pharmacy inventory</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={downloadTemplate}
              className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-[10px] sm:text-xs md:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </button>
            <label className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg transition-colors cursor-pointer text-[10px] sm:text-xs md:text-sm">
              <Upload className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Upload Excel</span>
              <span className="sm:hidden">Upload</span>
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
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">Record New Supply</h2>
            <form className="space-y-4 sm:space-y-6" onSubmit={handleSave}>
              {/* PO and Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Purchase Order Number *
                  </label>
                  <div className="flex space-x-2">
                    <select
                      name="purchaseOrder"
                      value={form.purchaseOrder}
                      onChange={handleChange}
                      className="flex-1 border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
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
                      className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 md:px-4 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Receiving Date
                  </label>
                  <input
                    type="text"
                    name="date"
                    value={form.date}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 bg-gray-100 text-[11px] sm:text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Medicine Details */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Medicine Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      name="medicine"
                      value={form.medicine}
                      onChange={handleChange}
                      placeholder="e.g., Amoxicillin"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      name="genericName"
                      value={form.genericName}
                      onChange={handleChange}
                      placeholder="e.g., Amoxicillin trihydrate"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Type *
                    </label>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
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
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Strength
                    </label>
                    <input
                      type="text"
                      name="strength"
                      value={form.strength}
                      onChange={handleChange}
                      placeholder="e.g., 500mg, 10ml"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
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
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={form.manufacturer}
                      onChange={handleChange}
                      placeholder="e.g., Pfizer"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Batch Details */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Batch Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={form.batchNumber}
                      onChange={handleChange}
                      placeholder="Auto-generated if left empty"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="qty"
                      value={form.qty}
                      onChange={handleChange}
                      placeholder="Enter quantity"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Buying Price (per unit) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="Enter buying price"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Selling Price (per unit)
                    </label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={form.sellingPrice}
                      onChange={handleChange}
                      placeholder="Auto-calculated with 30% markup"
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-[11px] sm:text-xs md:text-sm"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1">Leave empty for automatic 30% markup</p>
                  </div>

                  <div>
                    <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Receive To
                    </label>
                    <input
                      type="text"
                      name="receiveTo"
                      value={form.receiveTo}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Description / Notes
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional information about this medicine..."
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 sm:pt-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-[11px] sm:text-xs md:text-sm"
                >
                  <span>Preview</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preview Section */}
        {preview && (
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-gray-800 flex items-center">
              <CheckCircle className="mr-2 text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              Preview Supply
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="space-y-2 sm:space-y-3">
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Purchase Order:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.purchaseOrder}</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Date:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.date}</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Medicine:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.medicine}</span>
                </div>
                {preview.genericName && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Generic Name:</span>
                    <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.genericName}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Type:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.type}</span>
                </div>
                {preview.strength && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Strength:</span>
                    <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.strength}</span>
                  </div>
                )}
                {preview.manufacturer && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Manufacturer:</span>
                    <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.manufacturer}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3">
                {preview.category && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Category:</span>
                    <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.category}</span>
                  </div>
                )}
                {preview.batchNumber && (
                  <div className="bg-gray-50 p-2 sm:p-3 rounded">
                    <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Batch Number:</span>
                    <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.batchNumber}</span>
                  </div>
                )}
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Expiry Date:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.expiry}</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Quantity:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.qty} units</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Buying Price:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.price} TZS per unit</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded">
                  <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Selling Price:</span>
                  <span className="ml-2 text-gray-900 text-[10px] sm:text-xs md:text-sm">{preview.sellingPrice} TZS per unit</span>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded border border-blue-200">
                  <span className="font-semibold text-blue-700 text-[10px] sm:text-xs md:text-sm">Total Cost:</span>
                  <span className="ml-2 text-blue-900 font-bold text-[10px] sm:text-xs md:text-sm">
                    {(parseFloat(preview.price) * parseInt(preview.qty)).toFixed(2)} TZS
                  </span>
                </div>
              </div>
            </div>

            {preview.description && (
              <div className="mt-3 sm:mt-4 bg-gray-50 p-2 sm:p-3 rounded">
                <span className="font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Description:</span>
                <p className="ml-2 text-gray-900 mt-1 text-[10px] sm:text-xs md:text-sm">{preview.description}</p>
              </div>
            )}

            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={confirmSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors flex items-center justify-center space-x-2 text-[11px] sm:text-xs md:text-sm"
              >
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Confirm & Save</span>
              </button>
              <button
                onClick={() => setPreview(null)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors text-[11px] sm:text-xs md:text-sm"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 w-full max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Review Imported Items</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto mb-3 sm:mb-4">
                <div className="text-[10px] sm:text-xs md:text-sm text-gray-600 mb-2 sm:mb-3">
                  Found {uploadedData.length} items. Review and confirm to import.
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  {uploadedData.map((item, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-2 sm:p-3 md:p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <h3 className="font-semibold text-gray-800 text-[11px] sm:text-xs md:text-sm">{item.medicine || "No name"}</h3>
                        <span className="text-[9px] sm:text-[10px] md:text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                          Row {item.rowIndex}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                        <div className="truncate">
                          <span className="font-medium">PO:</span> {item.purchaseOrder || "Missing"}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Type:</span> {item.type || "Missing"}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Qty:</span> {item.qty || "Missing"}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Price:</span> {item.price || "Missing"} TZS
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Expiry:</span> {item.expiry || "Missing"}
                        </div>
                        <div className="truncate">
                          <span className="font-medium">Batch:</span> {item.batchNumber || "Auto"}
                        </div>
                        <div className="col-span-2 truncate">
                          <span className="font-medium">Generic:</span> {item.genericName || "N/A"}
                        </div>
                      </div>

                      {(!item.purchaseOrder || !item.medicine || !item.type || !item.qty || !item.price || !item.expiry) && (
                        <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-xs text-red-600 bg-red-50 p-1.5 sm:p-2 rounded">
                          ⚠️ Missing required fields. This item will be skipped.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4 border-t">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadedData([]);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-[11px] sm:text-xs md:text-sm"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  onClick={uploadBulkItems}
                  disabled={uploading}
                  className="px-4 sm:px-5 md:px-6 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 flex items-center justify-center space-x-2 text-[11px] sm:text-xs md:text-sm"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
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
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 md:p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowPOModal(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-gray-800">Add Purchase Order</h2>
              
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    PO Number *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., PO-2025-001"
                    value={newPO.number}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, number: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newPO.date}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., ABC Pharmaceuticals"
                    value={newPO.supplier}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplier: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={newPO.supplierContact}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierContact: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="supplier@example.com"
                    value={newPO.supplierEmail}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierEmail: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+255 XXX XXX XXX"
                    value={newPO.supplierPhone}
                    onChange={(e) =>
                      setNewPO((prev) => ({ ...prev, supplierPhone: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-lg p-1.5 sm:p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-[11px] sm:text-xs md:text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowPOModal(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-[11px] sm:text-xs md:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addPurchaseOrder}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-[11px] sm:text-xs md:text-sm"
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