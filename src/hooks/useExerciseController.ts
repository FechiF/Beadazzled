'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  APP_CONFIG,
  VOICES,
  WORDS,
  type BeadazzledSettings,
  type VoiceId,
  type Word,
} from '@/src/config';

export type AppScreen = 'home' | 'settings' | 'about' | 'instructions' | 'play';

export type ExerciseStatus = 'idle' | 'playing' | 'paused' | 'finished';

interface UseExerciseControllerOptions {
  settings: BeadazzledSettings;
  setSettings: React.Dispatch<React.SetStateAction<BeadazzledSettings>>;
}

/**
 * Create a random exercise sequence.
 *
 * Example:
 *
 * duration: 60 seconds
 * interval: 1000 ms
 *
 * Number of words:
 * 60
 *
 * 60 / 5 colors = 12 of each color
 *
 * The complete list is then shuffled.
 *
 * If the number of words is not divisible by five,
 * the remaining words are distributed randomly.
 */
function createExerciseSequence(
  durationSeconds: number,
  intervalMs: number,
): Word[] {
  const wordCount = Math.max(
    1,
    Math.floor((durationSeconds * 1000) / intervalMs),
  );

  const sequence: Word[] = [];

  /*
   * Add words in complete groups.
   *
   * This guarantees that all five colors are used evenly
   * whenever the number of words allows it.
   */
  const completeSets = Math.floor(wordCount / WORDS.length);

  for (let set = 0; set < completeSets; set += 1) {
    sequence.push(...WORDS);
  }

  /*
   * Add the remaining words.
   *
   * Shuffle the word list first so the remainder is not
   * always the same colors.
   */
  const remainder = wordCount % WORDS.length;

  if (remainder > 0) {
    const shuffledWords = shuffleArray([...WORDS]);

    sequence.push(...shuffledWords.slice(0, remainder));
  }

  /*
   * Randomize the complete sequence.
   *
   * Fisher-Yates gives an unbiased shuffle.
   */
  return shuffleArray(sequence);
}

/**
 * Fisher-Yates shuffle.
 *
 * Returns a new array.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export function useExerciseController({
  settings,
  setSettings,
}: UseExerciseControllerOptions) {
  /*
   * ---------------------------------------------------------
   * Screen state
   * ---------------------------------------------------------
   */

  const [screen, setScreen] = useState<AppScreen>('home');

  /*
   * ---------------------------------------------------------
   * Exercise state
   * ---------------------------------------------------------
   */

  const [status, setStatus] = useState<ExerciseStatus>('idle');

  const [timeLeft, setTimeLeft] = useState(settings.durationSeconds);

  /*
   * The color currently being spoken.
   *
   * This is useful for the UI if you want to show the
   * current word during development.
   *
   * For the actual Brock string exercise, you may prefer
   * not to display this value.
   */
  const [currentWord, setCurrentWord] = useState<Word | null>(null);

  /*
   * ---------------------------------------------------------
   * Exercise refs
   * ---------------------------------------------------------
   */

  const statusRef = useRef<ExerciseStatus>('idle');

  /**
   * The complete randomized sequence for the current
   * exercise.
   */
  const sequenceRef = useRef<Word[]>([]);

  /**
   * Index of the next word to play.
   */
  const wordIndexRef = useRef(0);

  /**
   * Current audio element.
   */
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Exercise timer.
   */
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Timer used to wait between audio clips.
   */
  const nextWordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * When the current interval delay should end.
   *
   * This is used to resume correctly if the user pauses
   * during the gap between two words.
   */
  const nextWordDueAtRef = useRef<number | null>(null);

  /**
   * Start time of the exercise.
   *
   * This is adjusted when the exercise is paused.
   */
  const startTimeRef = useRef<number | null>(null);

  /**
   * Time when pause started.
   */
  const pausedAtRef = useRef<number | null>(null);

  /*
   * ---------------------------------------------------------
   * Status helper
   * ---------------------------------------------------------
   */

  const setExerciseStatus = useCallback((nextStatus: ExerciseStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  /*
   * ---------------------------------------------------------
   * Timer helpers
   * ---------------------------------------------------------
   */

  const clearExerciseTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const clearNextWordTimer = useCallback(() => {
    if (nextWordTimeoutRef.current !== null) {
      clearTimeout(nextWordTimeoutRef.current);
      nextWordTimeoutRef.current = null;
    }

    nextWordDueAtRef.current = null;
  }, []);

  const clearAllTimers = useCallback(() => {
    clearExerciseTimer();
    clearNextWordTimer();
  }, [clearExerciseTimer, clearNextWordTimer]);

  /*
   * ---------------------------------------------------------
   * Audio helpers
   * ---------------------------------------------------------
   */

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    audioRef.current = null;
  }, []);

  const getAudioPath = useCallback((voice: VoiceId, word: Word) => {
    return `/audio/${voice}/${word}.mp3`;
  }, []);

  /*
   * ---------------------------------------------------------
   * Finish exercise
   * ---------------------------------------------------------
   */

  const finish = useCallback(() => {
    clearAllTimers();
    stopAudio();

    sequenceRef.current = [];
    wordIndexRef.current = 0;

    startTimeRef.current = null;
    pausedAtRef.current = null;
    nextWordDueAtRef.current = null;

    setCurrentWord(null);
    setTimeLeft(0);

    setExerciseStatus('finished');
  }, [clearAllTimers, setExerciseStatus, stopAudio]);

  /*
   * ---------------------------------------------------------
   * Exercise countdown
   * ---------------------------------------------------------
   */

  const startCountdown = useCallback(() => {
    clearExerciseTimer();

    timerRef.current = setInterval(() => {
      const startTime = startTimeRef.current;

      if (startTime === null) {
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);

      const remainingSeconds = Math.max(
        0,
        settings.durationSeconds - elapsedSeconds,
      );

      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        finish();
      }
    }, 200);
  }, [clearExerciseTimer, finish, settings.durationSeconds]);

  /*
   * ---------------------------------------------------------
   * Play next word
   * ---------------------------------------------------------
   */

  const playNextWordRef = useRef<() => void>(() => {});

  const playNextWord = useCallback(() => {
    if (statusRef.current !== 'playing') {
      return;
    }

    /*
     * Check if the exercise duration has ended.
     */
    if (
      startTimeRef.current !== null &&
      Date.now() - startTimeRef.current >= settings.durationSeconds * 1000
    ) {
      finish();
      return;
    }

    const sequence = sequenceRef.current;

    /*
     * The generated sequence has been completely played.
     */
    if (wordIndexRef.current >= sequence.length) {
      finish();
      return;
    }

    /*
     * Get the next word from the randomized sequence.
     */
    const word = sequence[wordIndexRef.current];

    wordIndexRef.current += 1;

    setCurrentWord(word);

    /*
     * Stop any previous audio.
     */
    stopAudio();

    /*
     * Create audio for the selected voice and word.
     */
    const audio = new Audio(getAudioPath(settings.voice, word));

    audio.preload = 'auto';

    audioRef.current = audio;

    /*
     * -------------------------------------------------------
     * Audio ended
     * -------------------------------------------------------
     *
     * intervalMs is the target time from the start of one
     * word to the start of the next word.
     *
     * Example:
     *
     * interval = 1000 ms
     * clip     = 700 ms
     *
     * remaining delay = 300 ms
     *
     * Result:
     *
     * 0.0s  red
     * 1.0s  blue
     * 2.0s  yellow
     * 3.0s  green
     */
    const handleEnded = () => {
      if (statusRef.current !== 'playing') {
        return;
      }

      const clipDurationMs = Number.isFinite(audio.duration)
        ? audio.duration * 1000
        : 0;

      const delay = Math.max(0, settings.intervalMs - clipDurationMs);

      /*
       * Store when the next word should start.
       */
      nextWordDueAtRef.current = Date.now() + delay;

      nextWordTimeoutRef.current = setTimeout(() => {
        nextWordTimeoutRef.current = null;
        nextWordDueAtRef.current = null;

        /*
         * Use the ref rather than calling playNextWord()
         * directly.
         */
        playNextWordRef.current();
      }, delay);
    };

    /*
     * -------------------------------------------------------
     * Audio error
     * -------------------------------------------------------
     */

    const handleError = () => {
      if (statusRef.current !== 'playing') {
        return;
      }

      /*
       * Give the same interval before attempting the next
       * word if this audio file cannot be played.
       */
      nextWordDueAtRef.current = Date.now() + settings.intervalMs;

      nextWordTimeoutRef.current = setTimeout(() => {
        nextWordTimeoutRef.current = null;
        nextWordDueAtRef.current = null;

        playNextWordRef.current();
      }, settings.intervalMs);
    };

    audio.addEventListener('ended', handleEnded, { once: true });

    audio.addEventListener('error', handleError, { once: true });

    void audio.play().catch(() => {
      /*
       * Playback errors are handled by the audio error
       * event when available.
       */
    });
  }, [
    finish,
    getAudioPath,
    settings.durationSeconds,
    settings.intervalMs,
    settings.voice,
    stopAudio,
  ]);

  /*
   * ---------------------------------------------------------
   * Start
   * ---------------------------------------------------------
   */

  const start = useCallback(() => {
    clearAllTimers();
    stopAudio();

    /*
     * Generate a completely new sequence every time the
     * exercise starts or restarts.
     */
    const sequence = createExerciseSequence(
      settings.durationSeconds,
      settings.intervalMs,
    );

    sequenceRef.current = sequence;
    wordIndexRef.current = 0;

    /*
     * Reset timing state.
     */
    startTimeRef.current = Date.now();
    pausedAtRef.current = null;
    nextWordDueAtRef.current = null;

    setTimeLeft(settings.durationSeconds);
    setCurrentWord(null);

    setExerciseStatus('playing');
  }, [
    clearAllTimers,
    setExerciseStatus,
    settings.durationSeconds,
    settings.intervalMs,
    stopAudio,
  ]);

  /*
   * Keep the ref pointing to the latest version of the
   * callback.
   *
   * This is important because the callback uses current
   * settings such as voice, duration, and interval.
   */
  useEffect(() => {
    playNextWordRef.current = playNextWord;
  }, [playNextWord]);

  /*
   * ---------------------------------------------------------
   * Start playback when status becomes "playing"
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (status !== 'playing') {
      return;
    }

    startCountdown();

    /*
     * Small delay before the first word.
     */
    nextWordTimeoutRef.current = setTimeout(() => {
      nextWordTimeoutRef.current = null;

      playNextWord();
    }, 100);

    return () => {
      clearExerciseTimer();
    };
  }, [status, startCountdown, playNextWord, clearExerciseTimer]);

  /*
   * ---------------------------------------------------------
   * Pause
   * ---------------------------------------------------------
   */

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') {
      return;
    }

    pausedAtRef.current = Date.now();

    clearExerciseTimer();

    /*
     * If a word is currently playing, pause it.
     */
    audioRef.current?.pause();

    /*
     * If we are waiting between words, remember how much
     * time was still remaining.
     */
    if (nextWordDueAtRef.current !== null) {
      const remaining = Math.max(0, nextWordDueAtRef.current - Date.now());

      nextWordDueAtRef.current = remaining;
    }

    if (nextWordTimeoutRef.current !== null) {
      clearTimeout(nextWordTimeoutRef.current);

      nextWordTimeoutRef.current = null;
    }

    setExerciseStatus('paused');
  }, [clearExerciseTimer, setExerciseStatus]);

  /*
   * ---------------------------------------------------------
   * Resume
   * ---------------------------------------------------------
   */

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') {
      return;
    }

    /*
     * Move the exercise start time forward by the length
     * of the pause.
     *
     * Therefore the paused time does not count toward the
     * exercise duration.
     */
    if (startTimeRef.current !== null && pausedAtRef.current !== null) {
      const pauseDuration = Date.now() - pausedAtRef.current;

      startTimeRef.current += pauseDuration;
    }

    pausedAtRef.current = null;

    setExerciseStatus('playing');

    /*
     * If an audio clip is paused, continue that clip.
     */
    if (audioRef.current && !audioRef.current.ended) {
      void audioRef.current.play().catch(() => {});

      return;
    }

    /*
     * If we were paused during the gap between words,
     * resume the remaining gap.
     *
     * nextWordDueAtRef contains the remaining delay while
     * paused.
     */
    if (typeof nextWordDueAtRef.current === 'number') {
      const remainingDelay = nextWordDueAtRef.current;

      nextWordDueAtRef.current = null;

      nextWordTimeoutRef.current = setTimeout(() => {
        nextWordTimeoutRef.current = null;

        playNextWord();
      }, remainingDelay);

      return;
    }

    /*
     * No current audio and no pending gap.
     *
     * Continue with the next word.
     */
    playNextWord();
  }, [playNextWord, setExerciseStatus]);

  /*
   * ---------------------------------------------------------
   * Restart
   * ---------------------------------------------------------
   */

  const restart = useCallback(() => {
    start();
  }, [start]);

  /*
   * ---------------------------------------------------------
   * Screen navigation
   * ---------------------------------------------------------
   */

  const goToScreen = useCallback((nextScreen: AppScreen) => {
    /*
     * Do not allow navigation away from an active
     * exercise.
     */
    if (statusRef.current === 'playing' || statusRef.current === 'paused') {
      return;
    }

    setScreen(nextScreen);
  }, []);

  /*
   * ---------------------------------------------------------
   * Voice setting
   * ---------------------------------------------------------
   */

  const updateVoice = useCallback(
    (voice: VoiceId) => {
      setSettings((current) => ({
        ...current,
        voice,
      }));
    },
    [setSettings],
  );

  /*
   * ---------------------------------------------------------
   * Duration setting
   * ---------------------------------------------------------
   */

  const updateDuration = useCallback(
    (durationSeconds: number) => {
      if (!Number.isFinite(durationSeconds)) {
        return;
      }

      const value = Math.min(
        APP_CONFIG.exercise.maxDurationSeconds,
        Math.max(
          APP_CONFIG.exercise.minDurationSeconds,
          Math.round(durationSeconds),
        ),
      );

      setSettings((current) => ({
        ...current,
        durationSeconds: value,
      }));

      /*
       * Update the home/settings display when there is no
       * active exercise.
       */
      if (statusRef.current === 'idle' || statusRef.current === 'finished') {
        setTimeLeft(value);
      }
    },
    [setSettings],
  );

  /*
   * ---------------------------------------------------------
   * Word interval setting
   * ---------------------------------------------------------
   */

  const updateInterval = useCallback(
    (intervalMs: number) => {
      if (!Number.isFinite(intervalMs)) {
        return;
      }

      const value = Math.min(
        APP_CONFIG.exercise.maxIntervalMs,
        Math.max(APP_CONFIG.exercise.minIntervalMs, Math.round(intervalMs)),
      );

      setSettings((current) => ({
        ...current,
        intervalMs: value,
      }));
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
      clearAllTimers();
      stopAudio();
    };
  }, [clearAllTimers, stopAudio]);

  /*
   * ---------------------------------------------------------
   * Public controller API
   * ---------------------------------------------------------
   */

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
