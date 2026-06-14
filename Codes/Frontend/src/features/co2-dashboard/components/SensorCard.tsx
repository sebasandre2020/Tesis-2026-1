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
      <div className="shadow-md p-4 rounded-lg border border-gray-200 bg-white h-full hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
        <h3 className="font-bold text-lg">{sensor.name}</h3>
        <p className="text-gray-600">
          Nivel de CO₂:{' '}
          <span className={`font-semibold ${getStatusColor(sensor.status)}`}>
            {formatPPM(sensor.currentLevel)}
          </span>
        </p>
        <p className="text-gray-600">Última actualización: {sensor.lastUpdate}</p>
      </div>
    </Link>
  );
};

export default SensorCard;
