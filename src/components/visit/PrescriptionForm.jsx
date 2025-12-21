import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const prescriptionService = {
  create: (data) => api.post('/prescriptions', data)
};

const medicationService = {
  getAll: (params) => api.get('/medications', { params })
};

const PrescriptionForm = ({ visitId, patientId, existingPrescriptions }) => {
  const { control, handleSubmit, register, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      medication: null,
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    }
  });
  const queryClient = useQueryClient();

  // Fetch all medications
  const { data: medicationsData, isLoading: isLoadingMedications } = useQuery(
    'medications',
    () => medicationService.getAll(),
    {
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (error) => {
        console.error('Error fetching medications:', error);
        toast.error('Failed to load medications');
      }
    }
  );

  // Transform medications to options format
  const medicationOptions = React.useMemo(() => {
    if (!medicationsData?.data?.data) return [];
    
    return medicationsData.data.data.map(medication => ({
      value: medication.name,
      label: `${medication.name} - $${medication.price}`,
      price: medication.price,
      genericName: medication.genericName,
      strength: medication.strength
    }));
  }, [medicationsData]);

  const mutation = useMutation(prescriptionService.create, {
    onSuccess: () => {
      toast.success('Prescription added successfully!');
      queryClient.invalidateQueries(['visit', visitId]);
      reset();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to add prescription.';
      toast.error(errorMessage);
    },
  });

  const onSubmit = (data) => {
    // Validate that medication is selected
    if (!data.medication || !data.medication.value) {
      toast.error('Please select a medication');
      return;
    }

    // Prepare the prescription data
    const prescriptionData = {
      medication: data.medication.value,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      notes: data.notes
    };

    // Send to backend
    mutation.mutate({ 
      visitId, 
      patient: patientId, 
      prescriptionData 
    });
  };

  return (
    <div>
      <h4 className="font-semibold mb-2">New Prescription</h4>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-6 p-4 border rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label-field">Medication *</label>
            <Controller
              name="medication"
              control={control}
              rules={{ required: 'Medication is required' }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={medicationOptions}
                  isLoading={isLoadingMedications}
                  isClearable
                  isSearchable
                  placeholder="Select a medication..."
                  noOptionsMessage={() => "No medications available"}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderColor: '#d1d5db',
                    })
                  }}
                />
              )}
            /> 
          </div>
          <div>
            <label className="label-field">Dosage (e.g., 1 tablet) *</label>
            <input 
              {...register('dosage', { required: true })} 
              className="input-field" 
              placeholder="e.g., 500mg"
            />
          </div>
          <div>
            <label className="label-field">Frequency (e.g., Twice a day) *</label>
            <input 
              {...register('frequency', { required: true })} 
              className="input-field" 
              placeholder="e.g., Twice daily"
            />
          </div>
          <div>
            <label className="label-field">Duration (e.g., 7 days)</label>
            <input 
              {...register('duration')} 
              className="input-field" 
              placeholder="e.g., 7 days"
            />
          </div>
        </div>
        <div>
          <label className="label-field">Notes (Optional)</label>
          <textarea 
            {...register('notes')} 
            className="input-field" 
            rows="2"
            placeholder="Additional instructions or notes"
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isSubmitting || mutation.isLoading || isLoadingMedications}
          >
            {mutation.isLoading ? 'Adding...' : 'Add Prescription'}
          </button>
        </div>
      </form>

      <h4 className="font-semibold mb-2">Existing Prescriptions</h4>
      {existingPrescriptions && existingPrescriptions.length > 0 ? (
        <ul className="space-y-2">
          {existingPrescriptions.map(p => (
            <li key={p._id} className="p-3 border rounded-md bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{p.medication}</p>
                  <p className="text-sm text-gray-600">
                    {p.dosage} • {p.frequency}
                    {p.duration && ` • ${p.duration}`}
                  </p>
                  {p.notes && (
                    <p className="text-sm text-gray-500 mt-1">{p.notes}</p>
                  )}
                </div>
                {p.isActive !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">No prescriptions yet.</p>
      )}
    </div>
  );
};

export default PrescriptionForm;
