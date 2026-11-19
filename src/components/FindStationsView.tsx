import React, { useState, useMemo } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  BatteryCharging,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { Station } from '../types';
import { GoogleMapView } from './GoogleMapView';

interface FindStationsViewProps {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (station: Station) => void;
  center: [number, number];
  userLocation: [number, number] | null;
  onRequestUserLocation: () => void;
  onUserLocationChange?: (coords: [number, number]) => void;
  selectedCity: string;
}

export const FindStationsView: React.FC<FindStationsViewProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  center,
  userLocation,
  onRequestUserLocation,
  onUserLocationChange,
  selectedCity,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChargerType, setSelectedChargerType] = useState('ALL');
  const [selectedDemand, setSelectedDemand] = useState('ALL');
  const [minPorts, setMinPorts] = useState(0);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = station.station_name.toLowerCase().includes(query);
        const matchesArea = station.area.toLowerCase().includes(query);
        const matchesCity = station.city.toLowerCase().includes(query);
        const matchesProvider = station.provider.toLowerCase().includes(query);
        const matchesAddress = station.address.toLowerCase().includes(query);
        if (!matchesName && !matchesArea && !matchesCity && !matchesProvider && !matchesAddress) {
          return false;
        }
      }

      if (selectedChargerType !== 'ALL') {
        if (!station.charger_type.toLowerCase().includes(selectedChargerType.toLowerCase())) {
          return false;
        }
      }

      if (selectedDemand !== 'ALL') {
        if (station.demand_level !== selectedDemand) {
          return false;
        }
      }

      if (minPorts > 0 && station.total_ports < minPorts) {
        return false;
      }

      if (availableOnly && (!station.available_ports || station.available_ports <= 0)) {
        return false;
      }

      return true;
    });
  }, [stations, searchQuery, selectedChargerType, selectedDemand, minPorts, availableOnly]);

  const calculateDistanceKm = (lat: number, lon: number): string | null => {
    if (!userLocation) return null;
    const [uLat, uLon] = userLocation;
    const R = 6371;
    const dLat = ((lat - uLat) * Math.PI) / 180;
    const dLon = ((lon - uLon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((uLat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return `${d.toFixed(1)} km`;
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedChargerType('ALL');
    setSelectedDemand('ALL');
    setMinPorts(0);
    setAvailableOnly(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Find EV Charging Stations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Explore stations in {selectedCity} with connector specs, tariff rates, and demo availability counts.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 p-1 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              viewMode === 'split' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              viewMode === 'map' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Map Only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
              viewMode === 'list' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
            }`}
          >
            List Only
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by area, station name, provider, or road..."
              className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onRequestUserLocation}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
              userLocation
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                : 'bg-white hover:bg-zinc-200 text-black border-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{userLocation ? 'GPS Location Active' : 'Use My Current Location'}</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-800 text-xs">
          <div>
            <label className="text-zinc-400 block mb-1 font-medium">Charger Type</label>
            <select
              value={selectedChargerType}
              onChange={(e) => setSelectedChargerType(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="CCS2">CCS2 DC Fast</option>
              <option value="Type 2">Type 2 AC</option>
              <option value="120kW">Ultra-Fast 120kW</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-medium">Demand Level</label>
            <select
              value={selectedDemand}
              onChange={(e) => setSelectedDemand(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Demand Levels</option>
              <option value="Low">Low Demand (Free)</option>
              <option value="Medium">Medium Demand</option>
              <option value="High">High Demand (Crowded)</option>
            </select>
          </div>

          <div>
            <label className="text-zinc-400 block mb-1 font-medium">Capacity (Ports)</label>
            <select
              value={minPorts}
              onChange={(e) => setMinPorts(Number(e.target.value))}
              className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={0}>Any Capacity</option>
              <option value={4}>4+ Ports</option>
              <option value={6}>6+ Ports</option>
              <option value={8}>8+ Ports</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 py-1.5 cursor-pointer text-zinc-300">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded border-zinc-700 accent-emerald-500"
              />
              <span className="font-medium text-xs">Available Ports Only</span>
            </label>
          </div>

          <div className="col-span-2 sm:col-span-1 flex flex-col justify-end">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer text-xs"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`grid gap-6 ${viewMode === 'split' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'}`}>
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={viewMode === 'split' ? 'lg:col-span-7' : 'w-full'}>
            <div className="sticky top-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-400 tabular-nums">
                  Showing <strong className="text-emerald-400">{filteredStations.length}</strong> matching stations
                </span>
                <span className="text-[11px] text-zinc-500">Tap pin to preview · Demo dataset</span>
              </div>
              <GoogleMapView
                stations={filteredStations}
                selectedStation={selectedStation}
                onSelectStation={onSelectStation}
                center={center}
                zoom={12}
                userLocation={userLocation}
                onUserLocationChange={onUserLocationChange}
                heightClass={
                  viewMode === 'split'
                    ? 'h-[420px] sm:h-[540px] lg:h-[620px]'
                    : 'h-[500px] sm:h-[640px] lg:h-[750px]'
                }
              />
            </div>
          </div>
        )}

        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={viewMode === 'split' ? 'lg:col-span-5' : 'w-full'}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                <span className="tabular-nums">Station Results ({filteredStations.length})</span>
              </h3>
              <span className="text-xs text-zinc-500">Demo availability</span>
            </div>

            {filteredStations.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
                <SlidersHorizontal className="w-8 h-8 text-zinc-500 mx-auto" />
                <h4 className="text-sm font-semibold text-white">
                  No charging stations match your criteria
                </h4>
                <p className="text-xs text-zinc-400">
                  Try clearing the search query or loosening your demand/connector filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {filteredStations.map((station) => {
                  const isSelected = selectedStation?.station_id === station.station_id;
                  const distance = calculateDistanceKm(station.latitude, station.longitude);

                  return (
                    <div
                      key={station.station_id}
                      onClick={() => onSelectStation(station)}
                      className={`p-4 rounded-2xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-900 border-emerald-500'
                          : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 text-[11px] text-zinc-400 font-mono">
                            <span>{station.provider}</span>
                            {distance && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-400 font-semibold tabular-nums">
                                  {distance} away
                                </span>
                              </>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-white truncate">
                            {station.station_name}
                          </h4>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>
                              {station.area}, {station.city}
                            </span>
                          </p>
                        </div>

                        <span
                          className={`text-[11px] font-semibold shrink-0 ${
                            station.demand_level === 'High'
                              ? 'text-rose-400'
                              : station.demand_level === 'Medium'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {station.demand_level} Demand
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-black rounded-xl border border-zinc-800 text-xs mb-3 tabular-nums">
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Charger</span>
                          <span className="font-semibold text-zinc-200 truncate block">
                            {station.charger_type.split(' ')[0]} {station.power_kw}kW
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Demo Ports</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {station.available_ports}/{station.total_ports}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">Tariff</span>
                          <span className="font-semibold text-white font-mono">
                            ₹{station.cost_per_kwh}/kWh
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStation(station);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          View Details &rarr;
                        </button>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-zinc-400 hover:text-white flex items-center gap-1 font-medium hover:underline text-xs"
                        >
                          <span>Directions</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
