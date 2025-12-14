import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import { labTestService } from '../../utils/labTestService';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

const LabOrderForm = ({ visitId, existingOrders, patientId }) => {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm();

  const queryClient = useQueryClient();

  /** ----------------------------
   * Fetch ALL lab test services
   * ---------------------------- */
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

  /** ----------------------------
   * Create lab order mutation
   * ---------------------------- */
  const mutation = useMutation(labTestService.create, {
    onSuccess: () => {
      toast.success('Lab order added!');
      queryClient.invalidateQueries(['visit', visitId]);
      reset();
    },
    onError: (error) =>
      toast.error(error.response?.data?.message || 'Failed to add order.')
  });

  /** ----------------------------
   * Submit handler
   * ---------------------------- */
  const onSubmit = (data) => {
    if (!data.test) {
      toast.error('Please select a test.');
      return;
    }

    const orderData = {
      testName: data.test.value,
      notes: data.notes
    };

    mutation.mutate({
      visit: visitId,
      patient: patientId,
      orderData
    });
  };

  /** ----------------------------
   * Loading / Error states
   * ---------------------------- */
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <p className="text-red-500">Failed to load lab tests.</p>;

  /** ----------------------------
   * Dropdown options
   * ---------------------------- */
  const testOptions = labTests.map((service) => ({
    value: service.name,
    label: `${service.name} - Tsh.${service.price}`
  }));

  return (
    <div className="container mx-auto p-6">
      <h4 className="font-semibold mb-2">New Lab Order</h4>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 mb-6 p-4 border rounded-lg"
      >
        <div>
          <label className="label-field">Lab Test</label>
          <Controller
            name="test"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={testOptions}
                isClearable
                placeholder="Select a lab test"
              />
            )}
          />
        </div>

        <div>
          <label className="label-field">Notes (Optional)</label>
          <input {...register('notes')} className="input-field" />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            Add Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default LabOrderForm;
