// src/features/co2-dashboard/containers/DashboardContainer.tsx
// Componente CONTENEDOR (Smart) — Gestiona la lógica de negocio y el estado.
// Se comunica con la capa de servicios y pasa datos a componentes presentacionales.

import React from 'react';
import Sidebar from '../../../components/Sidebar';
import SensorCard from '../components/SensorCard';
import CO2TrendChart from '../components/CO2TrendChart';
import StatisticsPanel from '../components/StatisticsPanel';
import AlertHistoryList from '../components/AlertHistoryList';
import AlertList from '../components/AlertList';
import TimeRangeFilter from '../components/TimeRangeFilter';
import { useTimeRange } from '../../../hooks/useTimeRange';
import { fetchSensors, fetchActiveAlerts, fetchAlertHistory, fetchStats, fetchChartData } from '../../../services/api';
import { Sensor, Alert, AlertHistoryEntry, SystemStats, ChartData } from '../../../types/sensor.types';

const HEIGHT_SUPERIOR = '12%';
const HEIGHT_INTERMEDIO = '55%';
const HEIGHT_INFERIOR = '30%';

const DashboardContainer: React.FC = () => {
  const { timeRange, setTimeRange } = useTimeRange('24h');

  // En el futuro, estos datos vendrán de la API con useEffect + useState.
  // Por ahora se usan las funciones del servicio de forma síncrona (datos dummy).
  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [history, setHistory] = React.useState<AlertHistoryEntry[]>([]);
  const [stats, setStats] = React.useState<SystemStats>({ averageCO2: 0, maxCO2: 0, alertTimeHours: 0, totalAlerts: 0 });
  const [chartData, setChartData] = React.useState<ChartData>({ labels: [], datasets: [] });

  React.useEffect(() => {
    const loadData = async () => {
      const [sensorsData, alertsData, historyData, statsData, chart] = await Promise.all([
        fetchSensors(),
        fetchActiveAlerts(),
        fetchAlertHistory(),
        fetchStats(),
        fetchChartData(timeRange),
      ]);
      setSensors(sensorsData);
      setAlerts(alertsData);
      setHistory(historyData);
      setStats(statsData);
      setChartData(chart);
    };
    loadData();
  }, [timeRange]);

  return (
    <div className="dashboard flex overflow-auto h-screen">
      {/* Menú Lateral */}
      <Sidebar />

      {/* Contenedor Principal */}
      <div className="ml-64 p-6 w-full bg-gray-100 flex flex-col gap-4">
        
        {/* Título del Dashboard */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 text-center">
          <h1 className="text-2xl font-bold">Dashboard de Monitoreo de CO₂</h1>
        </div>
        
        {/* Nivel Superior: Cards de Sensores y Filtros */}
        <div className="flex gap-4" style={{ height: HEIGHT_SUPERIOR }}>
          <div className="flex-1">
            <div className="sensor-overview grid grid-cols-3 gap-4 h-full">
              {sensors.map((sensor) => (
                <SensorCard key={sensor.id} sensor={sensor} />
              ))}
            </div>
          </div>
          <div className="w-1/4">
            <TimeRangeFilter timeRange={timeRange} onTimeRangeChange={setTimeRange} />
          </div>
        </div>

        {/* Nivel Intermedio: Gráfica Comparativa */}
        <div style={{ height: HEIGHT_INTERMEDIO }}>
          <CO2TrendChart data={chartData} timeRange={timeRange} />
        </div>

        {/* Nivel Inferior: Estadísticas, Historial y Alertas Activas */}
        <div className="flex gap-4" style={{ height: HEIGHT_INFERIOR }}>
          <div className="flex-1">
            <StatisticsPanel stats={stats} />
          </div>
          <div className="flex-1">
            <AlertHistoryList history={history} />
          </div>
          <div className="flex-1">
            <AlertList alerts={alerts} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContainer;
