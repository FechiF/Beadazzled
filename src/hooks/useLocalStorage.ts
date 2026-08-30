'use client';

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  /*
   * Always use initialValue during the first render.
   *
   * This makes the server render and the first client
   * render identical.
   */
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  /*
   * ---------------------------------------------------------
   * Load localStorage after hydration
   * ---------------------------------------------------------
   *
   * React 19's lint rules do not like a synchronous
   * setState directly inside the effect body.
   *
   * setTimeout moves the state update outside the
   * synchronous effect execution.
   */
  useEffect(() => {
    const loadValue = () => {
      try {
        const item = window.localStorage.getItem(key);

        if (item === null) {
          return;
        }

        const parsed = JSON.parse(item) as T;

        setStoredValue(parsed);
      } catch {
        /*
         * Keep initialValue if localStorage contains
         * invalid data.
         */
      }
    };

    const timeoutId = window.setTimeout(loadValue, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [key]);

  /*
   * ---------------------------------------------------------
   * Set value
   * ---------------------------------------------------------
   */

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setStoredValue((previousValue) => {
        const nextValue =
          value instanceof Function ? value(previousValue) : value;

        try {
          if (nextValue === undefined || nextValue === null) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          }
        } catch {
          /*
           * localStorage may be unavailable or full.
           *
           * In-memory state still updates.
           */
        }

        return nextValue;
      });
    },
    [key],
  );

  /*
   * ---------------------------------------------------------
   * Remove value
   * ---------------------------------------------------------
   */

  const remove = useCallback(() => {
    setStoredValue(initialValue);

    try {
      window.localStorage.removeItem(key);
    } catch {
      /*
       * Ignore localStorage errors.
       */
    }
  }, [initialValue, key]);

  /*
   * ---------------------------------------------------------
   * Cross-tab synchronization
   * ---------------------------------------------------------
   */

  useEffect(() => {
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key !== key) {
        return;
      }

      /*
       * Storage events are already asynchronous
       * browser events, so updating React state here
       * is appropriate.
       */
      try {
        if (event.newValue === null) {
          setStoredValue(initialValue);
          return;
        }

        const parsed = JSON.parse(event.newValue) as T;

        setStoredValue(parsed);
      } catch {
        /*
         * Ignore invalid data.
         */
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [initialValue, key]);

  return [storedValue, setValue, remove] as const;
}
