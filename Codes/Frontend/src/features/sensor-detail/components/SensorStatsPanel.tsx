// src/features/sensor-detail/components/SensorStatsPanel.tsx
// Componente PRESENTACIONAL — Estadísticas clave de un sensor individual.

import React from 'react';
import { FaChartLine, FaArrowUp, FaClock, FaBell } from 'react-icons/fa';
import { SystemStats } from '../../../types/sensor.types';
import { formatPPM, formatHours } from '../../../utils/formatters';

interface SensorStatsPanelProps {
  stats: SystemStats;
}

const SensorStatsPanel: React.FC<SensorStatsPanelProps> = ({ stats }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex-1">
      <h3 className="text-lg font-semibold mb-4">Estadísticas Clave</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center">
          <FaChartLine className="text-blue-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-500">Promedio CO₂</p>
            <p className="text-lg font-bold">{formatPPM(stats.averageCO2)}</p>
          </div>
        </div>
        <div className="flex items-center">
          <FaArrowUp className="text-red-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-500">Máximo CO₂</p>
            <p className="text-lg font-bold">{formatPPM(stats.maxCO2)}</p>
          </div>
        </div>
        <div className="flex items-center">
          <FaClock className="text-yellow-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-500">Tiempo en Alerta</p>
            <p className="text-lg font-bold">{formatHours(stats.alertTimeHours)}</p>
          </div>
        </div>
        <div className="flex items-center">
          <FaBell className="text-green-500 mr-2" size={20} />
          <div>
            <p className="text-sm text-gray-500">Alertas Generadas</p>
            <p className="text-lg font-bold">{stats.totalAlerts}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorStatsPanel;
