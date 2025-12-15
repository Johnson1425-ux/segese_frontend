import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const PaymentModal = ({ invoice, onClose, onPaymentSuccess }) => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [currentInvoice, setCurrentInvoice] = useState(invoice);

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
        setCurrentInvoice(updatedInvoice);
        
        // Update the cache with the response data
        queryClient.setQueryData(['invoice', invoice._id], updatedInvoice);
        
        // Clear selected items
        setSelectedItems([]);
        
        // Call the success callback after a delay to show updated state
        setTimeout(() => {
          if (onPaymentSuccess) onPaymentSuccess();
        }, 1000);
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
    const unpaidIndices = currentInvoice.items
      .map((item, index) => !item.paid ? index : null)
      .filter(index => index !== null);
    setSelectedItems(unpaidIndices);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  const calculateTotal = () => {
    if (!currentInvoice) return 0;
    return selectedItems.reduce((sum, index) => {
      return sum + currentInvoice.items[index].total;
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
        method: paymentMethod,
        amount: totalAmount
      });
    }
  };

  const unpaidItems = currentInvoice?.items?.filter(item => !item.paid) || [];
  const paidItems = currentInvoice?.items?.filter(item => item.paid) || [];
  const totalUnpaid = unpaidItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">Record Payment - Invoice #{currentInvoice.invoiceNumber}</h2>
            <p className="text-sm text-gray-600">
              Patient: {currentInvoice.patient?.firstName} {currentInvoice.patient?.lastName}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Invoice:</span>
                <span className="font-semibold ml-1">Tsh. {currentInvoice.totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Paid:</span>
                <span className="font-semibold text-green-600 ml-1">Tsh. {currentInvoice.amountPaid.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Balance Due:</span>
                <span className="font-semibold text-red-600 ml-1">Tsh. {currentInvoice.balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Unpaid Items */}
          {unpaidItems.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                  Unpaid Services ({unpaidItems.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllUnpaid}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  {selectedItems.length > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {currentInvoice.items.map((item, index) => {
                  if (item.paid) return null;
                  return (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition ${
                        selectedItems.includes(index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleItemSelection(index)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(index)}
                            onChange={() => toggleItemSelection(index)}
                            className="mt-1 mr-3"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {item.type?.replace('_', ' ') || 'Service'}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-600">
                                  Qty: {item.quantity}
                                </span>
                              )}
                            </div>
                            {item.coveredByInsurance && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                                Insurance Coverage
                              </span>
                            )}
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg">Tsh. {item.total.toLocaleString()}</p>
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            Unpaid
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                <p className="text-sm text-orange-800">
                  <strong>Total Unpaid:</strong> Tsh. {totalUnpaid.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Paid Items */}
          {paidItems.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                Paid Services ({paidItems.length})
              </h3>
              <div className="space-y-2">
                {currentInvoice.items.map((item, index) => {
                  if (!item.paid) return null;
                  return (
                    <div
                      key={index}
                      className="p-4 border border-green-200 bg-green-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              {item.type?.replace('_', ' ') || 'Service'}
                            </span>
                            {item.paidAt && (
                              <span className="text-xs text-gray-600">
                                Paid: {new Date(item.paidAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-800">Tsh. {item.total.toLocaleString()}</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
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
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No items found in this invoice</p>
            </div>
          )}

          {unpaidItems.length === 0 && paidItems.length > 0 && (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-500" />
              <p className="text-lg font-semibold text-green-600">All items have been paid!</p>
              <p className="text-sm text-gray-600 mt-1">Invoice Status: {currentInvoice.status}</p>
            </div>
          )}
        </div>

        {/* Footer - Payment Section */}
        {unpaidItems.length > 0 && (
          <div className="border-t p-6 bg-gray-50">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input-field w-full"
              >
                <option value="cash">Cash</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="mobile_money">Mobile Money (M-Pesa, Tigo Pesa, etc.)</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Amount to Pay: <span className="text-blue-600">Tsh. {calculateTotal().toLocaleString()}</span>
                </p>
                {selectedItems.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining after payment: Tsh. {(currentInvoice.balanceDue - calculateTotal()).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={selectedItems.length === 0 || paymentMutation.isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {paymentMutation.isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Confirm Payment
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
