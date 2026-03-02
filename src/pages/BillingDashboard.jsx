import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Plus,
  Search,
  Download,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import { toast } from 'react-hot-toast';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    invoices: {},
    payments: [],
    overdueCount: 0
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsResponse = await api.get('/billing/statistics');
      setStatistics(statsResponse.data.data);

      // Fetch recent invoices
      const invoicesResponse = await api.get('/billing/invoices?limit=5');
      setRecentInvoices(invoicesResponse.data.data.invoices);

      // Fetch recent payments
      const paymentsResponse = await api.get('/billing/payments?limit=5');
      setRecentPayments(paymentsResponse.data.data.payments);

    } catch (error) {
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'overdue': 'bg-red-100 text-red-800',
      'partial': 'bg-blue-100 text-blue-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Billing Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-600">Manage invoices, payments, and financial reports</p>
        </div>
        <div className="flex space-x-2 w-full sm:w-auto">
          <button
            onClick={fetchBillingData}
            className="flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => navigate('/billing/invoices/new')}
            className="flex-1 sm:flex-none flex items-center justify-center px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-gray-900 truncate">
                {formatCurrency(statistics.invoices.totalAmount)}
              </p>
            </div>
            <div className="bg-blue-100 p-1.5 sm:p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4">
            <span className="text-[9px] sm:text-xs md:text-sm text-gray-600">
              {statistics.invoices.totalInvoices || 0} invoices
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Total Collected</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-green-600 truncate">
                {formatCurrency(statistics.invoices.totalPaid)}
              </p>
            </div>
            <div className="bg-green-100 p-1.5 sm:p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4">
            <span className="text-[9px] sm:text-xs md:text-sm text-gray-600">
              {((statistics.invoices.totalPaid / statistics.invoices.totalAmount) * 100 || 0).toFixed(1)}% collected
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Outstanding</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-orange-600 truncate">
                {formatCurrency(statistics.invoices.totalDue)}
              </p>
            </div>
            <div className="bg-orange-100 p-1.5 sm:p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4">
            <span className="text-[9px] sm:text-xs md:text-sm text-gray-600">
              Pending collection
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600 truncate">Overdue</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold text-red-600 truncate">
                {statistics.overdueCount || 0}
              </p>
            </div>
            <div className="bg-red-100 p-1.5 sm:p-2 md:p-3 rounded-full flex-shrink-0 ml-2">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 md:mt-4">
            <span className="text-[9px] sm:text-xs md:text-sm text-gray-600">
              Invoices overdue
            </span>
          </div>
        </div>
      </div>

      <div >
        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold">Recent Invoices</h2>
              <button
                onClick={() => navigate('/billing/invoices')}
                className="text-[10px] sm:text-xs md:text-sm text-blue-600 hover:text-blue-800"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentInvoices.map((invoice) => (
              <div
                key={invoice._id}
                className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/billing/invoices/${invoice._id}`)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">{invoice.invoiceNumber}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 truncate">
                      {invoice.patient?.firstName} {invoice.patient?.lastName}
                    </p>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm md:text-base font-medium truncate">{formatCurrency(invoice.totalAmount)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        {/* <div className="bg-white rounded-lg shadow">
          <div className="p-3 sm:p-4 md:p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold">Recent Payments</h2>
              <button
                onClick={() => navigate('/billing/payments')}
                className="text-[10px] sm:text-xs md:text-sm text-blue-600 hover:text-blue-800"
              >
                View all →
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentPayments.map((payment) => (
              <div key={payment._id} className="p-2 sm:p-3 md:p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-gray-900 truncate">{payment.paymentNumber}</p>
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 truncate">
                      {payment.patient?.firstName} {payment.patient?.lastName}
                    </p>
                    <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 truncate">
                      {payment.method.replace('_', ' ')} • {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs sm:text-sm md:text-base font-medium text-green-600 truncate">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className={`text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => navigate('/billing/invoices')}
            className="p-2 sm:p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1 sm:mb-2 text-gray-600" />
            <span className="text-[10px] sm:text-xs md:text-sm block">Manage Invoices</span>
          </button>
          <button
            onClick={() => navigate('/billing/insurance')}
            className="p-2 sm:p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1 sm:mb-2 text-gray-600" />
            <span className="text-[10px] sm:text-xs md:text-sm block">Insurance Claims</span>
          </button>
          <button
            onClick={() => navigate('/billing/statements')}
            className="p-2 sm:p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-center"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mx-auto mb-1 sm:mb-2 text-gray-600" />
            <span className="text-[10px] sm:text-xs md:text-sm block">Patient Statements</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;