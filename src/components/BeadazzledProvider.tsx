'use client';

import { createContext, useContext, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, APP_CONFIG } from '@/src/config';

import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { useExerciseController } from '@/src/hooks/useExerciseController';

type BeadazzledController = ReturnType<typeof useExerciseController>;

const BeadazzledContext = createContext<BeadazzledController | null>(null);

export function BeadazzledProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage(
    APP_CONFIG.storageKeys.settings,
    DEFAULT_SETTINGS,
  );

  const controller = useExerciseController({
    settings,
    setSettings,
  });

  return (
    <BeadazzledContext.Provider value={controller}>
      {children}
    </BeadazzledContext.Provider>
  );
}

export function useBeadazzled() {
  const context = useContext(BeadazzledContext);

  if (!context) {
    throw new Error('useBeadazzled must be used inside BeadazzledProvider');
  }

  return context;
}
