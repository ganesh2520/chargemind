import { ChargingUsageRecord, Station } from '../types';

// Deterministic mock generator for historical usage so all stations have robust metrics
export function generateUsageRecordsForStations(stations: Station[]): ChargingUsageRecord[] {
  const records: ChargingUsageRecord[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  stations.forEach((station) => {
    // Station multiplier based on demand level
    const demandMultiplier = station.demand_level === 'High' ? 1.4 : station.demand_level === 'Medium' ? 1.0 : 0.65;
    
    // Generate records for standard hours (0 to 23)
    for (let hour = 0; hour < 24; hour++) {
      // Natural EV charging curve: peaks around 9am, lunch (13:00), and evening (18:00 - 20:00)
      let hourFactor = 0.25;
      if (hour >= 8 && hour <= 10) hourFactor = 0.85; // morning rush
      else if (hour >= 12 && hour <= 14) hourFactor = 0.70; // lunch
      else if (hour >= 17 && hour <= 21) hourFactor = 1.0; // peak evening
      else if (hour >= 22 || hour <= 5) hourFactor = 0.18; // night trickle
      else hourFactor = 0.55;

      const baseSessions = Math.max(1, Math.round(station.total_ports * hourFactor * demandMultiplier));
      const occupancy = Math.min(98, Math.round((baseSessions / station.total_ports) * 100 * (0.8 + Math.random() * 0.2)));
      const avgDuration = station.power_kw >= 60 ? 35 + Math.round(Math.random() * 20) : 110 + Math.round(Math.random() * 45);
      const energyPerSession = station.power_kw >= 60 ? (avgDuration / 60) * station.power_kw * 0.75 : (avgDuration / 60) * station.power_kw * 0.85;

      records.push({
        station_id: station.station_id,
        date: '2026-10-08',
        time: `${hour.toString().padStart(2, '0')}:00`,
        duration_minutes: avgDuration,
        energy_kwh: Math.round(energyPerSession * baseSessions * 10) / 10,
        occupancy_pct: occupancy,
        charging_sessions: baseSessions,
      });
    }
  });

  return records;
}
