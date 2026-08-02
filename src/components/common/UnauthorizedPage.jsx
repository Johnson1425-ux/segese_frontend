import { Shield, ArrowLeft, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const UnauthorizedPage = ({ requiredRole, requiredPermissions }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You don&apos;t have permission to access this resource.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            {requiredRole && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Required Role</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700">
                    This page requires the <strong>{requiredRole}</strong> role.
                  </p>
                </div>
              </div>
            )}

            {requiredPermissions && requiredPermissions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Required Permissions</h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm text-blue-700 mb-2">You need the following permissions:</p>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    {requiredPermissions.map((permission, index) => (
                      <li key={index}>{permission}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <Shield className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">What you can do:</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Contact your administrator to request access</li>
                      <li>Check if you&apos;re logged in with the correct account</li>
                      <li>Return to the dashboard or previous page</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? <Link to="/about#contact" className="text-blue-600 hover:text-blue-500">Contact support</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
