import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Reservations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch reservations based on role
  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', isAdmin],
    queryFn: () => 
      isAdmin 
        ? reservationAPI.getAllReservations().then(res => res.data)
        : reservationAPI.getUserReservations().then(res => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => reservationAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      toast.success('Reservation approved and book issued!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve reservation');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => reservationAPI.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      toast.success('Reservation rejected');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reject reservation');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => reservationAPI.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['reservations']);
      toast.success('Reservation cancelled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to cancel reservation');
    },
  });

  const handleApprove = (id) => {
    if (window.confirm('Approve this reservation and issue the book?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    if (window.confirm('Reject this reservation?')) {
      rejectMutation.mutate(id);
    }
  };

  const handleCancel = (id) => {
    if (window.confirm('Cancel this reservation?')) {
      cancelMutation.mutate(id);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
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
      <h2 className="text-3xl font-bold mb-6">
        {isAdmin ? 'All Reservations' : 'My Reservations'}
      </h2>

      {reservations?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No reservations found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Book</th>
                <th className="p-3 text-left">Author</th>
                {isAdmin && <th className="p-3 text-left">User</th>}
                {isAdmin && <th className="p-3 text-left">Role</th>}
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Available</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations?.map((reservation) => (
                <tr key={reservation.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{reservation.title}</td>
                  <td className="p-3">{reservation.author}</td>
                  {isAdmin && <td className="p-3">{reservation.username}</td>}
                  {isAdmin && <td className="p-3 capitalize">{reservation.role}</td>}
                  <td className="p-3">{new Date(reservation.reservation_date).toLocaleDateString()}</td>
                  <td className="p-3">{getStatusBadge(reservation.status)}</td>
                  <td className="p-3">{reservation.available_copies}</td>
                  <td className="p-3">
                    {isAdmin && reservation.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(reservation.id)}
                          disabled={reservation.available_copies === 0}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(reservation.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {!isAdmin && reservation.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(reservation.id)}
                        className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    )}
                    {reservation.status !== 'pending' && (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
