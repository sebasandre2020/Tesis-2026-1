// src/utils/formatters.ts
// Funciones de ayuda para formateo de datos en la UI

import { CO2Status, TimeRange } from '../types/sensor.types';

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
 * Formatea un valor de ppm para mostrar en la UI.
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
 * Determina el estado del CO₂ basado en el nivel en ppm.
 * Umbrales basados en estándares ASHRAE:
 * - Normal: < 800 ppm
 * - Elevado: 800-1000 ppm
 * - Crítico: > 1000 ppm
 */
export const getCO2Status = (ppm: number): CO2Status => {
  if (ppm > 1000) return 'Crítico';
  if (ppm > 800) return 'Elevado';
  return 'Normal';
};

/**
 * Formatea horas para mostrar en estadísticas.
 */
export const formatHours = (hours: number): string => {
  return `${hours} hrs`;
};
