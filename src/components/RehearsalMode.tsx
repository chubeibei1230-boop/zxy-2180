import { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { RehearsalTimer } from './RehearsalTimer';
import { formatDuration } from '../utils/timeUtils';
import { ExhibitionSlice } from '../types';
import { ReviewReminder } from './ReviewReminder';

export const RehearsalMode = () => {
  const {
    slices,
    currentRehearsalIndex,
    setCurrentRehearsalIndex,
    setRehearsalMode,
    getTotalDuration,
    updateSlice
  } = useSliceStore();

  const [key, setKey] = useState(0);

  const activeSlices = slices
    .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const currentSlice = activeSlices[currentRehearsalIndex];
  const nextSlice = activeSlices[currentRehearsalIndex + 1];

  const attentionSlices = activeSlices.filter((s) => s.reviewFlags.length > 0);

  const totalDuration = getTotalDuration();
  const elapsedDuration = activeSlices
    .slice(0, currentRehearsalIndex)
    .reduce((sum, s) => sum + s.durationMinutes, 0);
  const remainingDuration = totalDuration - elapsedDuration;

  const progressPercent = activeSlices.length > 0 ? ((currentRehearsalIndex) / activeSlices.length) * 100 : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRehearsalMode(false);
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRehearsalIndex, activeSlices.length]);

  const goToPrev = () => {
    if (currentRehearsalIndex > 0) {
      setCurrentRehearsalIndex(currentRehearsalIndex - 1);
      setKey((k) => k + 1);
    }
  };

  const goToNext = () => {
    if (currentRehearsalIndex < activeSlices.length - 1) {
      setCurrentRehearsalIndex(currentRehearsalIndex + 1);
      setKey((k) => k + 1);
    }
  };

  const handleTimeUp = () => {
    // 播放提示音或震动
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const markAsFamiliar = (slice: ExhibitionSlice) => {
    updateSlice(slice.id, { rehearsalStatus: 'familiar' });
  };

  if (!currentSlice) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white">排练模式</h2>
          <span className="text-slate-400 text-sm">
            {currentRehearsalIndex + 1} / {activeSlices.length}
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-sm">
          {attentionSlices.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
              <Zap className="w-4 h-4" />
              {attentionSlices.length} 个切片需重点关注
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            剩余: {formatDuration(remainingDuration)}
          </span>
          <button
            onClick={() => setRehearsalMode(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="h-1 bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <RehearsalTimer
              key={key}
              durationMinutes={currentSlice.durationMinutes}
              onTimeUp={handleTimeUp}
            />
          </div>

          <ReviewReminder slice={currentSlice} />

          <div className="bg-slate-800 rounded-2xl p-8 mb-6 animate-slide-up">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{currentSlice.title}</h3>
                <div className="flex items-center gap-4 text-slate-400 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentSlice.exhibit}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentSlice.durationMinutes}分钟
                  </span>
                </div>
              </div>
              <button
                onClick={() => markAsFamiliar(currentSlice)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  currentSlice.rehearsalStatus === 'familiar'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {currentSlice.rehearsalStatus === 'familiar' ? '已标记熟悉' : '标记为熟悉'}
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-400 mb-2">关键句</h4>
              <p className="text-xl text-white leading-relaxed" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                {currentSlice.keySentence}
              </p>
            </div>

            {currentSlice.errorReminder && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <h4 className="text-sm font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  易错提醒
                </h4>
                <p className="text-amber-200">{currentSlice.errorReminder}</p>
              </div>
            )}

            {currentSlice.alternativeVersion && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  备用说法
                </h4>
                <p className="text-emerald-200">{currentSlice.alternativeVersion}</p>
              </div>
            )}
          </div>

          {nextSlice && (
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-400 mb-3">下一个</h4>
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-lg font-semibold text-white mb-1">{nextSlice.title}</h5>
                  <p className="text-sm text-slate-400 line-clamp-1">{nextSlice.keySentence}</p>
                </div>
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {nextSlice.durationMinutes}分钟
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
        <button
          onClick={goToPrev}
          disabled={currentRehearsalIndex === 0}
          className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          上一个
        </button>

        <div className="text-sm text-slate-400">
          使用 ← → 键切换，ESC 退出
        </div>

        <button
          onClick={goToNext}
          disabled={currentRehearsalIndex === activeSlices.length - 1}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          下一个
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
