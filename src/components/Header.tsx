import { MapPin, AlertCircle, BarChart3, LogIn, LogOut, Shield, User as UserIcon } from 'lucide-react';
import type { AuthUser } from '../lib/authService';

interface HeaderProps {
  activeView: 'map' | 'report' | 'dashboard';
  onViewChange: (view: 'map' | 'report' | 'dashboard') => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Header({
  activeView,
  onViewChange,
  currentUser,
  onOpenAuth,
  onLogout,
}: HeaderProps) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white shadow-lg sticky top-0 z-[2000]">
      <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* BRAND LOGO */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewChange('map')}>
            <div className="bg-white p-2 rounded-xl shadow-md">
              <MapPin className="text-blue-600" size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">CampusConnect</h1>
                {isAdmin && (
                  <span className="bg-amber-400 text-gray-900 font-extrabold text-[10px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                    Admin Portal
                  </span>
                )}
              </div>
              <p className="text-blue-100 text-xs hidden sm:block">Report. Track. Navigate.</p>
            </div>
          </div>

          {/* NAVIGATION TABS & USER AUTH */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto flex-wrap">
            <nav className="flex gap-1.5 bg-black/15 p-1 rounded-xl backdrop-blur-md">
              <button
                onClick={() => onViewChange('map')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'map'
                    ? 'bg-white text-blue-700 font-bold shadow-md'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <MapPin size={16} />
                <span>Map</span>
              </button>

              <button
                onClick={() => onViewChange('report')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'report'
                    ? 'bg-white text-blue-700 font-bold shadow-md'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <AlertCircle size={16} />
                <span>Report Issue</span>
              </button>

              <button
                onClick={() => onViewChange('dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-white text-blue-700 font-bold shadow-md'
                    : 'text-white/90 hover:text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 size={16} />
                <span>Dashboard</span>
              </button>
            </nav>

            {/* AUTH / PROFILE SECTION */}
            <div className="pl-1 border-l border-white/20">
              {currentUser ? (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm text-white">
                    {isAdmin ? <Shield size={16} className="text-amber-300" /> : <UserIcon size={16} />}
                  </div>

                  <div className="hidden md:block text-left">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>{currentUser.name}</span>
                      {isAdmin ? (
                        <span className="bg-purple-900/60 text-purple-200 border border-purple-300/40 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="bg-emerald-900/60 text-emerald-200 border border-emerald-300/40 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                          USER
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-blue-200 truncate max-w-[130px]">
                      {currentUser.email}
                    </div>
                  </div>

                  <button
                    onClick={onLogout}
                    className="ml-1 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold px-3.5 py-2 rounded-xl text-xs sm:text-sm transition shadow-md cursor-pointer"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
