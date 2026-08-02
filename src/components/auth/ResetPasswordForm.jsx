import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, Link, useNavigate, NavLink } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft, AlertCircle, Check, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const ResetPasswordForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { resetToken } = useParams();
  const { resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm();

  const password = watch('password');

  // Password strength validation
  const passwordChecks = {
    length: password?.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };

  const onSubmit = async (data) => {
    try {
      await resetPassword(resetToken, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach((err) => {
          setError(err.field, { message: err.message });
        });
      } else {
        setError('root', { message: error.message || 'Failed to reset password' });
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <NavLink 
            to="/home" 
            className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </NavLink>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Password reset successful!
            </h2>
            
            <p className="text-gray-600 mb-8">
              Your password has been successfully reset. You will be redirected to the login page in a few seconds.
            </p>

            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
            >
              Go to login
            </Link>
          </div>

          <div className="text-center mt-8">
            <div className="flex items-center justify-center space-x-2 text-gray-600">
              <div 
                className="w-14 h-14 rounded-lg transform group-hover:scale-110 transition-transform duration-300 bg-cover bg-center"
                style={{ backgroundImage: "url('/SMC Logo.png')" }}
              >
              </div>
              <span className="text-md">SEGESE MEDICAL CLINIC</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <NavLink 
          to="/home" 
          className="inline-flex items-center text-gray-600 hover:text-blue-600 mb-8 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </NavLink>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset your password
            </h2>
            
            <p className="text-gray-600">
              Choose a strong password to secure your account
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: 'Password does not meet requirements',
                    },
                  })}
                  className={`appearance-none block w-full pl-12 pr-12 py-3 border ${
                    errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 transition-colors duration-200`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Password requirements:</h4>
                <div className="space-y-2">
                  {[
                    { check: passwordChecks.length, text: 'At least 8 characters' },
                    { check: passwordChecks.uppercase, text: 'One uppercase letter' },
                    { check: passwordChecks.lowercase, text: 'One lowercase letter' },
                    { check: passwordChecks.number, text: 'One number' },
                    { check: passwordChecks.special, text: 'One special character (@$!%*?&)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      {item.check ? (
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                      )}
                      <span className={item.check ? 'text-green-700' : 'text-gray-600'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  className={`appearance-none block w-full pl-12 pr-12 py-3 border ${
                    errors.confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 transition-colors duration-200`}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* General Error */}
            {errors.root && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errors.root.message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Resetting...
                </>
              ) : (
                'Reset password'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center pt-4">
              <Link
                to="/login"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to login
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <div 
              className="w-14 h-14 rounded-lg transform group-hover:scale-110 transition-transform duration-300 bg-cover bg-center"
              style={{ backgroundImage: "url('/SMC Logo.png')" }}
            >
            </div>
            <span className="text-md">SEGESE MEDICAL CLINIC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;