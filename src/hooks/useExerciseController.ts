'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { audioEngine } from '@/src/lib/audioEngine';
import {
  APP_CONFIG,
  WORDS,
  type BeadazzledSettings,
  type VoiceId,
  type Word,
} from '@/src/config';
import { createExerciseSequence } from '@/src/lib/exerciseSequence';

export type AppScreen = 'home' | 'settings' | 'about' | 'instructions' | 'play';
export type ExerciseStatus = 'idle' | 'playing' | 'paused' | 'finished';

interface UseExerciseControllerOptions {
  settings: BeadazzledSettings;
  setSettings: React.Dispatch<React.SetStateAction<BeadazzledSettings>>;
}

interface ScheduledEntry {
  source: AudioBufferSourceNode;
  word: Word;
  startTime: number;
}

export function useExerciseController({
  settings,
  setSettings,
}: UseExerciseControllerOptions) {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [status, setStatus] = useState<ExerciseStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(settings.durationSeconds);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);

  const statusRef = useRef<ExerciseStatus>('idle');
  const sessionIdRef = useRef(0);

  const sequenceRef = useRef<Word[]>([]);
  const sourcesRef = useRef<ScheduledEntry[]>([]);
  const cumulativeRef = useRef<number[]>([]);
  const baseTimeRef = useRef(0);
  const wordPointerRef = useRef(0);

  const uiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setExerciseStatus = useCallback((next: ExerciseStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  const clearUiTimer = useCallback(() => {
    if (uiTimerRef.current !== null) {
      clearInterval(uiTimerRef.current);
      uiTimerRef.current = null;
    }
  }, []);

  /*
   * ---------------------------------------------------------
   * Preload the current voice's clips whenever it changes so
   * Start can unlock + schedule with no fetch/decode delay.
   * decodeAudioData does not require a user gesture.
   * ---------------------------------------------------------
   */
  useEffect(() => {
    audioEngine.preloadVoice(settings.voice, WORDS).catch((error) => {
      console.error('Beadazzled: failed to preload audio', error);
    });
  }, [settings.voice]);

  /*
   * ---------------------------------------------------------
   * Finish
   * ---------------------------------------------------------
   */
  const finish = useCallback(() => {
    sessionIdRef.current += 1;

    clearUiTimer();
    audioEngine.stopAll(sourcesRef.current.map((entry) => entry.source));

    sourcesRef.current = [];
    sequenceRef.current = [];
    cumulativeRef.current = [];
    wordPointerRef.current = 0;

    setCurrentWord(null);
    setTimeLeft(settings.durationSeconds);

    setExerciseStatus('finished');
    setScreen('home');
  }, [clearUiTimer, settings.durationSeconds, setExerciseStatus]);

  /*
   * ---------------------------------------------------------
   * UI tick: advances currentWord/timeLeft off the
   * AudioContext clock, so it automatically freezes while
   * suspended (paused) and catches up on resume with no
   * extra bookkeeping.
   * ---------------------------------------------------------
   */
  const startUiTimer = useCallback(
    (session: number) => {
      clearUiTimer();

      uiTimerRef.current = setInterval(() => {
        if (session !== sessionIdRef.current) return;

        const now = audioEngine.currentTime;
        const elapsed = now - baseTimeRef.current;
        const remaining = Math.max(0, settings.durationSeconds - elapsed);

        setTimeLeft(Math.ceil(remaining));

        const cumulative = cumulativeRef.current;

        while (
          wordPointerRef.current + 1 < cumulative.length &&
          cumulative[wordPointerRef.current + 1] <= now
        ) {
          wordPointerRef.current += 1;
        }

        setCurrentWord(sequenceRef.current[wordPointerRef.current] ?? null);

        if (elapsed >= settings.durationSeconds) {
          finish();
        }
      }, 100);
    },
    [clearUiTimer, finish, settings.durationSeconds],
  );

  /*
   * ---------------------------------------------------------
   * Start / Reset
   * ---------------------------------------------------------
   */
  const start = useCallback(async () => {
    const session = ++sessionIdRef.current;

    audioEngine.stopAll(sourcesRef.current.map((entry) => entry.source));
    sourcesRef.current = [];
    clearUiTimer();

    setCurrentWord(null);
    setTimeLeft(settings.durationSeconds);
    wordPointerRef.current = 0;

    try {
      // Must happen inside this click-triggered async chain to
      // count as gesture-initiated.
      await audioEngine.unlock();
      if (session !== sessionIdRef.current) return;

      await audioEngine.preloadVoice(settings.voice, WORDS);
      if (session !== sessionIdRef.current) return;
    } catch (error) {
      console.error('Beadazzled: could not start audio', error);
      setExerciseStatus('idle');
      return;
    }

    const sequence = createExerciseSequence(
      settings.durationSeconds,
      settings.intervalMs,
    );
    sequenceRef.current = sequence;

    const intervalSeconds = settings.intervalMs / 1000;
    const baseTime = audioEngine.currentTime + 0.05;
    baseTimeRef.current = baseTime;

    let cursor = baseTime;
    const cumulative: number[] = [];
    const scheduled: ScheduledEntry[] = [];

    sequence.forEach((word, index) => {
      cumulative.push(cursor);

      const buffer = audioEngine.getBuffer(settings.voice, word);

      if (buffer) {
        const isLast = index === sequence.length - 1;

        const source = audioEngine.schedule(
          buffer,
          cursor,
          isLast
            ? () => {
                if (session === sessionIdRef.current) finish();
              }
            : undefined,
        );

        scheduled.push({ source, word, startTime: cursor });
        cursor += Math.max(intervalSeconds, buffer.duration);
      } else {
        // Missing clip: keep the slot's timing so the sequence
        // doesn't drift, just play nothing for this word.
        console.error(`Beadazzled: missing clip for ${settings.voice}/${word}`);
        cursor += intervalSeconds;
      }
    });

    cumulativeRef.current = cumulative;
    sourcesRef.current = scheduled;

    setExerciseStatus('playing');
    setScreen('play');

    startUiTimer(session);
  }, [
    clearUiTimer,
    finish,
    settings.durationSeconds,
    settings.intervalMs,
    settings.voice,
    setExerciseStatus,
    startUiTimer,
  ]);

  const restart = useCallback(() => {
    start();
  }, [start]);

  /*
   * ---------------------------------------------------------
   * Pause / Resume
   *
   * ctx.suspend()/resume() freezes and unfreezes the entire
   * scheduled timeline (and the AudioContext clock the UI
   * timer reads from) as one unit - no manual "remaining time"
   * bookkeeping needed.
   * ---------------------------------------------------------
   */
  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;

    audioEngine.suspend();
    setExerciseStatus('paused');
  }, [setExerciseStatus]);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;

    audioEngine.resume();
    setExerciseStatus('playing');
  }, [setExerciseStatus]);

  /*
   * ---------------------------------------------------------
   * Screen navigation
   * ---------------------------------------------------------
   */
  const goToScreen = useCallback((nextScreen: AppScreen) => {
    if (statusRef.current === 'playing' || statusRef.current === 'paused') {
      return;
    }

    setScreen(nextScreen);
  }, []);

  /*
   * ---------------------------------------------------------
   * Settings
   * ---------------------------------------------------------
   */
  const updateVoice = useCallback(
    (voice: VoiceId) => {
      setSettings((current) => ({ ...current, voice }));
    },
    [setSettings],
  );

  const updateDuration = useCallback(
    (durationSeconds: number) => {
      if (!Number.isFinite(durationSeconds)) return;

      const value = Math.min(
        APP_CONFIG.exercise.maxDurationSeconds,
        Math.max(
          APP_CONFIG.exercise.minDurationSeconds,
          Math.round(durationSeconds),
        ),
      );

      setSettings((current) => ({ ...current, durationSeconds: value }));

      if (statusRef.current === 'idle' || statusRef.current === 'finished') {
        setTimeLeft(value);
      }
    },
    [setSettings],
  );

  const updateInterval = useCallback(
    (intervalMs: number) => {
      if (!Number.isFinite(intervalMs)) return;

      const value = Math.min(
        APP_CONFIG.exercise.maxIntervalMs,
        Math.max(APP_CONFIG.exercise.minIntervalMs, Math.round(intervalMs)),
      );

      setSettings((current) => ({ ...current, intervalMs: value }));
    },
    [setSettings],
  );

  /*
   * ---------------------------------------------------------
   * Cleanup
   * ---------------------------------------------------------
   */
  useEffect(() => {
    return () => {
      sessionIdRef.current += 1;
      clearUiTimer();
      audioEngine.stopAll(sourcesRef.current.map((entry) => entry.source));
    };
  }, [clearUiTimer]);

  return {
    screen,
    goToScreen,

    status,
    timeLeft,
    currentWord,

    settings,

    start,
    pause,
    resume,
    restart,
    finish,

    updateVoice,
    updateDuration,
    updateInterval,
  };
}
