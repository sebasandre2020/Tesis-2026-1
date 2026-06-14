// src/features/shared/PlaceholderPage.tsx
// Página placeholder para secciones en construcción.

import React from 'react';
import Sidebar from '../../components/Sidebar';
import { FaCog, FaQuestionCircle } from 'react-icons/fa';

interface PlaceholderPageProps {
  title: string;
  icon: 'config' | 'help';
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon }) => {
  const IconComponent = icon === 'config' ? FaCog : FaQuestionCircle;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="p-6 bg-gray-100 flex-1 flex flex-col items-center justify-center ml-64">
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center max-w-md">
          <IconComponent className="text-blue-400 mx-auto mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-gray-500">Esta sección estará disponible próximamente.</p>
          <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">🚧 En construcción</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage;
