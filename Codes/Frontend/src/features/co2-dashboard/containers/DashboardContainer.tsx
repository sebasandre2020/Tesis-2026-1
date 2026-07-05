// src/features/co2-dashboard/containers/DashboardContainer.tsx
// Componente CONTENEDOR (Smart) — Carga los datos del dashboard y coordina
// la métrica seleccionada para la gráfica comparativa.

import React, { useEffect, useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import SensorCard from '../components/SensorCard';
import MetricsTrendChart from '../components/MetricsTrendChart';
import StatisticsPanel from '../components/StatisticsPanel';
import AlertHistoryList from '../components/AlertHistoryList';
import AlertList from '../components/AlertList';
import TimeRangeFilter from '../components/TimeRangeFilter';
import { useTimeRange } from '../../../hooks/useTimeRange';
import { toUtcIsoString, getCustomTimeRangeLabel } from '../../../utils/formatters';
import {
  fetchSensors,
  fetchActiveAlerts,
  fetchAlertHistory,
  fetchStats,
  fetchChartData,
} from '../../../services/api';
import {
  Sensor, Alert, AlertHistoryEntry, SystemStats, ChartData, MetricType,
} from '../../../types/sensor.types';

interface DashboardData {
  sensors: Sensor[];
  alerts: Alert[];
  history: AlertHistoryEntry[];
  stats: SystemStats;
  chartData: ChartData;
}

const EMPTY: DashboardData = {
  sensors: [],
  alerts: [],
  history: [],
  stats: { averageCO2: 0, maxCO2: 0, alertTimeHours: 0, totalAlerts: 0 },
  chartData: { labels: [], datasets: [] },
};

const DashboardContainer: React.FC = () => {
  const { timeRange, setTimeRange } = useTimeRange('24h');
  const [metric, setMetric] = useState<MetricType>('co2');
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('');
  const [appliedCustomTo, setAppliedCustomTo] = useState('');

  // Inicializa las fechas cuando el usuario cambia a rango personalizado
  useEffect(() => {
    if (timeRange === 'custom' && (!customFrom || !customTo)) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const toLocalISO = (d: Date) => {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      };
      const localFrom = toLocalISO(yesterday);
      const localTo = toLocalISO(now);
      setCustomFrom(localFrom);
      setCustomTo(localTo);
      setAppliedCustomFrom(localFrom);
      setAppliedCustomTo(localTo);
    }
  }, [timeRange]);

  // Sensores + alertas + stats no dependen de la métrica → cargan una sola vez.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchSensors(),
      fetchActiveAlerts(),
      fetchAlertHistory(),
      fetchStats(),
    ])
      .then(([sensors, alerts, history, stats]) => {
        if (cancelled) return;
        setData(prev => ({ ...prev, sensors, alerts, history, stats }));
        if (sensors.length === 0) {
          setError('No se pudieron obtener datos. Verifica la conexión con la API.');
        }
      })
      .catch(err => {
        if (cancelled) return;
        console.error(err);
        setError('Error al cargar los datos del dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // El chart comparativo depende de timeRange + métrica + fechas custom → recarga dedicada.
  useEffect(() => {
    let cancelled = false;
    if (timeRange === 'custom' && (!appliedCustomFrom || !appliedCustomTo)) {
      return;
    }

    const fromUtc = timeRange === 'custom' ? toUtcIsoString(appliedCustomFrom) : undefined;
    const toUtc = timeRange === 'custom' ? toUtcIsoString(appliedCustomTo) : undefined;

    fetchChartData(timeRange, metric, fromUtc, toUtc)
      .then(chartData => {
        if (!cancelled) setData(prev => ({ ...prev, chartData }));
      })
      .catch(err => {
        if (!cancelled) console.error(err);
      });
    return () => {
      cancelled = true;
    };
  }, [timeRange, metric, appliedCustomFrom, appliedCustomTo]);

  return (
    <div className="dashboard flex h-screen overflow-hidden">
      <Sidebar />

      <div className="ml-64 p-6 w-full bg-gray-100 flex flex-col gap-4 overflow-y-auto">
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
          <h1 className="text-2xl font-bold">Dashboard de Monitoreo de Calidad de Aire Interior</h1>
          {error && (
            <p className="text-sm text-red-600 mt-1" role="alert">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[200px]">
          <div className="lg:col-span-3 sensor-overview">
            {loading && data.sensors.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
                {[0, 1, 2].map(i => (
                  <div key={i} className="h-full bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse" />
                ))}
              </div>
            ) : data.sensors.length === 0 ? (
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 h-full flex items-center justify-center text-gray-500">
                No hay sensores registrados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 h-full">
                {data.sensors.map(sensor => (
                  <SensorCard key={sensor.id} sensor={sensor} />
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-1 h-fit">
            <TimeRangeFilter
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              customFrom={customFrom}
              customTo={customTo}
              onCustomFromChange={setCustomFrom}
              onCustomToChange={setCustomTo}
              onApplyCustomRange={(from, to) => {
                setAppliedCustomFrom(from);
                setAppliedCustomTo(to);
              }}
            />
          </div>
        </div>

        <div className="min-h-[460px] flex-shrink-0">
          <MetricsTrendChart
            data={data.chartData}
            metric={metric}
            onMetricChange={setMetric}
            timeRange={timeRange}
            loading={loading && data.chartData.datasets.length === 0}
            customRangeLabel={timeRange === 'custom' ? getCustomTimeRangeLabel(appliedCustomFrom, appliedCustomTo) : undefined}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatisticsPanel stats={data.stats} />
          <AlertHistoryList history={data.history} />
          <AlertList alerts={data.alerts} />
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
