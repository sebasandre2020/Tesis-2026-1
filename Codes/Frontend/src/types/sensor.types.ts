// src/types/sensor.types.ts
// Tipos TypeScript centralizados para el dominio de monitoreo IoT de CO₂

/** Rangos de tiempo disponibles para filtrar datos */
export type TimeRange = '1h' | '3h' | '12h' | '24h' | '7d' | 'june';

/** Estados posibles del nivel de CO₂ */
export type CO2Status = 'Normal' | 'Elevado' | 'Crítico';

/** Representación de un nodo sensor del sistema */
export interface Sensor {
  id: number;
  name: string;
  location: string;
  currentLevel: number;
  status: CO2Status;
  lastUpdate: string;
}

/** Una lectura individual de CO₂ */
export interface CO2Reading {
  timestamp: string;
  value: number;
  sensorId: number;
}

/** Una alerta generada por el sistema */
export interface Alert {
  id: number;
  location: string;
  level: string;
  status: CO2Status;
  time?: string;
}

/** Registro del historial de alertas */
export interface AlertHistoryEntry {
  time: string;
  level: string;
}

/** Datos de un dataset para gráficas Chart.js */
export interface ChartDataset {
  label: string;
  data: number[];
  borderColor: string;
  fill: boolean;
}

/** Datos formateados para Chart.js */
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

/** Estadísticas generales del sistema */
export interface SystemStats {
  averageCO2: number;
  maxCO2: number;
  alertTimeHours: number;
  totalAlerts: number;
}

/** Datos de detalle de un sensor individual */
export interface SensorDetailData {
  sensorName: string;
  location: string;
  currentLevel: number;
  currentStatus: string;
  stats: SystemStats;
  chartData: ChartData;
  alertHistory: { time: string; level: number }[];
}
