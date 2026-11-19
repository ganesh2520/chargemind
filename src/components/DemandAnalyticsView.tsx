import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  CheckCircle2,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { Station, ChargingUsageRecord } from '../types';
import {
  computeDemandSummary,
  computeStationRankings,
  computeHourlyTrend,
  computeDailyTrend,
  generateAutomatedInsights,
} from '../services/analyticsEngine';

interface DemandAnalyticsViewProps {
  stations: Station[];
  usageRecords: ChargingUsageRecord[];
  selectedCity: string;
  onSelectStation: (station: Station) => void;
}

export const DemandAnalyticsView: React.FC<DemandAnalyticsViewProps> = ({
  stations,
  usageRecords,
  selectedCity,
  onSelectStation,
}) => {
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState<'7d' | '30d'>('7d');
  const [activeChartTab, setActiveChartTab] = useState<
    'hourly' | 'daily' | 'stations' | 'utilization'
  >('stations');

  const rankings = useMemo(
    () => computeStationRankings(stations, usageRecords),
    [stations, usageRecords]
  );
  const hourlyData = useMemo(() => computeHourlyTrend(usageRecords), [usageRecords]);
  const dailyData = useMemo(() => computeDailyTrend(usageRecords), [usageRecords]);
  const insights = useMemo(
    () => generateAutomatedInsights(stations, rankings),
    [stations, rankings]
  );
  const summary = useMemo(
    () => computeDemandSummary(stations, usageRecords),
    [stations, usageRecords]
  );

  const highestStation = rankings[0]?.station;
  const lowestStation = rankings[rankings.length - 1]?.station;
  const avgSessionsPerStation =
    stations.length > 0 ? Math.round(summary.totalSessions / stations.length) : 0;

  const displayedRankings = useMemo(() => {
    if (selectedStationFilter === 'ALL') return rankings;
    return rankings.filter((r) => r.station.station_id === selectedStationFilter);
  }, [rankings, selectedStationFilter]);

  const maxSessionRank = Math.max(...rankings.map((r) => r.sessions), 1);
  const maxHourlySession = Math.max(...hourlyData.map((h) => h.sessions), 1);
  const maxDailySession = Math.max(...dailyData.map((d) => d.estimatedSessions), 1);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider mb-1.5">
            <Database className="w-3.5 h-3.5" />
            <span>Simulated Usage Dataset · {selectedCity}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>EV Charging Demand Analytics</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Simulated historical usage telemetry, load curves, and occupancy diagnostics for {selectedCity}.
          </p>
        </div>

        {/* Global Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Filter analytics by station"
            value={selectedStationFilter}
            onChange={(e) => setSelectedStationFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Stations ({stations.length})</option>
            {stations.map((s) => (
              <option key={s.station_id} value={s.station_id}>
                {s.station_name.slice(0, 24)}...
              </option>
            ))}
          </select>

          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                dateRange === '7d' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30d')}
              className={`px-3 py-1 rounded font-semibold transition cursor-pointer ${
                dateRange === '30d' ? 'bg-emerald-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
            Simulated Sessions
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {summary.totalSessions * (dateRange === '30d' ? 4 : 1)}
            </span>
            <span className="text-xs text-emerald-400 flex items-center font-mono font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Demo
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            Window: {dateRange === '30d' ? '30 days' : '7 days'}
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider block mb-1">
            Avg Sessions / Station
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tabular-nums tracking-tight">
              {avgSessionsPerStation * (dateRange === '30d' ? 4 : 1)}
            </span>
            <span className="text-xs text-zinc-400">sessions</span>
          </div>
          <p className="text-xs text-zinc-500 mt-2 tabular-nums">
            Mean occupancy: {summary.averageOccupancy}%
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-rose-400 uppercase tracking-wider">
              Highest Demand
            </span>
            <span className="text-[11px] font-mono text-rose-400">Peak</span>
          </div>
          <div className="font-bold text-sm text-white truncate">
            {highestStation ? highestStation.station_name : 'N/A'}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-zinc-400">{highestStation?.area}</span>
            <span className="text-rose-400 font-bold font-mono tabular-nums">
              {rankings[0]?.sessions ?? 0} sessions
            </span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Lowest Demand
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Available</span>
          </div>
          <div className="font-bold text-sm text-white truncate">
            {lowestStation ? lowestStation.station_name : 'N/A'}
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-zinc-400">{lowestStation?.area}</span>
            <span className="text-emerald-400 font-bold font-mono tabular-nums">
              {rankings[rankings.length - 1]?.sessions ?? 0} sessions
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visualizations */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-white">Interactive Demand Visualizations</h3>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-black p-1 rounded-lg border border-zinc-800">
            {[
              { id: 'stations', label: '1. Demand by Station' },
              { id: 'hourly', label: '2. Hourly (24h)' },
              { id: 'daily', label: '3. Daily Trends' },
              { id: 'utilization', label: '4. Utilization %' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChartTab(tab.id as typeof activeChartTab)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer ${
                  activeChartTab === tab.id
                    ? 'bg-emerald-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeChartTab === 'stations' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Station Name &amp; Location</span>
              <span>Simulated Daily Charging Sessions</span>
            </div>

            <div className="space-y-2.5">
              {displayedRankings.map((item) => {
                const pct = Math.round((item.sessions / maxSessionRank) * 100);
                const isHigh = item.station.demand_level === 'High';
                const isMed = item.station.demand_level === 'Medium';
                const barColor = isHigh
                  ? 'bg-rose-500'
                  : isMed
                  ? 'bg-amber-500'
                  : 'bg-emerald-500';

                return (
                  <div
                    key={item.station.station_id}
                    onClick={() => onSelectStation(item.station)}
                    className="p-3 bg-black hover:bg-zinc-900 rounded-xl border border-zinc-800 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                          {item.station.station_name}
                        </span>
                        <span className="text-zinc-500 text-[11px] shrink-0">
                          ({item.station.area})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-nums">
                        <span className="font-mono font-bold text-white">
                          {item.sessions} sessions
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          ({item.energyKwh} kWh)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${barColor} h-full rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeChartTab === 'hourly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>24-Hour Diurnal Charging Profile (Simulated Dataset)</span>
              <span className="text-emerald-400 font-semibold font-mono">Peak: 18:00 – 21:00</span>
            </div>

            <div className="h-64 flex items-end gap-1.5 pt-8 pb-4 px-2 bg-black rounded-xl border border-zinc-800 overflow-x-auto">
              {hourlyData.map((slot) => {
                const heightPct = Math.max(
                  12,
                  Math.round((slot.sessions / maxHourlySession) * 100)
                );
                const isPeak = parseInt(slot.time) >= 17 && parseInt(slot.time) <= 21;

                return (
                  <div
                    key={slot.time}
                    className="flex-1 min-w-[28px] flex flex-col items-center gap-2 group"
                  >
                    <span className="text-[10px] text-zinc-300 opacity-0 group-hover:opacity-100 transition font-mono tabular-nums font-bold">
                      {slot.sessions}
                    </span>
                    <div className="w-full bg-zinc-900 rounded-t h-44 flex items-end overflow-hidden">
                      <div
                        className={`w-full transition-all duration-500 rounded-t ${
                          isPeak ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono -rotate-45 sm:rotate-0">
                      {slot.time.split(':')[0]}h
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Off-Peak &amp; Standard Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span>Peak Evening Load (17:00 – 21:00)</span>
              </div>
            </div>
          </div>
        )}

        {activeChartTab === 'daily' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Day-of-Week Distribution (Simulated Baseline)</span>
              <span className="text-emerald-400 font-semibold">Friday/Saturday peak</span>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {dailyData.map((d) => {
                const heightPct = Math.round((d.estimatedSessions / maxDailySession) * 100);
                const isWeekend = ['Fri', 'Sat', 'Sun'].includes(d.day);

                return (
                  <div
                    key={d.day}
                    className="bg-black border border-zinc-800 rounded-xl p-2 sm:p-3 text-center space-y-2"
                  >
                    <span className="text-xs font-bold text-zinc-300 block">{d.day}</span>
                    <div className="h-28 flex items-end justify-center">
                      <div
                        className={`w-6 sm:w-8 rounded-t transition-all duration-500 ${
                          isWeekend ? 'bg-white' : 'bg-emerald-500'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono tabular-nums font-bold text-white block">
                      {d.estimatedSessions}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono tabular-nums block">
                      {d.occupancy}% occ
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeChartTab === 'utilization' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Station Capacity Utilization (% of available hours occupied)</span>
              <span className="font-mono">Target: 60% – 80%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {rankings.map((item) => (
                <div
                  key={item.station.station_id}
                  className="p-3 bg-black rounded-xl border border-zinc-800 flex items-center justify-between"
                >
                  <div className="max-w-[65%]">
                    <h5 className="font-bold text-xs text-white truncate">
                      {item.station.station_name}
                    </h5>
                    <p className="text-[11px] text-zinc-400">
                      {item.station.area} · {item.station.total_ports} ports
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                        {item.avgOccupancy}%
                      </span>
                      <span className="text-[10px] text-zinc-500 block">Utilization</span>
                    </div>
                    <div className="w-12 bg-zinc-900 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.avgOccupancy > 75
                            ? 'bg-rose-500'
                            : item.avgOccupancy > 45
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${item.avgOccupancy}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytical Insights */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-bold text-base text-white">Automated Analytical Summary</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Computed directly from the active station &amp; simulated usage dataset:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 bg-black rounded-xl border border-zinc-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-zinc-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Station Performance Matrix */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-white">Station Performance Matrix</h3>
            <p className="text-xs text-zinc-400">
              Breakdown of simulated sessions and utilization per hub
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-zinc-400">
            {displayedRankings.length} stations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Station Name</th>
                <th className="py-3 px-3">Area &amp; City</th>
                <th className="py-3 px-3">Charger Spec</th>
                <th className="py-3 px-3 text-right">Ports</th>
                <th className="py-3 px-3 text-right">Sessions</th>
                <th className="py-3 px-3 text-right">Occupancy</th>
                <th className="py-3 px-3 text-center">Demand</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-200 tabular-nums">
              {displayedRankings.map((item) => (
                <tr key={item.station.station_id} className="hover:bg-zinc-900/60 transition">
                  <td className="py-3 px-3 font-semibold text-white">
                    {item.station.station_name}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {item.station.area}, {item.station.city}
                  </td>
                  <td className="py-3 px-3 font-mono text-zinc-300">
                    {item.station.power_kw}kW ({item.station.charger_type.split(' ')[0]})
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{item.station.total_ports}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    {item.sessions}
                  </td>
                  <td className="py-3 px-3 text-right font-mono">{item.avgOccupancy}%</td>
                  <td className="py-3 px-3 text-center font-semibold">
                    <span
                      className={
                        item.station.demand_level === 'High'
                          ? 'text-rose-400'
                          : item.station.demand_level === 'Medium'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }
                    >
                      {item.station.demand_level}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectStation(item.station)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
                    >
                      View
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
