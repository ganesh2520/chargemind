import React from 'react';
import {
  Zap,
  MapPin,
  TrendingUp,
  Cpu,
  BatteryCharging,
  ArrowRight,
  Activity,
  Gauge,
  ShieldAlert,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Station, DemandSummary } from '../types';
import { GoogleMapView } from './GoogleMapView';

interface HomeViewProps {
  stations: Station[];
  demandSummary: DemandSummary;
  selectedCity: string;
  onNavigate: (tab: string) => void;
  onSelectStation: (station: Station) => void;
  center: [number, number];
  userLocation?: [number, number] | null;
  onUserLocationChange?: (coords: [number, number]) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  stations,
  demandSummary,
  selectedCity,
  onNavigate,
  onSelectStation,
  center,
  userLocation = null,
  onUserLocationChange,
}) => {
  const topStations = stations.slice(0, 4);
  const freePct = Math.round(
    (demandSummary.availablePorts / (demandSummary.totalPorts || 1)) * 100
  );

  return (
    <div className="space-y-10 pb-14">
      {/* Workspace Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-7 sm:p-10 lg:p-12">
        <div className="absolute -top-24 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-3">
            GreenCharge AI · EV Grid Intelligence Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Find Your Charge.{' '}
            <span className="text-emerald-400">Predict the Demand.</span> Drive Green.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-7 max-w-2xl">
            Explore EV charging infrastructure across {selectedCity}, calculate real-world driving range, analyze historical demand patterns, and inspect simulated ML load forecasts.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('find')}
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Explore Stations</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('range')}
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              <Gauge className="w-4 h-4" />
              <span>EV Range Calculator</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('analytics')}
              className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-white font-medium px-4 py-2.5 rounded-lg border border-zinc-800 text-sm transition-colors cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Demand Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('prediction')}
              className="inline-flex items-center gap-2 bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white font-medium px-4 py-2.5 rounded-lg border border-zinc-800 text-sm transition-colors cursor-pointer"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>AI Forecast</span>
            </button>
          </div>
        </div>
      </section>

      {/* Network Summary KPIs */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Network Overview ({selectedCity})</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Computed dynamically from the active dataset ({stations.length} stations)
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Demo Dataset · Simulated Availability</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Total Stations
              </span>
              <MapPin className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {demandSummary.totalStations}
              </span>
              <span className="text-xs text-zinc-400">in {selectedCity}</span>
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              Mapped with Google Maps coordinates
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Charging Ports
              </span>
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {demandSummary.totalPorts}
              </span>
              <span className="text-xs text-zinc-400">total connectors</span>
            </div>
            <div className="mt-3 text-xs text-zinc-500">
              CCS2 DC Fast &amp; Type 2 AC
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Dataset Ports Free
              </span>
              <Gauge className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {demandSummary.availablePorts}
              </span>
              <span className="text-xs text-emerald-400 font-mono tabular-nums">
                {freePct}% free (demo)
              </span>
            </div>
            <div className="mt-3 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${freePct}%` }}
              />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                High-Demand Hubs
              </span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tabular-nums">
                {demandSummary.highDemandCount}
              </span>
              <span className="text-xs text-rose-400 font-medium">peak hubs</span>
            </div>
            <div className="mt-3 text-xs text-zinc-500 tabular-nums">
              {demandSummary.mediumDemandCount} Med · {demandSummary.lowDemandCount} Low demand
            </div>
          </div>
        </div>
      </section>

      {/* Map & Demand Distribution Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Station Map Preview ({selectedCity})</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Click any marker to inspect connector specifications and dataset status
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('find')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Full Map Explorer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <GoogleMapView
            stations={stations}
            selectedStation={null}
            onSelectStation={onSelectStation}
            center={center}
            zoom={12}
            userLocation={userLocation}
            onUserLocationChange={onUserLocationChange}
            heightClass="h-[360px] sm:h-[420px]"
          />
        </div>

        {/* Demand Distribution */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Demand Distribution</span>
              </h3>
              <span className="text-xs text-zinc-500 font-mono">Dataset</span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Categorized from the active station dataset using occupancy thresholds and charging frequency:
            </p>

            <div className="space-y-4">
              {/* High */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-rose-400">High Demand (&gt;75% Occ.)</span>
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {demandSummary.highDemandCount} ({Math.round((demandSummary.highDemandCount / (stations.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full rounded-full"
                    style={{
                      width: `${Math.round((demandSummary.highDemandCount / (stations.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Medium */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-amber-400">Medium Demand (45–75% Occ.)</span>
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {demandSummary.mediumDemandCount} ({Math.round((demandSummary.mediumDemandCount / (stations.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${Math.round((demandSummary.mediumDemandCount / (stations.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* Low */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-emerald-400">Low Demand (&lt;45% Occ.)</span>
                  <span className="font-mono tabular-nums text-white font-semibold">
                    {demandSummary.lowDemandCount} ({Math.round((demandSummary.lowDemandCount / (stations.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${Math.round((demandSummary.lowDemandCount / (stations.length || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800">
            <div className="bg-black rounded-xl p-3 border border-zinc-800 text-xs text-zinc-400">
              <span className="font-semibold text-emerald-400 block mb-0.5">Operator Takeaway</span>
              High-demand clusters highlight corridors suited for fast-charger expansion or dynamic peak scheduling.
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Featured Charging Hubs</h3>
            <p className="text-xs text-zinc-400">Strategic locations across {selectedCity} (Demo Dataset)</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('find')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All {stations.length} Stations</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {topStations.map((station) => (
            <div
              key={station.station_id}
              onClick={() => onSelectStation(station)}
              className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/60 rounded-2xl p-4 transition-colors cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
                  <span className="font-mono text-zinc-400 uppercase">
                    {station.provider.split(' ')[0]}
                  </span>
                  <span
                    className={`font-semibold ${
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

                <h4 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
                  {station.station_name}
                </h4>
                <p className="text-xs text-zinc-400 line-clamp-1 mb-3">
                  {station.area}, {station.city}
                </p>

                <div className="text-xs space-y-1.5 py-2.5 px-3 bg-black rounded-xl border border-zinc-800 mb-3 tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Demo Ports</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {station.available_ports}/{station.total_ports}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Power</span>
                    <span className="font-semibold text-white font-mono">
                      {station.power_kw} kW
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-zinc-800 text-zinc-400">
                <span className="font-mono tabular-nums text-white">₹{station.cost_per_kwh}/kWh</span>
                <span className="text-emerald-400 font-semibold group-hover:underline">
                  Details &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('find')}
          className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-colors cursor-pointer"
        >
          <MapPin className="w-5 h-5 text-emerald-400 mb-3" />
          <h3 className="font-bold text-sm text-white mb-1.5">Google Maps Station Finder</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Interactive map with custom markers, place search autocomplete, connector filters, and GPS distance.
          </p>
        </div>

        <div
          onClick={() => onNavigate('range')}
          className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-colors cursor-pointer"
        >
          <Gauge className="w-5 h-5 text-emerald-400 mb-3" />
          <h3 className="font-bold text-sm text-white mb-1.5">EV Range Calculator</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Compute remaining km, safety reserve buffer, top-up times, and reachable stations from battery specs.
          </p>
        </div>

        <div
          onClick={() => onNavigate('analytics')}
          className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-colors cursor-pointer"
        >
          <TrendingUp className="w-5 h-5 text-emerald-400 mb-3" />
          <h3 className="font-bold text-sm text-white mb-1.5">Demand Analytics</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Inspect hourly diurnal profiles, day-of-week curves, and station utilization rankings.
          </p>
        </div>

        <div
          onClick={() => onNavigate('prediction')}
          className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-colors cursor-pointer"
        >
          <Cpu className="w-5 h-5 text-emerald-400 mb-3" />
          <h3 className="font-bold text-sm text-white mb-1.5">Simulated ML Forecast</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Simulate future station occupancy across time slots, weekdays, and atmospheric conditions.
          </p>
        </div>
      </section>
    </div>
  );
};
