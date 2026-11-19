import { Station, ChargingUsageRecord } from '../types';

export function parseStationsCSV(csvText: string): Station[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const stations: Station[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    if (row.length < 4) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = row[idx] || '';
    });

    const lat = parseFloat(rowObj['latitude'] || rowObj['lat'] || '0');
    const lon = parseFloat(rowObj['longitude'] || rowObj['lon'] || rowObj['lng'] || '0');
    const ports = parseInt(rowObj['total_ports'] || rowObj['ports'] || '4', 10);
    const available = parseInt(rowObj['available_ports'] || rowObj['available'] || `${Math.max(1, Math.round(ports * 0.4))}`, 10);
    const power = parseInt(rowObj['power_kw'] || rowObj['power'] || '60', 10);

    const station: Station = {
      station_id: rowObj['station_id'] || rowObj['id'] || `ST-${100 + i}`,
      station_name: rowObj['station_name'] || rowObj['name'] || `EV Station ${i}`,
      provider: rowObj['provider'] || 'GreenCharge Network',
      city: rowObj['city'] || 'Custom City',
      area: rowObj['area'] || 'Local Hub',
      address: rowObj['address'] || 'Station Location',
      latitude: isNaN(lat) ? 13.0827 : lat,
      longitude: isNaN(lon) ? 80.2707 : lon,
      charger_type: rowObj['charger_type'] || 'CCS2 DC Fast (60kW)',
      total_ports: isNaN(ports) ? 4 : ports,
      available_ports: isNaN(available) ? 2 : available,
      demand_level: (['High', 'Medium', 'Low'].includes(rowObj['demand_level']) ? rowObj['demand_level'] : 'Medium') as any,
      power_kw: isNaN(power) ? 60 : power,
      cost_per_kwh: parseFloat(rowObj['cost_per_kwh'] || '18.0'),
      status: 'Operational',
      rating: 4.6,
    };

    stations.push(station);
  }

  return stations;
}

export function exportStationsCSV(stations: Station[]): string {
  const headers = ['station_id', 'station_name', 'provider', 'city', 'area', 'address', 'latitude', 'longitude', 'charger_type', 'total_ports', 'available_ports', 'demand_level', 'power_kw', 'cost_per_kwh'];
  const rows = stations.map(s => [
    s.station_id,
    `"${s.station_name}"`,
    `"${s.provider}"`,
    `"${s.city}"`,
    `"${s.area}"`,
    `"${s.address}"`,
    s.latitude,
    s.longitude,
    `"${s.charger_type}"`,
    s.total_ports,
    s.available_ports ?? 2,
    s.demand_level,
    s.power_kw,
    s.cost_per_kwh
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function exportUsageCSV(records: ChargingUsageRecord[]): string {
  const headers = ['station_id', 'date', 'time', 'duration_minutes', 'energy_kwh', 'occupancy_pct', 'charging_sessions'];
  const rows = records.map(r => [
    r.station_id,
    r.date,
    r.time,
    r.duration_minutes,
    r.energy_kwh,
    r.occupancy_pct,
    r.charging_sessions
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
