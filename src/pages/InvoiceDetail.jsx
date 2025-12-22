import React, { useState, useRef } from ‘react’;
import { useParams, useNavigate } from ‘react-router-dom’;
import { useQuery, useQueryClient } from ‘react-query’;
import { toast } from ‘react-hot-toast’;
import { ArrowLeft, Printer, CreditCard } from ‘lucide-react’;
import { useReactToPrint } from ‘react-to-print’;
import { billingService } from ‘../utils/billingService.js’;
import LoadingSpinner from ‘../components/common/LoadingSpinner.jsx’;
import PaymentModal from ‘../components/billing/PaymentModal.jsx’;

const InvoiceDetail = () => {
const { id } = useParams();
const navigate = useNavigate();
const queryClient = useQueryClient();
const printRef = useRef();

const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

// Fetch invoice details
const { data: invoice, isLoading, isError, refetch } = useQuery(
[‘invoice’, id],
() => billingService.getInvoiceById(id).then(res => res.data.data),
{
refetchOnMount: ‘always’,
staleTime: 0
}
);

// Print handler
const handlePrint = useReactToPrint({
content: () => printRef.current,
documentTitle: `Invoice-${invoice?.invoiceNumber || id}`,
onAfterPrint: () => toast.success(‘Invoice printed successfully’),
});

const handlePaymentSuccess = async () => {
// Refetch the invoice immediately to get updated data
await refetch();
// Close modal after a short delay
setTimeout(() => {
setIsPaymentModalOpen(false);
}, 500);
};

if (isLoading) return <LoadingSpinner />;
if (isError || !invoice) return <div>Error loading invoice details.</div>;

const getStatusChip = (status) => {
switch (status) {
case ‘paid’: return ‘bg-green-100 text-green-800’;
case ‘pending’: return ‘bg-yellow-100 text-yellow-800’;
case ‘partial’: return ‘bg-blue-100 text-blue-800’;
case ‘overdue’: return ‘bg-red-100 text-red-800’;
default: return ‘bg-gray-100 text-gray-800’;
}
};

return (
<div className="max-w-4xl mx-auto p-6">
{/* Action Buttons - Not printed */}
<div className="flex items-center justify-between mb-6 print:hidden">
<button onClick={() => navigate(-1)} className=“btn-secondary flex items-center”>
<ArrowLeft className="w-4 h-4 mr-2" /> Back
</button>
<button onClick={handlePrint} className="btn-secondary flex items-center">
<Printer className="w-4 h-4 mr-2" /> Print Invoice
</button>
</div>

```
  {/* Printable Invoice Content */}
  <div ref={printRef} className="bg-white rounded-lg shadow-md p-8">
    {/* Header */}
    <div className="flex justify-between items-start mb-8 border-b pb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
        <p className="text-gray-500 text-lg mt-1">{invoice.invoiceNumber}</p>
      </div>
      <div className="text-right">
        <h2 className="text-xl font-bold text-gray-800">Segese Medical Clinic</h2>
        <p className="text-gray-600 text-sm mt-1">123 Medical Street</p>
        <p className="text-gray-600 text-sm">Shinyanga, Tanzania</p>
        <p className="text-gray-600 text-sm">Phone: +255 762 948 291</p>
        <p className="text-gray-600 text-sm">Email: publichope2@gmail.com</p>
      </div>
    </div>

    {/* Status Badge */}
    <div className="mb-6 flex items-center gap-3">
      <span className={`inline-block text-lg font-semibold px-4 py-2 rounded-full ${getStatusChip(invoice.status)}`}>
        Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
      </span>
      {invoice.items && (
        <span className="text-sm text-gray-600">
          ({invoice.items.filter(item => item.paid).length} of {invoice.items.length} items paid)
        </span>
      )}
    </div>

    {/* Patient and Date Info */}
    <div className="grid md:grid-cols-2 gap-8 mb-8">
      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To:</h3>
        <p className="text-lg font-medium text-gray-800">
          {invoice.patient.firstName} {invoice.patient.lastName}
        </p>
        {invoice.patient.email && (
          <p className="text-gray-600">{invoice.patient.email}</p>
        )}
        {invoice.patient.phone && (
          <p className="text-gray-600">{invoice.patient.phone}</p>
        )}
        {invoice.patient.patientId && (
          <p className="text-gray-600 text-sm mt-1">Patient ID: {invoice.patient.patientId}</p>
        )}
      </div>
      <div className="text-left md:text-right">
        <div className="mb-2">
          <span className="font-semibold text-gray-700">Invoice Date:</span>
          <p className="text-gray-800">{new Date(invoice.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
        </div>
        {invoice.dueDate && (
          <div className="mb-2">
            <span className="font-semibold text-gray-700">Due Date:</span>
            <p className="text-gray-800">{new Date(invoice.dueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        )}
        {invoice.visit?.visitId && (
          <div>
            <span className="font-semibold text-gray-700">Visit ID:</span>
            <p className="text-gray-800">{invoice.visit.visitId}</p>
          </div>
        )}
      </div>
    </div>

    {/* Invoice Items Table */}
    <div className="mb-8">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-300">
            <th className="text-left py-3 font-semibold text-gray-700">Description</th>
            <th className="text-center py-3 font-semibold text-gray-700">Qty</th>
            <th className="text-right py-3 font-semibold text-gray-700">Unit Price</th>
            <th className="text-right py-3 font-semibold text-gray-700">Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, index) => (
            <tr key={index} className={`border-b border-gray-200 ${item.paid ? 'bg-green-50' : ''}`}>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <div className="font-medium text-gray-800">{item.description}</div>
                  {item.paid && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Paid ✓
                    </span>
                  )}
                </div>
                {item.type && (
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {item.type}
                  </div>
                )}
                {item.notes && (
                  <div className="text-xs text-gray-500 mt-1">
                    Note: {item.notes}
                  </div>
                )}
                {item.paidAt && (
                  <div className="text-xs text-green-600 mt-1">
                    Paid on: {new Date(item.paidAt).toLocaleDateString()}
                  </div>
                )}
              </td>
              <td className="py-3 text-center text-gray-700">{item.quantity || 1}</td>
              <td className="py-3 text-right text-gray-700">
                {item.unitPrice?.toLocaleString() || 0} TZS
              </td>
              <td className="py-3 text-right font-medium text-gray-800">
                {item.total.toLocaleString()} TZS
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Totals Section */}
    <div className="flex justify-end mb-8">
      <div className="w-full md:w-1/2 lg:w-1/3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-800">
            {invoice.totalAmount.toLocaleString()} TZS
          </span>
        </div>
        
        {invoice.amountPaid > 0 && (
          <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
            <span>Amount Paid:</span>
            <span className="font-medium">
              -{invoice.amountPaid.toLocaleString()} TZS
            </span>
          </div>
        )}
        
        <div className="flex justify-between py-3 font-bold text-xl text-gray-900 border-t-2 border-gray-300 mt-2">
          <span>Balance Due:</span>
          <span className={invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
            {invoice.balanceDue.toLocaleString()} TZS
          </span>
        </div>
      </div>
    </div>

    {/* Payment History */}
    {invoice.payments && invoice.payments.length > 0 && (
      <div className="mb-8 border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Date & Time</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-700">Method</th>
              <th className="text-right py-2 text-sm font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.payments.map((payment, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2 text-sm text-gray-700">
                  {new Date(payment.paidAt).toLocaleString()}
                </td>
                <td className="py-2 text-sm text-gray-700 capitalize">
                  {payment.method.replace('_', ' ')}
                </td>
                <td className="py-2 text-sm text-right text-gray-700">
                  {payment.amount.toLocaleString()} TZS
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Footer */}
    <div className="border-t pt-6 mt-8">
      <div className="text-center text-gray-600 text-sm">
        <p className="mb-2">Thank you for your business!</p>
        <p>For any queries regarding this invoice, please contact our billing department.</p>
        {invoice.notes && (
          <p className="mt-4 italic text-gray-500">{invoice.notes}</p>
        )}
      </div>
    </div>

    {/* Print timestamp */}
    <div className="text-right text-xs text-gray-400 mt-4 print-only hidden print:block">
      Printed on: {new Date().toLocaleString()}
    </div>
  </div>

  {/* Payment Section - Not printed */}
  <div className="mt-8 p-6 bg-gray-50 rounded-lg print:hidden">
    <div className="flex flex-col md:flex-row justify-between items-center">
      <div>
        <h3 className="font-bold text-lg">Payment Status</h3>
        <p className="text-gray-600">Manage payments for this invoice.</p>
      </div>
      <button
        onClick={() => setIsPaymentModalOpen(true)}
        className="btn-primary flex items-center mt-4 md:mt-0"
        disabled={invoice.status === 'paid'}
      >
        <CreditCard className="w-5 h-5 mr-2" />
        {invoice.status === 'paid' ? 'Invoice Paid' : 'Record Payment'}
      </button>
    </div>
  </div>

  {/* Payment Modal - Not printed */}
  {isPaymentModalOpen && (
    <PaymentModal
      invoice={invoice}
      onClose={() => setIsPaymentModalOpen(false)}
      onPaymentSuccess={handlePaymentSuccess}
    />
  )}

  {/* Print styles */}
  <style>{`
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .print\\:hidden {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      @page {
        size: A4;
        margin: 1cm;
      }
    }
  `}</style>
</div>
```

);
};

export default InvoiceDetail;