import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function Members() {
  // Fetch all users (members are users with role != admin)
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.get('/admin/users').then(res => res.data),
  });

  // Filter out admins to show only members
  const members = users?.filter(user => user.role !== 'admin') || [];

  const getRoleBadge = (role) => {
    const styles = {
      student: 'bg-blue-100 text-blue-800',
      faculty: 'bg-purple-100 text-purple-800',
      staff: 'bg-green-100 text-green-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-sm ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-sm ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Library Members</h2>
        <div className="text-sm text-gray-600">
          Total Members: {members.length}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Students</div>
          <div className="text-2xl font-bold text-blue-600">
            {members.filter(m => m.role === 'student').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Faculty</div>
          <div className="text-2xl font-bold text-purple-600">
            {members.filter(m => m.role === 'faculty').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Staff</div>
          <div className="text-2xl font-bold text-green-600">
            {members.filter(m => m.role === 'staff').length}
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Student/Employee ID</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Fine Balance</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-8 text-center text-gray-500">
                  No members found
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{member.id}</td>
                  <td className="p-3 font-medium">{member.username}</td>
                  <td className="p-3">{member.email}</td>
                  <td className="p-3">{getRoleBadge(member.role)}</td>
                  <td className="p-3">{member.department || '-'}</td>
                  <td className="p-3">
                    {member.student_id || member.employee_id || '-'}
                  </td>
                  <td className="p-3">{member.phone || '-'}</td>
                  <td className="p-3">{getStatusBadge(member.status)}</td>
                  <td className="p-3">
                    <span className={`font-semibold ${
                      member.total_fine_balance > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${member.total_fine_balance || 0}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This page shows all registered library members (Students, Faculty, and Staff). 
          To manage user accounts, approve registrations, or change roles, please visit the <strong>Users</strong> page.
        </p>
      </div>
    </div>
  );
}
