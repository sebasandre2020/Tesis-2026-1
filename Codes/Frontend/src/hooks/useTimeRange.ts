// src/hooks/useTimeRange.ts
// Custom hook para gestionar el estado del filtro de rango de tiempo

import { useState, useCallback } from 'react';
import { TimeRange } from '../types/sensor.types';

/**
 * Hook personalizado que encapsula la lógica del filtro de período de tiempo.
 * Sigue el patrón Custom Hooks descrito en el README para abstraer
 * lógica compleja de la interfaz.
 */
export const useTimeRange = (initialRange: TimeRange = '24h') => {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);

  const handleTimeRangeChange = useCallback((value: string) => {
    setTimeRange(value as TimeRange);
  }, []);

  return {
    timeRange,
    setTimeRange: handleTimeRangeChange,
  };
};
