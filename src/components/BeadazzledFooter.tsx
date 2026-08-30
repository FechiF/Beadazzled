'use client';

import type { AppScreen } from '@/src/hooks/useExerciseController';

interface BeadazzledFooterProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export function BeadazzledFooter({
  currentScreen,
  onNavigate,
}: BeadazzledFooterProps) {
  const items: Array<{
    label: string;
    screen: AppScreen;
  }> = [
    {
      label: 'Home',
      screen: 'home',
    },
    {
      label: 'Settings',
      screen: 'settings',
    },
    {
      label: 'About',
      screen: 'about',
    },
    {
      label: 'Instructions',
      screen: 'instructions',
    },
  ];

  return (
    <footer className="mt-auto flex flex-wrap justify-center gap-3 px-4 py-5">
      {items.map((item) => (
        <button
          key={item.screen}
          type="button"
          onClick={() => onNavigate(item.screen)}
          className={[
            'rounded-full px-5 py-3',
            'font-bold',
            'transition',
            'active:scale-95',
            currentScreen === item.screen
              ? 'bg-stone-500 text-white'
              : 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200',
          ].join(' ')}
        >
          {item.label}
        </button>
      ))}
    </footer>
  );
}
