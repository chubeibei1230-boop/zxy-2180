import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatTimeDisplay } from '../utils/timeUtils';

interface RehearsalTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
  onTick?: (elapsedSeconds: number) => void;
  initialElapsedSeconds?: number;
  autoStart?: boolean;
}

export interface RehearsalTimerRef {
  getElapsedSeconds: () => number;
  reset: () => void;
  start: () => void;
  pause: () => void;
}

export const RehearsalTimer = forwardRef<RehearsalTimerRef, RehearsalTimerProps>((
  { durationMinutes, onTimeUp, onTick, initialElapsedSeconds = 0, autoStart = false },
  ref
) => {
  const totalSeconds = durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds - initialElapsedSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);
  const timeUpNotifiedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    getElapsedSeconds: () => totalSeconds - remainingSeconds,
    reset: () => {
      setRemainingSeconds(totalSeconds);
      setIsRunning(false);
      timeUpNotifiedRef.current = false;
    },
    start: () => setIsRunning(true),
    pause: () => setIsRunning(false)
  }));

  useEffect(() => {
    setRemainingSeconds(totalSeconds - initialElapsedSeconds);
    timeUpNotifiedRef.current = initialElapsedSeconds >= totalSeconds;
    if (autoStart) {
      setIsRunning(true);
    }
  }, [totalSeconds, initialElapsedSeconds, autoStart]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          const next = prev - 1;
          const elapsed = totalSeconds - next;
          onTick?.(elapsed);
          if (next <= 0 && !timeUpNotifiedRef.current) {
            timeUpNotifiedRef.current = true;
            onTimeUp?.();
          }
          return next;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUp, onTick, totalSeconds]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
    timeUpNotifiedRef.current = false;
    onTick?.(0);
  };

  const elapsedSeconds = totalSeconds - remainingSeconds;
  const progressPercent = (elapsedSeconds / totalSeconds) * 100;
  const isWarning = remainingSeconds <= 60 && remainingSeconds > 30;
  const isDanger = remainingSeconds <= 30;
  const isOvertime = remainingSeconds < 0;
  const displayTime = isOvertime
    ? `+${formatTimeDisplay(Math.abs(remainingSeconds))}`
    : formatTimeDisplay(remainingSeconds);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-6xl font-mono font-bold mb-4 transition-colors ${
          isDanger ? 'text-red-500 animate-pulse' : isWarning ? 'text-amber-500' : 'text-white'
        }`}
      >
        {displayTime}
      </div>

      <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-1000 ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTimer}
          className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              开始
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
});

RehearsalTimer.displayName = 'RehearsalTimer';
