// src/services/api.ts
// Capa de servicios HTTP — Cliente para comunicación con la API de Azure.
// Maneja 4 métricas por nodo: CO₂ (MH-Z19), Polvo (Sharp), Temperatura y Humedad (DHT22).

import {
  Sensor,
  Alert,
  AlertHistoryEntry,
  ChartData,
  TimeRange,
  SystemStats,
  SensorDetailData,
  RawReading,
  SensorAlertEntry,
  MetricType,
} from '../types/sensor.types';
import {
  getCO2Status,
  getDustStatus,
  getTemperatureStatus,
  getHumidityStatus,
} from '../utils/formatters';

const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api' 
  : (process.env.REACT_APP_API_URL || 'https://func-co2-yfifyk.azurewebsites.net/api');

// =============================================================================
// Mapeo: id numérico de la URL ↔ NodeId del backend ↔ nombre legible
// El backend expone "Node_01" en /api/readings y el nombre "Aula 101"
// en /api/sensors. Mantenemos este mapa sincronizado con el backend.
// =============================================================================
export const SENSOR_ID_TO_NODE: Record<number, { nodeId: string; name: string; location: string }> = {
  [-642718467]: { nodeId: 'Node_01', name: 'Aula 101', location: 'Piso 1' },
  [-889472740]: { nodeId: 'Node_02', name: 'Laboratorio', location: 'Piso 2' },
  [615230235]: { nodeId: 'Node_03', name: 'Biblioteca', location: 'Piso 1' },
};

/** Tabla de nodeId -> nombre legible (para legends/labels en la UI). */
const NODE_ID_TO_NAME: Record<string, string> = Object.values(SENSOR_ID_TO_NODE)
  .reduce((acc, s) => { acc[s.nodeId] = s.name; return acc; }, {} as Record<string, string>);

const displayName = (r: RawReading): string =>
  r.displayName || NODE_ID_TO_NAME[r.nodeId] || r.nodeId;

export const CO2_ALERT_THRESHOLD = 500;

// =============================================================================
// Helpers
// =============================================================================

const safeJson = async <T,>(res: Response, context: string): Promise<T | null> => {
  try {
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[api] Invalid JSON in ${context}`, e);
    return null;
  }
};

const labelForRange = (d: Date, range: TimeRange): string => {
  if (range === 'june' || range === '7d' || range === '24h' || range === '12h' || range === 'custom') {
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const valueFor = (r: RawReading, metric: MetricType): number | null => {
  switch (metric) {
    case 'co2': return r.co2;
    case 'dust': return r.dust;
    case 'temperature': return r.temperature;
    case 'humidity': return r.humidity;
  }
};

const buildSingleSensorChart = (
  readings: RawReading[],
  range: TimeRange,
  metric: MetricType
): ChartData => {
  const filtered = readings.filter(r => valueFor(r, metric) !== null);
  if (filtered.length === 0) return { labels: [], datasets: [] };

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const labels = sorted.map(r => labelForRange(new Date(r.timestamp), range));
  const data = sorted.map(r => valueFor(r, metric));

  return {
    labels,
    datasets: [
      {
        label: metric,
        data,
        borderColor: '#42A5F5',
        backgroundColor: 'rgba(66,165,245,0.15)',
        fill: false,
        tension: 0.25,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
    ],
  };
};

const computeStats = (readings: RawReading[]): SystemStats => {
  const co2Readings = readings.filter(r => r.co2 !== null);
  if (co2Readings.length === 0) {
    return { averageCO2: 0, maxCO2: 0, alertTimeHours: 0, totalAlerts: 0 };
  }
  const values = co2Readings.map(r => r.co2 as number);
  const sum = values.reduce((a, b) => a + b, 0);
  const average = Math.round(sum / values.length);
  const max = Math.max(...values);
  const alertReadings = co2Readings.filter(r => (r.co2 as number) > CO2_ALERT_THRESHOLD);
  const alertTimeHours = Math.round((alertReadings.length / 60) * 10) / 10;
  return {
    averageCO2: average,
    maxCO2: max,
    alertTimeHours,
    totalAlerts: alertReadings.length,
  };
};

const computeAlertHistory = (readings: RawReading[], limit = 10): SensorAlertEntry[] => {
  return readings
    .filter(r => r.co2 !== null && (r.co2 as number) > CO2_ALERT_THRESHOLD)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map(r => ({
      time: new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      level: r.co2 as number,
    }));
};

const computeLatestNumeric = (readings: RawReading[], metric: MetricType): number | null => {
  const withMetric = readings.filter(r => valueFor(r, metric) !== null);
  if (withMetric.length === 0) return null;
  const sorted = [...withMetric].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return valueFor(sorted[0], metric);
};

const computeCurrentLevel = (readings: RawReading[]): number => {
  const withCo2 = readings.filter(r => r.co2 !== null);
  if (withCo2.length === 0) return 0;
  const sorted = [...withCo2].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return sorted[0].co2 as number;
};

// =============================================================================
// API: Sensores y lecturas
// =============================================================================

export const fetchSensors = async (): Promise<Sensor[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/sensors`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await safeJson<Sensor[]>(res, 'fetchSensors');
    if (!Array.isArray(data)) throw new Error('Sensors payload not an array');
    return data;
  } catch (error) {
    console.warn('[api] fetchSensors failed', error);
    return [];
  }
};

/**
 * Datos completos del sensor para la página de detalle.
 *
 * Estrategia de "latest reading" para los widgets de lecturas actuales:
 *  - El widget debe mostrar la última lectura conocida, no la última del rango
 *    seleccionado (que puede estar vacío si los datos son antiguos).
 *  - Por eso, además de /readings?range=24h (para chart+stats+alerts),
 *    también llamamos a /sensors que devuelve la última lectura por nodo
 *    sin filtro de tiempo.
 *  - Si /sensors tiene la lectura más reciente que /readings?range=24h,
 *    usamos esa para los widgets. Si /sensors falla, caemos al cómputo
 *    desde /readings.
 */
export const fetchSensorDetail = async (sensorId: number): Promise<SensorDetailData | null> => {
  // Intentamos obtener metadata del mapa estático primero.
  let meta = SENSOR_ID_TO_NODE[sensorId];

  try {
    const sensors = await fetchSensors();
    
    // Si no está en el mapa estático, buscamos dinámicamente en la lista de sensores.
    if (!meta) {
      const sensorFromApi = sensors.find(s => s.id === sensorId);
      if (sensorFromApi) {
        meta = {
          nodeId: sensorFromApi.nodeId || 'Unknown',
          name: sensorFromApi.name || 'Nodo Desconocido',
          location: sensorFromApi.location || 'Sin ubicación',
        };
      }
    }

    if (!meta) return null;

    // Traemos lecturas del rango seleccionado para chart/stats/alerts.
    const res24h = await fetch(`${API_BASE_URL}/readings?range=24h`);
    if (!res24h.ok) throw new Error(`HTTP ${res24h.status}`);
    
    const raw = (await safeJson<RawReading[]>(res24h, 'fetchSensorDetail')) ?? [];
    const nodeReadings = raw.filter(r => r.nodeId === meta.nodeId);

    const sensorFromSensors = sensors.find(
      s => s.nodeId === meta.nodeId || s.id === sensorId
    );

    const fallbackReadings = sensorFromSensors ? [{
      co2: sensorFromSensors.currentLevel ?? null,
      dust: sensorFromSensors.dustLevel ?? null,
      temperature: sensorFromSensors.temperature ?? null,
      humidity: sensorFromSensors.humidity ?? null,
      timestamp: new Date().toISOString(),
    } as RawReading] : [];

    const sourceReadings = nodeReadings.length > 0 ? nodeReadings : fallbackReadings;

    const currentLevel = computeCurrentLevel(sourceReadings);
    const currentDust = sensorFromSensors?.dustLevel ?? computeLatestNumeric(sourceReadings, 'dust');
    const currentTemperature = sensorFromSensors?.temperature ?? computeLatestNumeric(sourceReadings, 'temperature');
    const currentHumidity = sensorFromSensors?.humidity ?? computeLatestNumeric(sourceReadings, 'humidity');

    const stats = computeStats(nodeReadings);
    const chartData = buildSingleSensorChart(nodeReadings, '24h', 'co2');
    const alertHistory = computeAlertHistory(nodeReadings);

    const hasPartialReadings = nodeReadings.some(
      r => r.co2 !== null && (r.dust === null || r.temperature === null || r.humidity === null)
    );

    return {
      sensorName: `Nodo ${meta.name}`,
      location: meta.location,
      currentLevel,
      currentStatus: getCO2Status(currentLevel),
      currentDust: currentDust ?? null,
      currentDustStatus: currentDust === null || currentDust === undefined ? 'Normal' : getDustStatus(currentDust),
      currentTemperature: currentTemperature ?? null,
      currentTemperatureStatus: currentTemperature === null || currentTemperature === undefined ? 'Normal' : getTemperatureStatus(currentTemperature),
      currentHumidity: currentHumidity ?? null,
      currentHumidityStatus: currentHumidity === null || currentHumidity === undefined ? 'Normal' : getHumidityStatus(currentHumidity),
      stats,
      chartData,
      alertHistory,
      hasPartialReadings,
    };
  } catch (error) {
    console.warn('[api] fetchSensorDetail failed', error);
    return null;
  }
};

export const fetchSensorDetailChart = async (
  sensorId: number,
  timeRange: TimeRange,
  metric: MetricType,
  customFrom?: string,
  customTo?: string
): Promise<ChartData> => {
  let meta = SENSOR_ID_TO_NODE[sensorId];

  try {
    if (!meta) {
      const sensors = await fetchSensors();
      const s = sensors.find(s => s.id === sensorId);
      if (s) {
        meta = { nodeId: s.nodeId || '', name: s.name || '', location: s.location || '' };
      }
    }
    
    if (!meta) return { labels: [], datasets: [] };

    let url = `${API_BASE_URL}/readings?range=${encodeURIComponent(timeRange)}`;
    if (timeRange === 'custom' && customFrom && customTo) {
      url = `${API_BASE_URL}/readings?from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await safeJson<RawReading[]>(res, 'fetchSensorDetailChart')) ?? [];
    const nodeReadings = raw.filter(r => r.nodeId === meta.nodeId);
    return buildSingleSensorChart(nodeReadings, timeRange, metric);
  } catch (error) {
    console.warn('[api] fetchSensorDetailChart failed', error);
    return { labels: [], datasets: [] };
  }
};

// =============================================================================
// API: Dashboard (chart agregado + alertas + stats)
// =============================================================================

/**
 * Construye un ChartData comparativo entre todos los nodos para una métrica.
 * Las etiquetas usan el displayName (no el nodeId crudo) para que la
 * leyenda se vea amigable ("Aula 101" en vez de "Node_01").
 */
export const processChartData = (
  readings: RawReading[],
  timeRange: TimeRange,
  metric: MetricType
): ChartData => {
  const filtered = readings.filter(r => valueFor(r, metric) !== null);
  if (filtered.length === 0) return { labels: [], datasets: [] };

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const nodeIds = Array.from(new Set(sorted.map(r => r.nodeId)));
  const uniqueTimestamps = Array.from(new Set(sorted.map(r => r.timestamp)));

  const labels = uniqueTimestamps.map(ts => labelForRange(new Date(ts), timeRange));
  const colors = ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#EC407A'];

  const datasets = nodeIds.map((nodeId, idx) => {
    const nodeReadings = sorted.filter(r => r.nodeId === nodeId);
    const data = uniqueTimestamps.map(ts => {
      const reading = nodeReadings.find(r => r.timestamp === ts);
      return reading ? valueFor(reading, metric) : null;
    });

    return {
      label: displayName(nodeReadings[0]) || nodeId,
      data,
      borderColor: colors[idx % colors.length],
      fill: false,
      tension: 0.1,
      pointRadius: 1,
      pointHoverRadius: 4,
      spanGaps: true,
    };
  });

  return { labels, datasets };
};

export const fetchChartData = async (
  timeRange: TimeRange,
  metric: MetricType,
  customFrom?: string,
  customTo?: string
): Promise<ChartData> => {
  try {
    let url = `${API_BASE_URL}/readings?range=${encodeURIComponent(timeRange)}`;
    if (timeRange === 'custom' && customFrom && customTo) {
      url = `${API_BASE_URL}/readings?from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await safeJson<RawReading[]>(res, 'fetchChartData')) ?? [];
    return processChartData(raw, timeRange, metric);
  } catch (error) {
    console.warn('[api] fetchChartData failed', error);
    return { labels: [], datasets: [] };
  }
};

export const fetchActiveAlerts = async (): Promise<Alert[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/readings?range=24h`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await safeJson<RawReading[]>(res, 'fetchActiveAlerts')) ?? [];

    const byNode = new Map<string, RawReading>();
    raw.forEach(r => {
      const prev = byNode.get(r.nodeId);
      if (!prev || new Date(r.timestamp) > new Date(prev.timestamp)) {
        byNode.set(r.nodeId, r);
      }
    });

    const alerts: Alert[] = [];
    let counter = 1;
    byNode.forEach(reading => {
      if (reading.co2 !== null && reading.co2 > CO2_ALERT_THRESHOLD) {
        const status = reading.co2 > 1000 ? 'Crítico' : 'Elevado';
        alerts.push({
          id: counter++,
          location: displayName(reading),
          level: `${reading.co2} ppm`,
          status,
          time: new Date(reading.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        });
      }
    });
    return alerts;
  } catch (error) {
    console.warn('[api] fetchActiveAlerts failed', error);
    return [];
  }
};

export const fetchAlertHistory = async (): Promise<AlertHistoryEntry[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/readings?range=24h`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await safeJson<RawReading[]>(res, 'fetchAlertHistory')) ?? [];

    return raw
      .filter(r => r.co2 !== null && r.co2 > CO2_ALERT_THRESHOLD)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map(r => ({
        time: new Date(r.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        level: `${r.co2} ppm`,
      }));
  } catch (error) {
    console.warn('[api] fetchAlertHistory failed', error);
    return [];
  }
};

export const fetchStats = async (): Promise<SystemStats> => {
  try {
    const res = await fetch(`${API_BASE_URL}/readings?range=24h`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await safeJson<RawReading[]>(res, 'fetchStats')) ?? [];
    return computeStats(raw);
  } catch (error) {
    console.warn('[api] fetchStats failed', error);
    return { averageCO2: 0, maxCO2: 0, alertTimeHours: 0, totalAlerts: 0 };
  }
};
