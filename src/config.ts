export const APP_CONFIG = {
  name: 'Beadazzled',

  exercise: {
    defaultDurationSeconds: 60,

    minDurationSeconds: 30,
    maxDurationSeconds: 30 * 60,
    durationStepSeconds: 30,

    // Time from the start of one word to the start of the next word.
    defaultIntervalMs: 1500,

    minIntervalMs: 500,
    maxIntervalMs: 3000,
    intervalStepMs: 100,
  },

  storageKeys: {
    settings: 'beadazzled-settings',
  },
} as const;

export const WORDS = ['blue', 'green', 'orange', 'red', 'yellow'] as const;

export type Word = (typeof WORDS)[number];

export const VOICES = [
  {
    id: 'kid',
    name: 'Kid',
  },
  {
    id: 'diana',
    name: 'Diana',
  },
  {
    id: 'australian',
    name: 'Australian Accent',
  },
  {
    id: 'british',
    name: 'British Accent',
  },
  {
    id: 'filipino',
    name: 'Filipino Accent',
  },
] as const;

export type VoiceConfig = (typeof VOICES)[number];
export type VoiceId = (typeof VOICES)[number]['id'];

export interface BeadazzledSettings {
  voice: VoiceId;
  durationSeconds: number;
  intervalMs: number;
}

export const DEFAULT_SETTINGS: BeadazzledSettings = {
  voice: 'kid',
  durationSeconds: APP_CONFIG.exercise.defaultDurationSeconds,
  intervalMs: APP_CONFIG.exercise.defaultIntervalMs,
};
