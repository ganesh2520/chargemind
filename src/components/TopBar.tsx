import React from 'react';
import { Menu, MapPin, Database, User } from 'lucide-react';
import { UserProfile } from '../types';

interface TopBarProps {
  activeTab: string;
  selectedCity: string;
  onCityChange: (city: string) => void;
  onOpenMobileMenu: () => void;
  onOpenDatasetModal: () => void;
  onOpenAuthModal: () => void;
  user: UserProfile | null;
  totalStationsCount: number;
}

const TAB_LABELS: Record<string, { section: string; page: string }> = {
  home: { section: 'Discovery & Grid', page: 'Overview' },
  find: { section: 'Discovery & Grid', page: 'Find Stations' },
  range: { section: 'EV Tools & Intelligence', page: 'EV Range Calculator' },
  analytics: { section: 'EV Tools & Intelligence', page: 'Demand Analytics' },
  prediction: { section: 'EV Tools & Intelligence', page: 'AI Demand Forecast' },
  about: { section: 'Documentation', page: 'About & Stack' },
};

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  selectedCity,
  onCityChange,
  onOpenMobileMenu,
  onOpenDatasetModal,
  onOpenAuthModal,
  user,
  totalStationsCount,
}) => {
  const crumb = TAB_LABELS[activeTab] || { section: 'Workspace', page: 'Dashboard' };

  return (
    <header className="sticky top-0 z-20 h-16 bg-black/90 backdrop-blur-md border-b border-zinc-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Trigger + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0 truncate">
          <span className="text-zinc-500 hidden sm:inline">GreenCharge AI</span>
          <span className="text-zinc-700 hidden sm:inline">/</span>
          <span className="text-zinc-400 hidden md:inline">{crumb.section}</span>
          <span className="text-zinc-700 hidden md:inline">/</span>
          <span className="font-semibold text-white truncate">{crumb.page}</span>
        </div>
      </div>

      {/* Right: City Switcher + Dataset + Account */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <select
            aria-label="Select City"
            value={selectedCity}
            onChange={(e) => onCityChange(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="Chennai" className="bg-zinc-950 text-white">Chennai</option>
            <option value="Coimbatore" className="bg-zinc-950 text-white">Coimbatore</option>
            <option value="Bengaluru" className="bg-zinc-950 text-white">Bengaluru</option>
            <option value="Custom" className="bg-zinc-950 text-white">Custom Dataset</option>
          </select>
          <span className="hidden sm:inline text-zinc-500 font-mono tabular-nums pl-1 border-l border-zinc-800">
            {totalStationsCount}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDatasetModal}
          className="hidden sm:inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dataset</span>
        </button>

        {user ? (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-4 h-4 rounded bg-black text-white flex items-center justify-center text-[10px] font-bold">
              {user.name[0]}
            </span>
            <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenAuthModal}
            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
