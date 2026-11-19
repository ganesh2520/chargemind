import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Sparkles,
  Calendar,
  MapPin,
  Sliders,
  BarChart2,
  RefreshCw,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Station, PredictionInput, PredictionResult } from '../types';
import { predictChargingDemand } from '../services/predictionEngine';

interface PredictionViewProps {
  stations: Station[];
  initialSelectedStation?: Station | null;
  onSelectStation: (station: Station) => void;
}

export const PredictionView: React.FC<PredictionViewProps> = ({
  stations,
  initialSelectedStation,
}) => {
  const [selectedStationId, setSelectedStationId] = useState<string>(
    initialSelectedStation?.station_id || stations[0]?.station_id || ''
  );
  const [predictionDate, setPredictionDate] = useState<string>('2026-10-10');
  const [timePeriod, setTimePeriod] = useState<'Morning' | 'Afternoon' | 'Evening' | 'Night'>(
    'Evening'
  );
  const [weatherCondition, setWeatherCondition] = useState<'Clear' | 'Rain' | 'Hot'>('Clear');
  const [isComputing, setIsComputing] = useState(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);

  useEffect(() => {
    if (initialSelectedStation) {
      setSelectedStationId(initialSelectedStation.station_id);
    }
  }, [initialSelectedStation]);

  const activeStation = stations.find((s) => s.station_id === selectedStationId) || stations[0];

  const getDayOfWeek = (dateStr: string) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Friday' : days[d.getDay()];
  };

  const handleRunPrediction = () => {
    if (!activeStation) return;
    setIsComputing(true);

    setTimeout(() => {
      const dayOfWeek = getDayOfWeek(predictionDate);
      const input: PredictionInput = {
        stationId: activeStation.station_id,
        date: predictionDate,
        timePeriod,
        dayOfWeek,
        weatherCondition,
      };

      const result = predictChargingDemand(activeStation, input);
      setPredictionResult(result);
      setIsComputing(false);
    }, 300);
  };

  useEffect(() => {
    if (activeStation) {
      handleRunPrediction();
    }
  }, [selectedStationId]);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="border-b border-zinc-800 pb-5 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" />
          <span>Client-Side Heuristic Simulation · Random Forest Benchmark</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          EV Charging Demand Forecast
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl">
          Simulate station-level charging demand across time windows, weekdays, and atmospheric conditions. Note: Predictions below are computed by a client-side heuristic simulation, not live telemetry.
        </p>
      </div>

      {/* Simulation Notice */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 flex items-start gap-3 text-xs text-zinc-300">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-white">Simulated Model Output:</strong> Values and evaluation benchmarks (MAE / RMSE / R²) reflect offline Random Forest reference parameters applied to demo station capacity.
        </span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Forecast Parameters</span>
              </h3>
              <span className="text-xs text-zinc-500 font-mono">Input Pipeline</span>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Target Charging Station
              </label>
              <select
                value={selectedStationId}
                onChange={(e) => setSelectedStationId(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {stations.map((s) => (
                  <option key={s.station_id} value={s.station_id}>
                    {s.station_name} ({s.area} · {s.total_ports} ports)
                  </option>
                ))}
              </select>
              {activeStation && (
                <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span>{activeStation.address}</span>
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Forecast Date</span>
                <span className="text-emerald-400 font-mono text-xs">
                  {getDayOfWeek(predictionDate)}
                </span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="date"
                  value={predictionDate}
                  onChange={(e) => setPredictionDate(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Target Time Window
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'Morning', label: 'Morning', hours: '06:00 – 12:00' },
                  { id: 'Afternoon', label: 'Afternoon', hours: '12:00 – 16:00' },
                  { id: 'Evening', label: 'Evening (Peak)', hours: '16:00 – 21:00' },
                  { id: 'Night', label: 'Night', hours: '21:00 – 06:00' },
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setTimePeriod(slot.id as typeof timePeriod)}
                    className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                      timePeriod === slot.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-white'
                        : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs block">{slot.label}</span>
                    <span className="text-[11px] text-zinc-500 font-mono block">{slot.hours}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Atmospheric / Weather Factor
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['Clear', 'Rain', 'Hot'].map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setWeatherCondition(cond as typeof weatherCondition)}
                    className={`py-2 px-2 rounded-lg border text-center transition cursor-pointer font-medium ${
                      weatherCondition === cond
                        ? 'bg-white text-black border-white font-semibold'
                        : 'bg-black border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunPrediction}
              disabled={isComputing}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isComputing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Simulated Forecast...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Demand Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          {predictionResult ? (
            <div className="space-y-6">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-3">
                  <div>
                    <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-mono block">
                      Simulated Output
                    </span>
                    <h3 className="font-bold text-lg text-white">
                      {predictionResult.stationName}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-bold shrink-0 ${
                      predictionResult.predictedDemandLevel === 'High'
                        ? 'text-rose-400'
                        : predictionResult.predictedDemandLevel === 'Medium'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {predictionResult.predictedDemandLevel} Demand Expected
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
                  <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">
                      Simulated Sessions
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {predictionResult.predictedSessions}
                    </span>
                    <span className="text-[11px] text-emerald-400 block font-mono">
                      {predictionResult.variancePercentage >= 0
                        ? `+${predictionResult.variancePercentage}%`
                        : `${predictionResult.variancePercentage}%`}{' '}
                      vs baseline
                    </span>
                  </div>

                  <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">
                      Est. Occupancy
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                      {predictionResult.predictedOccupancy}%
                    </span>
                    <span className="text-[11px] text-zinc-500 block">of port capacity</span>
                  </div>

                  <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">
                      Baseline Average
                    </span>
                    <span className="text-2xl font-extrabold text-zinc-200 font-mono">
                      {predictionResult.historicalAverageSessions}
                    </span>
                    <span className="text-[11px] text-zinc-500 block">reference mean</span>
                  </div>

                  <div className="bg-black p-3.5 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block mb-0.5">
                      Ref. Benchmark
                    </span>
                    <span className="text-2xl font-extrabold text-white font-mono">
                      {predictionResult.confidenceScore}%
                    </span>
                    <span className="text-[11px] text-zinc-500 block font-mono">
                      R² = {predictionResult.modelMetrics.r2Score}
                    </span>
                  </div>
                </div>

                <div className="bg-black border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-bold text-emerald-400 block">Forecast Interpretation</span>
                    <p className="text-zinc-300 leading-relaxed">{predictionResult.explanation}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-emerald-400" />
                      <span>Baseline vs. Simulated Forecast</span>
                    </span>
                    <div className="flex items-center gap-4 text-[11px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" />
                        <span>Baseline</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                        <span>Forecast</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 bg-black p-4 rounded-xl border border-zinc-800">
                    {predictionResult.timeSeriesComparison.map((item) => (
                      <div key={item.timeLabel} className="text-center space-y-2">
                        <span className="text-xs font-mono font-bold text-zinc-300 block">
                          {item.timeLabel}
                        </span>
                        <div className="h-28 flex items-end justify-center gap-1.5">
                          <div
                            className="w-3.5 bg-zinc-700 rounded-t transition-all duration-500"
                            style={{ height: `${Math.min(100, item.historical * 16)}%` }}
                            title={`Baseline: ${item.historical}`}
                          />
                          <div
                            className="w-3.5 bg-emerald-500 rounded-t transition-all duration-500"
                            style={{ height: `${Math.min(100, item.predicted * 16)}%` }}
                            title={`Forecast: ${item.predicted}`}
                          />
                        </div>
                        <div className="text-[11px] space-y-0.5 tabular-nums font-mono">
                          <span className="text-zinc-400 block">B: {item.historical}</span>
                          <span className="text-emerald-400 block font-bold">F: {item.predicted}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Model Benchmark Details */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">
                      Reference Model Benchmarks (Offline Evaluation)
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-zinc-400">Random Forest Regressor</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs tabular-nums">
                  <div className="bg-black p-3 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">Mean Absolute Error (MAE)</span>
                    <span className="text-base font-bold font-mono text-white">
                      {predictionResult.modelMetrics.mae} sessions
                    </span>
                  </div>

                  <div className="bg-black p-3 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">RMSE</span>
                    <span className="text-base font-bold font-mono text-white">
                      {predictionResult.modelMetrics.rmse} sessions
                    </span>
                  </div>

                  <div className="bg-black p-3 rounded-xl border border-zinc-800">
                    <span className="text-[11px] text-zinc-400 block">R² Score</span>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      {predictionResult.modelMetrics.r2Score}
                    </span>
                  </div>
                </div>

                <div className="pt-1 space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-zinc-400 block">
                    Feature Importance Weights:
                  </span>
                  {[
                    { name: 'Hour of Day & Commute Peak', weight: 38 },
                    { name: 'Day of Week (Weekend vs Weekday)', weight: 24 },
                    { name: 'Station Port Capacity & Power Rating (kW)', weight: 20 },
                    { name: 'Area Geographic Density & Surrounding Hubs', weight: 18 },
                  ].map((f) => (
                    <div key={f.name}>
                      <div className="flex justify-between text-[11px] text-zinc-300 mb-0.5 tabular-nums">
                        <span>{f.name}</span>
                        <span className="font-mono text-emerald-400">{f.weight}%</span>
                      </div>
                      <div className="w-full bg-black h-1.5 rounded-full overflow-hidden border border-zinc-900">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${f.weight}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 text-center text-zinc-400">
              Select parameters and click "Run Demand Simulation".
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
