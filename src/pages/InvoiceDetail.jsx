import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Printer, CreditCard } from 'lucide-react';
import { billingService } from '../utils/billingService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import PaymentModal from '../components/billing/PaymentModal.jsx';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
    const printRef = useRef();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Fetch invoice details
  const { data: invoice, isLoading, isError, refetch } = useQuery(
    ['invoice', id],
    () => billingService.getInvoiceById(id).then(res => res.data.data),
    {
      refetchOnMount: 'always',
      staleTime: 0
    }
  );

  // Simple native print handler
  const handlePrint = () => {
    window.print();
    setTimeout(() => {
      toast.success('Invoice printed successfully');
    }, 500);
  };

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
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter only paid items for print
  const paidItems = invoice.items?.filter(item => item.paid) || [];

  return (
    <>
      <div className="max-w-4xl mx-auto p-2 sm:p-4 md:p-6">
        {/* Action Buttons - Not printed */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 md:mb-6 no-print gap-2">
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center text-xs sm:text-sm">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <button onClick={handlePrint} className="btn-secondary flex items-center text-xs sm:text-sm">
            <Printer className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Print Receipt</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>

        {/* Status Badge */}
        <div className="mb-3 sm:mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className={`inline-block text-xs sm:text-sm md:text-lg font-semibold px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full ${getStatusChip(invoice.status)}`}>
            Status: {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </span>
          {invoice.items && (
            <span className="text-[10px] sm:text-xs md:text-sm text-gray-600">
              ({invoice.items.filter(item => item.paid).length} of {invoice.items.length} items paid)
            </span>
          )}
        </div>

        {/* Printable Invoice Content */}
        <div ref={printRef} className="bg-white rounded-lg shadow-md p-3 sm:p-6 md:p-8 printable-area">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 md:mb-8 border-b pb-1 sm:pb-1 md:pb-1 gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">INVOICE</h1>
              <p className="text-gray-500 text-sm sm:text-base md:text-lg mt-1">{invoice.invoiceNumber}</p>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">Segese Medical Clinic</h2>
              <p className="text-gray-600 text-xs sm:text-sm">Msalala, Kahama</p>
              <p className="text-gray-600 text-xs sm:text-sm">Phone: +255 624 229 207</p>
              <p className="text-gray-600 text-xs sm:text-sm">Email: publichope2@gmail.com</p>
            </div>
          </div>

          {/* Patient and Date Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 md:mb-8 border-b pb-1 sm:pb-1 md:pb-1 gap-3">
            <div>
              <h3 className="text-[10px] sm:text-xs md:text-sm font-semibold text-gray-500 uppercase mb-1 sm:mb-2">Bill To:</h3>
              <p className="text-sm sm:text-base md:text-lg font-medium text-gray-800">
                {invoice.patient.firstName} {invoice.patient.lastName}
              </p>
              {invoice.patient.email && (
                <p className="text-xs sm:text-sm text-gray-600 break-all">{invoice.patient.email}</p>
              )}
              {invoice.patient.phone && (
                <p className="text-xs sm:text-sm text-gray-600">{invoice.patient.phone}</p>
              )}
              {invoice.patient.patientId && (
                <p className="text-gray-600 text-[10px] sm:text-xs md:text-sm mt-1">Patient ID: {invoice.patient.patientId}</p>
              )}
            </div>

            <div className="text-left sm:text-right">
              <div className="mb-2">
                <span className="font-semibold text-gray-700 text-xs sm:text-sm">Date of issue:</span>
                <p className="text-gray-800 text-xs sm:text-sm">{new Date(invoice.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              {invoice.dueDate && (
                <div className="mb-2">
                  <span className="font-semibold text-gray-700 text-xs sm:text-sm">Date due:</span>
                  <p className="text-gray-800 text-xs sm:text-sm">{new Date(invoice.dueDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</p>
                </div>
              )}
              {invoice.visit?.visitId && (
                <div>
                  <span className="font-semibold text-gray-700 text-xs sm:text-sm">Visit ID:</span>
                  <p className="text-gray-800 text-xs sm:text-sm">{invoice.visit.visitId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items Table - ALL ITEMS for screen view */}
          <div className="mb-4 sm:mb-6 md:mb-8 screen-only overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-left py-2 sm:py-3 font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Description</th>
                  <th className="text-center py-2 sm:py-3 font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Qty</th>
                  <th className="text-right py-2 sm:py-3 font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Unit Price</th>
                  <th className="text-right py-2 sm:py-3 font-semibold text-gray-700 text-[10px] sm:text-xs md:text-sm">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index} className={`border-b border-gray-200 ${item.paid ? 'bg-green-50' : ''}`}>
                    <td className="py-2 sm:py-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <div className="font-medium text-gray-800 text-[11px] sm:text-xs md:text-sm">{item.description}</div>
                        {item.paid && (
                          <span className="text-[9px] sm:text-[10px] bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 rounded whitespace-nowrap">
                            Paid ✓
                          </span>
                        )}
                      </div>
                      {item.type && (
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1">
                          Type: {item.type}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1">
                          Note: {item.notes}
                        </div>
                      )}
                      {item.paidAt && (
                        <div className="text-[9px] sm:text-[10px] md:text-xs text-green-600 mt-1">
                          Paid on: {new Date(item.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="py-2 sm:py-3 text-center text-gray-700 text-[11px] sm:text-xs md:text-sm">{item.quantity || 1}</td>
                    <td className="py-2 sm:py-3 text-right text-gray-700 text-[11px] sm:text-xs md:text-sm">
                      {item.unitPrice?.toLocaleString() || 0} TZS
                    </td>
                    <td className="py-2 sm:py-3 text-right font-medium text-gray-800 text-[11px] sm:text-xs md:text-sm">
                      {item.total.toLocaleString()} TZS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAID Items Table - ONLY for print */}
          {paidItems.length > 0 && (
            <div className="mb-8 print-only">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300">
                    <th className="text-left py-1 font-semibold text-gray-700">Description</th>
                    <th className="text-center py-1 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-1 font-semibold text-gray-700">Unit Price</th>
                    <th className="text-right py-1 font-semibold text-gray-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paidItems.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 bg-green-50">
                      <td className="py-3">
                        <div className="font-medium text-gray-800">{item.description}</div>
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
          )}

          {/* Totals Section - Screen only shows full details */}
          <div className="flex justify-end mb-4 sm:mb-6 md:mb-8 screen-only">
            <div className="w-full sm:w-2/3 md:w-1/2 lg:w-1/3">
              <div className="flex justify-between border-t border-b border-gray-200 text-xs sm:text-sm">
                <span className="text-gray">Subtotal:</span>
                <span className="font-medium text-gray-800">
                  {invoice.totalAmount.toLocaleString()} TZS
                </span>
              </div>
              
              {invoice.amountPaid > 0 && (
                <div className="flex justify-between border-b border-gray-200 text-green-600 text-xs sm:text-sm">
                  <span>Amount Paid:</span>
                  <span className="font-medium">
                    -{invoice.amountPaid.toLocaleString()} TZS
                  </span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-base sm:text-sm text-xs text-gray-900 border-gray-300">
                <span>Amount Due:</span>
                <span className={invoice.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}>
                  {invoice.balanceDue.toLocaleString()} TZS
                </span>
              </div>
            </div>
          </div>

          {/* Totals Section - Print only shows paid amount */}
          <div className="flex justify-end mb-8 print-only">
            <div className="w-full md:w-1/2 lg:w-1/3">
              <div className="flex justify-between py-3 font-bold text-xl text-gray-900 border-t-2 border-gray-300">
                <span>Total Paid:</span>
                <span className="text-green-600">
                  {invoice.amountPaid.toLocaleString()} TZS
                </span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mb-4 sm:mb-6 md:mb-8 pt-3 sm:pt-4 md:pt-6">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">Payment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700">Date & Time</th>
                      <th className="text-left py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700">Method</th>
                      <th className="text-right py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-gray-700">
                          {new Date(payment.paidAt).toLocaleString()}
                        </td>
                        <td className="py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-gray-700 capitalize">
                          {payment.method.replace('_', ' ')}
                        </td>
                        <td className="py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm text-right text-gray-700">
                          {payment.amount.toLocaleString()} TZS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 sm:pt-4 md:pt-6 mt-4 sm:mt-6 md:mt-8">
            <div className="text-center text-gray-600 text-[10px] sm:text-xs md:text-sm">
              <p className="mb-2">Thank you for your business!</p>
              <p>For any queries regarding this invoice, please contact our billing department.</p>
            </div>
          </div>

          {/* Print timestamp */}
          <div className="text-right text-[9px] sm:text-xs text-gray-400 mt-4 print-only">
            Printed on: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Payment Section - Not printed */}
        <div className="mt-4 sm:mt-6 md:mt-8 p-3 sm:p-4 md:p-6 bg-gray-50 rounded-lg no-print">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base sm:text-lg">Payment Status</h3>
              <p className="text-gray-600 text-xs sm:text-sm">Manage payments for this invoice.</p>
            </div>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="btn-primary flex items-center justify-center w-full sm:w-auto text-xs sm:text-sm"
              disabled={invoice.status === 'paid'}
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          /* Hide everything except the printable area */
          body * {
            visibility: hidden;
          }
          
          .printable-area,
          .printable-area * {
            visibility: visible;
          }
          
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          
          /* Hide non-printable elements */
          .no-print,
          .screen-only {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Show print-only elements */
          .print-only {
            display: block !important;
            visibility: visible !important;
          }
          
          /* Ensure colors are printed */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Page setup */
          @page {
            size: A4;
            margin: 15mm;
          }
          
          /* Prevent page breaks inside elements */
          table, tr, td, th, .border-t {
            page-break-inside: avoid;
          }
          
          /* Table styling for print */
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          /* Ensure background colors print */
          .bg-green-50,
          .bg-green-100,
          .bg-yellow-100,
          .bg-blue-100,
          .bg-red-100,
          .bg-gray-100 {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Compact spacing for single page */
          h1 {
            font-size: 24px !important;
          }
          
          h2 {
            font-size: 18px !important;
          }
          
          h3 {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }
          
          .mb-8 {
            margin-bottom: 16px !important;
          }
          
          .py-3 {
            padding-top: 6px !important;
            padding-bottom: 6px !important;
          }
        }

        /* Hide print-only on screen */
        .print-only {
          display: none;
        }
      `}</style>
    </>
  );
};

export default InvoiceDetail;