import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone, Shield, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const Profile = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      gender: user?.gender || '',
      address: user?.address || '',
      department: user?.department || '',
    },
  });

  const onSubmit = async (data) => {
    try {
      await updateProfile(data);
      setIsEditing(false);
      reset(data);
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          setError(err.field, { message: err.message });
        });
      } else {
        setError('root', { message: error.message || 'Failed to update profile' });
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset();
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Administrator',
      doctor: 'Doctor',
      receptionist: 'Receptionist',
      pharmacist: 'Pharmacist',
      lab_technician: 'Lab Technician',
      radiologist:  'Radiologist',
      mortuary_attendant: 'Mortuary Attendant',
      user: 'User',
    };
    return roleNames[role] || role;
  };

  const getStatusBadge = (isActive, isEmailVerified) => {
    if (!isActive) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Inactive</span>;
    }
    if (!isEmailVerified) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unverified</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
  };

  // Format date for display in input field
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <p className="text-sm text-gray-600">Manage your account information and preferences</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 py-6 space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <div className="h-24 w-24 rounded-full bg-gray-300 flex items-center justify-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt="Profile"
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-2 flex items-center space-x-4">
                  {getStatusBadge(user?.isActive, user?.isEmailVerified)}
                  {user?.employeeId && (
                    <span className="text-bold text-gray-600">
                      {user.employeeId}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1 relative">
                    <div className='relative block px-3 py-2 border border-gray-300 bg-gray-50 rounded-md'>
                      <span className="text-md text-gray-800">{user?.firstName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="relative px-3 py-2 border border-gray-300 bg-gray-50 rounded-md">
                      <span className="text-md text-gray-800">{user?.lastName}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="email"
                      type="email"
                      disabled={!isEditing}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <div className="mt-1 relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      id="phone"
                      type="tel"
                      disabled={!isEditing}
                      {...register('phone', {
                        pattern: {
                          value: /^\+?[1-9]\d{0,15}$/,
                          message: 'Invalid phone number',
                        },
                      })}
                      className={`appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                    Date of Birth
                  </label>
                  <div className="mt-1 relative">
                    <div className=" relative px-3 py-2 border border-gray-300 bg-gray-50 rounded-md">
                      <span className='text-md text-gray-800'>{formatDate(user?.dateOfBirth)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <div className="mt-1 relative">
                    <div className="relative px-3 py-2 border border-gray-300 bg-gray-50 rounded-md">
                      <span className="text-md text-gray-800">{user?.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <div className="mt-1 relative">
                    <textarea
                      id="address"
                      rows="2"
                      disabled={!isEditing}
                      {...register('address')}
                      className={`appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                        !isEditing ? 'bg-gray-50' : ''
                      }`}
                      placeholder="Enter your complete address"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            {(user?.role === 'doctor' || user?.role === 'nurse' || user?.role === 'receptionist' || user?.role === 'pharmacist' || user?.role === 'lab_technician') && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {user?.role === 'doctor' && (
                    <>
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                          Department
                        </label>
                        <div className="mt-1 flex relative block px-3 py-2 border border-gray-300 rounded-md">
                          <span className="text-md text-gray-800"> {user?.department} </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Account Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <div className="mt-1 flex items-center">
                    <Shield className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{getRoleDisplayName(user?.role)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Role cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Status</label>
                  <div className="mt-1">
                    {getStatusBadge(user?.isActive, user?.isEmailVerified)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Login</label>
                  <div className="mt-1">
                    <span className="text-sm text-gray-900">
                      {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Never'}
                    </span>
                  </div>
                </div>

                {user?.failedLoginAttempts > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failed Login Attempts</label>
                    <div className="mt-1">
                      <span className="text-sm text-red-600">{user.failedLoginAttempts}</span>
                    </div>
                  </div>
                )}

                {user?.lockUntil && new Date(user.lockUntil) > new Date() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Locked Until</label>
                    <div className="mt-1">
                      <span className="text-sm text-red-600">
                        {new Date(user.lockUntil).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* General Error */}
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{errors.root.message}</div>
              </div>
            )}

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;