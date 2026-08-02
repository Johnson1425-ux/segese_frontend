import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const LabOrderForm = ({ visitId, visitStatus }) => {
  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const queryClient = useQueryClient();
  const [paymentRequired, setPaymentRequired] = useState(false);

  // Fetch all lab tests
  const {
    data: labTests,
    isLoading,
    isError
  } = useQuery(
    ['lab-tests'],
    async () => {
      const { data } = await api.get('/services?category=Lab Test');
      return data.data;
    }
  );

  // Convert lab tests to react-select options format
  const labTestOptions = React.useMemo(() => {
    if (!labTests) return [];
    return labTests.map(test => ({
      value: test.name || test.serviceName,
      label: test.name || test.serviceName,
      id: test._id || test.id
    }));
  }, [labTests]);

  // Create lab order mutation
  const mutation = useMutation(
    async (orderData) => {
      const response = await api.post(`/visits/${visitId}/lab-orders`, orderData);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Lab order added!');
        queryClient.invalidateQueries(['visit', visitId]);
        setPaymentRequired(false);
        reset();
      },
      onError: (error) => {
        if (error.response?.data?.requiresPayment) {
          setPaymentRequired(true);
          toast.error('Payment required before ordering lab tests. Please direct patient to reception for payment.', {
            duration: 5000,
          });
        } else {
          toast.error(error.response?.data?.message || 'Failed to add order.');
        }
      },
    }
  );

  const onSubmit = (data) => {
    if (!data.test) {
      toast.error("Please select a test.");
      return;
    }
    
    // Pass only the order data - visitId is already in the URL
    const orderData = { 
      testName: data.test.value, 
      notes: data.notes 
    };
    
    mutation.mutate(orderData);
  };

  // Check if visit is pending payment
  const isPendingPayment = visitStatus === 'Pending Payment';

  return (
    <div className="container mx-auto p-6">
      <h4 className="font-semibold mb-2">New Lab Order</h4>
      
      {/* Payment Warning Banner */}
      {(isPendingPayment || paymentRequired) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">
                Payment Required
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                This patient needs to complete payment at reception before lab tests can be ordered.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 border rounded-lg">
        <div>
          <label className="label-field">Select Lab Test</label>
          <Controller
            name="test"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={labTestOptions}
                isClearable
                isSearchable
                placeholder={isLoading ? "Loading lab tests..." : "Select a lab test..."}
                isDisabled={isPendingPayment || isLoading}
                isLoading={isLoading}
                noOptionsMessage={() => isError ? "Error loading tests" : "No tests available"}
              />
            )}
          />
        </div>
        <div>
          <label className="label-field">Notes (Optional)</label>
          <input 
            {...register('notes')} 
            className="input-field"
            disabled={isPendingPayment}
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={isSubmitting || isPendingPayment || isLoading}
          >
            Add Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabOrderForm;
