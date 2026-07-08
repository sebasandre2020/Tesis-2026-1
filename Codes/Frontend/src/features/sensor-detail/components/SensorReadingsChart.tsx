// src/features/sensor-detail/components/SensorReadingsChart.tsx
import React from 'react';
import { Chart } from 'primereact/chart';
import { TbChartLine, TbCalendarStats } from 'react-icons/tb';
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
  suggestedRange?: TimeRange;
  onSuggestedRangeClick?: () => void;
  customRangeLabel?: string;
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
  customRangeLabel,
}) => {
  const meta = METRIC_META[metric];
  
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => 
            ctx.parsed.y === null ? 'Sin datos' : `${ctx.dataset.label ?? meta.label}: ${ctx.parsed.y.toFixed(meta.decimals)} ${meta.unit}`,
        },
      },
      thresholdAnnotation: {
        lines: THRESHOLD_LINES[metric],
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: { color: '#f1f5f9' },
        ticks: { font: { family: 'IBM Plex Mono', size: 10 } },
        title: { display: true, text: `${meta.label} (${meta.shortUnit})`, font: { size: 10, weight: 'bold' } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'IBM Plex Mono', size: 10 } },
      },
    },
  };

  const label = customRangeLabel || (timeRange ? getTimeRangeLabel(timeRange) : 'Lecturas Recientes');

  return (
    <div className="card-refined p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-utec-black flex items-center">
            <TbChartLine className="mr-2 text-utec-cyan" /> Tendencia de {meta.label}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {label}
          </p>
        </div>
        <MetricTabs value={metric} onChange={onMetricChange} className="bg-gray-50 p-1 rounded-lg" />
      </div>

      <div className="relative flex-1 min-h-[300px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 backdrop-blur-[1px]">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-utec-cyan border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-[10px] font-bold text-utec-cyan uppercase tracking-widest">Sincronizando...</p>
            </div>
          </div>
        )}
        
        {hasData(data) ? (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        ) : !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <TbCalendarStats size={48} className="text-gray-200 mb-2" />
            <p className="text-gray-500 font-bold uppercase tracking-tighter">Sin Lecturas Disponibles</p>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">
              No se encontraron registros para {meta.label.toLowerCase()} en este período.
            </p>
            {suggestedRange && onSuggestedRangeClick && (
              <button
                type="button"
                onClick={onSuggestedRangeClick}
                className="mt-4 px-4 py-1.5 text-[10px] font-bold bg-utec-cyan text-white rounded uppercase tracking-widest hover:bg-utec-cyan/90 transition-colors"
              >
                Ver {getTimeRangeLabel(suggestedRange)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SensorReadingsChart;
