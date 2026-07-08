// src/features/co2-dashboard/components/MetricsTrendChart.tsx
import React from 'react';
import { Chart } from 'primereact/chart';
import { TbChartArea, TbCalendarSearch } from 'react-icons/tb';
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
  customRangeLabel?: string;
}

const hasData = (data: ChartData) =>
  data.datasets.length > 0 && data.datasets.some(d => d.data.some(v => v !== null && v !== undefined));

const MetricsTrendChart: React.FC<MetricsTrendChartProps> = ({
  data,
  metric,
  onMetricChange,
  timeRange,
  loading = false,
  customRangeLabel,
}) => {
  const meta = METRIC_META[metric];
  
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { 
        display: true, 
        position: 'top' as const,
        labels: { font: { family: 'Manrope', size: 10, weight: 'bold' }, usePointStyle: true, boxWidth: 6 }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => 
            ctx.parsed.y === null 
              ? `${ctx.dataset.label}: sin datos` 
              : `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(meta.decimals)} ${meta.unit}`,
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

  return (
    <div className="card-refined p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-utec-black flex items-center">
            <TbChartArea className="mr-2 text-utec-cyan" /> Comparativa de Red
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
            {customRangeLabel || getTimeRangeLabel(timeRange)}
          </p>
        </div>
        <MetricTabs value={metric} onChange={onMetricChange} className="bg-gray-50 p-1 rounded-lg" />
      </div>

      <div className="relative flex-1 min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 backdrop-blur-[1px]">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-utec-cyan border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-[10px] font-bold text-utec-cyan uppercase tracking-widest">Analizando Datos...</p>
            </div>
          </div>
        )}
        
        {hasData(data) ? (
          <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
        ) : !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30">
            <TbCalendarSearch size={48} className="text-gray-200 mb-2" />
            <p className="text-sm font-bold uppercase tracking-widest">Sin Registros en el Período</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsTrendChart;
