import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertTriangle,
  MessageSquare,
  Clock,
  CheckCircle2,
  Zap,
  Save,
  FileText,
  AlertCircle,
  Target,
  Calendar
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { RehearsalTimer, RehearsalTimerRef } from './RehearsalTimer';
import { formatDuration, formatTimeDisplay } from '../utils/timeUtils';
import { ExhibitionSlice, SliceReview, RehearsalStep } from '../types';
import { ReviewReminder } from './ReviewReminder';

export const RehearsalMode = () => {
  const {
    slices,
    currentRehearsalIndex,
    setCurrentRehearsalIndex,
    setRehearsalMode,
    getTotalDuration,
    updateSlice,
    updateSliceElapsed,
    sliceRehearsalData,
    sessionStartTime,
    saveReviewDraft,
    setShowReviewForm,
    activeSessionPlanId,
    getSessionPlan,
    getSessionPlanActiveSlices,
    setActiveSessionPlanId
  } = useSliceStore();

  const timerRef = useRef<RehearsalTimerRef>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const activeSessionPlan = activeSessionPlanId ? getSessionPlan(activeSessionPlanId) : null;

  const activeSlices = useMemo(() => {
    if (activeSessionPlanId) {
      return getSessionPlanActiveSlices(activeSessionPlanId);
    }
    return slices
      .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [slices, activeSessionPlanId, getSessionPlanActiveSlices]);

  const currentSlice = activeSlices[currentRehearsalIndex];
  const nextSlice = activeSlices[currentRehearsalIndex + 1];

  const attentionSlices = activeSlices.filter((s) => s.reviewFlags.length > 0);

  const totalDuration = useMemo(() => {
    if (activeSessionPlanId) {
      return activeSlices.reduce((sum, s) => sum + s.durationMinutes, 0);
    }
    return getTotalDuration();
  }, [activeSlices, activeSessionPlanId, getTotalDuration]);

  const completedSliceData = sliceRehearsalData.filter((d) => d.isCompleted);
  const elapsedDuration = completedSliceData.reduce(
    (sum, d) => sum + d.elapsedSeconds / 60, 0
  );
  const remainingDuration = Math.max(0, totalDuration - elapsedDuration);

  const currentSliceData = sliceRehearsalData.find((d) => d.sliceId === currentSlice?.id);
  const currentElapsedSeconds = currentSliceData?.elapsedSeconds || 0;

  const completedCount = completedSliceData.length;
  const progressPercent = activeSlices.length > 0
    ? (completedCount / activeSlices.length) * 100
    : 0;

  const handleTick = (elapsedSeconds: number) => {
    if (currentSlice) {
      updateSliceElapsed(currentSlice.id, elapsedSeconds, false);
    }
  };

  const goToPrev = useCallback(() => {
    if (currentRehearsalIndex > 0) {
      if (currentSlice) {
        const elapsed = timerRef.current?.getElapsedSeconds() || currentElapsedSeconds;
        updateSliceElapsed(currentSlice.id, elapsed, true);
      }
      setCurrentRehearsalIndex(currentRehearsalIndex - 1);
    }
  }, [currentRehearsalIndex, currentSlice, currentElapsedSeconds, updateSliceElapsed, setCurrentRehearsalIndex]);

  const goToNext = useCallback(() => {
    if (currentRehearsalIndex < activeSlices.length - 1) {
      if (currentSlice) {
        const elapsed = timerRef.current?.getElapsedSeconds() || currentElapsedSeconds;
        updateSliceElapsed(currentSlice.id, elapsed, true);
      }
      setCurrentRehearsalIndex(currentRehearsalIndex + 1);
    }
  }, [currentRehearsalIndex, activeSlices.length, currentSlice, currentElapsedSeconds, updateSliceElapsed, setCurrentRehearsalIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExitConfirm(true);
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  const handleTimeUp = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  };

  const markAsFamiliar = (slice: ExhibitionSlice) => {
    updateSlice(slice.id, { rehearsalStatus: 'familiar' });
  };

  const handleExit = (option: 'review' | 'draft' | 'discard') => {
    let finalSliceData = sliceRehearsalData;
    if (currentSlice) {
      const elapsed = timerRef.current?.getElapsedSeconds() || currentElapsedSeconds;
      finalSliceData = sliceRehearsalData.map((data) =>
        data.sliceId === currentSlice.id
          ? { ...data, elapsedSeconds: elapsed, isCompleted: true }
          : data
      );
      updateSliceElapsed(currentSlice.id, elapsed, true);
    }

    if (option === 'review') {
      const sessionEndTime = new Date().toISOString();
      const sliceReviews: Record<string, Partial<SliceReview & { rehearsalStatus: RehearsalStep }>> = {};

      finalSliceData.forEach((data) => {
        if (data.isCompleted || data.elapsedSeconds > 0) {
          const slice = slices.find((s) => s.id === data.sliceId);
          if (slice) {
            sliceReviews[data.sliceId] = {
              sliceId: data.sliceId,
              actualDurationMinutes: Math.round((data.elapsedSeconds / 60) * 10) / 10,
              isStuck: false,
              stuckDescription: '',
              liveNotes: '',
              selfRating: 3,
              improvementSuggestion: '',
              rehearsalStatus: data.isCompleted ? 'rehearsed' : 'unrehearsed'
            };
          }
        }
      });

      saveReviewDraft({
        sessionStartTime: sessionStartTime || new Date().toISOString(),
        sessionEndTime,
        sessionPlanId: activeSessionPlanId || undefined,
        sliceData: finalSliceData,
        overallNotes: '',
        sliceReviews,
        lastEditedIndex: 0
      });

      setRehearsalMode(false);
      setShowReviewForm(true);
    } else if (option === 'draft') {
      const sessionEndTime = new Date().toISOString();
      const sliceReviews: Record<string, Partial<SliceReview & { rehearsalStatus: RehearsalStep }>> = {};

      finalSliceData.forEach((data) => {
        if (data.isCompleted || data.elapsedSeconds > 0) {
          const slice = slices.find((s) => s.id === data.sliceId);
          if (slice) {
            sliceReviews[data.sliceId] = {
              sliceId: data.sliceId,
              actualDurationMinutes: Math.round((data.elapsedSeconds / 60) * 10) / 10,
              isStuck: false,
              stuckDescription: '',
              liveNotes: '',
              selfRating: 3,
              improvementSuggestion: '',
              rehearsalStatus: data.isCompleted ? 'rehearsed' : 'unrehearsed'
            };
          }
        }
      });

      saveReviewDraft({
        sessionStartTime: sessionStartTime || new Date().toISOString(),
        sessionEndTime,
        sessionPlanId: activeSessionPlanId || undefined,
        sliceData: finalSliceData,
        overallNotes: '',
        sliceReviews,
        lastEditedIndex: currentRehearsalIndex
      });

      setRehearsalMode(false);
      setShowExitConfirm(false);
    } else {
      setRehearsalMode(false);
      setShowExitConfirm(false);
      setActiveSessionPlanId(null);
    }
  };

  if (!currentSlice) return null;

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col animate-fade-in">
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md animate-slide-up border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">退出排练模式</h3>
                <p className="text-sm text-slate-400">本次排练进度：{completedCount}/{activeSlices.length} 个切片</p>
              </div>
            </div>

            <p className="text-slate-300 mb-6">
              已排练的切片将保留计时数据。请选择退出后的操作：
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleExit('review')}
                className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                填写本次复盘
              </button>

              <button
                onClick={() => handleExit('draft')}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                保存为草稿，稍后再填
              </button>

              <button
                onClick={() => handleExit('discard')}
                className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-400 rounded-xl font-medium transition-colors"
              >
                直接退出，不保存
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              排练模式
              {activeSessionPlan && (
                <span className="ml-3 text-sm font-normal text-indigo-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {activeSessionPlan.name}
                </span>
              )}
            </h2>
            <span className="text-slate-400 text-sm">
              {currentRehearsalIndex + 1} / {activeSlices.length}
            </span>
            {activeSessionPlan && (
              <span className="ml-3 text-xs text-indigo-400">
                目标: {formatDuration(activeSessionPlan.targetDurationMinutes)}
              </span>
            )}
          </div>
          <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
            已完成 {completedCount} 个
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-sm">
          {activeSessionPlan && (
            <>
              <span className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30">
                <Target className="w-4 h-4" />
                已用 {formatDuration(Math.ceil(elapsedDuration))} / 目标 {formatDuration(activeSessionPlan.targetDurationMinutes)}
              </span>
            </>
          )}
          {attentionSlices.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
              <Zap className="w-4 h-4" />
              {attentionSlices.length} 个切片需重点关注
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            剩余预计: {formatDuration(Math.ceil(remainingDuration))}
          </span>
          <button
            onClick={() => setShowExitConfirm(true)}
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
            <div className="text-xs text-slate-400 mb-2">当前切片已用时间</div>
            <div className="text-sm text-slate-500 font-mono mb-4">
              {formatTimeDisplay(currentElapsedSeconds)}
            </div>
            <RehearsalTimer
              ref={timerRef}
              key={currentSlice.id}
              durationMinutes={currentSlice.durationMinutes}
              onTimeUp={handleTimeUp}
              onTick={handleTick}
              initialElapsedSeconds={currentElapsedSeconds}
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
                  {currentSliceData?.isCompleted && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      已排练过
                    </span>
                  )}
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
          onClick={() => {
            if (currentRehearsalIndex === activeSlices.length - 1) {
              handleExit('review');
            } else {
              goToNext();
            }
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {currentRehearsalIndex === activeSlices.length - 1 ? '完成排练' : '下一个'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
