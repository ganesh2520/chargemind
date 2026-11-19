import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Gauge,
  BatteryCharging,
  Zap,
  Navigation,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { Chart, registerables } from 'chart.js';
import { Station } from '../types';

Chart.register(...registerables);

interface RangeCalculatorViewProps {
  stations: Station[];
  selectedCity: string;
  center: [number, number];
  userLocation: [number, number] | null;
  onRequestUserLocation: () => void;
  onSelectStation: (station: Station) => void;
}

interface EvPreset {
  id: string;
  name: string;
  batteryKwh: number;
  efficiencyKmPerKwh: number;
  dcPeakKw: number;
}

const EV_PRESETS: EvPreset[] = [
  { id: 'nexon-lr', name: 'Tata Nexon EV LR', batteryKwh: 40.5, efficiencyKmPerKwh: 7.2, dcPeakKw: 50 },
  { id: 'punch-lr', name: 'Tata Punch EV LR', batteryKwh: 35.0, efficiencyKmPerKwh: 7.8, dcPeakKw: 50 },
  { id: 'mg-zs', name: 'MG ZS EV', batteryKwh: 50.3, efficiencyKmPerKwh: 7.1, dcPeakKw: 76 },
  { id: 'byd-atto3', name: 'BYD Atto 3', batteryKwh: 60.5, efficiencyKmPerKwh: 7.4, dcPeakKw: 88 },
  { id: 'ioniq-5', name: 'Hyundai Ioniq 5', batteryKwh: 72.6, efficiencyKmPerKwh: 6.9, dcPeakKw: 150 },
  { id: 'xuv400', name: 'Mahindra XUV400 Pro', batteryKwh: 39.4, efficiencyKmPerKwh: 7.0, dcPeakKw: 50 },
  { id: 'custom', name: 'Custom Vehicle', batteryKwh: 45.0, efficiencyKmPerKwh: 7.0, dcPeakKw: 60 },
];

type DriveMode = 'eco' | 'normal' | 'sport';
type HvacMode = 'off' | 'normal' | 'heavy';
type EfficiencyUnit = 'kmPerKwh' | 'whPerKm';

function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const RangeCalculatorView: React.FC<RangeCalculatorViewProps> = ({
  stations,
  selectedCity,
  center,
  userLocation,
  onRequestUserLocation,
  onSelectStation,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nexon-lr');
  const [batteryCapacityKwh, setBatteryCapacityKwh] = useState<number>(40.5);
  const [currentSocPct, setCurrentSocPct] = useState<number>(58);
  const [efficiencyKmPerKwh, setEfficiencyKmPerKwh] = useState<number>(7.2);
  const [efficiencyUnit, setEfficiencyUnit] = useState<EfficiencyUnit>('kmPerKwh');
  const [reserveBufferPct, setReserveBufferPct] = useState<number>(15);
  const [driveMode, setDriveMode] = useState<DriveMode>('normal');
  const [hvacMode, setHvacMode] = useState<HvacMode>('normal');

  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  const handleSelectPreset = (preset: EvPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setBatteryCapacityKwh(preset.batteryKwh);
      setEfficiencyKmPerKwh(preset.efficiencyKmPerKwh);
    }
  };

  const handleResetDefaults = () => {
    const def = EV_PRESETS[0];
    setSelectedPresetId(def.id);
    setBatteryCapacityKwh(def.batteryKwh);
    setCurrentSocPct(58);
    setEfficiencyKmPerKwh(def.efficiencyKmPerKwh);
    setEfficiencyUnit('kmPerKwh');
    setReserveBufferPct(15);
    setDriveMode('normal');
    setHvacMode('normal');
  };

  // Calculations
  const metrics = useMemo(() => {
    const safeCapacity = Math.max(5, Math.min(200, batteryCapacityKwh || 0));
    const safeSoc = Math.max(0, Math.min(100, currentSocPct || 0));
    const safeReserve = Math.max(0, Math.min(40, reserveBufferPct || 0));
    const baseEff = Math.max(1, Math.min(20, efficiencyKmPerKwh || 1));

    const driveMultiplier = driveMode === 'eco' ? 1.08 : driveMode === 'sport' ? 0.88 : 1.0;
    const hvacMultiplier = hvacMode === 'off' ? 1.0 : hvacMode === 'normal' ? 0.92 : 0.85;
    const effectiveEfficiency = baseEff * driveMultiplier * hvacMultiplier; // km/kWh

    const currentEnergyKwh = (safeCapacity * safeSoc) / 100;
    const reserveEnergyKwh = (safeCapacity * safeReserve) / 100;
    const usableAboveReserveKwh = Math.max(0, currentEnergyKwh - reserveEnergyKwh);

    const totalRemainingRangeKm = currentEnergyKwh * effectiveEfficiency;
    const safeRangeToReserveKm = usableAboveReserveKwh * effectiveEfficiency;
    const fullChargeRangeKm = safeCapacity * effectiveEfficiency;

    // Top-up requirements
    const kwhTo80 = Math.max(0, (safeCapacity * 0.8) - currentEnergyKwh);
    const kwhTo100 = Math.max(0, safeCapacity - currentEnergyKwh);

    // Charging time estimates (DC fast 60kW averages ~82% effective speed due to taper; 7.4kW AC at 92% efficiency)
    const dc60MinsTo80 = Math.round((kwhTo80 / (60 * 0.85)) * 60);
    const ac22MinsTo80 = Math.round((kwhTo80 / (22 * 0.9)) * 60);
    const ac7MinsTo100 = Math.round((kwhTo100 / (7.4 * 0.9)) * 60);

    const whPerKm = 1000 / effectiveEfficiency;

    return {
      safeCapacity,
      safeSoc,
      safeReserve,
      effectiveEfficiency,
      whPerKm,
      currentEnergyKwh,
      reserveEnergyKwh,
      usableAboveReserveKwh,
      totalRemainingRangeKm,
      safeRangeToReserveKm,
      fullChargeRangeKm,
      kwhTo80,
      kwhTo100,
      dc60MinsTo80,
      ac22MinsTo80,
      ac7MinsTo100,
    };
  }, [batteryCapacityKwh, currentSocPct, efficiencyKmPerKwh, reserveBufferPct, driveMode, hvacMode]);

  // Station reachability using active city preset stations & userLocation (or city reference center)
  const originCoords = userLocation ?? center;
  const usingGpsLocation = Boolean(userLocation);

  const stationReachability = useMemo(() => {
    return stations
      .map((station) => {
        const straightKm = calculateDistanceKm(
          originCoords[0],
          originCoords[1],
          station.latitude,
          station.longitude
        );
        // Urban road detour factor ~1.28x over straight-line distance
        const estimatedRoadKm = straightKm * 1.28;
        const status: 'safe' | 'reserve' | 'out' =
          estimatedRoadKm <= metrics.safeRangeToReserveKm
            ? 'safe'
            : estimatedRoadKm <= metrics.totalRemainingRangeKm
            ? 'reserve'
            : 'out';
        return {
          station,
          estimatedRoadKm,
          status,
          arrivalSocPct: Math.max(
            0,
            Math.round(
              metrics.safeSoc -
                (estimatedRoadKm / metrics.effectiveEfficiency / metrics.safeCapacity) * 100
            )
          ),
        };
      })
      .sort((a, b) => a.estimatedRoadKm - b.estimatedRoadKm);
  }, [stations, originCoords, metrics]);

  const safeCount = stationReachability.filter((s) => s.status === 'safe').length;
  const reserveCount = stationReachability.filter((s) => s.status === 'reserve').length;

  // Interactive Chart.js comparison across driving conditions
  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const baseEff = Math.max(1, Math.min(20, efficiencyKmPerKwh || 1));
    const currentEnergy = metrics.currentEnergyKwh;

    const scenarios = [
      { label: 'Eco (AC Off)', mult: 1.08 },
      { label: 'Eco (AC Normal)', mult: 1.08 * 0.92 },
      { label: 'Normal (AC Off)', mult: 1.0 },
      { label: 'Normal (AC Normal)', mult: 0.92 },
      { label: 'Sport (Heavy AC)', mult: 0.88 * 0.85 },
    ];

    const totalRanges = scenarios.map((s) => Math.round(currentEnergy * baseEff * s.mult));
    const safeRanges = scenarios.map((s) =>
      Math.round(metrics.usableAboveReserveKwh * baseEff * s.mult)
    );

    chartInstanceRef.current = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: scenarios.map((s) => s.label),
        datasets: [
          {
            label: 'Safe Range (Before Reserve)',
            data: safeRanges,
            backgroundColor: '#10b981',
            borderRadius: 6,
          },
          {
            label: 'Total Range (To 0%)',
            data: totalRanges,
            backgroundColor: 'rgba(255, 255, 255, 0.22)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 1,
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#d4d4d8',
              boxWidth: 12,
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            },
          },
          tooltip: {
            backgroundColor: '#09090b',
            titleColor: '#ffffff',
            bodyColor: '#10b981',
            borderColor: '#27272a',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} km`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(39, 39, 42, 0.4)' },
            ticks: { color: '#a1a1aa', font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(39, 39, 42, 0.5)' },
            ticks: {
              color: '#a1a1aa',
              font: { size: 11 },
              callback: (v) => `${v} km`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [metrics, efficiencyKmPerKwh]);

  const displayedEfficiencyValue =
    efficiencyUnit === 'kmPerKwh'
      ? Number(efficiencyKmPerKwh.toFixed(1))
      : Math.round(1000 / Math.max(0.5, efficiencyKmPerKwh));

  const handleEfficiencyInputChange = (rawVal: number) => {
    if (isNaN(rawVal) || rawVal <= 0) return;
    setSelectedPresetId('custom');
    if (efficiencyUnit === 'kmPerKwh') {
      setEfficiencyKmPerKwh(Math.min(20, Math.max(1, rawVal)));
    } else {
      const clampedWh = Math.min(500, Math.max(60, rawVal));
      setEfficiencyKmPerKwh(Number((1000 / clampedWh).toFixed(2)));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1.5">
            <Gauge className="w-4 h-4" />
            <span>Phase 1 · Vehicle Telemetry & Range Planner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            EV Driving Range Calculator
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Calculate real-world remaining range from your battery capacity, current state of charge, vehicle efficiency, and climate load—and immediately verify reachable stations in {selectedCity}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* Main 12-Col Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="font-semibold text-base text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                <span>Vehicle & Battery Inputs</span>
              </h2>
              <span className="text-xs font-mono text-zinc-500">Real-time math</span>
            </div>

            {/* EV Preset Selector */}
            <div>
              <label
                htmlFor="ev-preset-select"
                className="text-xs font-medium text-zinc-300 block mb-1.5"
              >
                EV Model Preset
              </label>
              <select
                id="ev-preset-select"
                value={selectedPresetId}
                onChange={(e) => {
                  const found = EV_PRESETS.find((p) => p.id === e.target.value);
                  if (found) handleSelectPreset(found);
                }}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {EV_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-zinc-950 text-white">
                    {preset.name} ({preset.batteryKwh} kWh · {preset.efficiencyKmPerKwh} km/kWh)
                  </option>
                ))}
              </select>
            </div>

            {/* Battery Capacity (kWh) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="battery-capacity-input" className="font-medium text-zinc-300">
                  Battery Capacity (kWh)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="battery-capacity-input"
                    type="number"
                    min={10}
                    max={150}
                    step={0.5}
                    value={batteryCapacityKwh}
                    onChange={(e) => {
                      setSelectedPresetId('custom');
                      setBatteryCapacityKwh(Number(e.target.value));
                    }}
                    className="w-20 bg-black border border-zinc-800 rounded-md px-2 py-1 text-right font-mono tabular-nums text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-zinc-500 font-mono">kWh</span>
                </div>
              </div>
              <input
                aria-label="Battery Capacity Slider"
                type="range"
                min={15}
                max={120}
                step={0.5}
                value={batteryCapacityKwh}
                onChange={(e) => {
                  setSelectedPresetId('custom');
                  setBatteryCapacityKwh(Number(e.target.value));
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Current Battery % */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="soc-input" className="font-medium text-zinc-300">
                  Current Battery Level (%)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    id="soc-input"
                    type="number"
                    min={1}
                    max={100}
                    value={currentSocPct}
                    onChange={(e) => setCurrentSocPct(Number(e.target.value))}
                    className="w-20 bg-black border border-zinc-800 rounded-md px-2 py-1 text-right font-mono tabular-nums text-emerald-400 font-semibold text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-zinc-500 font-mono">%</span>
                </div>
              </div>
              <input
                aria-label="Current Battery Percentage Slider"
                type="range"
                min={1}
                max={100}
                step={1}
                value={currentSocPct}
                onChange={(e) => setCurrentSocPct(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Vehicle Efficiency */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="efficiency-input" className="font-medium text-zinc-300">
                  Vehicle Efficiency
                </label>
                <div className="inline-flex bg-black border border-zinc-800 rounded-md p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEfficiencyUnit('kmPerKwh')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      efficiencyUnit === 'kmPerKwh'
                        ? 'bg-emerald-500 text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    km/kWh
                  </button>
                  <button
                    type="button"
                    onClick={() => setEfficiencyUnit('whPerKm')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      efficiencyUnit === 'whPerKm'
                        ? 'bg-emerald-500 text-black font-semibold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Wh/km
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="efficiency-input"
                  type="number"
                  step={efficiencyUnit === 'kmPerKwh' ? 0.1 : 5}
                  value={displayedEfficiencyValue}
                  onChange={(e) => handleEfficiencyInputChange(Number(e.target.value))}
                  className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-2 font-mono tabular-nums text-white text-sm focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs font-mono text-zinc-400 w-16">
                  {efficiencyUnit === 'kmPerKwh' ? 'km / kWh' : 'Wh / km'}
                </span>
              </div>
            </div>

            {/* Driving Mode & AC Load */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
              <div>
                <span className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Driving Mode
                </span>
                <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-lg border border-zinc-800 text-xs">
                  {(['eco', 'normal', 'sport'] as DriveMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDriveMode(mode)}
                      className={`py-1.5 rounded font-medium capitalize cursor-pointer transition-colors ${
                        driveMode === mode
                          ? 'bg-white text-black font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-zinc-300 block mb-1.5">
                  Climate / Traffic Load
                </span>
                <div className="grid grid-cols-3 gap-1 bg-black p-1 rounded-lg border border-zinc-800 text-xs">
                  {[
                    { id: 'off', label: 'AC Off' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'heavy', label: 'Heavy' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHvacMode(item.id as HvacMode)}
                      className={`py-1.5 rounded font-medium cursor-pointer transition-colors ${
                        hvacMode === item.id
                          ? 'bg-white text-black font-semibold'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reserve Buffer */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <label htmlFor="reserve-input" className="font-medium text-zinc-300">
                  Safety Reserve Buffer (%)
                </label>
                <span className="font-mono tabular-nums text-amber-400 font-semibold">
                  {reserveBufferPct}% ({metrics.reserveEnergyKwh.toFixed(1)} kWh)
                </span>
              </div>
              <input
                id="reserve-input"
                type="range"
                min={5}
                max={30}
                step={1}
                value={reserveBufferPct}
                onChange={(e) => setReserveBufferPct(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right: Results, Visual Gauge & Chart (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Primary Range Hero Readout */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-6 border-b border-zinc-800">
              <div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Estimated Remaining Range
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-white tabular-nums tracking-tight">
                    {Math.round(metrics.totalRemainingRangeKm)}
                  </span>
                  <span className="text-sm font-mono text-emerald-400 font-semibold">km</span>
                </div>
                <span className="text-xs text-zinc-500 mt-1 block tabular-nums">
                  100% full range: {Math.round(metrics.fullChargeRangeKm)} km
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Safe Range (To {metrics.safeReserve}% Reserve)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold text-emerald-400 tabular-nums tracking-tight">
                    {Math.round(metrics.safeRangeToReserveKm)}
                  </span>
                  <span className="text-sm font-mono text-emerald-400 font-semibold">km</span>
                </div>
                <span className="text-xs text-zinc-500 mt-1 block tabular-nums">
                  {metrics.usableAboveReserveKwh.toFixed(1)} kWh usable before buffer
                </span>
              </div>

              <div>
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
                  Effective Consumption
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight">
                    {metrics.effectiveEfficiency.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">km/kWh</span>
                </div>
                <span className="text-xs text-zinc-500 mt-1 block font-mono tabular-nums">
                  {Math.round(metrics.whPerKm)} Wh/km · {metrics.currentEnergyKwh.toFixed(1)} kWh stored
                </span>
              </div>
            </div>

            {/* Battery Charge Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium">Battery Energy Allocation</span>
                <span className="font-mono tabular-nums text-zinc-400">
                  {metrics.currentEnergyKwh.toFixed(1)} / {metrics.safeCapacity.toFixed(1)} kWh ({metrics.safeSoc}%)
                </span>
              </div>
              <div className="w-full h-3.5 bg-black border border-zinc-800 rounded-md overflow-hidden flex">
                {metrics.safeSoc > 0 && (
                  <>
                    <div
                      className="bg-amber-500/80 h-full transition-all duration-300"
                      style={{ width: `${Math.min(metrics.safeSoc, metrics.safeReserve)}%` }}
                      title={`Reserve zone: ${Math.min(metrics.safeSoc, metrics.safeReserve)}%`}
                    />
                    {metrics.safeSoc > metrics.safeReserve && (
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${metrics.safeSoc - metrics.safeReserve}%` }}
                        title={`Usable driving range: ${metrics.safeSoc - metrics.safeReserve}%`}
                      />
                    )}
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
                  Reserve Buffer ({metrics.safeReserve}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Usable Range ({Math.max(0, metrics.safeSoc - metrics.safeReserve)}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-700" />
                  Depleted ({100 - metrics.safeSoc}%)
                </span>
              </div>
            </div>

            {/* Quick Charge Top-up Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800">
              <div className="bg-black border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>60 kW DC Fast (to 80%)</span>
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white tabular-nums font-mono">
                  {metrics.kwhTo80 > 0 ? `~${metrics.dc60MinsTo80} mins` : 'Already >= 80%'}
                </div>
                <span className="text-[11px] text-zinc-500 tabular-nums">
                  +{metrics.kwhTo80.toFixed(1)} kWh needed
                </span>
              </div>

              <div className="bg-black border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>22 kW AC (to 80%)</span>
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold text-white tabular-nums font-mono">
                  {metrics.kwhTo80 > 0 ? `~${metrics.ac22MinsTo80} mins` : 'Already >= 80%'}
                </div>
                <span className="text-[11px] text-zinc-500 tabular-nums">
                  +{metrics.kwhTo80.toFixed(1)} kWh needed
                </span>
              </div>

              <div className="bg-black border border-zinc-800 rounded-xl p-3.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>7.4 kW Home AC (to 100%)</span>
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div className="text-lg font-bold text-white tabular-nums font-mono">
                  {metrics.kwhTo100 > 0
                    ? `${Math.floor(metrics.ac7MinsTo100 / 60)}h ${metrics.ac7MinsTo100 % 60}m`
                    : 'Full Charge'}
                </div>
                <span className="text-[11px] text-zinc-500 tabular-nums">
                  +{metrics.kwhTo100.toFixed(1)} kWh to full
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Chart.js Scenario Analysis */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base text-white">
                  Driving Mode & HVAC Impact on Remaining Range
                </h3>
                <p className="text-xs text-zinc-400">
                  Simulated comparison across drive profiles at {metrics.safeSoc}% SoC
                </p>
              </div>
            </div>
            <div className="h-60 w-full">
              <canvas ref={chartCanvasRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Reachable Charging Stations Matrix */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Reachable Stations in {selectedCity} (Demo Dataset)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 tabular-nums">
              {safeCount} stations safely reachable before reserve · {reserveCount} reachable using reserve · Distance measured from{' '}
              <span className="text-white font-medium">
                {usingGpsLocation ? 'your live GPS coordinates' : `${selectedCity} reference center`}
              </span>
              {' '}(1.28x road factor)
            </p>
          </div>

          {!usingGpsLocation && (
            <button
              type="button"
              onClick={onRequestUserLocation}
              className="inline-flex items-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Use My GPS Location</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Station</th>
                <th className="py-2.5 px-3">Area</th>
                <th className="py-2.5 px-3 text-right">Est. Road Distance</th>
                <th className="py-2.5 px-3 text-right">Est. Arrival SoC</th>
                <th className="py-2.5 px-3">Reachability</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70">
              {stationReachability.slice(0, 8).map((item) => (
                <tr key={item.station.station_id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="py-3 px-3 font-medium text-white">
                    {item.station.station_name}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {item.station.area}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-zinc-200">
                    {item.estimatedRoadKm.toFixed(1)} km
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-white font-semibold">
                    {item.arrivalSocPct}%
                  </td>
                  <td className="py-3 px-3">
                    {item.status === 'safe' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Safe Reach
                      </span>
                    ) : item.status === 'reserve' ? (
                      <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Uses Reserve
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Out of Range
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectStation(item.station)}
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
