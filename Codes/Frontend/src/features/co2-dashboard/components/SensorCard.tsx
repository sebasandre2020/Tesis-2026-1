// src/features/co2-dashboard/components/SensorCard.tsx
// Componente PRESENTACIONAL — Tarjeta de sensor con CO₂ como valor primario
// y mini-snapshots de las otras 3 métricas (Polvo / Temperatura / Humedad).

import React from 'react';
import { Link } from 'react-router-dom';
import { Sensor } from '../../../types/sensor.types';
import {
  getStatusColor,
  formatPPM,
  formatMetricValue,
  getMetricStatus,
  METRIC_META,
} from '../../../utils/formatters';

interface SensorCardProps {
  sensor: Sensor;
}

const snapshots: Array<{
  metric: 'dust' | 'temperature' | 'humidity';
  label: string;
  valueKey: 'dustLevel' | 'temperature' | 'humidity';
  statusKey: 'dustStatus' | 'temperatureStatus' | 'humidityStatus';
}> = [
  { metric: 'dust', label: 'Polvo', valueKey: 'dustLevel', statusKey: 'dustStatus' },
  { metric: 'temperature', label: 'Temp', valueKey: 'temperature', statusKey: 'temperatureStatus' },
  { metric: 'humidity', label: 'Humedad', valueKey: 'humidity', statusKey: 'humidityStatus' },
];

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  return (
    <Link to={`/sensor/${sensor.id}`} className="block h-full">
      <div className="shadow-md p-4 rounded-lg border border-gray-200 bg-white h-full hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col">
        <h3 className="font-bold text-lg">{sensor.name || 'Nodo sin nombre'}</h3>
        <p className="text-gray-600 text-xs">{sensor.location || 'Ubicación desconocida'}</p>

        <p className="text-gray-600 mt-2">
          Nivel de CO₂:{' '}
          <span className={`font-semibold ${getStatusColor(sensor.status)}`}>
            {formatPPM(sensor.currentLevel ?? 0)}
          </span>
        </p>

        <div className="mt-3 pt-2 border-t border-gray-100 space-y-1">
          {snapshots.map(({ metric, label, valueKey, statusKey }) => {
            const value = sensor[valueKey] as number | null | undefined;
            const status = (sensor[statusKey] as string | undefined) ?? getMetricStatus(metric, value);
            const meta = METRIC_META[metric];
            return (
              <p key={metric} className="text-xs text-gray-500 flex items-center">
                <span
                  className="inline-block w-2 h-2 rounded-full mr-1.5"
                  style={{ background: meta.color }}
                  aria-hidden
                />
                <span className="font-medium text-gray-700">{label}:</span>
                <span className={`ml-1 font-semibold ${getStatusColor(status as 'Normal' | 'Elevado' | 'Crítico')}`}>
                  {formatMetricValue(value, metric)}
                </span>
              </p>
            );
          })}
        </div>

        <p className="text-gray-400 text-[10px] mt-auto pt-2">
          Última actualización: {sensor.lastUpdate || '—'}
        </p>
      </div>
    </Link>
  );
};

export default SensorCard;
