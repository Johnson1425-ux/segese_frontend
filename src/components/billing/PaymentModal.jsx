import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const PaymentModal = ({ invoice: initialInvoice, onClose, onPaymentSuccess }) => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  // Use state to track the current invoice data
  const [invoice, setInvoice] = useState(initialInvoice);

  // Update local invoice when prop changes
  useEffect(() => {
    setInvoice(initialInvoice);
  }, [initialInvoice]);

  // Mutation to pay for selected items
  const paymentMutation = useMutation(
    async (paymentData) => {
      const response = await api.post(`/billing/invoices/${invoice._id}/pay-items`, paymentData);
      return response.data.data; // Return the updated invoice
    },
    {
      onSuccess: (updatedInvoice) => {
        toast.success('Payment recorded successfully!');
        
        // Update local state immediately to reflect changes in UI
        setInvoice(updatedInvoice);
        
        // Update the cache with the response data
        queryClient.setQueryData(['invoice', invoice._id], updatedInvoice);
        
        // Invalidate related queries to ensure consistency
        queryClient.invalidateQueries(['invoice', invoice._id]);
        queryClient.invalidateQueries(['invoices']);
        
        // Clear selected items
        setSelectedItems([]);
        
        // Call the success callback
        if (onPaymentSuccess) {
          onPaymentSuccess(updatedInvoice);
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Payment failed');
      }
    }
  );

  const toggleItemSelection = (index) => {
    setSelectedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const selectAllUnpaid = () => {
    const unpaidIndices = invoice.items
      .map((item, index) => !item.paid ? index : null)
      .filter(index => index !== null);
    setSelectedItems(unpaidIndices);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, index) => {
      return sum + (invoice.items[index]?.total || 0);
    }, 0);
  };

  const handlePayment = () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to pay');
      return;
    }

    const totalAmount = calculateTotal();
    
    if (window.confirm(`Confirm payment of Tsh. ${totalAmount.toLocaleString()} via ${paymentMethod}?`)) {
      paymentMutation.mutate({
        itemIndices: selectedItems,
        method: paymentMethod
      });
    }
  };

  const unpaidItems = invoice?.items?.filter(item => !item.paid) || [];
  const paidItems = invoice?.items?.filter(item => item.paid) || [];
  const totalUnpaid = unpaidItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-3 sm:p-4 md:p-6 border-b">
          <div className="flex-1 min-w-0 mr-2">
            <h2 className="text-base sm:text-lg md:text-xl font-bold mb-1 truncate">Record Payment - Invoice #{invoice.invoiceNumber}</h2>
            <p className="text-xs sm:text-sm text-gray-600 truncate">
              Patient: {invoice.patient?.firstName} {invoice.patient?.lastName}
            </p>
            <div className="mt-2 flex flex-col sm:flex-row sm:gap-3 md:gap-4 text-[10px] sm:text-xs md:text-sm space-y-1 sm:space-y-0">
              <div>
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold ml-1">Tsh. {invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Paid:</span>
                <span className="font-semibold text-green-600 ml-1">Tsh. {invoice.amountPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Due:</span>
                <span className="font-semibold text-red-600 ml-1">Tsh. {invoice.balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
          {/* Unpaid Items */}
          {unpaidItems.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-semibold text-sm sm:text-base md:text-lg flex items-center">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Unpaid Services ({unpaidItems.length})</span>
                </h3>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={selectAllUnpaid}
                    className="text-[10px] sm:text-xs md:text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                  >
                    Select All
                  </button>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-[10px] sm:text-xs md:text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {invoice.items.map((item, index) => {
                  if (item.paid) return null;
                  return (
                    <div
                      key={index}
                      className={`p-2 sm:p-3 md:p-4 border rounded-lg cursor-pointer transition ${
                        selectedItems.includes(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleItemSelection(index)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(index)}
                            onChange={() => toggleItemSelection(index)}
                            className="mt-0.5 sm:mt-1 mr-2 sm:mr-3 flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs sm:text-sm md:text-base truncate">{item.description}</p>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                              <span className="text-[9px] sm:text-[10px] md:text-xs bg-gray-100 text-gray-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                {item.type?.replace('_', ' ') || 'Service'}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                                  Qty: {item.quantity}
                                </span>
                              )}
                            </div>
                            {item.coveredByInsurance && (
                              <span className="text-[9px] sm:text-[10px] md:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded mt-1 inline-block">
                                Insurance Coverage
                              </span>
                            )}
                            {item.notes && (
                              <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1 line-clamp-2">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-xs sm:text-sm md:text-lg whitespace-nowrap">Tsh. {item.total.toLocaleString()}</p>
                          <span className="text-[9px] sm:text-[10px] md:text-xs bg-yellow-100 text-yellow-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block mt-1">
                            Unpaid
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-xs sm:text-sm text-orange-800">
                  <strong>Total Unpaid:</strong> Tsh. {totalUnpaid.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Paid Items */}
          {paidItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 sm:mb-3 flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Paid Services ({paidItems.length})</span>
              </h3>
              <div className="space-y-2">
                {invoice.items.map((item, index) => {
                  if (!item.paid) return null;
                  return (
                    <div
                      key={index}
                      className="p-2 sm:p-3 md:p-4 border border-green-200 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-xs sm:text-sm md:text-base truncate">{item.description}</p>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                            <span className="text-[9px] sm:text-[10px] md:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                              {item.type?.replace('_', ' ') || 'Service'}
                            </span>
                            {item.paidAt && (
                              <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                                Paid: {new Date(item.paidAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-gray-800 text-xs sm:text-sm md:text-base whitespace-nowrap">Tsh. {item.total.toLocaleString()}</p>
                          <span className="text-[9px] sm:text-[10px] md:text-xs bg-green-100 text-green-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded inline-block mt-1">
                            Paid ✓
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {unpaidItems.length === 0 && paidItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">No items found in this invoice</p>
            </div>
          )}

          {unpaidItems.length === 0 && paidItems.length > 0 && (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 text-green-500" />
              <p className="text-base sm:text-lg font-semibold text-green-600">All items have been paid!</p>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">Invoice Status: {invoice.status}</p>
            </div>
          )}
        </div>

        {/* Footer - Payment Section */}
        {unpaidItems.length > 0 && (
          <div className="border-t p-3 sm:p-4 md:p-6 bg-gray-50">
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field w-full text-xs sm:text-sm"
                disabled={paymentMutation.isLoading}
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="mobile_money">Mobile Money (M-Pesa, Tigo Pesa, etc.)</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="w-full sm:w-auto">
                <p className="text-[10px] sm:text-xs text-gray-600">
                  Selected: {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                </p>
                <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900">
                  Amount: <span className="text-blue-600">Tsh. {calculateTotal().toLocaleString()}</span>
                </p>
                {selectedItems.length > 0 && (
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 mt-1">
                    Remaining: Tsh. {(invoice.balanceDue - calculateTotal()).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 text-xs sm:text-sm"
                  disabled={paymentMutation.isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={selectedItems.length === 0 || paymentMutation.isLoading}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs sm:text-sm"
                >
                  {paymentMutation.isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      <span className="hidden sm:inline">Processing...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                      <span className="hidden sm:inline">Confirm Payment</span>
                      <span className="sm:hidden">Pay</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;