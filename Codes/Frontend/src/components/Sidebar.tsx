// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBroadcastTower, FaCog, FaQuestionCircle, FaChevronDown, FaChevronUp, FaThermometer } from 'react-icons/fa';
import { SENSOR_ID_TO_NODE } from '../services/api';

const Sidebar: React.FC = () => {
  const [isSensorsMenuOpen, setIsSensorsMenuOpen] = useState(false);
  const [userClosedSensorsMenu, setUserClosedSensorsMenu] = useState(false);
  const location = useLocation();

  const onSensorRoute = location.pathname.startsWith('/sensor/');
  const activeSensorId = (() => {
    const m = location.pathname.match(/^\/sensor\/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

  // El submenu se considera "abierto" si está abierto físicamente
  // o si el usuario nunca lo cerró explícitamente y la ruta activa es /sensor/*.
  const effectiveOpen = isSensorsMenuOpen || (onSensorRoute && !userClosedSensorsMenu);

  const toggleSensorsMenu = () => {
    if (effectiveOpen) {
      setIsSensorsMenuOpen(false);
      setUserClosedSensorsMenu(true);
    } else {
      setIsSensorsMenuOpen(true);
      setUserClosedSensorsMenu(false);
    }
  };

  const getLinkClasses = (path: string, exact: boolean = false) => {
    const isActive = exact
      ? location.pathname === path
      : location.pathname.startsWith(path);
    return `flex items-center text-lg p-2 rounded transition-colors duration-200 ${
      isActive ? 'bg-blue-900 font-semibold' : 'hover:bg-blue-700'
    }`;
  };

  const sensorIds = Object.keys(SENSOR_ID_TO_NODE)
    .map(s => parseInt(s, 10))
    .sort((a, b) => a - b);

  return (
    <aside className="w-64 h-screen bg-blue-800 text-white fixed flex flex-col p-6 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 tracking-wide">Monitor de Calidad de Aire Interior</h2>
      <nav className="flex flex-col space-y-4">
        <Link to="/" className={getLinkClasses('/', true)}>
          <FaHome className="mr-3" /> Dashboard
        </Link>

        <div>
          <button
            type="button"
            onClick={toggleSensorsMenu}
            aria-expanded={effectiveOpen}
            className={`flex items-center justify-between w-full text-lg p-2 rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
              onSensorRoute ? 'bg-blue-900' : 'hover:bg-blue-700'
            }`}
          >
            <span className="flex items-center">
              <FaBroadcastTower className="mr-3" /> Detalles de Sensores
            </span>
            {effectiveOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {effectiveOpen && (
            <div className="ml-8 flex flex-col space-y-2 mt-2">
              {sensorIds.map(sid => (
                <Link
                  key={sid}
                  to={`/sensor/${sid}`}
                  className={getLinkClasses(`/sensor/${sid}`, true)}
                >
                  <FaThermometer className="mr-3" /> Nodo {sid}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/config" className={getLinkClasses('/config', true)}>
          <FaCog className="mr-3" /> Configuración
        </Link>
        <Link to="/help" className={getLinkClasses('/help', true)}>
          <FaQuestionCircle className="mr-3" /> Ayuda
        </Link>
      </nav>
      {activeSensorId !== null && (
        <div className="mt-auto pt-6 text-xs text-blue-200">
          Viendo: <span className="font-semibold">Nodo {activeSensorId}</span>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
