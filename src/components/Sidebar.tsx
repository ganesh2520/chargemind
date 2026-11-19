import React from 'react';
import {
  Zap,
  LayoutDashboard,
  MapPin,
  Gauge,
  TrendingUp,
  Cpu,
  Info,
  Database,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  selectedCity: string;
  totalStationsCount: number;
  onOpenDatasetModal: () => void;
  user: UserProfile | null;
  onOpenAuthModal: () => void;
}

interface NavGroup {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  onCloseMobile,
  selectedCity,
  totalStationsCount,
  onOpenDatasetModal,
  user,
  onOpenAuthModal,
}) => {
  const navGroups: NavGroup[] = [
    {
      title: 'Discovery & Grid',
      items: [
        { id: 'home', label: 'Overview', icon: LayoutDashboard },
        { id: 'find', label: 'Find Stations', icon: MapPin },
      ],
    },
    {
      title: 'EV Tools & Intelligence',
      items: [
        { id: 'range', label: 'EV Range Calculator', icon: Gauge },
        { id: 'analytics', label: 'Demand Analytics', icon: TrendingUp },
        { id: 'prediction', label: 'AI Demand Forecast', icon: Cpu },
      ],
    },
    {
      title: 'Documentation',
      items: [{ id: 'about', label: 'About & Stack', icon: Info }],
    },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-zinc-950 text-white border-r border-zinc-800 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-black shrink-0 group-hover:bg-emerald-400 transition-colors">
            <Zap className="w-5 h-5 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">
                GreenCharge
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                AI
              </span>
            </div>
            <span className="text-[11px] text-zinc-400 block leading-none mt-0.5">
              EV Intelligence Platform
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              {group.title}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-black font-semibold'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-black' : 'text-zinc-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.id === 'find' && (
                    <span
                      className={`text-[11px] font-mono tabular-nums ${
                        isActive ? 'text-black/80 font-bold' : 'text-zinc-500'
                      }`}
                    >
                      {totalStationsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Active Dataset Summary & Account Footer */}
      <div className="p-3 border-t border-zinc-800 space-y-2.5 shrink-0">
        <button
          type="button"
          onClick={() => {
            onOpenDatasetModal();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-left transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-semibold text-white block truncate">
                {selectedCity} Dataset
              </span>
              <span className="text-[11px] text-zinc-400 font-mono tabular-nums block">
                {totalStationsCount} stations · Demo
              </span>
            </div>
          </div>
          <span className="text-[11px] font-medium text-emerald-400 shrink-0">
            Edit
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenAuthModal();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-zinc-900 text-left transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-white text-black font-bold text-xs flex items-center justify-center shrink-0">
            {user ? user.name[0].toUpperCase() : 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-white block truncate">
              {user ? user.name : 'Sign In'}
            </span>
            <span className="text-[11px] text-zinc-400 block truncate">
              {user ? user.role : 'Driver / Operator Access'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex lg:shrink-0 lg:sticky lg:top-0 lg:h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
