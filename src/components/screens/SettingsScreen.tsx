'use client';

import { APP_CONFIG, VOICES, type VoiceId } from '@/src/config';

interface SettingsScreenProps {
  voice: VoiceId;
  durationSeconds: number;
  intervalMs: number;

  onVoiceChange: (voice: VoiceId) => void;
  onDurationChange: (seconds: number) => void;
  onIntervalChange: (milliseconds: number) => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

export function SettingsScreen({
  voice,
  durationSeconds,
  intervalMs,
  onVoiceChange,
  onDurationChange,
  onIntervalChange,
}: SettingsScreenProps) {
  const changeDuration = (amount: number) => {
    onDurationChange(
      Math.min(
        APP_CONFIG.exercise.maxDurationSeconds,
        Math.max(
          APP_CONFIG.exercise.minDurationSeconds,
          durationSeconds + amount,
        ),
      ),
    );
  };

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      <h2 className="mb-8 text-center text-3xl font-black">Settings</h2>

      <div className="space-y-8">
        <section>
          <label htmlFor="voice" className="mb-3 block text-xl font-black">
            Voice / Accent
          </label>

          <select
            id="voice"
            value={voice}
            onChange={(event) => onVoiceChange(event.target.value as VoiceId)}
            className="w-full rounded-2xl border-2 border-stone-300 bg-white px-5 py-4 text-lg font-bold outline-none focus:border-blue-500"
          >
            {VOICES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </section>

        <section>
          <label htmlFor="duration" className="mb-3 block text-xl font-black">
            Exercise time
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                changeDuration(-APP_CONFIG.exercise.durationStepSeconds)
              }
              className="h-16 w-16 rounded-2xl bg-red-500 text-3xl font-black text-white"
              aria-label="Decrease exercise time"
            >
              −
            </button>

            <input
              id="duration"
              type="number"
              min={APP_CONFIG.exercise.minDurationSeconds}
              max={APP_CONFIG.exercise.maxDurationSeconds}
              step={APP_CONFIG.exercise.durationStepSeconds}
              value={durationSeconds}
              onChange={(event) =>
                onDurationChange(
                  Number(event.target.value) ||
                    APP_CONFIG.exercise.minDurationSeconds,
                )
              }
              className="h-16 min-w-0 flex-1 rounded-2xl border-2 border-stone-300 bg-white px-4 text-center text-xl font-black"
            />

            <button
              type="button"
              onClick={() =>
                changeDuration(APP_CONFIG.exercise.durationStepSeconds)
              }
              className="h-16 w-16 rounded-2xl bg-green-500 text-3xl font-black text-white"
              aria-label="Increase exercise time"
            >
              +
            </button>
          </div>

          <p className="mt-2 text-center text-slate-500">
            {formatDuration(durationSeconds)}
          </p>
        </section>

        <section>
          <label htmlFor="interval" className="mb-3 block text-xl font-black">
            Time between words
          </label>

          <div className="rounded-2xl bg-blue-100 p-5">
            <input
              id="interval"
              type="range"
              min={APP_CONFIG.exercise.minIntervalMs}
              max={APP_CONFIG.exercise.maxIntervalMs}
              step={APP_CONFIG.exercise.intervalStepMs}
              value={intervalMs}
              onChange={(event) => onIntervalChange(Number(event.target.value))}
              className="w-full"
            />

            <div className="mt-3 text-center text-2xl font-black text-blue-900">
              {(intervalMs / 1000).toFixed(1)} seconds
            </div>

            <p className="mt-2 text-center text-sm text-blue-800">
              Longer time gives more time to listen and change focus.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
