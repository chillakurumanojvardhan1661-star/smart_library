import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import Issues from './pages/Issues';
import Analytics from './pages/Analytics';
import Recommendations from './pages/Recommendations';
import Fines from './pages/Fines';
import Users from './pages/Users';
import Reservations from './pages/Reservations';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return children;
}

function AppContent() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">📚 VIT-AP University Central Library</h1>
            <div className="flex gap-6 items-center">
              <Link to="/" className="hover:text-blue-200 transition">Dashboard</Link>
              <Link to="/books" className="hover:text-blue-200 transition">Books</Link>
              <Link to="/reservations" className="hover:text-blue-200 transition">
                {user.role === 'admin' ? 'Reservations' : 'My Reservations'}
              </Link>
              
              {/* Admin-only navigation */}
              {user.role === 'admin' && (
                <>
                  <Link to="/users" className="hover:text-blue-200 transition">Users</Link>
                  <Link to="/members" className="hover:text-blue-200 transition">Members</Link>
                  <Link to="/issues" className="hover:text-blue-200 transition">Issues</Link>
                  <Link to="/fines" className="hover:text-blue-200 transition">Fines</Link>
                </>
              )}
              
              {/* Non-admin users can see their fine balance */}
              {user.role !== 'admin' && (
                <Link to="/fines" className="hover:text-blue-200 transition">My Fines</Link>
              )}
              
              <Link to="/recommendations" className="hover:text-blue-200 transition">Recommendations</Link>
              
              {/* Analytics for admin and faculty */}
              {(user.role === 'admin' || user.role === 'faculty') && (
                <Link to="/analytics" className="hover:text-blue-200 transition">Analytics</Link>
              )}
              
              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/30">
                <div className="text-sm">
                  <div className="font-semibold">{user.username}</div>
                  <div className="text-xs text-blue-100 capitalize">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/reservations" element={<ProtectedRoute><Reservations /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute><Issues /></ProtectedRoute>} />
          <Route path="/fines" element={<ProtectedRoute><Fines /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
