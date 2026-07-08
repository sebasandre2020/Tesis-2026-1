// src/features/co2-dashboard/components/AlertList.tsx
import React from 'react';
import { TbCheck, TbAlertTriangle } from 'react-icons/tb';
import { Alert } from '../../../types/sensor.types';

interface AlertListProps {
  alerts: Alert[];
}

const AlertList: React.FC<AlertListProps> = ({ alerts }) => {
  return (
    <div className="card-refined p-5 h-full flex flex-col">
      <h2 className="text-sm font-bold text-utec-black uppercase tracking-wider mb-4 flex items-center">
        <TbAlertTriangle className="mr-2 text-red-500" /> Alertas Activas
      </h2>
      
      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 grayscale">
          <TbCheck size={32} className="text-green-500 mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Sistema Seguro</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg border border-red-100 bg-red-50/30 flex flex-col gap-1"
            >
              <div className="flex justify-between items-start">
                <p className="text-xs font-bold text-utec-black uppercase tracking-tight">{alert.location}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  alert.status === 'Crítico' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {alert.status}
                </span>
              </div>
              <div className="flex justify-between items-end mt-1 font-mono">
                <p className="text-lg font-bold text-red-700 leading-none">{alert.level}</p>
                {alert.time && <p className="text-[10px] text-gray-400 font-semibold uppercase">{alert.time}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertList;
