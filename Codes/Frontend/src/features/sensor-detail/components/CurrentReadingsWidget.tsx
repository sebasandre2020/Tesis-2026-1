// src/features/sensor-detail/components/CurrentReadingsWidget.tsx
import React from 'react';
import { TbWind, TbDroplets, TbThermometer, TbChartDots } from 'react-icons/tb';
import { CO2Status } from '../../../types/sensor.types';
import { getStatusColor, getMetricStatus } from '../../../utils/formatters';

interface CurrentReadingsWidgetProps {
  co2: number;
  co2Status: string;
  dust: number | null;
  dustStatus: string;
  temperature: number | null;
  temperatureStatus: string;
  humidity: number | null;
  humidityStatus: string;
}

const toStatus = (s: string): CO2Status =>
  s === 'Crítico' || s === 'Elevado' || s === 'Normal' ? s : 'Normal';

const CurrentReadingsWidget: React.FC<CurrentReadingsWidgetProps> = ({
  co2,
  co2Status,
  dust,
  dustStatus,
  temperature,
  temperatureStatus,
  humidity,
  humidityStatus,
}) => {
  const readings = [
    { label: 'CO₂', value: co2, unit: 'ppm', status: toStatus(co2Status), icon: TbChartDots, color: 'text-utec-cyan', metric: 'co2' as const },
    { label: 'Polvo', value: dust, unit: 'µg/m³', status: toStatus(dustStatus), icon: TbWind, color: 'text-gray-600', metric: 'dust' as const },
    { label: 'Temperatura', value: temperature, unit: '°C', status: toStatus(temperatureStatus), icon: TbThermometer, color: 'text-red-500', metric: 'temperature' as const },
    { label: 'Humedad', value: humidity, unit: '%', status: toStatus(humidityStatus), icon: TbDroplets, color: 'text-blue-400', metric: 'humidity' as const },
  ];

  return (
    <div className="card-refined p-5">
      <h2 className="text-sm font-bold text-utec-black uppercase tracking-wider mb-6 flex items-center">
        <TbChartDots className="mr-2 text-utec-cyan" /> Lecturas Actuales
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        {readings.map((r, i) => {
          const status = r.status ?? getMetricStatus(r.metric, r.value);
          return (
            <div key={r.label} className="p-3 rounded-lg bg-gray-50/50 border border-gray-100 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <r.icon className={`${r.color} text-lg`} />
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  status === 'Normal' ? 'bg-green-100 text-green-700' : 
                  status === 'Elevado' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                }`}>
                  {status}
                </span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{r.label}</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className={`text-xl font-bold font-mono ${getStatusColor(status)}`}>
                    {r.value !== null && r.value !== undefined ? r.value.toFixed(i >= 2 ? 1 : 0) : '—'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">{r.unit}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CurrentReadingsWidget;
