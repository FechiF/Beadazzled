'use client';

import { VOICES, type BeadazzledSettings } from '@/src/config';
import { AppScreen } from '@/src/hooks/useExerciseController';

interface HomeScreenProps {
  settings: BeadazzledSettings;
  onStart: () => void;
  onNavigate: (nextScreen: AppScreen) => void;
}

export function HomeScreen({ settings, onStart, onNavigate }: HomeScreenProps) {
  function goToSettings() {
    onNavigate('settings');
  }

  const voice = VOICES.find((v) => v.id === settings.voice)?.name;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-8 max-w-xl">
        <h2 className="mb-4 text-3xl font-black text-slate-900 sm:text-4xl">
          Ready to bead?
        </h2>

        <p className="text-lg leading-8 text-slate-600">
          Listen for each word. Look at the bead that your exercise tells you to
          use. Move your eyes and keep your focus.
        </p>
      </div>

      <button
        type="button"
        onClick={onStart}
        className={[
          'flex h-48 w-48 items-center justify-center',
          'rounded-full',
          'bg-green-500',
          'text-3xl font-black text-white',
          'shadow-xl shadow-green-200',
          'transition',
          'hover:scale-105',
          'active:scale-95',
        ].join(' ')}
      >
        START
      </button>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={goToSettings}
          className="rounded-full bg-yellow-100 px-4 py-2 font-bold text-yellow-900"
        >
          {Math.floor(settings.durationSeconds / 60)} min{' '}
          {settings.durationSeconds % 60}s
        </button>

        <button
          type="button"
          onClick={goToSettings}
          className="rounded-full bg-blue-100 px-4 py-2 font-bold text-blue-900"
        >
          {settings.intervalMs / 1000}s per word
        </button>

        <button
          type="button"
          onClick={goToSettings}
          className="capitalize rounded-full bg-green-100 px-4 py-2 font-bold text-green-900"
        >
          {`${voice ? voice : settings.voice === 'kid' ? '' : ' Accent'}`}
        </button>
      </div>
    </main>
  );
}
