import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { X, DollarSign, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../utils/api';

const UnpaidServicesModal = ({ visit, onClose }) => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Fetch the invoice
  const { data: invoice, isLoading, refetch } = useQuery(
    ['invoice', visit.invoice],
    () => api.get(`/billing/invoices/${visit.invoice}`).then(res => res.data.data),
    { 
      enabled: !!visit.invoice,
      refetchOnMount: 'always',
      cacheTime: 0,
      staleTime: 0
    }
  );

  // Mutation to pay for selected items
  const paymentMutation = useMutation(
    async (paymentData) => {
      const response = await api.post(`/billing/invoices/${visit.invoice}/pay-items`, paymentData);
      return response.data.data; // Return the updated invoice
    },
    {
      onSuccess: async (updatedInvoice) => {
        toast.success('Payment recorded successfully!');
        setSelectedItems([]);
        
        // Update the cache immediately with the response data
        queryClient.setQueryData(['invoice', visit.invoice], updatedInvoice);
        
        // Also refetch to ensure consistency
        await refetch();
        
        // Invalidate related queries
        queryClient.invalidateQueries(['visit', visit._id]);
        
        // Close modal after showing the updated state
        setTimeout(() => {
          onClose();
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

  const calculateTotal = () => {
    if (!invoice) return 0;
    return selectedItems.reduce((sum, index) => {
      return sum + invoice.items[index].total;
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

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  const unpaidItems = invoice?.items?.filter(item => !item.paid) || [];
  const paidItems = invoice?.items?.filter(item => item.paid) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Invoice Items - {invoice?.invoiceNumber}</h2>
            <p className="text-sm text-gray-600">
              Patient: {visit.patient?.firstName} {visit.patient?.lastName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Unpaid Items */}
          {unpaidItems.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                Unpaid Services ({unpaidItems.length})
              </h3>
              <div className="space-y-2">
                {invoice.items.map((item, index) => {
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
                            <p className="text-sm text-gray-600">
                              Type: {item.type?.replace('_', ' ') || 'Service'}
                            </p>
                            {item.coveredByInsurance && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded mt-1 inline-block">
                                Insurance Coverage
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
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
                {invoice.items.map((item, index) => {
                  if (!item.paid) return null;
                  return (
                    <div
                      key={index}
                      className="p-4 border border-green-200 bg-green-50 rounded-lg opacity-75"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-gray-600">
                            Type: {item.type?.replace('_', ' ') || 'Service'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">Tsh. {item.total.toLocaleString()}</p>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            Paid
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
                <option value="mobile_money">Mobile Money</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
                </p>
                <p className="text-2xl font-bold">
                  Total: Tsh. {calculateTotal().toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default UnpaidServicesModal;
