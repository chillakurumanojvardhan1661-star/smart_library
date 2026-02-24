import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const userAPI = {
  getAll: () => api.get('/admin/users'),
  updateStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  updateRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export default function Users() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => userAPI.getAll().then(res => res.data),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => userAPI.updateStatus(id, { status }),
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries(['admin-users']);
      setShowStatusModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update status');
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => userAPI.updateRole(id, { role }),
    onSuccess: () => {
      toast.success('User role updated successfully');
      queryClient.invalidateQueries(['admin-users']);
      setShowRoleModal(false);
      setSelectedUser(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update role');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => userAPI.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries(['admin-users']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    },
  });

  const handleApprove = (user) => {
    if (confirm(`Approve ${user.username}?`)) {
      updateStatusMutation.mutate({ id: user.id, status: 'active' });
    }
  };

  const handleReject = (user) => {
    if (confirm(`Reject ${user.username}? This will set their status to rejected.`)) {
      updateStatusMutation.mutate({ id: user.id, status: 'rejected' });
    }
  };

  const handleSuspend = (user) => {
    if (confirm(`Suspend ${user.username}?`)) {
      updateStatusMutation.mutate({ id: user.id, status: 'suspended' });
    }
  };

  const handleDelete = (user) => {
    if (confirm(`Delete ${user.username}? This action cannot be undone.`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const filteredUsers = users?.filter(user => {
    if (filter === 'all') return true;
    if (filter === 'pending') return user.status === 'pending';
    if (filter === 'active') return user.status === 'active';
    if (filter === 'suspended') return user.status === 'suspended';
    if (filter === 'rejected') return user.status === 'rejected';
    return true;
  });

  const pendingCount = users?.filter(u => u.status === 'pending').length || 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">User Management</h2>
          <p className="text-gray-600 mt-1">Manage registered users and approve accounts</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg">
            <span className="font-semibold">{pendingCount}</span> pending approval{pendingCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Users" value={users?.length || 0} color="blue" />
        <StatCard title="Active" value={users?.filter(u => u.status === 'active').length || 0} color="green" />
        <StatCard title="Pending" value={pendingCount} color="yellow" />
        <StatCard title="Suspended" value={users?.filter(u => u.status === 'suspended').length || 0} color="red" />
        <StatCard title="Rejected" value={users?.filter(u => u.status === 'rejected').length || 0} color="gray" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          {['all', 'pending', 'active', 'suspended', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fine Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : filteredUsers?.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">No users found</td>
              </tr>
            ) : (
              filteredUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'faculty' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'student' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.department || '-'}</td>
                  <td className="px-6 py-4 text-sm">{user.student_id || user.employee_id || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={user.total_fine_balance > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}>
                      ${user.total_fine_balance || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                            title="Approve"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(user)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                            title="Reject"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                      {user.status === 'active' && (
                        <button
                          onClick={() => handleSuspend(user)}
                          className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                          title="Suspend"
                        >
                          Suspend
                        </button>
                      )}
                      {user.status === 'suspended' && (
                        <button
                          onClick={() => handleApprove(user)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                          title="Activate"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowRoleModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        title="Change Role"
                      >
                        Role
                      </button>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                          title="Delete"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <Modal onClose={() => setShowRoleModal(false)} title="Change User Role">
          <div className="space-y-4">
            <p className="text-gray-600">
              Change role for <strong>{selectedUser.username}</strong>
            </p>
            <div className="space-y-2">
              {['student', 'faculty', 'staff', 'admin'].map((role) => (
                <button
                  key={role}
                  onClick={() => updateRoleMutation.mutate({ id: selectedUser.id, role })}
                  disabled={updateRoleMutation.isPending}
                  className={`w-full px-4 py-3 rounded-lg text-left capitalize transition ${
                    selectedUser.role === role
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="font-semibold">{role}</div>
                  <div className="text-sm text-gray-600">
                    {role === 'admin' && 'Full system access'}
                    {role === 'faculty' && '10 books, 30 days, $3/day fine'}
                    {role === 'student' && '5 books, 14 days, $5/day fine'}
                    {role === 'staff' && '5 books, 21 days, $4/day fine'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
    gray: 'from-gray-500 to-gray-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-4 rounded-xl shadow-lg`}>
      <h3 className="text-sm font-semibold opacity-90">{title}</h3>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
