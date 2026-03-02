import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const prescriptionService = {
  create: ({ visitId, ...data }) => api.post(`/visits/${visitId}/prescriptions`, data)
};

const medicineService = {
  getAll: (params) => api.get('/medicines', { params })
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

  // Fetch all medicines
  const { data: medicinesData, isLoading: isLoadingMedicines } = useQuery(
    'medicines',
    () => medicineService.getAll(),
    {
      staleTime: 5 * 60 * 1000,
      onError: (error) => {
        console.error('Error fetching medicines:', error);
        toast.error('Failed to load medicines');
      }
    }
  );

  // Transform medicines to options format
  const medicineOptions = React.useMemo(() => {
    if (!medicinesData?.data?.data) return [];
    
    return medicinesData.data.data.map(medicine => ({
      value: medicine.name,
      label: `${medicine.name}${medicine.strength ? ` ${medicine.strength}` : ''}`,
      genericName: medicine.genericName,
      strength: medicine.strength,
      type: medicine.type,
      manufacturer: medicine.manufacturer
    }));
  }, [medicinesData]);

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

    // Prepare and send the prescription data
    mutation.mutate({ 
      visitId,
      medication: data.medication.value,
      type:data.medication.type,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration,
      notes: data.notes,
      patient: patientId
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
                  options={medicineOptions}
                  isLoading={isLoadingMedicines}
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
            disabled={isSubmitting || mutation.isLoading || isLoadingMedicines}
          >
            {mutation.isLoading ? 'Adding...' : 'Add Prescription'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrescriptionForm;
