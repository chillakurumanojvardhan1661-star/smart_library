import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../services/api';

export default function Recommendations() {
  const [selectedMember, setSelectedMember] = useState('1');

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/members').then(res => res.data),
  });

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', selectedMember],
    queryFn: () => api.get(`/recommendations/member/${selectedMember}`).then(res => res.data),
    enabled: !!selectedMember,
  });

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: () => api.get('/recommendations/trending').then(res => res.data),
  });

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Book Recommendations</h2>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Select Member</label>
        <select
          value={selectedMember}
          onChange={(e) => setSelectedMember(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          {members?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.member_id})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold mb-4">Recommended for You</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations?.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-semibold mb-4">Trending Books</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trending?.map((book) => (
            <BookCard key={book.id} book={book} showCount />
          ))}
        </div>
      </div>
    </div>
  );
}

function BookCard({ book, showCount }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
      <h4 className="text-lg font-semibold mb-2">{book.title}</h4>
      <p className="text-gray-600 mb-2">{book.author}</p>
      <p className="text-sm text-gray-500 mb-3">{book.category}</p>
      <div className="flex justify-between items-center">
        <span className={`px-2 py-1 rounded text-sm ${
          book.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {book.available_copies > 0 ? 'Available' : 'Not Available'}
        </span>
        {showCount && book.issue_count > 0 && (
          <span className="text-sm text-gray-600">
            {book.issue_count} issues
          </span>
        )}
      </div>
    </div>
  );
}
