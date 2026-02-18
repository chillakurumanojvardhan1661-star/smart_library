import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const fineAPI = {
  getAll: (params) => api.get('/fines', { params }),
  getStats: () => api.get('/fines/stats'),
  getMyBalance: () => api.get('/fines/my-balance'),
  recordPayment: (id, data) => api.post(`/fines/${id}/payment`, data),
  waiveFine: (id, data) => api.post(`/fines/${id}/waive`, data),
  createManual: (data) => api.post('/fines/manual', data),
};

export default function Fines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWaiveModal, setShowWaiveModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);

  // Fetch fines (admin only)
  const { data: fines, isLoading: finesLoading } = useQuery({
    queryKey: ['fines', filter],
    queryFn: () => fineAPI.getAll(filter !== 'all' ? { status: filter } : {}).then(res => res.data),
    enabled: user?.role === 'admin',
  });

  // Fetch fine stats (admin only)
  const { data: stats } = useQuery({
    queryKey: ['fine-stats'],
    queryFn: () => fineAPI.getStats().then(res => res.data),
    enabled: user?.role === 'admin',
  });

  // Fetch user's fine balance
  const { data: myBalance } = useQuery({
    queryKey: ['my-fine-balance'],
    queryFn: () => fineAPI.getMyBalance().then(res => res.data),
  });

  // Record payment mutation
  const paymentMutation = useMutation({
    mutationFn: ({ id, data }) => fineAPI.recordPayment(id, data),
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      setShowPaymentModal(false);
      setSelectedFine(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to record payment');
    },
  });

  // Waive fine mutation
  const waiveMutation = useMutation({
    mutationFn: ({ id, data }) => fineAPI.waiveFine(id, data),
    onSuccess: () => {
      toast.success('Fine waived successfully');
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      setShowWaiveModal(false);
      setSelectedFine(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to waive fine');
    },
  });

  const handlePayment = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    paymentMutation.mutate({
      id: selectedFine.id,
      data: {
        amount: parseFloat(formData.get('amount')),
        payment_method: formData.get('payment_method'),
        transaction_id: formData.get('transaction_id'),
        notes: formData.get('notes'),
      },
    });
  };

  const handleWaive = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    waiveMutation.mutate({
      id: selectedFine.id,
      data: {
        reason: formData.get('reason'),
      },
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">My Fine Balance</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            value={`$${myBalance?.total_fine_balance || 0}`}
            icon="💰"
            color="red"
          />
          <StatCard
            title="Unpaid Fines"
            value={myBalance?.unpaid_count || 0}
            icon="⚠️"
            color="yellow"
          />
          <StatCard
            title="Overdue Books"
            value={myBalance?.overdue_books || 0}
            icon="📚"
            color="orange"
          />
        </div>

        {myBalance?.total_fine_balance > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-red-800 mb-2">Outstanding Fines</h3>
            <p className="text-red-700 mb-4">
              You have ${myBalance.total_fine_balance} in unpaid fines. Please contact the library admin to clear your fines.
            </p>
            {myBalance.total_fine_balance >= 500 && (
              <p className="text-red-800 font-semibold">
                ⚠️ Your account may be suspended. Book borrowing is restricted until fines are cleared.
              </p>
            )}
          </div>
        )}

        {myBalance?.total_fine_balance === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-green-800 font-semibold">No outstanding fines!</p>
            <p className="text-green-700">Your account is in good standing.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Fine Management</h2>
        <button
          onClick={() => setShowManualModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          + Add Manual Fine
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Collected"
          value={`$${stats?.total_collected || 0}`}
          icon="💵"
          color="green"
        />
        <StatCard
          title="Outstanding"
          value={`$${stats?.total_outstanding || 0}`}
          icon="⚠️"
          color="red"
        />
        <StatCard
          title="Waived"
          value={`$${stats?.total_waived || 0}`}
          icon="🎁"
          color="blue"
        />
        <StatCard
          title="Total Fines"
          value={fines?.length || 0}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex gap-2">
          {['all', 'unpaid', 'paid', 'waived', 'partially_paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Fines Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {finesLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : fines?.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No fines found</td>
              </tr>
            ) : (
              fines?.map((fine) => (
                <tr key={fine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{fine.username || fine.member_name}</div>
                      <div className="text-sm text-gray-500">{fine.role}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{fine.book_title || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fine.fine_type === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
                      fine.fine_type === 'lost' ? 'bg-red-100 text-red-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {fine.fine_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold">${fine.fine_amount}</td>
                  <td className="px-6 py-4">{fine.overdue_days || 0}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      fine.fine_status === 'paid' ? 'bg-green-100 text-green-800' :
                      fine.fine_status === 'unpaid' ? 'bg-red-100 text-red-800' :
                      fine.fine_status === 'waived' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fine.fine_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {fine.fine_status === 'unpaid' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFine(fine);
                            setShowPaymentModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Pay
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFine(fine);
                            setShowWaiveModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Waive
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <Modal onClose={() => setShowPaymentModal(false)} title="Record Payment">
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                defaultValue={selectedFine?.fine_amount}
                className="w-full px-4 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Payment Method</label>
              <select name="payment_method" className="w-full px-4 py-2 border rounded-lg" required>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Transaction ID (Optional)</label>
              <input
                type="text"
                name="transaction_id"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                name="notes"
                rows="3"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={paymentMutation.isPending}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {paymentMutation.isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </form>
        </Modal>
      )}

      {/* Waive Modal */}
      {showWaiveModal && (
        <Modal onClose={() => setShowWaiveModal(false)} title="Waive Fine">
          <form onSubmit={handleWaive} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Reason for Waiving</label>
              <textarea
                name="reason"
                rows="4"
                className="w-full px-4 py-2 border rounded-lg"
                required
                placeholder="Enter reason for waiving this fine..."
              />
            </div>
            <button
              type="submit"
              disabled={waiveMutation.isPending}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {waiveMutation.isPending ? 'Waiving...' : 'Waive Fine'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold opacity-90">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function Modal({ onClose, title, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
