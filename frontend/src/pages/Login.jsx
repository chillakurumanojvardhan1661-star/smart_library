import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">VIT-AP Central Library</h1>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Sign up
          </Link>
        </p>

        <div className="mt-6 space-y-3">
          <p className="text-sm font-semibold text-gray-700 text-center mb-2">
            Demo Accounts (Click to auto-fill):
          </p>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@library.com');
              setPassword('admin123');
            }}
            className="w-full p-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-red-700">👨‍💼 Admin</p>
                <p className="text-xs text-gray-600">admin@library.com / admin123</p>
              </div>
              <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">Full Access</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('faculty@library.com');
              setPassword('faculty123');
            }}
            className="w-full p-3 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-purple-700">👩‍🏫 Faculty</p>
                <p className="text-xs text-gray-600">faculty@library.com / faculty123</p>
              </div>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded">10 Books</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('student@library.com');
              setPassword('student123');
            }}
            className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-blue-700">🎓 Student</p>
                <p className="text-xs text-gray-600">student@library.com / student123</p>
              </div>
              <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">5 Books</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setEmail('staff@library.com');
              setPassword('staff123');
            }}
            className="w-full p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-700">🏢 Staff</p>
                <p className="text-xs text-gray-600">staff@library.com / staff123</p>
              </div>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">5 Books</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
