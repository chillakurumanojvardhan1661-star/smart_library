import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../services/api';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => adminAPI.getStats().then(res => res.data),
    enabled: user?.role === 'admin',
  });

  const handleExport = (type) => {
    window.open(`http://localhost:5001/api/export/${type}?format=csv`, '_blank');
  };

  if (isLoading && user?.role === 'admin') {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome, {user?.username}! ({user?.role})</p>
        </div>
        
        {user?.role === 'admin' && (
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('books')}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Books
            </button>
            <button
              onClick={() => handleExport('members')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Members
            </button>
            <button
              onClick={() => handleExport('issues')}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export Issues
            </button>
          </div>
        )}
      </div>
      
      {user?.role === 'admin' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Books" value={stats?.total_books || 0} icon="📚" color="blue" />
            <StatCard title="Active Members" value={stats?.active_members || 0} icon="👥" color="green" />
            <StatCard title="Books Issued" value={stats?.books_issued || 0} icon="📖" color="purple" />
            <StatCard title="Available Copies" value={stats?.available_copies || 0} icon="✅" color="indigo" />
            <StatCard title="Overdue Books" value={stats?.overdue_books || 0} icon="⚠️" color="red" />
            <StatCard title="Fines Collected" value={`$${stats?.total_fines_collected || 0}`} icon="💰" color="yellow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickStats stats={stats} />
            <RecentActivity />
          </div>
        </>
      )}

      {user?.role !== 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Your Borrowing Privileges</h3>
            <div className="space-y-4">
              <PrivilegeItem 
                label="Maximum Books" 
                value={user.role === 'faculty' ? '10 books' : '5 books'} 
              />
              <PrivilegeItem 
                label="Borrowing Period" 
                value={
                  user.role === 'faculty' ? '30 days' : 
                  user.role === 'student' ? '14 days' : '21 days'
                } 
              />
              <PrivilegeItem 
                label="Fine Rate" 
                value={
                  user.role === 'faculty' ? '$3/day' : 
                  user.role === 'student' ? '$5/day' : '$4/day'
                } 
              />
              <PrivilegeItem 
                label="Department" 
                value={user.department || 'Not specified'} 
              />
            </div>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <h3 className="text-2xl font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <ActionButton href="/books" icon="📚" text="Browse Books" />
              <ActionButton href="/recommendations" icon="🤖" text="Get Recommendations" />
              {(user.role === 'admin' || user.role === 'faculty') && (
                <ActionButton href="/analytics" icon="📊" text="View Analytics" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold opacity-90">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold">{value}</p>
    </div>
  );
}

function QuickStats({ stats }) {
  const utilizationRate = stats?.total_copies > 0 
    ? ((stats.total_copies - stats.available_copies) / stats.total_copies * 100).toFixed(1)
    : 0;

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">Quick Statistics</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Library Utilization</span>
          <span className="font-semibold text-lg">{utilizationRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${utilizationRate}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats?.total_copies || 0}</p>
            <p className="text-sm text-gray-600">Total Copies</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.available_copies || 0}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold mb-4">System Status</h3>
      <div className="space-y-3">
        <StatusItem status="online" text="Database Connection" />
        <StatusItem status="online" text="API Server" />
        <StatusItem status="online" text="Authentication Service" />
        <StatusItem status="online" text="Analytics Engine" />
      </div>
    </div>
  );
}

function StatusItem({ status, text }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={`w-3 h-3 rounded-full ${status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-gray-700">{text}</span>
      <span className="ml-auto text-sm text-gray-500">{status === 'online' ? 'Active' : 'Offline'}</span>
    </div>
  );
}

function PrivilegeItem({ label, value }) {
  return (
    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="text-gray-900 font-semibold">{value}</span>
    </div>
  );
}

function ActionButton({ href, icon, text }) {
  return (
    <Link
      to={href}
      className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold">{text}</span>
    </Link>
  );
}
