// src/components/Header.tsx
import React from 'react';
import { Link } from 'react-router-dom';

const Header = ({ title }: { title: string }) => (
  <header className="header p-4 bg-blue-600 text-white flex justify-between items-center">
    <h1>{title}</h1>
    <nav>
      <Link to="/" className="px-2">Dashboard</Link>
      <Link to="/sensor/1" className="px-2">Vista Individual</Link>
      <Link to="/config" className="px-2">Configuración</Link>
      <Link to="/help" className="px-2">Ayuda</Link>
    </nav>
  </header>
);

export default Header;
