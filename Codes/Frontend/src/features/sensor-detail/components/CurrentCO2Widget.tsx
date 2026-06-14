// src/features/sensor-detail/components/CurrentCO2Widget.tsx
// Componente PRESENTACIONAL — Widget de nivel actual de CO₂.

import React from 'react';
import { formatPPM, getStatusBgColor, getStatusColor } from '../../../utils/formatters';
import { CO2Status } from '../../../types/sensor.types';

interface CurrentCO2WidgetProps {
  currentLevel: number;
  currentStatus: string;
}

const CurrentCO2Widget: React.FC<CurrentCO2WidgetProps> = ({ currentLevel, currentStatus }) => {
  const status = (currentStatus as CO2Status) ?? 'Normal';
  return (
    <div className={`p-4 rounded-lg shadow-md border ${getStatusBgColor(status)} flex flex-col items-center justify-center`}>
      <h3 className="text-sm font-semibold text-gray-700">Nivel Actual de CO₂</h3>
      <p className={`text-3xl font-bold mt-1 ${getStatusColor(status)}`}>
        {formatPPM(currentLevel)}
      </p>
      <p className="text-xs text-gray-600 mt-1">Estado: <span className="font-semibold">{currentStatus}</span></p>
    </div>
  );
};

export default CurrentCO2Widget;
