import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, FileText, Plus, DollarSign, Calendar, User } from 'lucide-react';
import { billingService } from '../utils/billingService.js';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';

const Invoices = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: invoiceData, isLoading, isError } = useQuery(
        ['invoices', currentPage, statusFilter, searchTerm],
        () => billingService.getAllInvoices({ page: currentPage, limit: 10, status: statusFilter, search: searchTerm }),
        { keepPreviousData: true }
    );

    const invoices = invoiceData?.data?.data?.invoices || [];
    const totalPages = invoiceData?.data?.data?.pagination?.totalPages || 1;

    const getStatusChip = (status) => {
        const statusClasses = {
            paid: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            overdue: 'bg-red-100 text-red-800',
            partial: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };
        return <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] md:text-xs font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100'}`}>{status}</span>;
    };

    if (isLoading) return <LoadingSpinner />;
    if (isError) return <div className="text-red-500">Error loading invoices.</div>;

    return (
        <div className="p-2 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">Invoice Management</h1>
                <Link to="/billing/invoices/new" className="btn-primary inline-flex items-center w-full sm:w-auto justify-center text-xs sm:text-sm">
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Create New Invoice</span>
                    <span className="sm:hidden">New Invoice</span>
                </Link>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name or invoice #"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-8 sm:pl-10 w-full text-xs sm:text-sm"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                        className="input-field pl-8 sm:pl-10 w-full sm:w-auto text-xs sm:text-sm"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="partial">Partial</option>
                        <option value="overdue">Overdue</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase">Patient</th>
                                <th className="px-4 md:px-6 py-2 md:py-3 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 md:px-6 py-2 md:py-3 text-right text-[10px] md:text-xs font-medium text-gray-500 uppercase">Amount (TZS)</th>
                                <th className="px-4 md:px-6 py-2 md:py-3 text-center text-[10px] md:text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="relative px-4 md:px-6 py-2 md:py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-gray-50">
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap font-mono text-xs md:text-sm">{invoice.invoiceNumber}</td>
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{invoice.patient?.firstName} {invoice.patient?.lastName}</td>
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm">{new Date(invoice.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm">{invoice.totalAmount.toLocaleString()}</td>
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">{getStatusChip(invoice.status)}</td>
                                    <td className="px-4 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm font-medium">
                                        <Link to={`/billing/invoices/${invoice._id}`} className="text-blue-600 hover:text-blue-800">
                                            <Eye className="inline h-4 w-4 md:h-5 md:w-5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {invoices.map((invoice) => (
                    <div key={invoice._id} className="bg-white shadow-md rounded-lg p-3 border border-gray-200">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <span className="font-mono text-xs font-semibold text-gray-900 truncate">
                                        {invoice.invoiceNumber}
                                    </span>
                                </div>
                                <div className="flex items-center text-xs text-gray-600">
                                    <User className="w-3 h-3 mr-1 flex-shrink-0" />
                                    <span className="truncate">{invoice.patient?.firstName} {invoice.patient?.lastName}</span>
                                </div>
                            </div>
                            <div className="flex-shrink-0 ml-2">
                                {getStatusChip(invoice.status)}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-600">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{new Date(invoice.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center">
                                    <DollarSign className="w-3 h-3 text-gray-400" />
                                    <span className="text-sm font-bold text-gray-900">
                                        {invoice.totalAmount.toLocaleString()} TZS
                                    </span>
                                </div>
                                <Link 
                                    to={`/billing/invoices/${invoice._id}`} 
                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                                >
                                    <Eye className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {invoices.length === 0 && (
                <div className="bg-white shadow-md rounded-lg p-8 sm:p-12 text-center">
                    <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                        {searchTerm || statusFilter !== 'all' 
                            ? 'Try adjusting your search or filter criteria.' 
                            : 'Get started by creating your first invoice.'}
                    </p>
                    {!searchTerm && statusFilter === 'all' && (
                        <Link to="/billing/invoices/new" className="btn-primary inline-flex items-center text-xs sm:text-sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Invoice
                        </Link>
                    )}
                </div>
            )}

            {/* Pagination Controls */}
            {invoices.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3 sm:mt-4">
                    <button 
                        onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                        disabled={currentPage === 1} 
                        className="btn-secondary disabled:opacity-50 w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center"
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="text-xs sm:text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                        disabled={currentPage === totalPages} 
                        className="btn-secondary disabled:opacity-50 w-full sm:w-auto text-xs sm:text-sm flex items-center justify-center"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 sm:ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Invoices;