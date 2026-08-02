import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, DollarSign, Tag, Type, Loader2 } from 'lucide-react';
import serviceService from '../utils/serviceService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const ServiceForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Fetch service data if editing
  const { isLoading } = useQuery(
    ['service', id],
    () => serviceService.getServiceById(id).then(res => res.data.data),
    {
      enabled: isEditing,
      onSuccess: (data) => reset(data),
    }
  );

  // Mutation for creating/updating a service
  const serviceMutation = useMutation(
    (data) => isEditing ? serviceService.updateService(id, data) : serviceService.createService(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('services');
        toast.success(`Service ${isEditing ? 'updated' : 'created'} successfully!`);
        navigate('/services');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Operation failed.');
      },
    }
  );

  const onSubmit = (data) => {
    serviceMutation.mutate(data);
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{isEditing ? 'Edit Service' : 'Add New Service'}</h1>
        <button onClick={() => navigate('/services')} className="btn-secondary flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Services
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service Name</label>
          <div className="relative mt-1">
            <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="name"
              {...register('name', { required: 'Service name is required' })}
              className="input-field pl-10"
              placeholder="e.g., Doctor's Consultation"
            />
          </div>
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <div className="relative mt-1">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select id="category" {...register('category', { required: 'Category is required' })} className="input-field pl-10">
              <option value="">Select a category</option>
              <option value="Consultation">Consultation</option>
              <option value="Procedure">Procedure</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Imaging">Imaging</option>
              <option value="Other">Other</option>
            </select>
          </div>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (TZS)</label>
           <div className="relative mt-1">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="price"
              type="number"
              {...register('price', { required: 'Price is required', valueAsNumber: true })}
              className="input-field pl-10"
              placeholder="e.g., 50000"
            />
          </div>
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            {...register('description')}
            rows="3"
            className="input-field mt-1"
            placeholder="Optional: A brief description of the service."
          />
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button type="submit" disabled={serviceMutation.isLoading} className="btn-primary flex items-center disabled:opacity-50">
            {serviceMutation.isLoading ? <Loader2 className="animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {serviceMutation.isLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Service')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;