import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issueAPI, bookAPI, memberAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function Issues() {
  const { user } = useAuth();
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueForm, setIssueForm] = useState({
    book_id: '',
    member_id: '',
    user_id: '',
  });

  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['issues'],
    queryFn: () => issueAPI.getAll().then(res => res.data),
  });

  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => bookAPI.getAll({}).then(res => res.data),
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => memberAPI.getAll().then(res => res.data),
  });

  // Fetch all users for selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then(res => res.data),
    enabled: user?.role === 'admin',
  });

  const issueMutation = useMutation({
    mutationFn: (data) => issueAPI.issue(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['books']);
      toast.success(`Book issued successfully! Due date: ${response.data.due_date}`);
      setShowIssueModal(false);
      setIssueForm({ book_id: '', member_id: '', user_id: '' });
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to issue book');
    },
  });

  const returnMutation = useMutation({
    mutationFn: (id) => issueAPI.return(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['issues']);
      queryClient.invalidateQueries(['books']);
      queryClient.invalidateQueries(['fines']);
      queryClient.invalidateQueries(['fine-stats']);
      
      const data = response.data;
      if (data.fine_amount > 0) {
        toast.success(
          `Book returned! Fine: $${data.fine_amount} (${data.overdue_days} days overdue)`,
          { duration: 5000 }
        );
      } else {
        toast.success('Book returned successfully!');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to return book');
    },
  });

  const handleIssueSubmit = (e) => {
    e.preventDefault();
    issueMutation.mutate(issueForm);
  };

  const handleReturn = (issueId) => {
    if (confirm('Are you sure you want to return this book? Fine will be calculated if overdue.')) {
      returnMutation.mutate(issueId);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Issue & Return</h2>
        <button 
          onClick={() => setShowIssueModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Issue Book
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Book</th>
                <th className="p-3 text-left">Member</th>
                <th className="p-3 text-left">Issue Date</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Fine</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {issues?.map((issue) => (
                <tr key={issue.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{issue.title}</td>
                  <td className="p-3">{issue.member_name}</td>
                  <td className="p-3">{new Date(issue.issue_date).toLocaleDateString()}</td>
                  <td className="p-3">{new Date(issue.due_date).toLocaleDateString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${
                      issue.status === 'issued' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="p-3">${issue.fine_amount || 0}</td>
                  <td className="p-3">
                    {issue.status === 'issued' && (
                      <button
                        onClick={() => handleReturn(issue.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Issue Book Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Issue Book</h3>
            <form onSubmit={handleIssueSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Select Book</label>
                <select
                  value={issueForm.book_id}
                  onChange={(e) => setIssueForm({...issueForm, book_id: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Choose a book...</option>
                  {books?.filter(b => b.available_copies > 0).map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} by {book.author} (Available: {book.available_copies})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select User (for fine calculation)</label>
                <select
                  value={issueForm.user_id}
                  onChange={(e) => setIssueForm({...issueForm, user_id: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.role}) - {u.email}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Due date will be calculated based on user's role
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Select Member</label>
                <select
                  value={issueForm.member_id}
                  onChange={(e) => setIssueForm({...issueForm, member_id: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Choose a member...</option>
                  {members?.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.member_id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-semibold text-blue-800 mb-1">Fine Rates:</p>
                <p className="text-blue-700">• Student: $5/day (14 days, 1 grace day)</p>
                <p className="text-blue-700">• Faculty: $3/day (30 days, 2 grace days)</p>
                <p className="text-blue-700">• Staff: $4/day (21 days, 1 grace day)</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={issueMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {issueMutation.isPending ? 'Issuing...' : 'Issue Book'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
