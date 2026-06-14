// src/features/co2-dashboard/components/AlertList.tsx
// Componente PRESENTACIONAL — Muestra las alertas activas del sistema.

import React from 'react';
import { Alert } from '../../../types/sensor.types';

interface AlertListProps {
  alerts: Alert[];
}

const AlertList: React.FC<AlertListProps> = ({ alerts }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full">
      <h2 className="text-xl font-semibold mb-4">Alertas Activas</h2>
      <ul className="space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex items-center justify-between p-2 rounded-lg bg-red-50 border border-red-200 shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <div>
                <p className="text-sm font-semibold">{alert.location}</p>
                <p className="text-sm text-gray-500">{alert.level}</p>
              </div>
              <span className={`text-sm font-bold ${alert.status === 'Crítico' ? 'text-red-600' : 'text-orange-500'}`}>
                {alert.status}
              </span>
            </div>
            <div className="flex space-x-2">
              <button className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">Reconocer</button>
              <button className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Silenciar</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertList;
