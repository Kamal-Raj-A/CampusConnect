import { useState } from 'react';
import { X, Shield, User, Lock, Mail, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import {
  ADMIN_EMAIL,
  AuthUser,
  loginUser,
  registerUser,
  quickLoginAdmin,
  quickLoginStudent,
} from '../lib/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthUser) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isAdminEmail = email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginUser(email, password);
    setLoading(false);

    if (res.success && res.user) {
      onSuccess?.(res.user);
      onClose();
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await registerUser(name, email, password);
    setLoading(false);

    if (res.success && res.user) {
      onSuccess?.(res.user);
      onClose();
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  const handleQuickAdmin = () => {
    const user = quickLoginAdmin();
    onSuccess?.(user);
    onClose();
  };

  const handleQuickStudent = () => {
    const user = quickLoginStudent();
    onSuccess?.(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transition-all">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Shield size={26} />
            </div>
            <div>
              <h3 className="text-xl font-extrabold tracking-tight">CampusConnect Account</h3>
              <p className="text-xs text-blue-100 mt-0.5">Role-Based Access for Students & Admins</p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex bg-black/20 p-1 rounded-xl mt-5 backdrop-blur-md">
            <button
              onClick={() => {
                setTab('signin');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === 'signin'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab('signup');
                setError(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 space-y-5">
          {/* QUICK DEMO SHORTCUTS */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 space-y-2">
            <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
              ⚡ Quick 1-Click Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="flex items-center gap-2 p-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer text-left"
              >
                <Shield size={16} className="shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-extrabold">Login as Admin</div>
                  <div className="text-[10px] text-purple-200 truncate">kamalraj3106@gmail.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleQuickStudent}
                className="flex items-center gap-2 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm cursor-pointer text-left"
              >
                <User size={16} className="shrink-0" />
                <div className="min-w-0">
                  <div className="truncate font-extrabold">Login as Student</div>
                  <div className="text-[10px] text-emerald-100 truncate">student@saveetha.edu</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kamalraj3106@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {isAdminEmail && (
                  <div className="mt-1.5 text-xs text-purple-700 font-semibold flex items-center gap-1 bg-purple-50 p-1.5 rounded-lg border border-purple-200">
                    <Shield size={14} className="text-purple-600" />
                    <span>Admin account recognized ({ADMIN_EMAIL})</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kamal Raj or John Doe"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. kamalraj3106@gmail.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                {isAdminEmail && (
                  <p className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={13} />
                    This email is designated as System Administrator.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
              >
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* ROLE NOTE */}
          <div className="pt-2 text-center text-[11px] text-gray-500 border-t border-gray-100">
            <p>
              🔑 <strong>Admin:</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-purple-700 font-mono font-bold">{ADMIN_EMAIL}</code> has permission to resolve and manage all issues.
            </p>
            <p className="mt-0.5">
              👤 <strong>Users:</strong> Can report issues and edit their own reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
