// src/features/co2-dashboard/components/CO2TrendChart.tsx
// Componente PRESENTACIONAL — Gráfica comparativa de tendencias de CO₂.

import React from 'react';
import { Chart } from 'primereact/chart';
import { ChartData, TimeRange } from '../../../types/sensor.types';

interface CO2TrendChartProps {
  data: ChartData;
  timeRange: TimeRange;
}

const CO2TrendChart: React.FC<CO2TrendChartProps> = ({ data, timeRange }) => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
  };

  return (
    <div className="comparative-chart bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full">
      <h2 className="text-xl font-semibold mb-2">Tendencias de CO₂ en las Últimas {timeRange}</h2>
      <div className="h-full">
        <Chart type="line" data={data} options={options} style={{ height: '100%' }} />
      </div>
    </div>
  );
};

export default CO2TrendChart;
