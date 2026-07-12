// src/features/co2-dashboard/containers/DashboardContainer.tsx
import React, { useEffect, useState } from 'react';
import { TbLayoutGrid, TbBolt } from 'react-icons/tb';
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

import { useAppContext } from '../../../store/AppContext';

interface DashboardData {
  alerts: Alert[];
  history: AlertHistoryEntry[];
  stats: SystemStats;
  chartData: ChartData;
}

const EMPTY: DashboardData = {
  alerts: [],
  history: [],
  stats: { averageCO2: 0, maxCO2: 0, alertTimeHours: 0, totalAlerts: 0 },
  chartData: { labels: [], datasets: [] },
};

const DashboardContainer: React.FC = () => {
  const { sensors, loadingSensors, refreshSensors } = useAppContext();
  const { timeRange, setTimeRange } = useTimeRange('month');
  const [metric, setMetric] = useState<MetricType>('co2');
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('');
  const [appliedCustomTo, setAppliedCustomTo] = useState('');

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

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchActiveAlerts(),
      fetchAlertHistory(),
      fetchStats(),
    ])
      .then(([alerts, history, stats]) => {
        if (cancelled) return;
        setData(prev => ({ ...prev, alerts, history, stats }));
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-y-auto">
        <header className="px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-utec-black tracking-tight flex items-center">
              <TbLayoutGrid className="mr-2 text-utec-cyan" /> Centro de Control de Calidad de Aire
            </h1>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mt-1">
              Monitoreo en Tiempo Real · Universidad de Ingeniería y Tecnología
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-green-600 uppercase flex items-center">
                <TbBolt className="mr-1" /> Sistema Activo
              </span>
              <span className="text-[9px] text-gray-400 font-mono">ID: UTEC-AQ-01</span>
            </div>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-in fade-in slide-in-from-left-4 duration-300">
              <p className="text-sm text-red-700 font-medium" role="alert">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 h-full">
                {(loading || loadingSensors) && sensors.length === 0 ? (
                  [0, 1, 2].map(i => (
                    <div key={i} className="h-[220px] bg-white border border-gray-100 rounded-xl animate-pulse" />
                  ))
                ) : sensors.length === 0 ? (
                  <div className="col-span-full card-refined p-8 flex items-center justify-center text-gray-400 font-medium italic">
                    No se detectaron nodos activos en la red.
                  </div>
                ) : (
                  sensors.map(sensor => (
                    <SensorCard key={sensor.id} sensor={sensor} />
                  ))
                )}
              </div>
            </div>
            <div className="lg:col-span-1 min-h-[180px]">
              <TimeRangeFilter
                timeRange={timeRange}
                onTimeRangeChange={(v) => setTimeRange(v)}
                customFrom={customFrom}
                customTo={customTo}
                onCustomFromChange={(v) => setCustomFrom(v)}
                onCustomToChange={(v) => setCustomTo(v)}
                onApplyCustomRange={(from, to) => {
                  setAppliedCustomFrom(from);
                  setAppliedCustomTo(to);
                }}
              />
            </div>
          </div>

          <div className="min-h-[480px]">
            <MetricsTrendChart
              data={data.chartData}
              metric={metric}
              onMetricChange={setMetric}
              timeRange={timeRange}
              loading={loading && data.chartData.datasets.length === 0}
              customRangeLabel={timeRange === 'custom' ? getCustomTimeRangeLabel(appliedCustomFrom, appliedCustomTo) : undefined}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatisticsPanel stats={data.stats} />
            <AlertHistoryList history={data.history} />
            <AlertList alerts={data.alerts} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardContainer;
