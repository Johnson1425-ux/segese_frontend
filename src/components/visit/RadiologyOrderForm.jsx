import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import Select from 'react-select';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const RadiologyOrderForm = ({ visitId, patientId }) => {
const { control, register, handleSubmit, reset, formState: { errors } } = useForm();
const queryClient = useQueryClient();

// Fetch all Imaging services
const { data: imagingServices, isLoading: servicesLoading } = useQuery(
'imagingServices',
async () => {
const { data } = await api.get('/services?category=Imaging');
return data.data;
},
{
staleTime: 5 * 60 * 1000, // Cache for 5 minutes
onError: (error) => {
toast.error('Failed to load imaging services');
console.error('Error fetching imaging services:', error);
}
}
);

// Transform services into select options
const serviceOptions = React.useMemo(() => {
if (!imagingServices) return [];
return imagingServices.map(service => ({
value: service.name,
label: `${service.name} - Tsh.${service.price.toLocaleString()}`,
price: service.price
}));
}, [imagingServices]);

// Mutation for creating radiology order
const mutation = useMutation(
(orderData) => api.post(`/visits/${visitId}/radiology-orders`, orderData),
{
onSuccess: (response) => {
toast.success(response.data.message || 'Radiology order created successfully!');
queryClient.invalidateQueries(['visit', visitId]);
reset();
},
onError: (error) => {
toast.error(error.response?.data?.message || 'Failed to create radiology order.');
},
}
);

const onSubmit = (data) => {
if (!data.scanType) {
toast.error('Please select a scan type.');
return;
}

const orderData = {
  orderData: {
    scanType: data.scanType.value,
    bodyPart: data.bodyPart,
    reason: data.reason
  }
};

mutation.mutate(orderData);
};

return (
<div className="p-4 border rounded-lg bg-white">
<h4 className="text-xl font-semibold mb-4 text-gray-700">Order Radiology Scan</h4>
<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
<div>
<label className="label-field">Select Scan Type</label>
<Controller
name="scanType"
control={control}
rules={{ required: 'Scan type is required' }}
render={({ field }) => (
<Select
{...field}
options={serviceOptions}
isLoading={servicesLoading}
isClearable
placeholder="Select a scan type..."
noOptionsMessage={() => 'No imaging services available'}
/>
)}
/>
{errors.scanType && (
<p className="text-red-500 text-sm mt-1">{errors.scanType.message}</p>
)}
</div>
    <div>
      <label className="label-field">Body Part to Scan</label>
      <input 
        {...register('bodyPart', { required: 'Body part is required' })} 
        className="input-field"
        placeholder="e.g., Chest, Abdomen, Head"
      />
      {errors.bodyPart && (
        <p className="text-red-500 text-sm mt-1">{errors.bodyPart.message}</p>
      )}
    </div>

    <div>
      <label className="label-field">Reason for Scan / Clinical Notes</label>
      <textarea 
        {...register('reason', { required: 'Reason is required' })} 
        className="input-field" 
        rows="3"
        placeholder="Enter clinical indication for the scan..."
      ></textarea>
      {errors.reason && (
        <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
      )}
    </div>

    <div className="flex justify-end">
      <button 
        type="submit" 
        className="btn-primary" 
        disabled={mutation.isLoading || servicesLoading}
      >
        {mutation.isLoading ? 'Submitting...' : 'Submit Request'}
      </button>
    </div>
  </form>
</div>

);
};

export default RadiologyOrderForm;