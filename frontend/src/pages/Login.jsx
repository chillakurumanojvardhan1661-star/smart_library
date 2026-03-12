import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back to the Library!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950 flex flex-col lg:flex-row items-center justify-center p-6 selection:bg-blue-500/30">
      {/* Background Image with Parallax & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/library_bg.png" 
          alt="Library Background" 
          className="w-full h-full object-cover opacity-60 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/70 to-blue-900/40"></div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Hero Content */}
      <div className="relative z-10 lg:mr-20 text-center lg:text-left mb-12 lg:mb-0 max-w-xl">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 animate-bounce">
          <span>✨ New 3D Library Experience</span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
          Smaert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Library</span> Management
        </h1>
        <p className="text-lg text-slate-300 mb-8 leading-relaxed">
          Experience the future of knowledge management with our 3D-enhanced library portal. Access thousands of resources, track your issues, and explore recommendations in a seamless environment.
        </p>
        <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
          <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-white font-medium flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>24/7 Access</span>
          </div>
          <div className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm text-white font-medium flex items-center space-x-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>3D Visualizer</span>
          </div>
        </div>
      </div>

      {/* Login Card with 3D Tilt */}
      <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative z-10 w-full max-w-[440px] tilt-card preserve-3d"
      >
        <div className="glass-morphism rounded-3xl p-8 lg:p-10 border border-white/10 relative overflow-hidden">
          {/* Subtle light streak */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rotate-45 blur-2xl pointer-events-none"></div>
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl mb-4 shadow-lg shadow-blue-500/20">
              📚
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to VIT-AP Central Library</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                placeholder="you@university.edu"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all duration-300"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/40 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 overflow-hidden"
            >
              <span className="relative z-10">{loading ? 'Verifying...' : 'Unlock Portal'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="text-center mb-6">
              <span className="text-sm text-slate-500">Quick access for testing</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                { role: 'Admin', icon: '👨‍💼', email: 'admin@library.com', pass: 'admin123', color: 'red' },
                { role: 'Student', icon: '🎓', email: 'student@library.com', pass: 'student123', color: 'blue' },
              ].map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword(demo.pass);
                  }}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <span className="text-2xl mb-1 filter grayscale group-hover:grayscale-0 transition-all">{demo.icon}</span>
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">{demo.role}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center mt-8 text-slate-400 text-sm">
            New to the library?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold underline decoration-blue-400/30 underline-offset-4">
              Join now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
