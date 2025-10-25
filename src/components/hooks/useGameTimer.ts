import { useEffect, useRef, useState } from "react";

/**
 * Custom hook for managing game timer
 * Tracks elapsed time in milliseconds for Daily mode
 */
export function useGameTimer(isRunning: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
  };

  const pauseTimer = () => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setElapsedMs(0);
    startTimeRef.current = null;
  };

  useEffect(() => {
    if (isRunning && startTimeRef.current === null) {
      startTimer();
    }

    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        if (startTimeRef.current !== null) {
          setElapsedMs(Date.now() - startTimeRef.current);
        }
      }, 100);
    } else {
      pauseTimer();
    }

    return () => {
      pauseTimer();
    };
  }, [isRunning]);

  return {
    elapsedMs,
    startTimer,
    pauseTimer,
    resetTimer,
  };
}
