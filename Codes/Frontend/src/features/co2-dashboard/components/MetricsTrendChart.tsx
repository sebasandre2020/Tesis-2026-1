// src/features/co2-dashboard/components/MetricsTrendChart.tsx
// Componente PRESENTACIONAL — Gráfica comparativa de métricas entre los
// nodos, con tabs de métrica y líneas de umbral (dashed) por métrica.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData, MetricType, TimeRange } from '../../../types/sensor.types';
import { METRIC_META, getTimeRangeLabel } from '../../../utils/formatters';
import { THRESHOLD_LINES } from '../../../utils/chartThresholds';
import MetricTabs from '../../../components/MetricTabs';

interface MetricsTrendChartProps {
  data: ChartData;
  metric: MetricType;
  onMetricChange: (m: MetricType) => void;
  timeRange: TimeRange;
  loading?: boolean;
}

const hasData = (data: ChartData) =>
  data.datasets.length > 0 && data.datasets.some(d => d.data.some(v => v !== null && v !== undefined));

const MetricsTrendChart: React.FC<MetricsTrendChartProps> = ({
  data,
  metric,
  onMetricChange,
  timeRange,
  loading = false,
}) => {
  const meta = METRIC_META[metric];
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null }; dataset: { label?: string } }) =>
            ctx.parsed.y === null
              ? `${ctx.dataset.label ?? ''}: sin datos`
              : `${ctx.dataset.label ?? ''}: ${ctx.parsed.y.toFixed(meta.decimals)} ${meta.unit}`,
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

  return (
    <div
      id={`dashboard-chart-panel-${metric}`}
      role="tabpanel"
      aria-label={`Gráfica comparativa de ${meta.label}`}
      className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full flex flex-col"
    >
      <h2 className="text-xl font-semibold mb-2 flex-shrink-0">
        Tendencias de {meta.label} — {getTimeRangeLabel(timeRange)}
      </h2>

      <MetricTabs value={metric} onChange={onMetricChange} className="mb-3 flex-shrink-0" />

      <div className="relative flex-1 min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        )}
        {!loading && !hasData(data) ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-gray-500 font-medium">Sin lecturas de {meta.label.toLowerCase()} en este período.</p>
            <p className="text-sm text-gray-400 mt-1">
              Aún no se han recibido lecturas para esta métrica en el rango seleccionado.
            </p>
          </div>
        ) : (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        )}
      </div>
    </div>
  );
};

export default MetricsTrendChart;
