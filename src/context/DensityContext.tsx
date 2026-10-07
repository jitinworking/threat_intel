import React, { createContext, useContext, useState, useEffect } from 'react';

export type DensityMode = 'comfortable' | 'compact';

interface DensityContextType {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  toggleDensity: () => void;
  isCompact: boolean;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensityState] = useState<DensityMode>(() => {
    try {
      const saved = localStorage.getItem('threat-intel-density');
      return (saved === 'compact' || saved === 'comfortable') ? saved : 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  const setDensity = (mode: DensityMode) => {
    setDensityState(mode);
    try {
      localStorage.setItem('threat-intel-density', mode);
    } catch {}
  };

  const toggleDensity = () => {
    setDensity(density === 'compact' ? 'comfortable' : 'compact');
  };

  useEffect(() => {
    const root = document.documentElement;
    if (density === 'compact') {
      root.classList.add('density-compact');
      root.classList.remove('density-comfortable');
    } else {
      root.classList.add('density-comfortable');
      root.classList.remove('density-compact');
    }
  }, [density]);

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity, isCompact: density === 'compact' }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = (): DensityContextType => {
  const context = useContext(DensityContext);
  if (!context) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
};
