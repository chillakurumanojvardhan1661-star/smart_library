import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fineAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Fines() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [selectedFine, setSelectedFine] = useState(null);
  const [selectedFines, setSelectedFines] = useState([]);
  const [fineDetails, setFineDetails] = useState(null);

  // Separate states for different actions to avoid conflicts
  const [manualData, setManualData] = useState({
    user_id: '',
    fine_amount: '',
    fine_type: 'overdue',
    notes: ''
  });

  const [editData, setEditData] = useState({
    fine_amount: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    payment_amount: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: ''
  });

  // Fetch fines with filters
  const { data: fines, isLoading } = useQuery({
    queryKey: ['fines', filter, isAdmin],
    queryFn: () => {
      if (isAdmin) {
        const params = filter !== 'all' ? { status: filter } : {};
        return fineAPI.getAll(params).then(res => res.data);
      } else {
        return fineAPI.getMyFines().then(res => res.data);
      }
    },
  });

  // Filter fines locally for search
  const filteredFines = fines?.filter(fine =>
    fine.username?.toLowerCase().includes(search.toLowerCase()) ||
    fine.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    fine.book_title?.toLowerCase().includes(search.toLowerCase()) ||
    fine.fine_type?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Fetch admin stats
  const { data: stats } = useQuery({
    queryKey: ['fine-stats'],
    queryFn: () => fineAPI.getStats().then(res => res.data),
    enabled: isAdmin,
  });

  // Fetch user balance
  const { data: myBalance } = useQuery({
    queryKey: ['my-balance'],
    queryFn: () => fineAPI.getMyBalance().then(res => res.data),
    enabled: !isAdmin,
  });

  // Mutations
  const createManualMutation = useMutation({
    mutationFn: (data) => fineAPI.createManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      toast.success('Manual fine created successfully');
      setShowManualModal(false);
      setManualData({ user_id: '', fine_amount: '', fine_type: 'overdue', notes: '' });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to create fine')
  });

  const updateAmountMutation = useMutation({
    mutationFn: ({ id, data }) => fineAPI.updateAmount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fines']);
      toast.success('Fine amount updated');
      setShowEditModal(false);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to update amount')
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, data }) => fineAPI.recordPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      queryClient.invalidateQueries(['my-balance']);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setPaymentData({ payment_amount: '', payment_method: 'cash', transaction_id: '', notes: '' });
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to record payment')
  });

  const waiveMutation = useMutation({
    mutationFn: ({ id, reason }) => fineAPI.waive(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      toast.success('Fine waived');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to waive fine')
  });

  const bulkWaiveMutation = useMutation({
    mutationFn: (ids) => fineAPI.bulkWaive({ fine_ids: ids, reason: 'Bulk waived by admin' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      toast.success(res.data.message);
      setSelectedFines([]);
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to bulk waive')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fineAPI.deleteFine(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      toast.success('Fine deleted');
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to delete fine')
  });

  const viewDetails = async (id) => {
    try {
      const res = await fineAPI.getDetails(id);
      setFineDetails(res.data);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error('Failed to load details');
    }
  };

  const toggleSelection = (id) => {
    setSelectedFines(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading fine data...</div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            {isAdmin ? 'Fine Management' : 'My Fines'}
          </h2>
          <p className="text-gray-500 mt-1">Manage and track library fines efficiently.</p>
        </div>

        {isAdmin && (
          <div className="flex gap-2">
            {selectedFines.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`Waive ${selectedFines.length} selected fines?`)) {
                    bulkWaiveMutation.mutate(selectedFines);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all"
              >
                Waive Selected ({selectedFines.length})
              </button>
            )}
            <button
              onClick={() => setShowManualModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition-all"
            >
              + Create Manual Fine
            </button>
          </div>
        )}
      </div>

      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard title="Total Collected" value={`$${stats.paid_fines}`} icon="💰" color="blue" />
          <StatCard title="Total Outstanding" value={`$${stats.unpaid_fines}`} icon="⚖️" color="red" />
          <StatCard title="Total Waived" value={`$${stats.waived_fines}`} icon="🎁" color="purple" />
          <StatCard title="Total Fine Records" value={stats.total_count} icon="📋" color="gray" />
        </div>
      )}

      {!isAdmin && myBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard title="Current Balance" value={`$${myBalance.total_fine_balance}`} icon="💳" color="red" />
          <StatCard title="Unpaid Items" value={myBalance.unpaid_count} icon="⚠️" color="yellow" />
          <StatCard title="Overdue Books" value={myBalance.overdue_books} icon="📚" color="orange" />
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex overflow-x-auto pb-1 gap-2 w-full lg:w-auto">
            {['all', 'unpaid', 'paid', 'waived', 'partially_paid'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${filter === s
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
              >
                {s.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-96">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, book, or type..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm font-bold uppercase tracking-wider">
                {isAdmin && <th className="p-5 w-4 font-normal"><input type="checkbox" className="rounded border-gray-300" /></th>}
                <th className="p-5">User</th>
                <th className="p-5">Details</th>
                <th className="p-5 text-center">Amount</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFines.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-10 text-center text-gray-500 font-medium">
                    No fine records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredFines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-blue-50/30 transition-colors">
                    {isAdmin && (
                      <td className="p-5">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedFines.includes(fine.id)}
                          onChange={() => toggleSelection(fine.id)}
                        />
                      </td>
                    )}
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{fine.username || fine.member_name}</span>
                        <span className="text-xs text-gray-500 uppercase font-semibold">{fine.role}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-gray-900 font-medium">{fine.book_title || 'Manual Entry'}</span>
                        <span className="text-xs text-gray-400">Type: {fine.fine_type} {fine.overdue_days ? `• ${fine.overdue_days} days` : ''}</span>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className="font-mono font-bold text-gray-900">${fine.fine_amount}</span>
                    </td>
                    <td className="p-5">
                      <StatusBadge status={fine.fine_status} />
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-1.5">
                        {isAdmin ? (
                          <>
                            <ActionButton onClick={() => viewDetails(fine.id)} label="Details" color="gray" />
                            <ActionButton onClick={() => {
                              setSelectedFine(fine);
                              setEditData({ fine_amount: fine.fine_amount, notes: fine.notes || '' });
                              setShowEditModal(true);
                            }} label="Edit" color="blue" />
                            {fine.fine_status === 'unpaid' && (
                              <>
                                <ActionButton onClick={() => {
                                  setSelectedFine(fine);
                                  setPaymentData({ payment_amount: fine.fine_amount, payment_method: 'cash', transaction_id: '', notes: '' });
                                  setShowPaymentModal(true);
                                }} label="Pay" color="green" />
                                <ActionButton onClick={() => { if (window.confirm('Waive this fine?')) waiveMutation.mutate({ id: fine.id, reason: 'Waived by Admin' }) }} label="Waive" color="purple" />
                              </>
                            )}
                            <ActionButton onClick={() => { if (window.confirm('Delete this record?')) deleteMutation.mutate(fine.id) }} label="🗑️" color="red" />
                          </>
                        ) : (
                          fine.fine_status !== 'paid' && fine.fine_status !== 'waived' && (
                            <button
                              onClick={() => {
                                setSelectedFine(fine);
                                setPaymentData({ payment_amount: fine.fine_amount, payment_method: 'card', transaction_id: '', notes: '' });
                                setShowPaymentModal(true);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-all"
                            >
                              💳 Pay Now
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showManualModal && (
        <Modal title="Create Manual Fine" onClose={() => setShowManualModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); createManualMutation.mutate(manualData); }} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">User ID (or Username/Email)</label>
              <input type="text" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500" required value={manualData.user_id} onChange={e => setManualData({ ...manualData, user_id: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Amount ($)</label>
                <input type="number" step="0.01" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-purple-500" required value={manualData.fine_amount} onChange={e => setManualData({ ...manualData, fine_amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                <select className="w-full p-3 rounded-xl border border-gray-200 outline-none" value={manualData.fine_type} onChange={e => setManualData({ ...manualData, fine_type: e.target.value })}>
                  <option value="overdue">Overdue</option>
                  <option value="lost">Lost Book</option>
                  <option value="damaged">Damaged Book</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Notes</label>
              <textarea className="w-full p-3 rounded-xl border border-gray-200 outline-none h-24" value={manualData.notes} onChange={e => setManualData({ ...manualData, notes: e.target.value })} />
            </div>
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all">Create Fine Record</button>
          </form>
        </Modal>
      )}

      {showEditModal && selectedFine && (
        <Modal title="Edit Fine Amount" onClose={() => setShowEditModal(false)}>
          <form onSubmit={(e) => { e.preventDefault(); updateAmountMutation.mutate({ id: selectedFine.id, data: { fine_amount: editData.fine_amount, notes: editData.notes } }); }} className="space-y-4">
            <p className="text-sm text-gray-500">Updating fine for <span className="font-bold text-gray-900">{selectedFine.username}</span></p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">New Amount ($)</label>
              <input type="number" step="0.01" className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" required value={editData.fine_amount} onChange={e => setEditData({ ...editData, fine_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Notes Update</label>
              <textarea className="w-full p-3 rounded-xl border border-gray-200 outline-none h-24" value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all">Update Record</button>
          </form>
        </Modal>
      )}

      {showPaymentModal && selectedFine && (
        <Modal title="Record Payment" onClose={() => setShowPaymentModal(false)}>
          <form onSubmit={(e) => {
            e.preventDefault();
            paymentMutation.mutate({
              id: selectedFine.id, data: {
                payment_amount: paymentData.payment_amount,
                payment_method: paymentData.payment_method,
                transaction_id: paymentData.transaction_id,
                notes: paymentData.notes
              }
            });
          }} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl mb-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Balance Due</p>
              <p className="text-3xl font-extrabold text-gray-900">${selectedFine.fine_amount}</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Payment Amount ($)</label>
              <input type="number" step="0.01" className="w-full p-3 rounded-xl border border-gray-200 outline-none" required value={paymentData.payment_amount} onChange={e => setPaymentData({ ...paymentData, payment_amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Method</label>
              <select className="w-full p-3 rounded-xl border border-gray-200 outline-none" value={paymentData.payment_method} onChange={e => setPaymentData({ ...paymentData, payment_method: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="online">Online Transfer</option>
                <option value="upi">UPI / Digital</option>
                <option value="card">Card Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Transaction ID / Notes</label>
              <input type="text" className="w-full p-3 rounded-xl border border-gray-200 outline-none" placeholder="Optional reference..." value={paymentData.transaction_id} onChange={e => setPaymentData({ ...paymentData, transaction_id: e.target.value })} />
            </div>
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg transition-all">
              {isAdmin ? 'Confirm Payment' : 'Pay Now'}
            </button>
          </form>
        </Modal>
      )}

      {showDetailsModal && fineDetails && (
        <Modal title="Fine Details & History" onClose={() => setShowDetailsModal(false)}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">User</p>
                <p className="font-bold text-gray-900">{fineDetails.fine.username}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Status</p>
                <StatusBadge status={fineDetails.fine.fine_status} />
              </div>
            </div>
            {fineDetails.fine.book_title && (
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Instructional Context</p>
                <p className="text-gray-700">Issued for <span className="font-bold italic">"{fineDetails.fine.book_title}"</span></p>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span>🔄</span> Payment / Waive History
              </h4>
              {fineDetails.payments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payment history recorded.</p>
              ) : (
                <div className="space-y-3">
                  {fineDetails.payments.map((p, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-green-700 text-sm">{p.payment_method.toUpperCase()}</span>
                        <span className="font-mono font-bold text-gray-900">${p.amount}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{new Date(p.payment_date).toLocaleString()}</p>
                      {p.notes && <p className="text-xs text-gray-600 mt-1 italic border-l-2 border-gray-200 pl-2">"{p.notes}"</p>}
                    </div>
                  ))}
                </div>
              )}
              {fineDetails.fine.fine_status === 'waived' && (
                <div className="mt-4 bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-800 font-bold uppercase">Waived Detail</p>
                  <p className="text-sm text-blue-700 mt-1">Reason: {fineDetails.fine.waived_reason}</p>
                  <p className="text-[10px] text-blue-400 mt-1">{new Date(fineDetails.fine.waived_at).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const gradients = {
    blue: 'from-blue-600 to-indigo-700',
    red: 'from-red-500 to-rose-700',
    purple: 'from-purple-600 to-fuchsia-700',
    gray: 'from-gray-700 to-slate-900',
    yellow: 'from-amber-400 to-orange-500',
    orange: 'from-orange-500 to-red-600'
  };
  return (
    <div className={`bg-gradient-to-br ${gradients[color]} p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1`}>
      <div className="flex justify-between items-start mb-4">
        <div className="bg-white/20 p-2 rounded-xl text-2xl">{icon}</div>
        <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">{title}</div>
      </div>
      <div className="text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    paid: 'bg-green-100 text-green-700 border-green-200',
    unpaid: 'bg-red-100 text-red-700 border-red-200 font-black',
    waived: 'bg-blue-100 text-blue-700 border-blue-200',
    partially_paid: 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ActionButton({ onClick, label, color }) {
  const colors = {
    gray: 'text-gray-400 hover:text-gray-900 hover:bg-gray-100',
    blue: 'text-blue-500 hover:text-blue-700 hover:bg-blue-100',
    green: 'text-green-500 hover:text-green-700 hover:bg-green-100',
    purple: 'text-purple-500 hover:text-purple-700 hover:bg-purple-100',
    red: 'text-red-500 hover:text-red-700 hover:bg-red-100'
  };
  return (
    <button
      onClick={onClick}
      className={`${colors[color]} p-2 rounded-lg transition-all text-xs font-bold uppercase tracking-tighter`}
    >
      {label}
    </button>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg border border-gray-100 animate-in fade-in zoom-in duration-300">
        <div className="p-8 pb-4 flex justify-between items-center">
          <h3 className="text-2xl font-black text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors text-xl">✕</button>
        </div>
        <div className="p-8 pt-4">{children}</div>
      </div>
    </div>
  );
}
