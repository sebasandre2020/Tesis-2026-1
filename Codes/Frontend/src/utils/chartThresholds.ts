// src/utils/chartThresholds.ts
// Definiciones de líneas de umbral (dashed) que se dibujan sobre la gráfica
// de cada métrica. Una sola fuente de verdad para "qué se considera
// aceptable / elevado / crítico" en la UI.
//
// Los valores se mantienen sincronizados con el backend (GetSensors.cs)
// y con formatters.ts (getCO2Status, getDustStatus, etc.).

import { MetricType } from '../types/sensor.types';

export interface ThresholdLine {
  /** Valor en el eje Y. */
  value: number;
  /** Etiqueta corta que aparece sobre la línea. */
  label: string;
  /** Color CSS. */
  color: string;
  /** 'critico' se muestra más grueso; 'limite' (confort) más fino. */
  variant: 'critico' | 'limite';
}

/** Etiquetas i18n consistentes con formatters.ts. */
const L = {
  CRITICO_CO2: '500 ppm (crítico)',
  CRITICO_DUST: '55 µg/m³ (crítico)',
  CONFORT_TEMP_LOW: '18 °C (confort mín.)',
  CONFORT_TEMP_HIGH: '26 °C (confort máx.)',
  CONFORT_HUM_LOW: '30 % (confort mín.)',
  CONFORT_HUM_HIGH: '60 % (confort máx.)',
};

export const THRESHOLD_LINES: Record<MetricType, ThresholdLine[]> = {
  // CO₂: 1 sola línea en el umbral crítico (métricas "lower is better" sin banda de confort).
  co2: [
    { value: 500, label: L.CRITICO_CO2, color: '#dc2626', variant: 'critico' },
  ],
  // Polvo (PM2.5): mismo razonamiento que CO₂.
  dust: [
    { value: 55, label: L.CRITICO_DUST, color: '#dc2626', variant: 'critico' },
  ],
  // Temperatura: 2 líneas formando la banda de confort 18-26 °C.
  temperature: [
    { value: 18, label: L.CONFORT_TEMP_LOW, color: '#00A4E4', variant: 'limite' },
    { value: 26, label: L.CONFORT_TEMP_HIGH, color: '#dc2626', variant: 'limite' },
  ],
  // Humedad: 2 líneas formando la banda de confort 30-60 %.
  humidity: [
    { value: 30, label: L.CONFORT_HUM_LOW, color: '#00A4E4', variant: 'limite' },
    { value: 60, label: L.CONFORT_HUM_HIGH, color: '#00A4E4', variant: 'limite' },
  ],
};
