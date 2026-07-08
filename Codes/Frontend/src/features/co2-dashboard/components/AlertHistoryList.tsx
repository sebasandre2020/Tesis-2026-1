// src/features/co2-dashboard/components/AlertHistoryList.tsx
import React from 'react';
import { TbHistory, TbSearch } from 'react-icons/tb';
import { AlertHistoryEntry } from '../../../types/sensor.types';

interface AlertHistoryListProps {
  history: AlertHistoryEntry[];
}

const AlertHistoryList: React.FC<AlertHistoryListProps> = ({ history }) => {
  return (
    <div className="card-refined p-5 h-full flex flex-col">
      <h2 className="text-sm font-bold text-utec-black uppercase tracking-wider mb-4 flex items-center">
        <TbHistory className="mr-2 text-utec-cyan" /> Historial Reciente
      </h2>
      
      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
          <TbSearch size={28} className="text-gray-400 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sin Eventos</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1">
            {history.map((entry, index) => (
              <div
                key={`${entry.time}-${index}`}
                className="flex justify-between items-center py-2 px-1 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono leading-none">{entry.time}</span>
                <span className="text-xs font-bold text-red-600 font-mono leading-none">{entry.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
        <button className="text-[10px] font-bold text-utec-cyan uppercase tracking-widest hover:underline focus:outline-none">
          Ver Log Completo
        </button>
      </div>
    </div>
  );
};

export default AlertHistoryList;
