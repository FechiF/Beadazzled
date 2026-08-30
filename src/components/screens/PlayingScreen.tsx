'use client';

interface PlayingScreenProps {
  timeLeft: number;
  currentWord: string | null;
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onRestart: () => void;
  onStop: () => void;
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function PlayingScreen({
  timeLeft,
  currentWord,
  paused,
  onPause,
  onResume,
  onRestart,
  onStop,
}: PlayingScreenProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-8">
      <div className="mb-5 rounded-full bg-yellow-100 px-5 py-2 text-sm font-bold text-yellow-900">
        {paused ? 'PAUSED' : 'EXERCISE'}
      </div>

      <div
        className="text-8xl font-black tabular-nums tracking-tight text-slate-900 sm:text-9xl"
        aria-live="polite"
        aria-label={`${timeLeft} seconds left`}
      >
        {formatTime(timeLeft)}
      </div>

      <div className="mt-8 flex min-h-20 items-center justify-center">
        {currentWord ? (
          <div className="rounded-3xl bg-blue-100 px-8 py-4 text-3xl font-black text-blue-900">
            {currentWord}
          </div>
        ) : (
          <div className="text-lg font-bold text-slate-400">Listen...</div>
        )}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <button
          type="button"
          onClick={paused ? onResume : onPause}
          className="min-w-40 rounded-2xl bg-yellow-500 px-7 py-5 text-xl font-black text-white shadow-lg transition active:scale-95"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="min-w-40 rounded-2xl bg-red-500 px-7 py-5 text-xl font-black text-white shadow-lg transition active:scale-95"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="min-w-40 rounded-2xl bg-green-500 px-7 py-5 text-xl font-black text-white shadow-lg transition active:scale-95"
        >
          Restart
        </button>
      </div>
    </main>
  );
}
