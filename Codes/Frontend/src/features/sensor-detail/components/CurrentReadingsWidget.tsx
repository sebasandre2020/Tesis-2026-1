// src/features/sensor-detail/components/CurrentReadingsWidget.tsx
// Componente PRESENTACIONAL — 4 mini-readouts (CO₂ / Polvo / Temperatura / Humedad)
// con badge de estado derivado de umbrales.

import React from 'react';
import { CO2Status } from '../../../types/sensor.types';
import { METRIC_META, METRIC_ORDER, getStatusBgColor, getStatusColor, formatMetricValue, getMetricStatus } from '../../../utils/formatters';

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

const readouts: Array<{
  metric: typeof METRIC_ORDER[number];
  label: string;
  valueKey: 'co2' | 'dust' | 'temperature' | 'humidity';
  statusKey: 'co2Status' | 'dustStatus' | 'temperatureStatus' | 'humidityStatus';
  isPrimary: boolean;
}> = [
  { metric: 'co2', label: 'CO₂', valueKey: 'co2', statusKey: 'co2Status', isPrimary: true },
  { metric: 'dust', label: 'Polvo', valueKey: 'dust', statusKey: 'dustStatus', isPrimary: false },
  { metric: 'temperature', label: 'Temp', valueKey: 'temperature', statusKey: 'temperatureStatus', isPrimary: false },
  { metric: 'humidity', label: 'Humedad', valueKey: 'humidity', statusKey: 'humidityStatus', isPrimary: false },
];

const CurrentReadingsWidget: React.FC<CurrentReadingsWidgetProps> = ({
  co2, co2Status, dust, dustStatus, temperature, temperatureStatus, humidity, humidityStatus,
}) => {
  const values = { co2, dust, temperature, humidity };
  const statuses = { co2Status, dustStatus, temperatureStatus, humidityStatus };

  return (
    <div className="grid grid-cols-2 gap-3">
      {readouts.map(({ metric, label, valueKey, statusKey, isPrimary }) => {
        const meta = METRIC_META[metric];
        const value = values[valueKey];
        const status = toStatus(statuses[statusKey]) ?? getMetricStatus(metric, value);
        return (
          <div
            key={metric}
            className={`p-3 rounded-lg border flex flex-col items-center text-center ${
              isPrimary ? getStatusBgColor(toStatus(co2Status)) : getStatusBgColor(status)
            }`}
          >
            <div className="flex items-center gap-1.5 self-start mb-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: meta.color }}
                aria-hidden
              />
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
            </div>
            <p className={`text-xl font-bold ${getStatusColor(status)}`}>
              {formatMetricValue(value, metric)}
            </p>
            <p className={`text-[10px] font-semibold ${getStatusColor(status)}`}>{status}</p>
          </div>
        );
      })}
    </div>
  );
};

export default CurrentReadingsWidget;
