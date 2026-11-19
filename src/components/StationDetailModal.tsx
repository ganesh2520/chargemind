import React from 'react';
import {
  X,
  MapPin,
  BatteryCharging,
  TrendingUp,
  ExternalLink,
  Cpu,
  Compass,
} from 'lucide-react';
import { Station } from '../types';

interface StationDetailModalProps {
  station: Station | null;
  onClose: () => void;
  onOpenPredictionForStation: (station: Station) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onOpenPredictionForStation,
}) => {
  if (!station) return null;

  const demandMultiplier =
    station.demand_level === 'High' ? 1.4 : station.demand_level === 'Medium' ? 1.0 : 0.7;
  const estimatedDailySessions = Math.round(station.total_ports * 6.5 * demandMultiplier);
  const avgDuration = station.power_kw >= 60 ? 42 : 95;
  const avgEnergyKwh = Math.round((avgDuration / 60) * station.power_kw * 0.78 * 10) / 10;
  const occupancyPct = Math.min(
    96,
    Math.round(
      station.demand_level === 'High' ? 82 : station.demand_level === 'Medium' ? 58 : 34
    )
  );
  const peakPeriod =
    station.demand_level === 'High' ? '18:00 – 21:00 (Evening Rush)' : '12:00 – 14:00 (Midday)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative text-white">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 p-6 flex items-start justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-mono">
              <span className="text-emerald-400 font-bold">{station.station_id}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300 font-sans">{station.provider}</span>
              <span className="text-zinc-600">·</span>
              <span
                className={`font-sans font-semibold ${
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

            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {station.station_name}
            </h2>
            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>{station.address}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close station modal"
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
            <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-zinc-400 font-medium uppercase block mb-1">
                Demo Ports
              </span>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {station.available_ports ?? 2} / {station.total_ports} Free
              </div>
              <span className="text-[11px] text-zinc-500">{station.status}</span>
            </div>

            <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-zinc-400 font-medium uppercase block mb-1">
                Power Output
              </span>
              <div className="text-base font-bold text-white font-mono">
                {station.power_kw} kW
              </div>
              <span className="text-[11px] text-zinc-500">Rated peak output</span>
            </div>

            <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-zinc-400 font-medium uppercase block mb-1">
                Tariff Rate
              </span>
              <div className="text-base font-bold text-white font-mono">
                ₹{station.cost_per_kwh}
              </div>
              <span className="text-[11px] text-zinc-500">per kWh</span>
            </div>

            <div className="bg-black border border-zinc-800 p-3.5 rounded-xl">
              <span className="text-[11px] text-zinc-400 font-medium uppercase block mb-1">
                Avg Occupancy
              </span>
              <div className="text-base font-bold text-emerald-400 font-mono">
                {occupancyPct}%
              </div>
              <span className="text-[11px] text-zinc-500">Dataset estimate</span>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>Charging Infrastructure &amp; Compatibility</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Connector Standard</span>
                  <span className="font-semibold text-white">{station.charger_type}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Total Ports</span>
                  <span className="font-semibold text-white font-mono">{station.total_ports} Guns</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Supported EVs</span>
                  <span className="font-semibold text-white">Cars, SUVs, Fleets</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Payment Modes</span>
                  <span className="font-semibold text-white">UPI, RFID, App Wallet</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Network Operator</span>
                  <span className="font-semibold text-white">{station.provider}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-800">
                  <span className="text-zinc-400">Amenities</span>
                  <span className="font-semibold text-white">24/7 Access, CCTV</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black border border-zinc-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Simulated Usage Patterns (Demo Dataset B)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 tabular-nums">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block mb-1">Est. Daily Sessions</span>
                <span className="text-lg font-bold text-white font-mono">
                  {estimatedDailySessions}
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block mb-1">Avg Session Duration</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {avgDuration} mins
                </span>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <span className="text-[11px] text-zinc-400 block mb-1">Avg Energy Delivered</span>
                <span className="text-lg font-bold text-white font-mono">{avgEnergyKwh} kWh</span>
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-lg border border-zinc-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Peak Charging Period</span>
                <span className="font-semibold text-amber-400">{peakPeriod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Demand Threshold Rule</span>
                <span className="text-zinc-300 font-mono text-[11px]">
                  {station.demand_level === 'High'
                    ? 'Occupancy >= 75%'
                    : station.demand_level === 'Medium'
                    ? '45% <= Occ < 75%'
                    : 'Occupancy < 45%'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-black border border-zinc-800 rounded-xl gap-4">
            <div className="space-y-1 text-xs">
              <span className="text-zinc-400 font-semibold block">Geographic Coordinates</span>
              <div className="font-mono text-emerald-400 flex items-center gap-2 tabular-nums">
                <Compass className="w-3.5 h-3.5" />
                <span>
                  {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                {station.area} · {station.city}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPredictionForStation(station);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black font-semibold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>Simulate Forecast</span>
              </button>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-4 py-2.5 rounded-lg text-xs transition cursor-pointer"
              >
                <span>Navigate</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
