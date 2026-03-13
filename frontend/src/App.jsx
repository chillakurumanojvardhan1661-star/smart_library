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
import PendingApproval from './pages/PendingApproval';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  // Check if user is pending approval
  if (user.status === 'pending') {
    return <Navigate to="/pending-approval" />;
  }

  return children;
}

function AppContent() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Redirect pending users to approval page
  if (user.status === 'pending') {
    return (
      <Routes>
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="*" element={<Navigate to="/pending-approval" />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 selection:bg-blue-500/30">
      {/* Global Background Image with Deep Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <img 
          src="/library_bg.png" 
          alt="Library Background" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-blue-900/30"></div>
      </div>

      <nav className="relative z-10 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 text-white shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl lg:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              📚 VIT-AP University Central Library
            </h1>
            <div className="flex gap-4 lg:gap-6 items-center">
              <Link to="/" className="text-sm font-medium hover:text-blue-400 transition-colors">Dashboard</Link>
              <Link to="/books" className="text-sm font-medium hover:text-blue-400 transition-colors">Books</Link>
              <Link to="/reservations" className="text-sm font-medium hover:text-blue-400 transition-colors">
                {user.role === 'admin' ? 'Reservations' : 'My Reservations'}
              </Link>

              <div className="hidden lg:flex gap-6 items-center">
                {user.role === 'admin' && (
                  <>
                    <Link to="/users" className="text-sm font-medium hover:text-blue-400 transition-colors">Users</Link>
                    <Link to="/issues" className="text-sm font-medium hover:text-blue-400 transition-colors">Issues</Link>
                    <Link to="/fines" className="text-sm font-medium hover:text-blue-400 transition-colors">Fines</Link>
                    <Link to="/settings" className="text-sm font-medium hover:text-blue-400 transition-colors flex items-center gap-1">⚙️ Settings</Link>
                  </>
                )}
                
                {(user.role === 'admin' || user.role === 'faculty') && (
                  <Link to="/members" className="text-sm font-medium hover:text-blue-400 transition-colors">Members</Link>
                )}

                {user.role !== 'admin' && (
                  <Link to="/fines" className="text-sm font-medium hover:text-blue-400 transition-colors">My Fines</Link>
                )}

                <Link to="/recommendations" className="text-sm font-medium hover:text-blue-400 transition-colors">Recommendations</Link>

                {(user.role === 'admin' || user.role === 'faculty') && (
                  <Link to="/analytics" className="text-sm font-medium hover:text-blue-400 transition-colors">Analytics</Link>
                )}
              </div>

              <div className="flex items-center gap-3 ml-2 lg:ml-4 pl-4 border-l border-white/20">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-white">{user.username}</div>
                  <div className="text-[10px] text-blue-400 uppercase tracking-wider font-semibold">{user.role}</div>
                </div>
                <button
                  onClick={logout}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-8 overflow-y-auto">
        <div className="glass-morphism rounded-3xl p-1 bg-white/[0.02] border border-white/5 shadow-inner">
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
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Routes>
        </div>
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
