// src/utils/thresholdAnnotationPlugin.ts
// Plugin de Chart.js que dibuja líneas de umbral (dashed) en el eje Y.
// Se configura por gráfica pasando un array de líneas en
// options.plugins.thresholdAnnotation.lines.

import { Chart, Plugin } from 'chart.js';
import type { ThresholdLine } from './chartThresholds';

declare module 'chart.js' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType> {
    thresholdAnnotation?: {
      lines: ThresholdLine[];
    };
  }
}

export const thresholdAnnotationPlugin: Plugin<'line'> = {
  id: 'thresholdAnnotation',
  afterDatasetsDraw(chart) {
    // Cast directo al tipo de nuestro plugin: sabemos que las opciones
    // siguen la forma declarada arriba. Esto evita fricciones con
    // los genéricos de PluginOptionsByType de Chart.js v4.
    const opts = (chart.options.plugins as unknown as {
      thresholdAnnotation?: { lines: ThresholdLine[] };
    }).thresholdAnnotation;
    if (!opts || !opts.lines || opts.lines.length === 0) return;

    const ctx: CanvasRenderingContext2D | null =
      (chart.ctx as unknown as CanvasRenderingContext2D | null) ?? null;
    const chartArea = chart.chartArea;
    const yScale = chart.scales.y;
    if (!ctx || !yScale || !chartArea) return;

    const lines = opts.lines;
    const top = chartArea.top;
    const bottom = chartArea.bottom;
    const left = chartArea.left;
    const right = chartArea.right;

    ctx.save();
    for (let i = 0; i < lines.length; i++) {
      const line: ThresholdLine = lines[i];
      const yPx: number = yScale.getPixelForValue(line.value);
      if (yPx < top || yPx > bottom) continue;

      const isCritico = line.variant === 'critico';
      ctx.beginPath();
      ctx.setLineDash(isCritico ? [6, 4] : [4, 4]);
      ctx.strokeStyle = line.color;
      ctx.lineWidth = isCritico ? 1.5 : 1;
      ctx.globalAlpha = isCritico ? 0.85 : 0.65;
      ctx.moveTo(left, yPx);
      ctx.lineTo(right, yPx);
      ctx.stroke();

      // Etiqueta al borde derecho
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = line.color;
      ctx.font = `${isCritico ? 'bold ' : ''}9px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'right';
      ctx.textBaseline = isCritico ? 'bottom' : 'top';
      const labelY: number = isCritico ? yPx - 2 : yPx + 2;
      ctx.fillText(line.label, right - 4, labelY);
    }
    ctx.restore();
  },
};

/** Helper para registrar el plugin una sola vez en el bundle. */
export const registerThresholdAnnotationPlugin = () => {
  try {
    Chart.register(thresholdAnnotationPlugin);
  } catch {
    /* already registered */
  }
};
