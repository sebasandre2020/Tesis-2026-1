// src/features/sensor-detail/containers/SensorDetailContainer.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TbAlertTriangle, TbInfoCircle, TbReload, TbChevronLeft, TbCalendarSearch } from 'react-icons/tb';
import Sidebar from '../../../components/Sidebar';
import SensorReadingsChart from '../components/SensorReadingsChart';
import SensorStatsPanel from '../components/SensorStatsPanel';
import CurrentReadingsWidget from '../components/CurrentReadingsWidget';
import TimeRangeFilter from '../../co2-dashboard/components/TimeRangeFilter';
import {
  fetchSensorDetail,
  fetchSensorDetailChart,
  SENSOR_ID_TO_NODE,
} from '../../../services/api';
import { SensorDetailData, ChartData, TimeRange, MetricType } from '../../../types/sensor.types';
import { getTimeRangeLabel, toUtcIsoString, getCustomTimeRangeLabel } from '../../../utils/formatters';

const parseSensorId = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return n;
};

const SensorDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sensorId = parseSensorId(id);

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [metric, setMetric] = useState<MetricType>('co2');
  const [sensorData, setSensorData] = useState<SensorDetailData | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
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
    if (timeRange === 'custom' && (!appliedCustomFrom || !appliedCustomTo)) {
      return;
    }

    let cancelled = false;
    setChartLoading(true);
    setChartData({ labels: [], datasets: [] });

    const fromUtc = timeRange === 'custom' ? toUtcIsoString(appliedCustomFrom) : undefined;
    const toUtc = timeRange === 'custom' ? toUtcIsoString(appliedCustomTo) : undefined;

    fetchSensorDetailChart(sensorId, timeRange, metric, fromUtc, toUtc)
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
  }, [sensorId, timeRange, metric, appliedCustomFrom, appliedCustomTo]);

  if (sensorId === null) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center ml-64 p-8">
          <div className="text-center opacity-40">
            <TbAlertTriangle size={64} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-bold text-gray-500 uppercase tracking-widest">Nodo no encontrado</p>
            <Link to="/" className="mt-6 inline-block text-utec-cyan font-bold hover:underline">Volver al Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center ml-64">
          <div className="w-12 h-12 border-4 border-utec-cyan border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cargando Telemetría...</p>
        </div>
      </div>
    );
  }

  if (error || !sensorData) {
    return (
      <div className="flex h-screen bg-gray-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center ml-64 p-8">
          <div className="card-refined p-8 text-center max-w-md">
            <TbAlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold mb-2 text-utec-black uppercase tracking-tight">Error de Conexión</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">{error ?? 'Los datos del sensor no están disponibles en este momento.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-utec-cyan text-white rounded-lg font-bold uppercase tracking-widest hover:bg-utec-cyan/90 transition-all"
            >
              <TbReload /> Reintentar Sincronización
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col h-full overflow-y-auto">
        <header className="px-8 py-6 bg-white border-b border-gray-200 sticky top-0 z-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <TbChevronLeft size={24} className="text-gray-400" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-utec-black tracking-tight">{sensorData.sensorName}</h1>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ubicación: {sensorData.location}</p>
            </div>
          </div>
        </header>

        <div className="p-8 flex flex-col gap-6">
          {sensorData.hasPartialReadings && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg flex items-start gap-3 animate-in fade-in duration-300">
              <TbInfoCircle className="text-amber-500 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-sm text-amber-800 leading-relaxed font-medium">
                Sincronización parcial detectada. Algunas lecturas anteriores a la migración no incluyen datos de polvo o humedad.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SensorReadingsChart
                data={chartData}
                metric={metric}
                onMetricChange={setMetric}
                timeRange={timeRange}
                loading={chartLoading}
                suggestedRange="7d"
                onSuggestedRangeClick={() => setTimeRange('7d')}
                customRangeLabel={timeRange === 'custom' ? getCustomTimeRangeLabel(appliedCustomFrom, appliedCustomTo) : undefined}
              />
            </div>

            <div className="flex flex-col gap-6">
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
              
              <div className="card-refined p-5">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
                  <TbCalendarSearch className="mr-2" /> Historial de Alertas
                </h3>
                <div className="max-h-[250px] overflow-y-auto pr-1 font-mono">
                  {sensorData.alertHistory.length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium italic py-4 text-center">No hay alertas registradas en este período.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sensorData.alertHistory.map((alert, index) => (
                        <div
                          key={`${alert.time}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100"
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{alert.time}</span>
                            <span className="text-sm font-bold text-red-600">{alert.level} ppm</span>
                          </div>
                          <TbAlertTriangle className="text-red-400" size={16} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SensorDetailContainer;
