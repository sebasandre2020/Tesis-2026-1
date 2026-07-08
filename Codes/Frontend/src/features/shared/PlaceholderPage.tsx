// src/features/shared/PlaceholderPage.tsx
import React from 'react';
import { TbSettings, TbHelp, TbHourglassLow } from 'react-icons/tb';
import Sidebar from '../../components/Sidebar';

interface PlaceholderPageProps {
  title: string;
  icon: 'config' | 'help';
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, icon }) => {
  const IconComponent = icon === 'config' ? TbSettings : TbHelp;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col items-center justify-center p-8">
        <div className="card-refined p-12 text-center max-w-lg w-full bg-white">
          <div className="relative inline-block mb-8">
            <IconComponent className="text-utec-cyan/20 mx-auto" size={80} />
            <TbHourglassLow className="absolute bottom-0 right-0 text-utec-cyan animate-bounce" size={32} />
          </div>
          
          <h1 className="text-3xl font-bold text-utec-black uppercase tracking-tight mb-3">{title}</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Estamos configurando esta sección para ofrecerle un control más granular de la red de sensores. Estará disponible en la próxima actualización.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fase de Desarrollo</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlaceholderPage;
