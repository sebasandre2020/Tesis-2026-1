// src/features/shared/NotFoundPage.tsx
// Página 404 para rutas no encontradas.

import React from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="p-6 bg-gray-100 flex-1 flex flex-col items-center justify-center ml-64">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center max-w-md">
          <p className="text-6xl font-bold text-gray-300 mb-4">404</p>
          <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
          <p className="text-gray-500 mb-6">La ruta que buscas no existe en el sistema.</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
