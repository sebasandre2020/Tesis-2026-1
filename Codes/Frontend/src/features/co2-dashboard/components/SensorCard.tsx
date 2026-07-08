// src/features/co2-dashboard/components/SensorCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { TbChevronRight } from 'react-icons/tb';
import { Sensor } from '../../../types/sensor.types';
import {
  getStatusColor,
  getMetricStatus,
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
      <div className="card-refined p-5 h-full flex flex-col group relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-utec-black group-hover:text-utec-cyan transition-colors">
              {sensor.name || 'Nodo sin nombre'}
            </h3>
            <p className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold">
              {sensor.location || 'Ubicación desconocida'}
            </p>
          </div>
          <TbChevronRight className="text-gray-300 group-hover:text-utec-cyan group-hover:translate-x-1 transition-all" size={20} />
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Concentración CO₂</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono ${getStatusColor(sensor.status)}`}>
              {sensor.currentLevel ?? 0}
            </span>
            <span className="text-xs text-gray-500 font-medium">ppm</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-50">
          {snapshots.map(({ metric, label, valueKey, statusKey }) => {
            const value = sensor[valueKey] as number | null | undefined;
            const status = (sensor[statusKey] as string | undefined) ?? getMetricStatus(metric, value);
            return (
              <div key={metric}>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">{label}</p>
                <p className={`text-xs font-bold font-mono ${getStatusColor(status as any)}`}>
                  {value !== null && value !== undefined ? value.toFixed(metric === 'dust' ? 0 : 1) : '—'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between text-[9px]">
          <span className="flex items-center text-gray-400">
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sensor.status === 'Normal' ? 'bg-green-500' : 'bg-red-500'}`} />
            Sincronizado
          </span>
          <span className="text-gray-400 italic">{sensor.lastUpdate || '—'}</span>
        </div>
      </div>
    </Link>
  );
};

export default SensorCard;
