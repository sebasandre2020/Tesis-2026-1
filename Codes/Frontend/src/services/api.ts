// src/services/api.ts
// Capa de servicios HTTP — Cliente base para comunicación con la API de Azure
// Sigue el patrón descrito en el README: src/services con clientes HTTP

import {
  Sensor,
  Alert,
  AlertHistoryEntry,
  ChartData,
  TimeRange,
  SystemStats,
  SensorDetailData,
} from '../types/sensor.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://func-co2-yfifyk.azurewebsites.net/api';

// =============================================================================
// DATOS DUMMY — Simulan las respuestas de la API de Azure Container Apps.
// Reemplazar con llamadas fetch reales cuando el backend esté disponible.
// =============================================================================

const DUMMY_SENSORS: Sensor[] = [
  { id: 1, name: 'Aula 101', location: 'Piso 1', currentLevel: 450, status: 'Elevado', lastUpdate: '10:30 AM' },
  { id: 2, name: 'Laboratorio', location: 'Piso 2', currentLevel: 500, status: 'Crítico', lastUpdate: '10:25 AM' },
  { id: 3, name: 'Biblioteca', location: 'Piso 1', currentLevel: 420, status: 'Normal', lastUpdate: '10:28 AM' },
];

const DUMMY_ACTIVE_ALERTS: Alert[] = [
  { id: 1, location: 'Aula 101', level: '550 ppm', status: 'Elevado' },
  { id: 2, location: 'Laboratorio', level: '520 ppm', status: 'Crítico' },
  { id: 3, location: 'Biblioteca', level: '530 ppm', status: 'Elevado' },
];

const DUMMY_ALERT_HISTORY: AlertHistoryEntry[] = [
  { time: '08:00', level: '510 ppm' },
  { time: '06:00', level: '500 ppm' },
  { time: '04:00', level: '490 ppm' },
];

const DUMMY_STATS: SystemStats = {
  averageCO2: 460,
  maxCO2: 500,
  alertTimeHours: 2,
  totalAlerts: 3,
};

const DUMMY_CHART_DATA: Record<TimeRange, ChartData> = {
  '1h': {
    labels: ['0m', '15m', '30m', '45m', '1h'],
    datasets: [
      { label: 'Aula 101', data: [420, 425, 430, 428, 429], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 452, 453, 451, 450], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 472, 473, 471, 470], borderColor: '#FFA726', fill: false },
    ],
  },
  '3h': {
    labels: ['0h', '1h', '2h', '3h'],
    datasets: [
      { label: 'Aula 101', data: [420, 430, 440, 445], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 455, 458, 460], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 475, 478, 480], borderColor: '#FFA726', fill: false },
    ],
  },
  '12h': {
    labels: ['0h', '3h', '6h', '9h', '12h'],
    datasets: [
      { label: 'Aula 101', data: [420, 430, 450, 460, 470], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 455, 460, 465, 470], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 480, 490, 495, 500], borderColor: '#FFA726', fill: false },
    ],
  },
  '24h': {
    labels: ['0h', '6h', '12h', '18h', '24h'],
    datasets: [
      { label: 'Aula 101', data: [420, 440, 460, 470, 480], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 460, 470, 475, 480], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 485, 495, 500, 510], borderColor: '#FFA726', fill: false },
    ],
  },
  '7d': {
    labels: ['1d', '2d', '3d', '4d', '5d', '6d', '7d'],
    datasets: [
      { label: 'Aula 101', data: [420, 440, 460, 470, 480, 450, 440], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 460, 470, 475, 480, 490, 500], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 485, 495, 500, 510, 520, 530], borderColor: '#FFA726', fill: false },
    ],
  },
  'june': {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      { label: 'Aula 101', data: [420, 440, 460, 470], borderColor: '#42A5F5', fill: false },
      { label: 'Laboratorio', data: [450, 460, 470, 475], borderColor: '#66BB6A', fill: false },
      { label: 'Biblioteca', data: [470, 485, 495, 500], borderColor: '#FFA726', fill: false },
    ],
  },
};

const DUMMY_SENSOR_DETAILS: Record<number, SensorDetailData> = {
  1: {
    sensorName: 'Sensor Aula 101',
    location: 'Aula 101',
    currentLevel: 480,
    currentStatus: 'Elevado',
    stats: { averageCO2: 460, maxCO2: 500, alertTimeHours: 2, totalAlerts: 3 },
    chartData: {
      labels: ['0h', '2h', '4h', '6h', '8h'],
      datasets: [{ label: 'CO₂ ppm', data: [420, 450, 470, 480, 490], borderColor: '#42A5F5', fill: false }],
    },
    alertHistory: [
      { time: '08:00', level: 510 },
      { time: '06:00', level: 500 },
      { time: '04:00', level: 490 },
    ],
  },
  2: {
    sensorName: 'Sensor Laboratorio',
    location: 'Laboratorio',
    currentLevel: 520,
    currentStatus: 'Crítico',
    stats: { averageCO2: 490, maxCO2: 540, alertTimeHours: 4, totalAlerts: 7 },
    chartData: {
      labels: ['0h', '2h', '4h', '6h', '8h'],
      datasets: [{ label: 'CO₂ ppm', data: [480, 500, 510, 530, 520], borderColor: '#66BB6A', fill: false }],
    },
    alertHistory: [
      { time: '09:00', level: 540 },
      { time: '07:00', level: 530 },
      { time: '05:00', level: 515 },
    ],
  },
  3: {
    sensorName: 'Sensor Biblioteca',
    location: 'Biblioteca',
    currentLevel: 410,
    currentStatus: 'Normal',
    stats: { averageCO2: 400, maxCO2: 430, alertTimeHours: 0, totalAlerts: 0 },
    chartData: {
      labels: ['0h', '2h', '4h', '6h', '8h'],
      datasets: [{ label: 'CO₂ ppm', data: [390, 400, 410, 420, 410], borderColor: '#FFA726', fill: false }],
    },
    alertHistory: [],
  },
};

// Datos de gráfica por sensor y rango de tiempo (para la subpágina de detalle)
const DUMMY_SENSOR_CHART_BY_RANGE: Record<number, Record<TimeRange, ChartData>> = {
  1: {
    '1h': {
      labels: ['0m', '15m', '30m', '45m', '1h'],
      datasets: [{ label: 'CO₂ ppm', data: [475, 478, 480, 482, 480], borderColor: '#42A5F5', fill: false }],
    },
    '3h': {
      labels: ['0h', '1h', '2h', '3h'],
      datasets: [{ label: 'CO₂ ppm', data: [460, 470, 478, 480], borderColor: '#42A5F5', fill: false }],
    },
    '12h': {
      labels: ['0h', '3h', '6h', '9h', '12h'],
      datasets: [{ label: 'CO₂ ppm', data: [430, 445, 460, 475, 480], borderColor: '#42A5F5', fill: false }],
    },
    '24h': {
      labels: ['0h', '4h', '8h', '12h', '16h', '20h', '24h'],
      datasets: [{ label: 'CO₂ ppm', data: [420, 435, 450, 460, 470, 478, 490], borderColor: '#42A5F5', fill: false }],
    },
    '7d': {
      labels: ['1d', '2d', '3d', '4d', '5d', '6d', '7d'],
      datasets: [{ label: 'CO₂ ppm', data: [420, 435, 450, 460, 470, 478, 490], borderColor: '#42A5F5', fill: false }],
    },
    'june': {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'CO₂ ppm', data: [420, 435, 450, 460], borderColor: '#42A5F5', fill: false }],
    },
  },
  2: {
    '1h': {
      labels: ['0m', '15m', '30m', '45m', '1h'],
      datasets: [{ label: 'CO₂ ppm', data: [515, 518, 520, 522, 520], borderColor: '#66BB6A', fill: false }],
    },
    '3h': {
      labels: ['0h', '1h', '2h', '3h'],
      datasets: [{ label: 'CO₂ ppm', data: [500, 510, 518, 520], borderColor: '#66BB6A', fill: false }],
    },
    '12h': {
      labels: ['0h', '3h', '6h', '9h', '12h'],
      datasets: [{ label: 'CO₂ ppm', data: [480, 495, 505, 515, 520], borderColor: '#66BB6A', fill: false }],
    },
    '24h': {
      labels: ['0h', '4h', '8h', '12h', '16h', '20h', '24h'],
      datasets: [{ label: 'CO₂ ppm', data: [470, 485, 500, 510, 520, 530, 520], borderColor: '#66BB6A', fill: false }],
    },
    '7d': {
      labels: ['1d', '2d', '3d', '4d', '5d', '6d', '7d'],
      datasets: [{ label: 'CO₂ ppm', data: [470, 485, 500, 510, 520, 530, 520], borderColor: '#66BB6A', fill: false }],
    },
    'june': {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'CO₂ ppm', data: [470, 485, 500, 510], borderColor: '#66BB6A', fill: false }],
    },
  },
  3: {
    '1h': {
      labels: ['0m', '15m', '30m', '45m', '1h'],
      datasets: [{ label: 'CO₂ ppm', data: [408, 409, 410, 411, 410], borderColor: '#FFA726', fill: false }],
    },
    '3h': {
      labels: ['0h', '1h', '2h', '3h'],
      datasets: [{ label: 'CO₂ ppm', data: [400, 405, 408, 410], borderColor: '#FFA726', fill: false }],
    },
    '12h': {
      labels: ['0h', '3h', '6h', '9h', '12h'],
      datasets: [{ label: 'CO₂ ppm', data: [390, 395, 400, 405, 410], borderColor: '#FFA726', fill: false }],
    },
    '24h': {
      labels: ['0h', '4h', '8h', '12h', '16h', '20h', '24h'],
      datasets: [{ label: 'CO₂ ppm', data: [380, 385, 390, 395, 400, 405, 410], borderColor: '#FFA726', fill: false }],
    },
    '7d': {
      labels: ['1d', '2d', '3d', '4d', '5d', '6d', '7d'],
      datasets: [{ label: 'CO₂ ppm', data: [380, 385, 390, 395, 400, 405, 410], borderColor: '#FFA726', fill: false }],
    },
    'june': {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [{ label: 'CO₂ ppm', data: [380, 385, 390, 395], borderColor: '#FFA726', fill: false }],
    },
  },
};

// =============================================================================
// API SERVICE — Funciones que simulan llamadas a la API.
// Cuando el backend esté listo, reemplazar los returns por fetch().
// =============================================================================

export const fetchSensors = async (): Promise<Sensor[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/sensors`);
    if (!res.ok) throw new Error('Failed to fetch from API');
    return await res.json();
  } catch (error) {
    console.warn('API call failed, falling back to dummy data', error);
    return Promise.resolve(DUMMY_SENSORS);
  }
};

/**
 * Obtiene las alertas activas del sistema.
 */
export const fetchActiveAlerts = async (): Promise<Alert[]> => {
  // TODO: Reemplazar con: const res = await fetch(`${API_BASE_URL}/alerts/active`);
  return Promise.resolve(DUMMY_ACTIVE_ALERTS);
};

/**
 * Obtiene el historial de alertas.
 */
export const fetchAlertHistory = async (): Promise<AlertHistoryEntry[]> => {
  // TODO: Reemplazar con: const res = await fetch(`${API_BASE_URL}/alerts/history`);
  return Promise.resolve(DUMMY_ALERT_HISTORY);
};

/**
 * Obtiene las estadísticas generales del sistema.
 */
export const fetchStats = async (): Promise<SystemStats> => {
  // TODO: Reemplazar con: const res = await fetch(`${API_BASE_URL}/stats`);
  return Promise.resolve(DUMMY_STATS);
};

interface RawReading {
  nodeId: string;
  co2: number;
  timestamp: string;
}

const processChartData = (readings: RawReading[], timeRange: TimeRange): ChartData => {
  if (readings.length === 0) {
    return {
      labels: ['Sin datos en este periodo'],
      datasets: [{ label: 'N/A', data: [], borderColor: 'transparent', fill: false }]
    };
  }

  readings.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const nodeIds = Array.from(new Set(readings.map(r => r.nodeId)));
  
  // Extract all unique raw timestamps to preserve every single data point
  const uniqueTimestamps = Array.from(new Set(readings.map(r => r.timestamp)));
  
  const labels = uniqueTimestamps.map(ts => {
    const d = new Date(ts);
    if (timeRange === 'june' || timeRange === '7d' || timeRange === '24h' || timeRange === '12h') {
      return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });
  
  const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A'];

  const datasets = nodeIds.map((nodeId, idx) => {
    const nodeReadings = readings.filter(r => r.nodeId === nodeId);
    const data = uniqueTimestamps.map(ts => {
      const reading = nodeReadings.find(r => r.timestamp === ts);
      return reading ? reading.co2 : null;
    });

    return {
      label: nodeId,
      data: data as any,
      borderColor: colors[idx % colors.length],
      fill: false,
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 4,
    };
  });

  return { labels, datasets };
};

export const fetchChartData = async (timeRange: TimeRange): Promise<ChartData> => {
  try {
    const res = await fetch(`${API_BASE_URL}/readings?range=${timeRange}`);
    if (!res.ok) throw new Error('Failed to fetch chart data');
    const rawData: RawReading[] = await res.json();
    return processChartData(rawData, timeRange);
  } catch (error) {
    console.warn('API call failed, falling back to dummy data', error);
    return Promise.resolve(DUMMY_CHART_DATA[timeRange] || DUMMY_CHART_DATA['24h']);
  }
};

export const fetchSensorDetail = async (sensorId: number): Promise<SensorDetailData | null> => {
  return Promise.resolve(DUMMY_SENSOR_DETAILS[sensorId] || null);
};

export const fetchSensorDetailChart = async (sensorId: number, timeRange: TimeRange): Promise<ChartData> => {
  const sensorCharts = DUMMY_SENSOR_CHART_BY_RANGE[sensorId];
  if (!sensorCharts) return { labels: [], datasets: [] };
  return Promise.resolve(sensorCharts[timeRange] || sensorCharts['24h']);
};
