import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { visitService } from '../../utils/visitService';

const DiagnosisForm = ({ visitId }) => {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();
  const queryClient = useQueryClient();

  const mutation = useMutation(visitService.updateDiagnosis, {
    onSuccess: () => {
      toast.success('Diagnosis saved!');
      queryClient.invalidateQueries(['visit', visitId]);
      reset();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to save diagnosis.'),
  });

  const onSubmit = (data) => {
    const diagnosisData = { condition: data.condition, icd10Code: data.icd10Code, notes: data.notes };
    mutation.mutate({ visitId, diagnosisData });
  };

  // if (isLoading) {
  //   return <div className="flex justify-center"><LoadingSpinner /></div>;
  // }

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label-field">Condition</label>
          <input {...register('condition', { required: true })} className="input-field" />
        </div>
        <div>
          <label className="label-field">ICD-10 Code</label>
          <input {...register('icd10Code')} className="input-field" />
        </div>
        <div>
          <label className="label-field">Notes</label>
          <textarea {...register('notes')} className="input-field" rows="4"></textarea>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Diagnosis'}
          </button>
        </div>
      </form>
      <h4 className="font-semibold mb-2">Existing Orders</h4>
      {/* <ul className="space-y-2">
        {existingDiagnosis?.map(order => (
          <li key={order._id} className="p-2 border rounded-md bg-gray-50">{order.testName} - <span className="capitalize text-gray-600">{order.status}</span></li>
        ))}
      </ul> */}
    </div>
  );
};

export default DiagnosisForm;