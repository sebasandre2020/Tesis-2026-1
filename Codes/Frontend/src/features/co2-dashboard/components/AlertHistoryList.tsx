// src/features/co2-dashboard/components/AlertHistoryList.tsx
// Componente PRESENTACIONAL — Muestra el historial de alertas pasadas.

import React from 'react';
import { AlertHistoryEntry } from '../../../types/sensor.types';

interface AlertHistoryListProps {
  history: AlertHistoryEntry[];
}

const AlertHistoryList: React.FC<AlertHistoryListProps> = ({ history }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full">
      <h2 className="text-xl font-semibold mb-4">Historial de Alertas</h2>
      <ul className="space-y-2">
        {history.map((entry, index) => (
          <li key={index} className="flex justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 shadow-sm">
            <span className="text-sm font-medium text-gray-600">{entry.time}</span>
            <span className="text-sm font-bold text-gray-800">{entry.level}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AlertHistoryList;
