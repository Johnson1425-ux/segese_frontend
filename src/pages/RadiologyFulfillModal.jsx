import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { X, Upload, FileText } from 'lucide-react';
import api from '../utils/api';

const RadiologyFulfillModal = ({ request, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    findings: '',
    imageUrl: '',
    status: 'Completed'
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const updateMutation = useMutation(
    async (data) => {
      const response = await api.put(`/radiology/${request._id}`, data);
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Radiology request completed successfully!');
        queryClient.invalidateQueries('radiologyRequests');
        onClose();
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update request');
      }
    }
  );

  const resetForm = () => {
    setFormData({
      findings: '',
      imageUrl: '',
      status: 'Completed'
    });
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size should not exceed 10MB');
        return;
      }
      setImageFile(file);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('image', imageFile);

    try {
      const response = await api.post('/upload/radiology', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploading(false);
      return response.data.imageUrl;
    } catch (error) {
      setUploading(false);
      toast.error('Failed to upload image');
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.findings.trim()) {
      toast.error('Please provide findings');
      return;
    }

    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      await updateMutation.mutateAsync({
        ...formData,
        imageUrl
      });
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between px-6 py-4 bg-blue-600">
            <h3 className="text-xl font-semibold text-white">
              Complete Radiology Request
            </h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Patient:</span>
                <span className="ml-2 text-gray-900">
                  {request.patient?.firstName} {request.patient?.lastName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Scan Type:</span>
                <span className="ml-2 text-gray-900">{request.scanType}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Body Part:</span>
                <span className="ml-2 text-gray-900">{request.bodyPart}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Ordered By:</span>
                <span className="ml-2 text-gray-900">
                  Dr. {request.orderedBy?.lastName}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Reason:</span>
                <span className="ml-2 text-gray-900">{request.reason}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline mr-2" size={16} />
                Findings *
              </label>
              <textarea
                value={formData.findings}
                onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter detailed findings from the scan..."
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Upload className="inline mr-2" size={16} />
                Upload Scan Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*,.dcm"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, DICOM up to 10MB
                  </p>
                  {imageFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {imageFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Image URL
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/scan-image.jpg"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Keep Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={updateMutation.isLoading || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isLoading || uploading ? 'Processing...' : 'Complete Request'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyFulfillModal;