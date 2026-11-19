import React, { useState } from 'react';
import {
  X,
  Database,
  Upload,
  Download,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Station, ChargingUsageRecord } from '../types';
import { CITY_PRESETS } from '../data/defaultStations';
import { parseStationsCSV, exportStationsCSV, exportUsageCSV } from '../services/csvParser';

interface DatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string;
  onSelectCityPreset: (cityName: string) => void;
  onUploadCustomStations: (stations: Station[]) => void;
  currentStations: Station[];
  currentUsageRecords: ChargingUsageRecord[];
}

export const DatasetModal: React.FC<DatasetModalProps> = ({
  isOpen,
  onClose,
  currentCity,
  onSelectCityPreset,
  onUploadCustomStations,
  currentStations,
  currentUsageRecords,
}) => {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setUploadSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUploadCustomStations(parsed);
            setUploadSuccess(`Successfully loaded ${parsed.length} stations from ${file.name}`);
          } else {
            setUploadError('JSON file must contain an array of station objects.');
          }
        } else {
          const stations = parseStationsCSV(text);
          if (stations.length > 0) {
            onUploadCustomStations(stations);
            setUploadSuccess(`Successfully parsed and loaded ${stations.length} stations from ${file.name}`);
          } else {
            setUploadError('Could not parse stations from CSV. Check columns: station_name, latitude, longitude.');
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid format';
        setUploadError(`Error reading file: ${msg}`);
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleStationsCSV = () => {
    const csvContent = exportStationsCSV(currentStations);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'stations.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadSampleUsageCSV = () => {
    const csvContent = exportUsageCSV(currentUsageRecords);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'charging_usage.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6 text-white">
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Dataset &amp; Location Manager</h2>
            </div>
            <p className="text-xs text-zinc-400">
              Switch built-in regional demo datasets or upload your own CSV/JSON station files.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dataset modal"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            1. Select Regional Demo Dataset
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CITY_PRESETS.map((preset) => {
              const isSelected = currentCity === preset.name;
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    onSelectCityPreset(preset.name);
                    setUploadSuccess(
                      `Switched active dataset to ${preset.name} (${preset.stations.length} stations)`
                    );
                  }}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-black border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">{preset.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <span className="text-[11px] text-zinc-400 block">{preset.state}</span>
                  <span className="text-[11px] font-mono text-emerald-400 mt-1 block tabular-nums">
                    {preset.stations.length} demo stations
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            2. Upload Custom Dataset (.csv or .json)
          </label>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Upload your own station coordinates and port specs. The map, range reachability, and analytics update automatically.
          </p>

          <div className="border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-xl p-6 text-center bg-black transition">
            <Upload className="w-7 h-7 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-200 mb-1">
              Select stations CSV / JSON file
            </p>
            <p className="text-[11px] text-zinc-500 mb-3">Supports stations.csv or stations.json</p>
            <label className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer transition">
              <span>Browse File</span>
              <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs text-emerald-300">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-3 border-t border-zinc-800">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            3. Export CSV Templates
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={downloadSampleStationsCSV}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 hover:text-white transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download stations.csv</span>
            </button>

            <button
              type="button"
              onClick={downloadSampleUsageCSV}
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-black border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 hover:text-white transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download charging_usage.csv</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-5 py-2.5 rounded-lg transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
