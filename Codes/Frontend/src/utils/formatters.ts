// src/utils/formatters.ts
// Funciones de ayuda para formateo de datos en la UI

import { CO2Status, MetricType, TimeRange } from '../types/sensor.types';

/**
 * Metadatos canónicos de cada métrica. Usado por los tabs, el widget,
 * las tarjetas, las gráficas y los formatters — fuente única de verdad.
 */
export interface MetricMeta {
  id: MetricType;
  label: string;
  unit: string;
  shortUnit: string;
  color: string;
  decimals: number;
  description: string;
}

export const METRIC_META: Record<MetricType, MetricMeta> = {
  co2: {
    id: 'co2',
    label: 'CO₂',
    unit: 'ppm',
    shortUnit: 'ppm',
    color: '#42A5F5',
    decimals: 0,
    description: 'Dióxido de carbono (MH-Z19)',
  },
  dust: {
    id: 'dust',
    label: 'Polvo',
    unit: 'µg/m³',
    shortUnit: 'µg/m³',
    color: '#FF8A65',
    decimals: 0,
    description: 'Material particulado (Sharp GP2Y1010AU0F)',
  },
  temperature: {
    id: 'temperature',
    label: 'Temperatura',
    unit: '°C',
    shortUnit: '°C',
    color: '#EF5350',
    decimals: 1,
    description: 'Temperatura (DHT22)',
  },
  humidity: {
    id: 'humidity',
    label: 'Humedad',
    unit: '%',
    shortUnit: '%',
    color: '#26C6DA',
    decimals: 1,
    description: 'Humedad relativa (DHT22)',
  },
};

export const METRIC_ORDER: MetricType[] = ['co2', 'dust', 'temperature', 'humidity'];

/**
 * Devuelve la clase CSS de color según el estado del CO₂.
 */
export const getStatusColor = (status: CO2Status): string => {
  switch (status) {
    case 'Crítico':
      return 'text-red-500';
    case 'Elevado':
      return 'text-yellow-500';
    case 'Normal':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Devuelve la clase CSS de fondo según el estado del CO₂.
 */
export const getStatusBgColor = (status: CO2Status): string => {
  switch (status) {
    case 'Crítico':
      return 'bg-red-50 border-red-200';
    case 'Elevado':
      return 'bg-yellow-50 border-yellow-200';
    case 'Normal':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

/**
 * Devuelve el valor formateado (con unidad) según la métrica.
 * Devuelve '—' si el valor es null/undefined.
 */
export const formatMetricValue = (value: number | null | undefined, metric: MetricType): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  const meta = METRIC_META[metric];
  return `${value.toFixed(meta.decimals)} ${meta.unit}`;
};

/**
 * Estado del CO₂ basado en ppm. Umbrales alineados con el backend.
 */
export const getCO2Status = (ppm: number): CO2Status => {
  if (ppm > 500) return 'Crítico';
  if (ppm > 400) return 'Elevado';
  return 'Normal';
};

/**
 * Estado de Polvo (PM2.5) en µg/m³. Umbrales basados en OMS 2021.
 */
export const getDustStatus = (ugm3: number): CO2Status => {
  if (ugm3 > 55) return 'Crítico';
  if (ugm3 > 35) return 'Elevado';
  return 'Normal';
};

/**
 * Estado de Temperatura en °C. Rango de confort 18-26.
 */
export const getTemperatureStatus = (c: number): CO2Status => {
  if (c < 16 || c > 30) return 'Crítico';
  if (c < 18 || c > 26) return 'Elevado';
  return 'Normal';
};

/**
 * Estado de Humedad relativa en %. Rango confortable 30-60.
 */
export const getHumidityStatus = (pct: number): CO2Status => {
  if (pct < 20 || pct > 75) return 'Crítico';
  if (pct < 30 || pct > 60) return 'Elevado';
  return 'Normal';
};

/** Devuelve el estado de cualquier métrica dado su valor numérico. */
export const getMetricStatus = (metric: MetricType, value: number | null | undefined): CO2Status => {
  if (value === null || value === undefined || Number.isNaN(value)) return 'Normal';
  switch (metric) {
    case 'co2': return getCO2Status(value);
    case 'dust': return getDustStatus(value);
    case 'temperature': return getTemperatureStatus(value);
    case 'humidity': return getHumidityStatus(value);
  }
};

/**
 * Formatea un valor de ppm para mostrar en la UI (compatibilidad hacia atrás).
 */
export const formatPPM = (value: number): string => {
  return `${value} ppm`;
};

/**
 * Devuelve una etiqueta legible para el rango de tiempo.
 */
export const getTimeRangeLabel = (range: TimeRange): string => {
  const labels: Record<TimeRange, string> = {
    '1h': 'Última hora',
    '3h': 'Últimas 3 horas',
    '12h': 'Últimas 12 horas',
    '24h': 'Últimas 24 horas',
    '7d': 'Últimos 7 días',
    'june': 'Todo Junio',
  };
  return labels[range];
};

/**
 * Formatea horas para mostrar en estadísticas.
 */
export const formatHours = (hours: number): string => {
  return `${hours} hrs`;
};
