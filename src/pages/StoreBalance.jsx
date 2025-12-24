import { useState, useEffect } from "react";
import { AlertCircle, Package, TrendingDown } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from "../utils/api";
import { toast } from "react-hot-toast";

export default function StoreBalance() {
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, low, sufficient

  useEffect(() => {
    fetchStockBalance();
  }, []);

  const fetchStockBalance = async () => {
    try {
      const response = await api.get("/stock/balance");
      setStockItems(response.data.data);
    } catch (err) {
      toast.error("Failed to fetch stock balance.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  const filteredItems = stockItems.filter(item => {
    if (filter === 'low') return item.isLowStock;
    if (filter === 'sufficient') return !item.isLowStock;
    return true;
  });

  const lowStockCount = stockItems.filter(item => item.isLowStock).length;
  const totalValue = stockItems.reduce((sum, item) => 
    sum + (item.totalQuantity * (item.medicine?.sellingPrice || 0)), 0
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start md:items-center mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <Package className="mr-2 md:mr-3" size={24} />
              <span className="hidden sm:inline">Store Balance</span>
              <span className="sm:hidden">Balance</span>
            </h1>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Current inventory levels</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-4 md:mb-6">
          <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Total Items</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">{stockItems.length}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Low Stock Items</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">{lowStockCount}</p>
              </div>
              <AlertCircle className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg md:rounded-xl shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs md:text-sm">Total Stock Value</p>
                <p className="text-xl md:text-3xl font-bold text-green-600">
                  {totalValue.toLocaleString()} TZS
                </p>
              </div>
              <TrendingDown className="text-green-500" size={32} />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-3 md:p-4 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:gap-0">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                filter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Items ({stockItems.length})
            </button>
            <button
              onClick={() => setFilter('low')}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                filter === 'low' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setFilter('sufficient')}
              className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium ${
                filter === 'sufficient' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sufficient ({stockItems.length - lowStockCount})
            </button>
          </div>
        </div>

        {/* Stock Table */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-md p-3 md:p-6 overflow-x-auto">
          <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Current Stock Levels</h2>
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Medicine</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase">Strength</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Batches</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-right text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Reorder</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden xl:table-cell">Expiry</th>
                    <th className="px-2 md:px-6 py-2 md:py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-2 md:px-6 py-6 md:py-10 text-center text-gray-500 text-sm">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50">
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap">
                          <div className="text-xs md:text-sm font-medium text-gray-900">
                            {item.medicine?.name}
                          </div>
                          {item.medicine?.genericName && (
                            <div className="text-xs text-gray-500 hidden md:block">
                              {item.medicine.genericName}
                            </div>
                          )}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                          {item.medicine?.type}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600">
                          {item.medicine?.strength || '-'}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right">
                          <div className={`text-xs md:text-sm font-semibold ${
                            item.isLowStock ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {item.totalQuantity}
                          </div>
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm text-gray-600 hidden sm:table-cell">
                          {item.batchCount}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-right text-xs md:text-sm text-gray-600 hidden lg:table-cell">
                          {item.reorderLevel}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-600 hidden xl:table-cell">
                          {item.nearestExpiry ? new Date(item.nearestExpiry).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-2 md:px-6 py-2 md:py-4 whitespace-nowrap text-center">
                          <span className={`px-2 md:px-3 py-1 text-xs font-semibold rounded-full ${
                            item.isLowStock
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            <span className="hidden sm:inline">{item.isLowStock ? 'Low Stock' : 'Sufficient'}</span>
                            <span className="sm:hidden">{item.isLowStock ? 'Low' : 'OK'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}