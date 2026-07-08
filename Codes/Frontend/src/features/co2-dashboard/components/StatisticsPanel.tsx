// src/features/co2-dashboard/components/StatisticsPanel.tsx
import React from 'react';
import { TbAlertCircle, TbWind, TbActivity } from 'react-icons/tb';
import { SystemStats } from '../../../types/sensor.types';
import { formatHours } from '../../../utils/formatters';
import { CO2_ALERT_THRESHOLD } from '../../../services/api';

interface StatisticsPanelProps {
  stats: SystemStats;
}

const StatisticsPanel: React.FC<StatisticsPanelProps> = ({ stats }) => {
  // Threshold-based colors for overview
  const co2Color = stats.averageCO2 > CO2_ALERT_THRESHOLD ? 'text-red-600' : 'text-green-600';
  const maxColor = stats.maxCO2 > CO2_ALERT_THRESHOLD ? 'text-red-600' : 'text-green-600';
  const fanColor = stats.alertTimeHours > 0 ? 'text-utec-cyan' : 'text-gray-400';

  return (
    <div className="card-refined p-5 h-full">
      <h2 className="text-sm font-bold text-utec-black uppercase tracking-wider mb-6 flex items-center">
        <TbActivity className="mr-2 text-utec-cyan" /> Resumen de Red
      </h2>
      
      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
        <div className="flex flex-col">
          <p className="stat-label">Promedio CO₂</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`stat-value ${co2Color}`}>{stats.averageCO2}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">ppm</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="stat-label">Pico CO₂</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`stat-value ${maxColor}`}>{stats.maxCO2}</span>
            <span className="text-[10px] text-gray-400 font-bold uppercase">ppm</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="stat-label">Extracción Activa</p>
          <div className="flex items-center gap-2 mt-1">
            <TbWind className={`${fanColor} ${stats.alertTimeHours > 0 ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <span className="stat-value text-utec-black">{formatHours(stats.alertTimeHours)}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <p className="stat-label">Alertas Totales</p>
          <div className="flex items-center gap-2 mt-1">
            <TbAlertCircle className={stats.totalAlerts > 0 ? 'text-red-500' : 'text-gray-300'} />
            <span className="stat-value text-utec-black">{stats.totalAlerts}</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-gray-50">
        <p className="text-[9px] text-gray-400 leading-relaxed font-medium">
          * Los ventiladores de extracción se activan automáticamente al superar los 500 ppm para garantizar la renovación de aire.
        </p>
      </div>
    </div>
  );
};

export default StatisticsPanel;
