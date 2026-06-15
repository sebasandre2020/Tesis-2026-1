// src/features/sensor-detail/components/SensorReadingsChart.tsx
// Componente PRESENTACIONAL — Gráfica de lecturas recientes de un sensor con
// tabs de métrica + líneas de umbral (dashed) por métrica.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData, MetricType, TimeRange } from '../../../types/sensor.types';
import { METRIC_META, getTimeRangeLabel } from '../../../utils/formatters';
import { THRESHOLD_LINES } from '../../../utils/chartThresholds';
import MetricTabs from '../../../components/MetricTabs';

interface SensorReadingsChartProps {
  data: ChartData;
  metric: MetricType;
  onMetricChange: (m: MetricType) => void;
  timeRange?: TimeRange;
  loading?: boolean;
  /** Cuando hay un rango con datos sugerido (ej. "7d"), lo mostramos como acción. */
  suggestedRange?: TimeRange;
  /** Callback al click en el botón de rango sugerido. */
  onSuggestedRangeClick?: () => void;
}

const hasData = (data: ChartData) =>
  data.datasets.length > 0 && data.datasets.some(d => d.data.length > 0);

const SensorReadingsChart: React.FC<SensorReadingsChartProps> = ({
  data,
  metric,
  onMetricChange,
  timeRange,
  loading = false,
  suggestedRange,
  onSuggestedRangeClick,
}) => {
  const meta = METRIC_META[metric];
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            ctx.parsed.y === null ? 'Sin datos' : `${ctx.parsed.y.toFixed(meta.decimals)} ${meta.unit}`,
        },
      },
      thresholdAnnotation: {
        lines: THRESHOLD_LINES[metric],
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: { display: true, text: `${meta.label} (${meta.shortUnit})` },
      },
    },
  };

  const title = timeRange
    ? `Lecturas — ${getTimeRangeLabel(timeRange)}`
    : 'Lecturas Recientes';

  return (
    <div
      id={`chart-panel-${metric}`}
      role="tabpanel"
      aria-label={`Gráfica de ${meta.label}`}
      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full flex flex-col"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <MetricTabs value={metric} onChange={onMetricChange} className="mb-2" />

      <div className="relative flex-1 min-h-[280px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <p className="text-gray-500">Cargando lecturas...</p>
          </div>
        )}
        {!loading && !hasData(data) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-gray-500 font-medium">Sin lecturas de {meta.label.toLowerCase()} en este período.</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              El sensor no tiene datos para esta métrica en el rango seleccionado.
              {suggestedRange && onSuggestedRangeClick && (
                <> Prueba ampliando el rango de tiempo.</>
              )}
            </p>
            {suggestedRange && onSuggestedRangeClick && (
              <button
                type="button"
                onClick={onSuggestedRangeClick}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded transition-colors"
              >
                Ver {getTimeRangeLabel(suggestedRange).toLowerCase()}
              </button>
            )}
          </div>
        ) : (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default SensorReadingsChart;
