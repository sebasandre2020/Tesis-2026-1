// src/features/shared/NotFoundPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { TbError404, TbChevronLeft } from 'react-icons/tb';
import Sidebar from '../../components/Sidebar';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col items-center justify-center p-8">
        <div className="card-refined p-12 text-center max-w-md w-full bg-white">
          <TbError404 size={120} className="mx-auto mb-6 text-utec-cyan/10" />
          
          <h1 className="text-2xl font-bold text-utec-black uppercase tracking-tight mb-2">Recurso no encontrado</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-10">
            La dirección solicitada no existe o no tiene una telemetría asignada en este momento.
          </p>
          
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-utec-cyan text-white rounded-lg font-bold uppercase tracking-widest hover:bg-utec-cyan/90 transition-all active:scale-[0.98]"
          >
            <TbChevronLeft /> Dashboard Principal
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
