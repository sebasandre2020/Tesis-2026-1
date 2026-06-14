// src/store/AppContext.tsx
// Provider Pattern — React Context para estado global de la aplicación.
// Sigue el patrón Proveedor descrito en el README para evitar prop-drilling.

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppState {
  /** Indica si la barra lateral está colapsada (para responsividad futura) */
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Provider que envuelve toda la aplicación e inyecta estado global.
 * Preparado para extenderse con autenticación (useAuth) y temas (useTheme).
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <AppContext.Provider value={{ isSidebarCollapsed, toggleSidebar }}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Hook para consumir el contexto global de la app.
 */
export const useAppContext = (): AppState => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe usarse dentro de un AppProvider');
  }
  return context;
};
