import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, User, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api.js';
import { userService } from '../utils/userService';
import LoadingSpinner from '../components/common/LoadingSpinner.jsx';
import ConfirmationDialog from './ConfirmationDialog.jsx';

const PAGE_SIZE = 20;

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [page, setPage] = useState(1);
  // Debounced so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // a new search starts from the first page
    }, 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Searching and paging happen on the server. Previously this fetched a
  // single default page of 10 and filtered it in the browser, so every user
  // past the tenth was unreachable — including by search.
  const { data, isLoading, error, isFetching } = useQuery(
    ['users', page, debouncedSearch],
    () => userService.getAllUsers({ page, limit: PAGE_SIZE, search: debouncedSearch || undefined }),
    { keepPreviousData: true }
  );

  const toggleStatusMutation = useMutation(userService.toggleUserStatus, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('User status updated!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    },
  });
  
  // The server has already applied the search and the page window.
  const filteredUsers = data?.data || [];
  const total = data?.total ?? filteredUsers.length;
  const totalPages = data?.totalPages ?? 1;

  const deleteMutation = useMutation(
    (id) => {
      return api.delete(`/users/${id}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully');
        setDialogOpen(false);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete user');
        setDialogOpen(false);
      }
    }
  );

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }

  const confirmDelete = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser._id);
    }
  }

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading users: {error.message}</div>;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage all staff accounts</p>
        </div>
        <Link 
          to="/users/new" 
          className="btn-primary flex items-center justify-center whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                    <div className="text-sm text-gray-500">{user.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm">{user.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => toggleStatusMutation.mutate(user._id)}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? <ToggleRight className="mr-1 w-4 h-4"/> : <ToggleLeft className="mr-1 w-4 h-4"/>}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link to={`/users/edit/${user._id}`} className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDeleteClick(user)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div 
            key={user._id} 
            className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
          >
            {/* User Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-gray-500">{user.employeeId}</p>
                </div>
              </div>
              
              {/* Status Toggle */}
              <button 
                onClick={() => toggleStatusMutation.mutate(user._id)}
                className="flex-shrink-0"
              >
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.isActive ? <ToggleRight className="w-3 h-3 mr-1"/> : <ToggleLeft className="w-3 h-3 mr-1"/>}
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </button>
            </div>

            {/* User Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-start">
                <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Email:</span>
                <span className="text-sm text-gray-900 break-all">{user.email}</span>
              </div>
              <div className="flex items-start">
                <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Phone:</span>
                <span className="text-sm text-gray-900">{user.phone}</span>
              </div>
              <div className="flex items-start">
                <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Role:</span>
                <span className="text-sm text-gray-900 capitalize">{user.role}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <Link 
                to={`/users/edit/${user._id}`}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
              <button 
                onClick={() => handleDeleteClick(user)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {debouncedSearch ? `No users match "${debouncedSearch}"` : 'No users found'}
          </p>
        </div>
      )}

      {/*
        Deliberately outside both the `hidden md:block` table and the
        `md:hidden` card list, so the controls appear on every viewport. There
        were no pagination controls at all before, which is why only the first
        page of users could ever be reached.
      */}
      {total > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            Showing{' '}
            <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span>
            {'–'}
            <span className="font-medium">{(page - 1) * PAGE_SIZE + filteredUsers.length}</span>
            {' of '}
            <span className="font-medium">{total}</span>
            {total === 1 ? ' user' : ' users'}
            {isFetching && <span className="ml-2 text-gray-400">updating…</span>}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <span className="text-sm text-gray-600 px-2 whitespace-nowrap">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmationDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};

export default Users;