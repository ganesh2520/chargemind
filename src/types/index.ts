export type DemandCategory = 'High' | 'Medium' | 'Low';

export type ChargerType = 
  | 'CCS2 DC Fast (60kW)' 
  | 'CCS2 DC Ultra-Fast (120kW)' 
  | 'Type 2 AC (22kW)' 
  | 'Type 2 AC (7.4kW)' 
  | 'CHAdeMO (50kW)' 
  | 'GB/T DC (15kW)';

export interface Station {
  station_id: string;
  station_name: string;
  provider: string;
  city: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  charger_type: string;
  total_ports: number;
  available_ports?: number;
  demand_level: DemandCategory;
  power_kw: number;
  cost_per_kwh: number; // in INR
  status: 'Operational' | 'Busy' | 'Maintenance';
  added_date?: string;
  rating?: number;
}

export interface ChargingUsageRecord {
  station_id: string;
  date: string;
  time: string; // e.g. "14:00"
  duration_minutes: number;
  energy_kwh: number;
  occupancy_pct: number;
  charging_sessions: number;
}

export interface DemandSummary {
  totalStations: number;
  totalPorts: number;
  availablePorts: number;
  highDemandCount: number;
  mediumDemandCount: number;
  lowDemandCount: number;
  averageOccupancy: number;
  totalSessions: number;
}

export interface PredictionInput {
  stationId: string;
  date: string;
  timePeriod: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  dayOfWeek: string;
  weatherCondition?: 'Clear' | 'Rain' | 'Hot';
}

export interface PredictionResult {
  stationId: string;
  stationName: string;
  predictedSessions: number;
  predictedOccupancy: number;
  predictedDemandLevel: DemandCategory;
  historicalAverageSessions: number;
  variancePercentage: number;
  confidenceScore: number;
  modelMetrics: {
    modelName: string;
    mae: number;
    rmse: number;
    r2Score: number;
    featuresUsed: string[];
  };
  timeSeriesComparison: {
    timeLabel: string;
    historical: number;
    predicted: number;
  }[];
  explanation: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'EV Driver' | 'Station Operator';
  avatar?: string;
}
