import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const { data: issuesTrend, isLoading: loadingTrend, error: errorTrend } = useQuery({
    queryKey: ['issuesTrend'],
    queryFn: () => api.get('/analytics/issues-trend?days=30').then(res => res.data),
  });

  const { data: categoryDist, isLoading: loadingDist, error: errorDist } = useQuery({
    queryKey: ['categoryDist'],
    queryFn: () => api.get('/analytics/category-distribution').then(res => res.data),
  });

  const { data: topBorrowers, isLoading: loadingTop, error: errorTop } = useQuery({
    queryKey: ['topBorrowers'],
    queryFn: () => api.get('/analytics/top-borrowers').then(res => res.data),
  });

  const { data: fineAnalytics, isLoading: loadingFines, error: errorFines } = useQuery({
    queryKey: ['fineAnalytics'],
    queryFn: () => api.get('/analytics/fines').then(res => res.data),
  });

  if (loadingTrend || loadingDist || loadingTop || loadingFines) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorTrend || errorDist || errorTop || errorFines) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        Error loading analytics data. Please try again later.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Analytics Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Fines" value={`$${fineAnalytics?.total_amount || 0}`} color="green" />
        <StatCard title="Avg Fine" value={`$${fineAnalytics?.avg_fine?.toFixed(2) || 0}`} color="blue" />
        <StatCard title="Max Fine" value={`$${fineAnalytics?.max_fine || 0}`} color="red" />
        <StatCard title="Fine Count" value={fineAnalytics?.total_fines || 0} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Issues Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={issuesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">Books by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDist}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {categoryDist?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Top Borrowers</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topBorrowers}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="borrow_count" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className={`${colors[color]} text-white p-6 rounded-lg shadow-lg`}>
      <h3 className="text-sm font-semibold mb-2 opacity-90">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
