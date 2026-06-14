// src/features/sensor-detail/containers/SensorDetailContainer.tsx
// Componente CONTENEDOR (Smart) — Obtiene datos del sensor desde la capa de servicios
// y los pasa a componentes presentacionales.

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import Sidebar from '../../../components/Sidebar';
import SensorReadingsChart from '../components/SensorReadingsChart';
import SensorStatsPanel from '../components/SensorStatsPanel';
import CurrentCO2Widget from '../components/CurrentCO2Widget';
import { fetchSensorDetail, fetchSensorDetailChart } from '../../../services/api';
import { SensorDetailData, ChartData, TimeRange } from '../../../types/sensor.types';
import { getTimeRangeLabel } from '../../../utils/formatters';

const SensorDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [sensorData, setSensorData] = useState<SensorDetailData | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ labels: [], datasets: [] });

  // Carga inicial: datos del sensor (stats, alertas, info general)
  useEffect(() => {
    const loadSensorData = async () => {
      const sensorId = parseInt(id || '1', 10);
      const data = await fetchSensorDetail(sensorId);
      setSensorData(data);
    };
    loadSensorData();
  }, [id]);

  // Carga reactiva: gráfica según timeRange (FIX del bug del filtro)
  useEffect(() => {
    const loadChartData = async () => {
      const sensorId = parseInt(id || '1', 10);
      const chart = await fetchSensorDetailChart(sensorId, timeRange);
      setChartData(chart);
    };
    loadChartData();
  }, [id, timeRange]);

  if (!sensorData) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="p-6 bg-gray-100 flex-1 flex items-center justify-center ml-64">
          <p className="text-gray-500 text-lg">Cargando datos del sensor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Menú Lateral */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="p-6 bg-gray-100 flex-1 flex flex-col gap-6 ml-64">
        {/* Encabezado del Sensor */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-2xl font-bold">{sensorData.sensorName}</h2>
          <p className="text-gray-600">Ubicación: {sensorData.location}</p>
        </div>

        {/* Contenido Principal en Grid */}
        <div className="grid grid-cols-3 gap-4 h-full">
          
          {/* Gráfica de Lecturas Recientes */}
          <SensorReadingsChart data={chartData} title={`Lecturas — ${getTimeRangeLabel(timeRange)}`} />

          {/* Columna Derecha con Estadísticas y Filtro */}
          <div className="flex flex-col gap-4" style={{ height: '400px' }}>
            <SensorStatsPanel stats={sensorData.stats} />

            {/* Filtro de Período de Tiempo */}
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 flex-1">
              <h3 className="text-lg font-semibold mb-2">Filtrar por Período</h3>
              <select 
                className="w-full p-2 border rounded"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              >
                <option value="1h">Última hora</option>
                <option value="3h">Últimas 3 horas</option>
                <option value="12h">Últimas 12 horas</option>
                <option value="24h">Últimas 24 horas</option>
              </select>
            </div>
          </div>

          {/* Historial de Alertas */}
          <div className="col-span-2 bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Historial de Alertas</h3>
            {sensorData.alertHistory.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay alertas registradas para este sensor.</p>
            ) : (
              <ul className="space-y-2">
                {sensorData.alertHistory.map((alert, index) => (
                  <li key={index} className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 shadow-sm">
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

          {/* Widget Nivel Actual */}
          <CurrentCO2Widget currentLevel={sensorData.currentLevel} currentStatus={sensorData.currentStatus} />
        </div>
      </div>
    </div>
  );
};

export default SensorDetailContainer;
