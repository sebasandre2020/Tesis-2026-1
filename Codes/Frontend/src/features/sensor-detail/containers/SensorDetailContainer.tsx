// src/features/sensor-detail/containers/SensorDetailContainer.tsx
// Componente CONTENEDOR (Smart) — Datos del sensor desde la API + tab de métrica
// para la gráfica. La métrica principal (CO₂) sigue siendo la base de las
// alertas y el "snapshot" actual; Polvo / Temperatura / Humedad se exponen
// en el widget de lecturas actuales y como pestañas de la gráfica.

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaExclamationTriangle, FaInfoCircle, FaSyncAlt } from 'react-icons/fa';
import Sidebar from '../../../components/Sidebar';
import SensorReadingsChart from '../components/SensorReadingsChart';
import SensorStatsPanel from '../components/SensorStatsPanel';
import CurrentReadingsWidget from '../components/CurrentReadingsWidget';
import {
  fetchSensorDetail,
  fetchSensorDetailChart,
  SENSOR_ID_TO_NODE,
} from '../../../services/api';
import { SensorDetailData, ChartData, TimeRange, MetricType } from '../../../types/sensor.types';
import { getTimeRangeLabel } from '../../../utils/formatters';

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '1h', label: 'Última hora' },
  { value: '3h', label: 'Últimas 3 horas' },
  { value: '12h', label: 'Últimas 12 horas' },
  { value: '24h', label: 'Últimas 24 horas' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: 'june', label: 'Todo Junio' },
];

const parseSensorId = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || !SENSOR_ID_TO_NODE[n]) return null;
  return n;
};

const SensorDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sensorId = parseSensorId(id);

  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [metric, setMetric] = useState<MetricType>('co2');
  const [sensorData, setSensorData] = useState<SensorDetailData | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sensorId === null) {
      setError('ID de sensor inválido. Use 1, 2 o 3.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchSensorDetail(sensorId)
      .then(data => {
        if (cancelled) return;
        if (!data) {
          setError('No se pudieron obtener datos del sensor. Verifica la conexión con la API.');
          setSensorData(null);
        } else {
          setSensorData(data);
        }
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setError('Error inesperado al cargar el sensor.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sensorId]);

  useEffect(() => {
    if (sensorId === null) return;

    let cancelled = false;
    setChartLoading(true);
    setChartData({ labels: [], datasets: [] });

    fetchSensorDetailChart(sensorId, timeRange, metric)
      .then(chart => {
        if (!cancelled) setChartData(chart);
      })
      .catch(err => {
        if (!cancelled) console.error(err);
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sensorId, timeRange, metric]);

  if (sensorId === null) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="p-6 bg-gray-100 flex-1 flex items-center justify-center ml-64">
          <p className="text-gray-500 text-lg">Nodo no encontrado.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="p-6 bg-gray-100 flex-1 flex items-center justify-center ml-64">
          <p className="text-gray-500 text-lg">Cargando datos del sensor...</p>
        </div>
      </div>
    );
  }

  if (error || !sensorData) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="p-6 bg-gray-100 flex-1 flex items-center justify-center ml-64">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center max-w-md">
            <FaExclamationTriangle className="text-red-500 mx-auto mb-3" size={32} />
            <h2 className="text-xl font-bold mb-2">No se pudo cargar el sensor</h2>
            <p className="text-gray-600 mb-4">{error ?? 'Datos no disponibles.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <FaSyncAlt /> Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="p-6 bg-gray-100 flex-1 flex flex-col gap-4 ml-64 overflow-y-auto">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold">{sensorData.sensorName}</h2>
          <p className="text-gray-600">Ubicación: {sensorData.location}</p>
        </div>

        {sensorData.hasPartialReadings && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 flex items-start gap-2">
            <FaInfoCircle className="mt-0.5 flex-shrink-0" />
            <span>
              Algunas lecturas anteriores a la migración aún no incluyen los 3 sensores nuevos.
              Esos puntos se omiten automáticamente en la gráfica cuando es posible.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-2 min-h-[420px] flex-shrink-0">
            <SensorReadingsChart
              data={chartData}
              metric={metric}
              onMetricChange={setMetric}
              timeRange={timeRange}
              loading={chartLoading}
              suggestedRange="7d"
              onSuggestedRangeClick={() => setTimeRange('7d')}
            />
          </div>

          <div className="flex flex-col gap-4 min-h-[420px]">
            <CurrentReadingsWidget
              co2={sensorData.currentLevel}
              co2Status={sensorData.currentStatus}
              dust={sensorData.currentDust}
              dustStatus={sensorData.currentDustStatus}
              temperature={sensorData.currentTemperature}
              temperatureStatus={sensorData.currentTemperatureStatus}
              humidity={sensorData.currentHumidity}
              humidityStatus={sensorData.currentHumidityStatus}
            />
            <SensorStatsPanel stats={sensorData.stats} />
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <h3 className="text-sm font-semibold mb-2">Filtrar por Período</h3>
              <select
                className="w-full p-2 border rounded text-sm"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              >
                {TIME_RANGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-500 mt-1.5">
                Mostrando: {getTimeRangeLabel(timeRange)}
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Historial de Alertas (CO₂)</h3>
            {sensorData.alertHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay alertas registradas para este sensor.</p>
            ) : (
              <ul className="space-y-2">
                {sensorData.alertHistory.map((alert, index) => (
                  <li
                    key={`${alert.time}-${index}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 shadow-sm"
                  >
                    <div className="flex items-center">
                      <FaExclamationTriangle className="text-red-500 mr-3" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Hora: {alert.time}</p>
                        <p className="text-lg font-bold text-red-600">{alert.level} ppm</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorDetailContainer;
