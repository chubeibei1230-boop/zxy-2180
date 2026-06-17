import { useState, useMemo } from 'react';
import {
  X,
  Clock,
  AlertCircle,
  StickyNote,
  Star,
  Save,
  ChevronDown,
  ChevronUp,
  Zap,
  FileText,
  CheckCircle2,
  SkipForward
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { SliceReview, SelfRating, RehearsalStep } from '../types';
import { formatDuration, formatTimeDisplay } from '../utils/timeUtils';

const ratingLabels: Record<SelfRating, string> = {
  1: '非常困难',
  2: '比较困难',
  3: '一般',
  4: '比较顺利',
  5: '非常流畅'
};

export const ReviewForm = () => {
  const {
    slices,
    sessionStartTime,
    saveRehearsalReview,
    setShowReviewForm,
    reviewDraft,
    saveReviewDraft,
    clearReviewDraft
  } = useSliceStore();

  const activeSlices = useMemo(() =>
    slices
      .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
      .sort((a, b) => a.orderIndex - b.orderIndex),
    [slices]
  );

  const initialReviews = useMemo(() => {
    if (reviewDraft && Object.keys(reviewDraft.sliceReviews).length > 0) {
      return reviewDraft.sliceReviews as Record<string, SliceReview>;
    }
    const initial: Record<string, SliceReview> = {};
    activeSlices.forEach((slice) => {
      initial[slice.id] = {
        sliceId: slice.id,
        actualDurationMinutes: slice.durationMinutes,
        isStuck: false,
        stuckDescription: '',
        liveNotes: '',
        selfRating: 3 as SelfRating,
        improvementSuggestion: '',
        rehearsalStatus: 'unrehearsed' as RehearsalStep
      };
    });
    return initial;
  }, [reviewDraft, activeSlices]);

  const [expandedSliceId, setExpandedSliceId] = useState<string | null>(
    activeSlices.find((s) => initialReviews[s.id]?.rehearsalStatus === 'rehearsed')?.id
    || activeSlices[0]?.id || null
  );
  const [overallNotes, setOverallNotes] = useState(reviewDraft?.overallNotes || '');
  const [sliceReviews, setSliceReviews] = useState<Record<string, SliceReview>>(initialReviews);
  const [filter, setFilter] = useState<'all' | 'rehearsed' | 'unrehearsed'>('all');

  const sessionEndTime = new Date().toISOString();
  const startTime = reviewDraft?.sessionStartTime || sessionStartTime || new Date().toISOString();

  const rehearsedCount = Object.values(sliceReviews).filter(
    (r) => r.rehearsalStatus === 'rehearsed'
  ).length;

  const totalActualDuration = Object.values(sliceReviews)
    .filter((r) => r.rehearsalStatus === 'rehearsed')
    .reduce((sum, r) => sum + (r.actualDurationMinutes || 0), 0);

  const displayedSlices = useMemo(() => {
    if (filter === 'all') return activeSlices;
    return activeSlices.filter((s) => {
      const status = sliceReviews[s.id]?.rehearsalStatus;
      return filter === 'rehearsed' ? status === 'rehearsed' : status !== 'rehearsed';
    });
  }, [activeSlices, sliceReviews, filter]);

  const updateSliceReview = (sliceId: string, updates: Partial<SliceReview>) => {
    setSliceReviews((prev) => ({
      ...prev,
      [sliceId]: { ...prev[sliceId], ...updates }
    }));
  };

  const handleSubmit = () => {
    const validReviews = Object.values(sliceReviews).filter(
      (r) => r.rehearsalStatus === 'rehearsed' && r.sliceId
    ) as SliceReview[];

    saveRehearsalReview({
      sessionStartTime: startTime,
      sessionEndTime,
      totalActualDurationMinutes: totalActualDuration,
      overallNotes,
      sliceReviews: validReviews
    });
  };

  const handleSaveDraft = () => {
    saveReviewDraft({
      sessionStartTime: startTime,
      sessionEndTime,
      sliceData: [],
      overallNotes,
      sliceReviews: sliceReviews as Record<string, Partial<SliceReview>>,
      lastEditedIndex: 0
    });
  };

  const handleSkip = () => {
    clearReviewDraft();
    setShowReviewForm(false);
  };

  const toggleExpand = (sliceId: string) => {
    setExpandedSliceId(expandedSliceId === sliceId ? null : sliceId);
  };

  const toggleRehearsed = (sliceId: string) => {
    const current = sliceReviews[sliceId];
    const newStatus: RehearsalStep = current.rehearsalStatus === 'rehearsed' ? 'unrehearsed' : 'rehearsed';
    updateSliceReview(sliceId, { rehearsalStatus: newStatus });
  };

  const RatingStars = ({ sliceId, value }: { sliceId: string; value: SelfRating }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => updateSliceReview(sliceId, { selfRating: star as SelfRating })}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 transition-colors ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-600">{ratingLabels[value]}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-xl">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">排练复盘</h2>
              <p className="text-sm text-slate-500">
                记录本次排练的问题和改进建议 · 已排练 {rehearsedCount} 个
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-200">
          <span className="text-sm text-slate-500">筛选：</span>
          {(['all', 'rehearsed', 'unrehearsed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-500 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? '全部' : f === 'rehearsed' ? '已排练' : '未排练'}
            </button>
          ))}
          <div className="ml-auto text-xs text-slate-400">
            点击标题切换排练状态
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">排练切片</p>
              <p className="text-2xl font-bold text-indigo-600">
                {rehearsedCount}
                <span className="text-sm font-normal text-slate-500"> / {activeSlices.length}</span>
              </p>
            </div>
            <div className="text-center border-x border-indigo-200">
              <p className="text-xs text-slate-500 mb-1">预计总时长</p>
              <p className="text-2xl font-bold text-slate-700">
                {formatDuration(activeSlices.reduce((sum, s) => sum + s.durationMinutes, 0))}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">实际总时长</p>
              <p className="text-2xl font-bold text-emerald-600">{formatDuration(totalActualDuration)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              各切片复盘详情
            </h3>

            {displayedSlices.length > 0 ? (
              displayedSlices.map((slice) => {
                const review = sliceReviews[slice.id];
                const isExpanded = expandedSliceId === slice.id;
                const isRehearsed = review?.rehearsalStatus === 'rehearsed';
                const hasIssues = isRehearsed && (
                  review.isStuck ||
                  review.actualDurationMinutes > slice.durationMinutes ||
                  review.selfRating <= 2
                );

                return (
                  <div
                    key={slice.id}
                    className={`rounded-xl border-2 transition-all ${
                      !isRehearsed
                        ? 'border-slate-200 bg-slate-50/50 opacity-70'
                        : hasIssues
                        ? 'border-amber-300 bg-amber-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => toggleExpand(slice.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRehearsed(slice.id);
                        }}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                          isRehearsed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                        }`}
                      >
                        {isRehearsed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <SkipForward className="w-4 h-4" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold truncate ${isRehearsed ? 'text-slate-800' : 'text-slate-500'}`}>
                            {slice.title}
                          </h4>
                          {!isRehearsed && (
                            <span className="px-2 py-0.5 text-xs bg-slate-200 text-slate-500 rounded-full">
                              未排练
                            </span>
                          )}
                          {hasIssues && (
                            <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              待优化
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          预计 {slice.durationMinutes} 分钟
                          {isRehearsed && ` · 自评 ${review.selfRating || 3}/5`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isRehearsed && (
                          <div className="text-right">
                            <p className="text-xs text-slate-500">实际时长</p>
                            <p className={`text-sm font-semibold ${
                              review.actualDurationMinutes > slice.durationMinutes
                                ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {review.actualDurationMinutes || 0} 分钟
                            </p>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
                        {!isRehearsed ? (
                          <div className="text-center py-8">
                            <SkipForward className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="text-slate-500 text-sm mb-3">该切片标记为未排练</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRehearsed(slice.id);
                              }}
                              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
                            >
                              标记为已排练
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  实际耗时（分钟）
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={review.actualDurationMinutes || 0}
                                  onChange={(e) => updateSliceReview(slice.id, {
                                    actualDurationMinutes: parseFloat(e.target.value) || 0
                                  })}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                {review.actualDurationMinutes > slice.durationMinutes && (
                                  <p className="mt-1 text-xs text-red-600">
                                    ⚠️ 超出预计时间 {(review.actualDurationMinutes - slice.durationMinutes).toFixed(1)} 分钟
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  计时记录
                                </label>
                                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-sm text-slate-600">
                                  {formatTimeDisplay(Math.round((review.actualDurationMinutes || 0) * 60))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                是否有卡顿/忘词
                              </label>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={!review.isStuck}
                                    onChange={() => updateSliceReview(slice.id, { isStuck: false })}
                                    className="w-4 h-4 text-emerald-600"
                                  />
                                  <span className="text-sm text-slate-600">流畅完成</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    checked={review.isStuck}
                                    onChange={() => updateSliceReview(slice.id, { isStuck: true })}
                                    className="w-4 h-4 text-amber-600"
                                  />
                                  <span className="text-sm text-slate-600">有卡顿</span>
                                </label>
                              </div>
                            </div>

                            {review.isStuck && (
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  卡顿描述（哪些片段出问题了）
                                </label>
                                <textarea
                                  value={review.stuckDescription || ''}
                                  onChange={(e) => updateSliceReview(slice.id, { stuckDescription: e.target.value })}
                                  rows={2}
                                  placeholder="例如：在讲年代部分时容易混淆，最后一段过渡词经常忘..."
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                自评表现
                              </label>
                              <RatingStars sliceId={slice.id} value={(review.selfRating || 3) as SelfRating} />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <StickyNote className="w-4 h-4" />
                                临场备注
                              </label>
                              <textarea
                                value={review.liveNotes || ''}
                                onChange={(e) => updateSliceReview(slice.id, { liveNotes: e.target.value })}
                                rows={2}
                                placeholder="记录排练时的临时想法、观众可能的反应等..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                改进建议
                              </label>
                              <textarea
                                value={review.improvementSuggestion || ''}
                                onChange={(e) => updateSliceReview(slice.id, { improvementSuggestion: e.target.value })}
                                rows={2}
                                placeholder="下次排练时要注意什么？需要调整讲解词的哪些部分？"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400">
                该分类下暂无切片
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              本次排练整体备注
            </label>
            <textarea
              value={overallNotes}
              onChange={(e) => setOverallNotes(e.target.value)}
              rows={3}
              placeholder="整体表现如何？有哪些需要在下次排练前统一调整的地方？"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleSaveDraft}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            保存草稿
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSkip}
              className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={rehearsedCount === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <Save className="w-4 h-4" />
              保存复盘记录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
