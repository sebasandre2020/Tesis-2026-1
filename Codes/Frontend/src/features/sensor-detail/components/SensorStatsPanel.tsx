// src/features/sensor-detail/components/SensorStatsPanel.tsx
import React from 'react';
import { TbAlertCircle, TbWind, TbChartBar } from 'react-icons/tb';
import { SystemStats } from '../../../types/sensor.types';
import { formatHours } from '../../../utils/formatters';
import { CO2_ALERT_THRESHOLD } from '../../../services/api';

interface SensorStatsPanelProps {
  stats: SystemStats;
}

const SensorStatsPanel: React.FC<SensorStatsPanelProps> = ({ stats }) => {
  return (
    <div className="card-refined p-5">
      <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
        <TbChartBar className="mr-2" /> Métricas del Nodo
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Promedio CO₂</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-lg font-bold font-mono ${stats.averageCO2 > CO2_ALERT_THRESHOLD ? 'text-red-600' : 'text-green-600'}`}>
              {stats.averageCO2}
            </span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">ppm</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Nivel Máximo</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-lg font-bold font-mono ${stats.maxCO2 > CO2_ALERT_THRESHOLD ? 'text-red-600' : 'text-green-600'}`}>
              {stats.maxCO2}
            </span>
            <span className="text-[8px] text-gray-400 font-bold uppercase">ppm</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Ciclo Extracción</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TbWind className={stats.alertTimeHours > 0 ? 'text-utec-cyan' : 'text-gray-300'} size={14} />
            <span className="text-lg font-bold font-mono text-utec-black">{formatHours(stats.alertTimeHours)}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Alertas Generadas</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TbAlertCircle className={stats.totalAlerts > 0 ? 'text-red-500' : 'text-gray-300'} size={14} />
            <span className="text-lg font-bold font-mono text-utec-black">{stats.totalAlerts}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorStatsPanel;
