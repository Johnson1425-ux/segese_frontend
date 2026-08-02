import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const ErrorFallback = ({ error, resetErrorBoundary }) => {
  const handleGoHome = () => {
    // Use window.location instead of useNavigate to avoid router context issues
    window.location.href = '/dashboard';
    resetErrorBoundary();
  };

  const handleRetry = () => {
    resetErrorBoundary();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We&apos;re sorry, but something unexpected happened. Please try again or contact support if the problem persists.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Details</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700 font-mono break-all">
                  {error?.message || 'Unknown error occurred'}
                </p>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleRetry}
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={handleGoHome}
                className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                If this problem continues, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;