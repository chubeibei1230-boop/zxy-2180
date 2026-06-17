import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { formatTimeDisplay } from '../utils/timeUtils';

interface RehearsalTimerProps {
  durationMinutes: number;
  onTimeUp?: () => void;
}

export const RehearsalTimer = ({ durationMinutes, onTimeUp }: RehearsalTimerProps) => {
  const totalSeconds = durationMinutes * 60;
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setRemainingSeconds(totalSeconds);
    setIsRunning(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimeUp?.();
            return 0;
          }
          return prev - 1;
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
  }, [isRunning, onTimeUp]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setRemainingSeconds(totalSeconds);
  };

  const progressPercent = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  const isWarning = remainingSeconds <= 60 && remainingSeconds > 30;
  const isDanger = remainingSeconds <= 30;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`text-6xl font-mono font-bold mb-4 transition-colors ${
          isDanger ? 'text-red-500 animate-pulse' : isWarning ? 'text-amber-500' : 'text-white'
        }`}
      >
        {formatTimeDisplay(remainingSeconds)}
      </div>

      <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full transition-all duration-1000 ${
            isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
          }`}
          style={{ width: `${progressPercent}%` }}
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
};
