import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { visitService } from '../../utils/visitService';

const VitalsForm = ({ visitId, existingVitals }) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: existingVitals || {},
  });
  const queryClient = useQueryClient();

  const mutation = useMutation(visitService.updateVitals, {
    onSuccess: () => {
      toast.success('Vitals updated successfully!');
      queryClient.invalidateQueries(['visit', visitId]);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update vitals.'),
  });

  const onSubmit = (data) => {
    mutation.mutate({ visitId, vitalsData: data });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label-field">Temperature (°C)</label>
          <input type="number" step="0.1" {...register('temperature', { valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label-field">Blood Pressure (e.g., 120/80)</label>
          <input {...register('bloodPressure')} className="input-field" />
        </div>
        <div>
          <label className="label-field">Heart Rate (bpm)</label>
          <input type="number" {...register('heartRate', { valueAsNumber: true })} className="input-field" />
        </div>
        <div>
          <label className="label-field">Oxygen Saturation (%)</label>
          <input type="number" {...register('oxygenSaturation', { valueAsNumber: true })} className="input-field" />
        </div>
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Vitals'}
        </button>
      </div>
    </form>
  );
};

export default VitalsForm;