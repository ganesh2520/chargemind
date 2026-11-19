import React, { useState, useMemo, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { Station, UserProfile } from './types';
import { CHENNAI_STATIONS, CITY_PRESETS } from './data/defaultStations';
import { generateUsageRecordsForStations } from './data/historicalUsage';
import { computeDemandSummary } from './services/analyticsEngine';

import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HomeView } from './components/HomeView';
import { FindStationsView } from './components/FindStationsView';
import { RangeCalculatorView } from './components/RangeCalculatorView';
import { StationDetailModal } from './components/StationDetailModal';
import { DemandAnalyticsView } from './components/DemandAnalyticsView';
import { PredictionView } from './components/PredictionView';
import { AboutView } from './components/AboutView';
import { DatasetModal } from './components/DatasetModal';
import { AuthModal } from './components/AuthModal';
import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('Chennai');
  const [stations, setStations] = useState<Station[]>(CHENNAI_STATIONS);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Modals
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User Auth State
  const [user, setUser] = useState<UserProfile | null>({
    name: 'Ganeshamanimoorthy B',
    email: 'ganeshamanimoorthy419@gmail.com',
    role: 'EV Driver',
  });

  // User Geolocation
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Map center determined by active preset
  const activePreset = useMemo(() => {
    return CITY_PRESETS.find((p) => p.name === selectedCity) || CITY_PRESETS[0];
  }, [selectedCity]);

  // Usage records dynamically generated for active stations dataset (Demo Dataset B)
  const usageRecords = useMemo(() => {
    return generateUsageRecordsForStations(stations);
  }, [stations]);

  // Network metrics (computed dynamically)
  const demandSummary = useMemo(() => {
    return computeDemandSummary(stations, usageRecords);
  }, [stations, usageRecords]);

  // Change City Preset
  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    const found = CITY_PRESETS.find((p) => p.name === cityName);
    if (found) {
      setStations(found.stations);
      setSelectedStation(null);
    }
  };

  // Custom stations uploaded via CSV or JSON
  const handleUploadCustomStations = (customStations: Station[]) => {
    setStations(customStations);
    setSelectedCity('Custom');
    setSelectedStation(null);
  };

  // Geolocation trigger
  const handleRequestUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Graceful fallback to center of active preset if denied
          setUserLocation(activePreset.center);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setUserLocation(activePreset.center);
    }
  };

  // Station Detail Selection
  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setIsStationModalOpen(true);
  };

  // Trigger Prediction specifically for a station
  const handleOpenPredictionForStation = (station: Station) => {
    setSelectedStation(station);
    setIsStationModalOpen(false);
    setActiveTab('prediction');
  };

  return (
    <APIProvider
      apiKey={GOOGLE_MAPS_API_KEY}
      libraries={['marker', 'places']}
      language="en"
      region="IN"
    >
      <div className="min-h-screen bg-black text-white flex font-sans selection:bg-emerald-500 selection:text-black">
        {/* Responsive SaaS Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          selectedCity={selectedCity}
          totalStationsCount={stations.length}
          onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />

        {/* Workspace Column */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          {/* Google Maps Quota Warning Banner (if quota reached) */}
          {quotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
            </div>
          )}

          {/* Top Workspace Utility Bar */}
          <TopBar
            activeTab={activeTab}
            selectedCity={selectedCity}
            onCityChange={handleCityChange}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenDatasetModal={() => setIsDatasetModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            user={user}
            totalStationsCount={stations.length}
          />

          {/* Main Content Viewport */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
            {activeTab === 'home' && (
              <HomeView
                stations={stations}
                demandSummary={demandSummary}
                selectedCity={selectedCity}
                onNavigate={setActiveTab}
                onSelectStation={handleSelectStation}
                center={activePreset.center}
                userLocation={userLocation}
                onUserLocationChange={setUserLocation}
              />
            )}

            {activeTab === 'find' && (
              <FindStationsView
                stations={stations}
                selectedStation={selectedStation}
                onSelectStation={handleSelectStation}
                center={activePreset.center}
                userLocation={userLocation}
                onRequestUserLocation={handleRequestUserLocation}
                onUserLocationChange={setUserLocation}
                selectedCity={selectedCity}
              />
            )}

            {activeTab === 'range' && (
              <RangeCalculatorView
                stations={stations}
                selectedCity={selectedCity}
                center={activePreset.center}
                userLocation={userLocation}
                onRequestUserLocation={handleRequestUserLocation}
                onSelectStation={handleSelectStation}
              />
            )}

            {activeTab === 'analytics' && (
              <DemandAnalyticsView
                stations={stations}
                usageRecords={usageRecords}
                selectedCity={selectedCity}
                onSelectStation={handleSelectStation}
              />
            )}

            {activeTab === 'prediction' && (
              <PredictionView
                stations={stations}
                initialSelectedStation={selectedStation}
                onSelectStation={handleSelectStation}
              />
            )}

            {activeTab === 'about' && <AboutView />}
          </main>

          {/* Compact SaaS Footer */}
          <footer className="bg-black border-t border-zinc-900 mt-auto py-6 text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Zap className="w-3 h-3" />
                </div>
                <span className="font-semibold text-zinc-300">GreenCharge AI</span>
                <span>· Smart EV Station Finder & Demand Forecasting</span>
              </div>

              <div className="flex items-center gap-4 text-zinc-400">
                <span>
                  Team Lead: <strong className="text-emerald-400">Ganeshamanimoorthy B</strong>
                </span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className="hover:text-white underline cursor-pointer"
                >
                  Project Details
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setIsDatasetModalOpen(true)}
                  className="hover:text-white underline cursor-pointer"
                >
                  Manage CSV Data
                </button>
              </div>
            </div>
          </footer>
        </div>

        {/* Station Detail Modal */}
        {isStationModalOpen && (
          <StationDetailModal
            station={selectedStation}
            onClose={() => setIsStationModalOpen(false)}
            onOpenPredictionForStation={handleOpenPredictionForStation}
          />
        )}

        {/* Dataset & CSV Modal */}
        <DatasetModal
          isOpen={isDatasetModalOpen}
          onClose={() => setIsDatasetModalOpen(false)}
          currentCity={selectedCity}
          onSelectCityPreset={handleCityChange}
          onUploadCustomStations={handleUploadCustomStations}
          currentStations={stations}
          currentUsageRecords={usageRecords}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={user}
          onLogin={(u) => setUser(u)}
          onLogout={() => setUser(null)}
        />
      </div>
    </APIProvider>
  );
}
