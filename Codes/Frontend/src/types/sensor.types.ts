// src/types/sensor.types.ts
// Tipos TypeScript centralizados para el dominio de monitoreo IoT multi-sensor

/** Rangos de tiempo disponibles para filtrar datos */
export type TimeRange = '1h' | '3h' | '12h' | '24h' | '7d' | 'june';

/** Métricas disponibles por cada nodo sensor. */
export type MetricType = 'co2' | 'dust' | 'temperature' | 'humidity';

/** Estados posibles del nivel de CO₂ */
export type CO2Status = 'Normal' | 'Elevado' | 'Crítico';

/** Representación de un nodo sensor del sistema */
export interface Sensor {
  id: number;
  /** Identificador canónico que llega desde la API, p.ej. "Node_01". */
  nodeId?: string;
  name: string;
  location: string;
  /** ppm de CO₂. */
  currentLevel: number;
  status: CO2Status;
  /** µg/m³ de material particulado. */
  dustLevel?: number | null;
  dustStatus?: CO2Status;
  /** °C. */
  temperature?: number | null;
  temperatureStatus?: CO2Status;
  /** % humedad relativa. */
  humidity?: number | null;
  humidityStatus?: CO2Status;
  lastUpdate: string;
}

/** Una lectura individual de un sensor (todas las métricas opcionales). */
export interface CO2Reading {
  timestamp: string;
  value: number;
  sensorId: number;
}

/** Una lectura cruda devuelta por /api/readings */
export interface RawReading {
  nodeId: string;
  co2: number | null;
  dust: number | null;
  temperature: number | null;
  humidity: number | null;
  timestamp: string;
}

/** Una alerta generada por el sistema */
export interface Alert {
  id: number;
  location: string;
  level: string;
  status: CO2Status;
  time?: string;
}

/** Registro del historial de alertas (formato string para listas del dashboard) */
export interface AlertHistoryEntry {
  time: string;
  level: string;
}

/** Entrada de historial de alertas para un sensor individual */
export interface SensorAlertEntry {
  time: string;
  level: number;
}

/** Datos de un dataset para gráficas Chart.js (data permite nulls para gaps) */
export interface ChartDataset {
  label: string;
  data: (number | null)[];
  borderColor: string;
  backgroundColor?: string;
  fill: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
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
  /** ppm */
  currentLevel: number;
  currentStatus: string;
  /** µg/m³ (puede ser null si la lectura más reciente no incluye polvo). */
  currentDust: number | null;
  currentDustStatus: string;
  /** °C */
  currentTemperature: number | null;
  currentTemperatureStatus: string;
  /** % humedad */
  currentHumidity: number | null;
  currentHumidityStatus: string;
  stats: SystemStats;
  chartData: ChartData;
  alertHistory: SensorAlertEntry[];
  /** True si alguna lectura del periodo no incluye los nuevos sensores. */
  hasPartialReadings: boolean;
}
