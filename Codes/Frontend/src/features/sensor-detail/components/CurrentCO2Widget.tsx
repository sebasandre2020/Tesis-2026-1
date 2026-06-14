// src/features/sensor-detail/components/CurrentCO2Widget.tsx
// Componente PRESENTACIONAL — Widget de nivel actual de CO₂.

import React from 'react';
import { formatPPM } from '../../../utils/formatters';

interface CurrentCO2WidgetProps {
  currentLevel: number;
  currentStatus: string;
}

const CurrentCO2Widget: React.FC<CurrentCO2WidgetProps> = ({ currentLevel, currentStatus }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold">Nivel Actual de CO₂</h3>
      <p className="text-3xl font-bold text-blue-500 mt-2">{formatPPM(currentLevel)}</p>
      <p className="text-sm text-gray-600 mt-1">Estado: {currentStatus}</p>
    </div>
  );
};

export default CurrentCO2Widget;
