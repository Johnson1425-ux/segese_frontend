import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Save, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { patientService } from '../utils/patientService.js';
import { billingService } from '../utils/billingService.js';
import serviceService from '../utils/serviceService.js';
import { productService } from '../utils/productService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const InvoiceForm = () => {
    const navigate = useNavigate();
    const patientSearchRef = useRef(null);

    const [patientId, setPatientId] = useState('');
    const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, total: 0, type: 'other', search: '' }]);
    const [paymentTerms] = useState('immediate');
    
    // State for patient search
    const [patients, setPatients] = useState([]);
    const [patientSearchTerm, setPatientSearchTerm] = useState('');
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // State for billable items search
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [activeSearchIndex, setActiveSearchIndex] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [patientsRes, servicesRes, productsRes] = await Promise.all([
                    patientService.getAllPatients(),
                    serviceService.getAllServices(),
                    productService.getAllProducts(),
                ]);
                setPatients(patientsRes.data || []);
                setServices(servicesRes.data.data || []);
                setProducts(productsRes.data.data || []);
            } catch (error) {
                toast.error("Failed to load necessary data.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);
    
    // Patient search effect
    useEffect(() => {
        if (patientSearchTerm) {
            const results = patients.filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(patientSearchTerm.toLowerCase()));
            setPatientSearchResults(results);
        } else {
            setPatientSearchResults([]);
        }
    }, [patientSearchTerm, patients]);

    // Handlers
    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
        }
        setItems(newItems);
    };

    const handleItemSelect = (itemIndex, billableItem) => {
        const newItems = [...items];
        newItems[itemIndex] = {
            ...newItems[itemIndex],
            description: billableItem.name,
            unitPrice: billableItem.price,
            total: (newItems[itemIndex].quantity || 1) * billableItem.price,
            type: billableItem.type === 'Service' ? billableItem.category.toLowerCase().replace(' ', '_') : 'medication',
            search: billableItem.name,
        };
        setItems(newItems);
        setActiveSearchIndex(null);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, total: 0, type: 'other', search: '' }]);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handlePatientSelect = (patient) => {
        setPatientId(patient._id);
        setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
        setShowPatientDropdown(false);
    };

    const getBillableItemResults = (search) => {
        if (!search) return [];
        return [
            ...services.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).map(s => ({ ...s, type: 'Service' })),
            ...products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(p => ({ ...p, type: 'Product' })),
        ];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!patientId) {
            toast.error("Please select a patient.");
            return;
        }
        setIsSubmitting(true);
        try {
            const invoiceData = {
                patient: patientId,
                items: items.map(({ ...rest }) => rest), // Remove the temporary 'search' field before sending
                paymentTerms
            };
            const res = await billingService.createInvoice(invoiceData);
            toast.success("Invoice created successfully!");
            navigate(`/billing/invoices/${res.data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create invoice.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Invoice</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* --- PATIENT SEARCH SECTION --- */}
                <div ref={patientSearchRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={patientSearchTerm} 
                            onChange={(e) => { setPatientSearchTerm(e.target.value); setShowPatientDropdown(true); }} 
                            placeholder="Search for a patient..." 
                            className="input-field pl-10"
                            required
                        />
                        {showPatientDropdown && patientSearchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {patientSearchResults.map(p => <div key={p._id} onClick={() => handlePatientSelect(p)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">{p.firstName} {p.lastName}</div>)}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- INVOICE ITEMS SECTION --- */}
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Invoice Items</h3>
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-start">
                                <div className="col-span-6 relative">
                                    <input
                                        type="text"
                                        placeholder="Search for a service or product..."
                                        value={item.search}
                                        onChange={(e) => handleItemChange(index, 'search', e.target.value)}
                                        onFocus={() => setActiveSearchIndex(index)}
                                        className="input-field w-full"
                                        required
                                    />
                                    {activeSearchIndex === index && getBillableItemResults(item.search).length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {getBillableItemResults(item.search).map(result => (
                                                <div key={result._id} onClick={() => handleItemSelect(index, result)} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                                    {result.name} <span className="text-xs text-gray-500">({result.type})</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))} className="input-field col-span-2" required />
                                <input type="number" placeholder="Unit Price" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} className="input-field col-span-3" required />
                                <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 col-span-1 mt-2"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addItem} className="btn-primary mt-4 flex items-center"><Plus className="w-4 h-4 mr-2" /> Add Item</button>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSubmitting ? 'Creating...' : 'Create Invoice'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;