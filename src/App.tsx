import { useState, useEffect } from 'react';
import Header from './components/Header';
import CampusMap from './components/CampusMap';
import IssueReportForm from './components/IssueReportForm';
import IssueDashboard from './components/IssueDashboard';
import AuthModal from './components/AuthModal';
import { Columns2, Rows3, MapPin } from 'lucide-react';
import {
  AuthUser,
  getCurrentUser,
  logoutUser,
  onAuthStateChange,
} from './lib/authService';

function App() {
  const [activeView, setActiveView] = useState<'map' | 'report' | 'dashboard'>('map');
  const [layoutMode, setLayoutMode] = useState<'split' | 'stacked'>('split');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | undefined>();
  const [refreshMap, setRefreshMap] = useState(0);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChange((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
  };

  const handleReportSuccess = () => {
    setSelectedLocation(undefined);
    setRefreshMap((prev) => prev + 1);
    setActiveView('map');
  };

  const handleLogout = () => {
    logoutUser();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/60 flex flex-col">
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8 py-4 flex-1 flex flex-col">
        {/* MAP VIEW */}
        {activeView === 'map' && (
          <div
            className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 relative"
            style={{ height: 'calc(100vh - 130px)', minHeight: '620px' }}
          >
            <CampusMap key={refreshMap} />
          </div>
        )}

        {/* REPORT ISSUE VIEW */}
        {activeView === 'report' && (
          <div className="w-full space-y-4">
            {/* Control Bar: Title & Layout Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <MapPin size={22} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">
                    Report Campus Issue
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Select a campus facility from the map, drop a pin, and provide the issue details.
                  </p>
                </div>
              </div>

              {/* Layout Switcher */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-semibold text-gray-500 hidden sm:inline">View Mode:</span>
                <div className="bg-gray-100 p-1 rounded-xl flex items-center gap-1 border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setLayoutMode('split')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'split'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Side-by-Side Widescreen Layout"
                  >
                    <Columns2 size={15} />
                    <span>Side-by-Side</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode('stacked')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      layoutMode === 'stacked'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Full-Width Stacked Layout"
                  >
                    <Rows3 size={15} />
                    <span>Stacked</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split (Side-by-Side) Layout */}
            {layoutMode === 'split' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Huge Interactive Map */}
                <div className="lg:col-span-7 xl:col-span-7 bg-white rounded-2xl shadow-xl p-4 sm:p-5 border border-gray-100 flex flex-col h-[calc(100vh-175px)] min-h-[640px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      Interactive Campus Map
                    </span>
                    {selectedLocation && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full truncate max-w-xs shadow-xs">
                        📍 {selectedLocation.name}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative">
                    <CampusMap
                      selectMode={true}
                      selectedLocation={selectedLocation}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                </div>

                {/* Right Column: Issue Form */}
                <div className="lg:col-span-5 xl:col-span-5 h-[calc(100vh-175px)] min-h-[640px] overflow-y-auto custom-scrollbar">
                  <IssueReportForm
                    onSuccess={handleReportSuccess}
                    preselectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    currentUser={currentUser}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                  />
                </div>
              </div>
            ) : (
              /* Stacked Full-Width Layout */
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Interactive Campus Map</h3>
                      <p className="text-xs text-gray-500">
                        Pick a building from the dropdown or click anywhere on the map.
                      </p>
                    </div>
                    {selectedLocation && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                        📍 {selectedLocation.name}
                      </span>
                    )}
                  </div>

                  <div
                    className="w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative"
                    style={{ height: '70vh', minHeight: '520px' }}
                  >
                    <CampusMap
                      selectMode={true}
                      selectedLocation={selectedLocation}
                      onLocationSelect={handleLocationSelect}
                    />
                  </div>
                </div>

                <div className="w-full">
                  <IssueReportForm
                    onSuccess={handleReportSuccess}
                    preselectedLocation={selectedLocation}
                    onLocationSelect={handleLocationSelect}
                    currentUser={currentUser}
                    onOpenAuth={() => setIsAuthModalOpen(true)}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* DASHBOARD VIEW */}
        {activeView === 'dashboard' && (
          <IssueDashboard
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto py-4">
        <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 text-sm">
          <p className="font-semibold text-gray-800 mb-0.5">
            CampusConnect - Making Campus Better Together
          </p>
          <p className="text-xs text-gray-500">
            Report issues, track progress, and navigate your campus efficiently.
          </p>
        </div>
      </footer>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />
    </div>
  );
}

export default App;
