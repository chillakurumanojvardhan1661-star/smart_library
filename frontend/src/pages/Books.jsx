import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookAPI, reservationAPI, uploadAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Books() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    author: '',
    category: '',
    publisher: '',
    publication_year: '',
    total_copies: 1,
    cover_image_url: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const queryClient = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ['books', search],
    queryFn: () => bookAPI.getAll({ search }).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => bookAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book added successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to add book');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => bookAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book updated successfully!');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update book');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => bookAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      toast.success('Book deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete book');
    },
  });

  const reserveMutation = useMutation({
    mutationFn: (book_id) => reservationAPI.create({ book_id }),
    onSuccess: () => {
      toast.success('Book reserved successfully! Waiting for admin approval.');
      queryClient.invalidateQueries(['books']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to reserve book');
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      isbn: '',
      title: '',
      author: '',
      category: '',
      publisher: '',
      publication_year: '',
      total_copies: 1,
      cover_image_url: '',
    });
  };

  const handleEdit = (book) => {
    setEditMode(true);
    setSelectedId(book.id);
    setFormData({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category || '',
      publisher: book.publisher || '',
      publication_year: book.publication_year || '',
      total_copies: book.total_copies,
      cover_image_url: book.cover_image_url || '',
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (client-side limit matching server)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const res = await uploadAPI.uploadFile(file);
      setFormData(prev => ({ ...prev, cover_image_url: res.data.url }));
      toast.success('Cover image uploaded!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      updateMutation.mutate({ id: selectedId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleReserve = (bookId) => {
    if (window.confirm('Do you want to reserve this book?')) {
      reserveMutation.mutate(bookId);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Books</h2>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Book
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search books..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded mb-6"
      />

      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Cover</th>
                <th className="p-3 text-left">ISBN</th>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Author</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Available</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {books?.map((book) => (
                <tr key={book.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-12 h-16 object-cover rounded shadow-sm" />
                    ) : (
                      <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs text-center border">
                        No Image
                      </div>
                    )}
                  </td>
                  <td className="p-3">{book.isbn}</td>
                  <td className="p-3">{book.title}</td>
                  <td className="p-3">{book.author}</td>
                  <td className="p-3">{book.category}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-sm ${book.available_copies > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {book.available_copies}/{book.total_copies}
                    </span>
                  </td>
                  <td className="p-3">
                    {isAdmin ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(book.id)}
                          className="text-red-600 hover:text-red-800 font-medium text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReserve(book.id)}
                        disabled={book.available_copies === 0 || reserveMutation.isPending}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reserve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-4">{editMode ? 'Edit Book' : 'Add New Book'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Cover Image Upload Section */}
              <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg bg-gray-50">
                {formData.cover_image_url ? (
                  <div className="relative mb-4">
                    <img src={formData.cover_image_url} alt="Cover Preview" className="w-32 h-44 object-cover rounded shadow-md" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, cover_image_url: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-44 bg-gray-200 border border-gray-300 rounded mb-4 flex items-center justify-center text-gray-500 flex-col">
                    <span className="text-3xl mb-1">🖼️</span>
                    <span className="text-xs text-center px-2">No Cover Image</span>
                  </div>
                )}

                <label className="cursor-pointer bg-white px-4 py-2 border rounded shadow-sm text-sm font-medium hover:bg-gray-50">
                  {uploadingImage ? 'Uploading...' : 'Upload Cover Image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ISBN</label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                  disabled={editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Publisher</label>
                <input
                  type="text"
                  value={formData.publisher}
                  onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Publication Year</label>
                <input
                  type="number"
                  value={formData.publication_year}
                  onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Copies</label>
                <input
                  type="number"
                  value={formData.total_copies}
                  onChange={(e) => setFormData({ ...formData, total_copies: e.target.value })}
                  className="w-full p-2 border rounded"
                  min="1"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {editMode
                    ? (updateMutation.isPending ? 'Updating...' : 'Update Book')
                    : (createMutation.isPending ? 'Adding...' : 'Add Book')}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
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
