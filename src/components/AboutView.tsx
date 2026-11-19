import React from 'react';
import {
  Users,
  Target,
  Zap,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Banner */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 sm:p-10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-mono uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 fill-emerald-400" />
          <span>Project Ideation &amp; Architecture</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Building a Smarter EV Charging Network
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-3xl mx-auto leading-relaxed">
          GreenCharge AI is a smart EV charging station discovery, range calculation, and demand analysis platform designed to make electric vehicle charging more predictable through geospatial services, data analytics, and machine learning forecasting.
        </p>
      </section>

      {/* Problem & Solution */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Challenges Addressed</h2>
              <p className="text-xs text-zinc-400">Grid bottlenecks &amp; driver range anxiety</p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-zinc-300">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>
                <strong className="text-white">Scattered Station Data:</strong> EV charging infrastructure is fragmented across commercial operators without unified visibility.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>
                <strong className="text-white">Range &amp; Queue Uncertainty:</strong> Drivers need accurate remaining-range visibility before heading to busy fast-charging corridors.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>
                <strong className="text-white">Uneven Infrastructure Load:</strong> Extreme demand concentration leaves nearby secondary chargers underutilized.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
              <span>
                <strong className="text-white">Operator Planning Blind Spots:</strong> Planners require occupancy breakdowns to prioritize charger capacity upgrades.
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Solution Architecture</h2>
              <p className="text-xs text-zinc-400">Data-driven electric mobility</p>
            </div>
          </div>

          <ul className="space-y-3 text-xs text-zinc-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Interactive Station Finder:</strong> Powered by Google Maps JavaScript API with custom AdvancedMarkerElement indicators.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">EV Range Calculator:</strong> Real-time kWh-to-km range modeling with reserve buffer and station reachability checks.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Usage &amp; Demand Analytics:</strong> Classification into High, Medium, and Low demand tiers with CSV/JSON dataset import.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Demand Forecasting:</strong> Simulated regression pipeline modeling hourly and day-of-week demand pressure.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Core Objectives */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          <span>Core Project Objectives</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {[
            ['1. Discovery Unification', 'Unify station locations, connector types, and tariff metadata in one Google Map workspace.'],
            ['2. Range Confidence', 'Translate battery SoC and efficiency into safe remaining kilometers and reachable hubs.'],
            ['3. Historical Mining', 'Analyze charging session duration, kWh, and occupancy curves across urban corridors.'],
            ['4. Demand Balancing', 'Direct drivers away from high-demand queues toward nearby available stations.'],
            ['5. Operator Planning', 'Highlight underserved and overloaded stations for hardware expansion decisions.'],
            ['6. Sustainable Mobility', 'Accelerate EV adoption through clear, accessible charging intelligence.'],
          ].map(([title, desc]) => (
            <div key={title} className="p-4 bg-black rounded-xl border border-zinc-800 space-y-1.5">
              <span className="font-bold text-emerald-400 block">{title}</span>
              <p className="text-zinc-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>Technology Stack</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Core technologies powering the GreenCharge AI platform
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Layer</th>
                <th className="py-3 px-4">Technology</th>
                <th className="py-3 px-4">Purpose in GreenCharge AI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/70 text-zinc-200">
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-400">Frontend</td>
                <td className="py-3 px-4 font-mono">React 19 · TypeScript · Tailwind CSS</td>
                <td className="py-3 px-4 text-zinc-400">Responsive SaaS dashboard &amp; state management</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-400">Maps &amp; Places</td>
                <td className="py-3 px-4 font-mono">Google Maps JS API</td>
                <td className="py-3 px-4 text-zinc-400">AdvancedMarkerElement pins, Place search &amp; navigation</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-400">Charts</td>
                <td className="py-3 px-4 font-mono">Chart.js</td>
                <td className="py-3 px-4 text-zinc-400">Range modeling &amp; demand visualization charts</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-semibold text-emerald-400">ML Reference</td>
                <td className="py-3 px-4 font-mono">Random Forest Regression</td>
                <td className="py-3 px-4 text-zinc-400">Simulated demand forecasting across time &amp; weather</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Engineering Team */}
      <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Project Contributors</span>
          </div>
          <h2 className="text-xl font-bold text-white">Engineering Team</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              initials: 'GB',
              name: 'Ganeshamanimoorthy B',
              role: 'Team Lead · Architecture & ML',
              desc: 'System architecture, ML forecasting design, and core integration.',
              lead: true,
            },
            {
              initials: 'BS',
              name: 'Baratsrihari S',
              role: 'Data Analysis & Engineering',
              desc: 'Usage telemetry preprocessing and analytics pipeline.',
              lead: false,
            },
            {
              initials: 'TM',
              name: 'Thavakani M',
              role: 'GIS & Map Interfaces',
              desc: 'Google Maps marker optimization and spatial navigation.',
              lead: false,
            },
            {
              initials: 'SN',
              name: 'Sriram NS',
              role: 'Frontend & Visualizations',
              desc: 'SaaS interface design and interactive Chart.js visuals.',
              lead: false,
            },
          ].map((member) => (
            <div
              key={member.name}
              className={`bg-black rounded-xl p-5 text-center space-y-3 border ${
                member.lead ? 'border-emerald-500/60' : 'border-zinc-800'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center font-bold text-base ${
                  member.lead ? 'bg-emerald-500 text-black' : 'bg-zinc-900 text-white border border-zinc-800'
                }`}
              >
                {member.initials}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{member.name}</h3>
                <p className="text-[11px] text-emerald-400 font-medium">{member.role}</p>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
