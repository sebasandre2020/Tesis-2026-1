// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBroadcastTower, FaCog, FaQuestionCircle, FaChevronDown, FaChevronUp, FaThermometer } from 'react-icons/fa';

const Sidebar = () => {
  const [isSensorsMenuOpen, setIsSensorsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleSensorsMenu = () => {
    setIsSensorsMenuOpen(!isSensorsMenuOpen);
  };

  /** Devuelve clases CSS extras si la ruta actual coincide con el link */
  const getLinkClasses = (path: string, exact: boolean = false) => {
    const isActive = exact
      ? location.pathname === path
      : location.pathname.startsWith(path);
    return `flex items-center text-lg p-2 rounded transition-colors duration-200 ${
      isActive ? 'bg-blue-900 font-semibold' : 'hover:bg-blue-700'
    }`;
  };

  // Auto-abrir el menú de sensores si estamos en una ruta de sensor
  React.useEffect(() => {
    if (location.pathname.startsWith('/sensor/')) {
      setIsSensorsMenuOpen(true);
    }
  }, [location.pathname]);

  return (
    <aside className="w-64 h-screen bg-blue-800 text-white fixed flex flex-col p-6">
      <h2 className="text-2xl font-bold mb-6 tracking-wide">Monitor de CO₂</h2>
      <nav className="flex flex-col space-y-4">
        <Link to="/" className={getLinkClasses('/', true)}>
          <FaHome className="mr-3" /> Dashboard
        </Link>
        
        {/* Menú desplegable para "Detalles de Sensores" */}
        <div>
          <button 
            onClick={toggleSensorsMenu} 
            className={`flex items-center justify-between w-full text-lg p-2 rounded transition-colors duration-200 focus:outline-none ${
              location.pathname.startsWith('/sensor/') ? 'bg-blue-900' : 'hover:bg-blue-700'
            }`}
          >
            <span className="flex items-center">
              <FaBroadcastTower className="mr-3" /> Detalles de Sensores
            </span>
            {isSensorsMenuOpen ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          {isSensorsMenuOpen && (
            <div className="ml-8 flex flex-col space-y-2 mt-2">
              <Link to="/sensor/1" className={getLinkClasses('/sensor/1', true)}>
                <FaThermometer className="mr-3" /> Sensor 1
              </Link>
              <Link to="/sensor/2" className={getLinkClasses('/sensor/2', true)}>
                <FaThermometer className="mr-3" /> Sensor 2
              </Link>
              <Link to="/sensor/3" className={getLinkClasses('/sensor/3', true)}>
                <FaThermometer className="mr-3" /> Sensor 3
              </Link>
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
    </aside>
  );
};

export default Sidebar;
