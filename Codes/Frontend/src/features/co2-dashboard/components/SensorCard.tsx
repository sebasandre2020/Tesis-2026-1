// src/features/co2-dashboard/components/SensorCard.tsx
// Componente PRESENTACIONAL — Solo recibe datos y los renderiza.
// Sigue el patrón Container/Presentational del README.

import React from 'react';
import { Link } from 'react-router-dom';
import { Sensor } from '../../../types/sensor.types';
import { getStatusColor, formatPPM } from '../../../utils/formatters';

interface SensorCardProps {
  sensor: Sensor;
}

/**
 * Tarjeta individual de sensor. Clickeable para navegar al detalle.
 */
const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  return (
    <Link to={`/sensor/${sensor.id}`} className="block h-full">
      <div className="shadow-md p-4 rounded-lg border border-gray-200 bg-white h-full hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col">
        <h3 className="font-bold text-lg">{sensor.name || 'Sensor sin nombre'}</h3>
        <p className="text-gray-600 text-sm">{sensor.location || 'Ubicación desconocida'}</p>
        <p className="text-gray-600 mt-2">
          Nivel de CO₂:{' '}
          <span className={`font-semibold ${getStatusColor(sensor.status)}`}>
            {formatPPM(sensor.currentLevel ?? 0)}
          </span>
        </p>
        <p className="text-gray-500 text-xs mt-auto pt-2">
          Última actualización: {sensor.lastUpdate || '—'}
        </p>
      </div>
    </Link>
  );
};

export default SensorCard;
