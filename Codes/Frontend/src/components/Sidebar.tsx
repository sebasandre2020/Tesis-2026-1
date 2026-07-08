// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  TbLayoutDashboard, 
  TbBroadcast, 
  TbSettings, 
  TbHelp, 
  TbChevronDown, 
  TbChevronUp
} from 'react-icons/tb';
import { SENSOR_ID_TO_NODE } from '../services/api';

const Sidebar: React.FC = () => {
  const [isSensorsMenuOpen, setIsSensorsMenuOpen] = useState(false);
  const [userClosedSensorsMenu, setUserClosedSensorsMenu] = useState(false);
  const location = useLocation();

  const onSensorRoute = location.pathname.startsWith('/sensor/');
  const activeSensorId = (() => {
    const m = location.pathname.match(/^\/sensor\/(-?\d+)/);
    return m ? parseInt(m[1], 10) : null;
  })();

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
    return `sidebar-link ${isActive ? 'sidebar-link-active' : 'text-gray-600 hover:bg-gray-100'}`;
  };

  const sensorIds = Object.keys(SENSOR_ID_TO_NODE)
    .map(sid => parseInt(sid, 10))
    .sort((a, b) => {
      const nodeA = SENSOR_ID_TO_NODE[a].nodeId;
      const nodeB = SENSOR_ID_TO_NODE[b].nodeId;
      return nodeA.localeCompare(nodeB);
    });

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 fixed flex flex-col p-6 z-30">
      <div className="mb-10">
        <h2 className="text-xl font-bold text-utec-black leading-tight">
          Control de <span className="text-utec-cyan">Aire Interior</span>
        </h2>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1 font-mono font-semibold">
          UTEC Monitoring v2.0
        </p>
      </div>

      <nav className="flex flex-col space-y-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-2">Principal</p>
        
        <Link to="/" className={getLinkClasses('/', true)}>
          <TbLayoutDashboard className="mr-3 text-lg" /> Dashboard
        </Link>

        <div>
          <button
            type="button"
            onClick={toggleSensorsMenu}
            className={`sidebar-link w-full flex justify-between focus:outline-none ${
              onSensorRoute ? 'bg-utec-cyan/5 text-utec-cyan font-medium' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center">
              <TbBroadcast className="mr-3 text-lg" /> Nodos
            </span>
            {effectiveOpen ? <TbChevronUp size={14} /> : <TbChevronDown size={14} />}
          </button>
          
          {effectiveOpen && (
            <div className="ml-4 flex flex-col space-y-1 mt-1 border-l border-gray-100 pl-4">
              {sensorIds.map(sid => (
                <Link
                  key={sid}
                  to={`/sensor/${sid}`}
                  className={`text-sm p-2 rounded transition-colors ${
                    activeSensorId === sid ? 'text-utec-cyan font-semibold' : 'text-gray-500 hover:text-utec-cyan hover:bg-utec-cyan/5'
                  }`}
                >
                  {SENSOR_ID_TO_NODE[sid].name} - {SENSOR_ID_TO_NODE[sid].location}
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-6 mb-2 px-2">Sistema</p>
        
        <Link to="/config" className={getLinkClasses('/config')}>
          <TbSettings className="mr-3 text-lg" /> Configuración
        </Link>
        <Link to="/help" className={getLinkClasses('/help')}>
          <TbHelp className="mr-3 text-lg" /> Ayuda
        </Link>
      </nav>

      <div className="mt-auto pt-6">
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            Sistema en Línea
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            Última sincronización remota hace 2 minutos.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
