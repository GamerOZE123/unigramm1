import React, { createContext, useContext, useState, useEffect } from 'react';

interface GhostModeContextType {
  isGhostMode: boolean;
  toggleGhostMode: () => void;
}

const GhostModeContext = createContext<GhostModeContextType | undefined>(undefined);

export const useGhostMode = () => {
  const context = useContext(GhostModeContext);
  if (!context) {
    throw new Error('useGhostMode must be used within GhostModeProvider');
  }
  return context;
};

export const GhostModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGhostMode, setIsGhostMode] = useState(false);

  const toggleGhostMode = () => {
    setIsGhostMode(prev => !prev);
  };

  useEffect(() => {
    if (isGhostMode) {
      document.documentElement.classList.add('ghost-mode');
    } else {
      document.documentElement.classList.remove('ghost-mode');
    }
  }, [isGhostMode]);

  return (
    <GhostModeContext.Provider value={{ isGhostMode, toggleGhostMode }}>
      {children}
    </GhostModeContext.Provider>
  );
};
