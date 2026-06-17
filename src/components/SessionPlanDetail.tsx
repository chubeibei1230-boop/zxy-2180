import { useState, useMemo } from 'react';
import {
  X,
  ArrowLeft,
  Play,
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Star,
  TrendingUp,
  Download,
  Edit2,
  Target,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { formatDuration } from '../utils/timeUtils';
import { ExhibitionSlice } from '../types';

interface SessionPlanDetailProps {
  planId: string;
  onClose: () => void;
}

export const SessionPlanDetail = ({ planId, onClose }: SessionPlanDetailProps) => {
  const {
    getSessionPlan,
    getSessionPlanDuration,
    getSessionPlanDurationRisk,
    getSessionPlanActiveSlices,
    getSessionPlanReviews,
    startRehearsalWithPlan,
    exportSessionPlanChecklist,
    setShowSessionPlanForm,
    setEditingSessionPlanId,
    slices
  } = useSliceStore();

  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'slices' | 'reviews'>('slices');

  const plan = getSessionPlan(planId);
  const totalDuration = getSessionPlanDuration(planId);
  const durationRisk = getSessionPlanDurationRisk(planId);
  const activeSlices = getSessionPlanActiveSlices(planId);
  const reviews = getSessionPlanReviews(planId);
  const excludedSlices = plan?.slices
    .filter((s) => s.isExcluded)
    .map((s) => slices.find((slice) => slice.id === s.sliceId))
    .filter((s): s is ExhibitionSlice => s !== undefined) || [];

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartRehearsal = () => {
    startRehearsalWithPlan(planId);
    onClose();
  };

  const handleEdit = () => {
    setEditingSessionPlanId(planId);
    setShowSessionPlanForm(true);
  };

  const getRiskColor = () => {
    switch (durationRisk.level) {
      case 'danger':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      default:
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getRiskIcon = () => {
    switch (durationRisk.level) {
      case 'danger':
        return <AlertTriangle className="w-6 h-6" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <CheckCircle className="w-6 h-6" />;
    }
  };

  const getRiskText = () => {
    if (durationRisk.level === 'danger') {
      return '超时高风险';
    } else if (durationRisk.level === 'warning' && durationRisk.diffMinutes > 0) {
      return '轻微超时风险';
    } else if (durationRisk.level === 'warning' && durationRisk.diffMinutes < 0) {
      return '时长偏短';
    }
    return '时长正常';
  };

  const RatingDisplay = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${
            s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  );

  const reviewSummary = useMemo(() => {
    if (reviews.length === 0) return null;
    const allRatings = reviews.flatMap((r) =>
      r.sliceReviews.filter((s) => s.rehearsalStatus === 'rehearsed').map((s) => s.selfRating)
    );
    const avgRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    const allSliceReviews = reviews.flatMap((r) => r.sliceReviews);
    const lowRatingSlices = allSliceReviews.filter((r) => r.selfRating <= 2 && r.rehearsalStatus === 'rehearsed');
    const stuckSlices = allSliceReviews.filter((r) => r.isStuck && r.rehearsalStatus === 'rehearsed');
    
    const timeoutSlices = allSliceReviews.filter((r) => {
      const slice = slices.find((s) => s.id === r.sliceId);
      return slice && r.actualDurationMinutes > slice.durationMinutes && r.rehearsalStatus === 'rehearsed';
    });

    return {
      totalReviews: reviews.length,
      avgRating,
      lowRatingCount: lowRatingSlices.length,
      stuckCount: stuckSlices.length,
      timeoutCount: timeoutSlices.length
    };
  }, [reviews, slices]);

  if (!plan) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{plan.name}</h2>
              <p className="text-sm text-slate-500">场次计划详情</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              编辑
            </button>
            <button
              onClick={() => exportSessionPlanChecklist(planId)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Target className="w-3.5 h-3.5" />
              目标时长
            </div>
            <p className="text-lg font-bold text-slate-800">
              {formatDuration(plan.targetDurationMinutes)}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Clock className="w-3.5 h-3.5" />
              预计总时长
            </div>
            <p className="text-lg font-bold text-slate-800">
              {formatDuration(totalDuration)}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" />
              预计开始
            </div>
            <p className="text-sm font-bold text-slate-800">
              {formatDateTime(plan.scheduledStartTime)}
            </p>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Users className="w-3.5 h-3.5" />
              讲解对象
            </div>
            <p className="text-sm font-bold text-slate-800 truncate">
              {plan.audience || '未设置'}
            </p>
          </div>
        </div>

        <div className={`mx-6 mt-4 p-4 rounded-xl border ${getRiskColor()}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getRiskIcon()}
              <div>
                <p className="font-semibold">{getRiskText()}</p>
                <p className="text-sm opacity-80">
                  {durationRisk.diffMinutes > 0 ? (
                    <>预计超出目标 {formatDuration(durationRisk.diffMinutes)} ({durationRisk.percent.toFixed(1)}%)</>
                  ) : durationRisk.diffMinutes < 0 ? (
                    <>预计少于目标 {formatDuration(Math.abs(durationRisk.diffMinutes))} ({Math.abs(durationRisk.percent).toFixed(1)}% 缓冲)</>
                  ) : (
                    <>与目标时长完全匹配</>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartRehearsal}
              disabled={activeSlices.length === 0}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-800 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
              开始排练
            </button>
          </div>
          {durationRisk.level !== 'normal' && (
            <p className="text-sm mt-3 pt-3 border-t border-current/20 opacity-80">
              {durationRisk.level === 'danger'
                ? '⚠️ 时长严重超标！建议减少切片数量、精简内容或缩短每个切片的讲解时间'
                : durationRisk.diffMinutes > 0
                ? '⚠️ 时长略有超出，请注意控制讲解节奏，可适当精简次要内容'
                : '💡 时长偏短，可考虑增加内容深度、放慢语速或增加互动环节'}
            </p>
          )}
        </div>

        <div className="flex gap-1 px-6 pt-4 border-b border-slate-100">
          {[
            { id: 'slices', label: '切片列表', icon: MessageSquare },
            { id: 'reviews', label: '复盘记录', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors -mb-px ${
                  isActive
                    ? 'bg-white text-indigo-600 border border-b-0 border-slate-200'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === 'slices' && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {activeSlices.length}
                  </span>
                )}
                {tab.id === 'reviews' && reviews.length > 0 && (
                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {reviews.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'slices' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  本场切片 ({activeSlices.length} 个)
                </h3>
                <div className="space-y-2">
                  {activeSlices.map((slice, index) => (
                    <div
                      key={slice.id}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm transition-all"
                    >
                      <div className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-800 truncate">
                          {slice.title}
                        </h4>
                        <p className="text-sm text-slate-500 truncate">{slice.exhibit}</p>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        {slice.durationMinutes}分钟
                      </div>
                      <div className="w-px h-8 bg-slate-200" />
                      <div className="text-right w-24">
                        <p className="text-xs text-slate-500">累计</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDuration(
                            activeSlices
                              .slice(0, index + 1)
                              .reduce((sum, s) => sum + s.durationMinutes, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {excludedSlices.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-500 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-slate-400" />
                    临时排除 ({excludedSlices.length} 个)
                  </h3>
                  <div className="space-y-2">
                    {excludedSlices.map((slice) => (
                      <div
                        key={slice.id}
                        className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 opacity-60"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-200 text-slate-500 rounded-lg font-bold text-sm line-through">
                          -
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-600 truncate line-through">
                            {slice.title}
                          </h4>
                          <p className="text-sm text-slate-400 truncate">{slice.exhibit}</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Clock className="w-4 h-4" />
                          {slice.durationMinutes}分钟
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {reviewSummary && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-indigo-700">
                      {reviewSummary.totalReviews}
                    </p>
                    <p className="text-xs text-indigo-600">复盘次数</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-700">
                      {reviewSummary.avgRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-amber-600">平均评分</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-red-700">
                      {reviewSummary.timeoutCount}
                    </p>
                    <p className="text-xs text-red-600">超时次数</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {reviewSummary.stuckCount}
                    </p>
                    <p className="text-xs text-purple-600">卡顿次数</p>
                  </div>
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((record, idx) => {
                    const avgRating = record.sliceReviews.length > 0
                      ? record.sliceReviews.reduce((s, r) => s + r.selfRating, 0) / record.sliceReviews.length
                      : 0;
                    const timeoutCount = record.sliceReviews.filter((r) => {
                      const sl = slices.find((s) => s.id === r.sliceId);
                      return sl && r.actualDurationMinutes > sl.durationMinutes;
                    }).length;
                    const stuckCount = record.sliceReviews.filter((r) => r.isStuck).length;
                    const lowRatingCount = record.sliceReviews.filter(
                      (r) => r.selfRating <= 2 && r.rehearsalStatus === 'rehearsed'
                    ).length;
                    const isExpanded = expandedReviewId === record.id;

                    return (
                      <div
                        key={record.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                      >
                        <div
                          className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedReviewId(isExpanded ? null : record.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
                                #{reviews.length - idx}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800">
                                  第 {reviews.length - idx} 次排练复盘
                                </h4>
                                <p className="text-xs text-slate-500">
                                  {formatDateTime(record.createdAt)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-700">
                                  {formatDuration(record.totalActualDurationMinutes)}
                                </p>
                                <p className="text-xs text-slate-500">实际总时长</p>
                              </div>
                              <RatingDisplay rating={Math.round(avgRating)} />
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-100">
                            <div className="text-center">
                              <span className="text-red-500 text-xs">超时: </span>
                              <span className="text-sm font-semibold text-red-600">
                                {timeoutCount} 个
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-amber-500 text-xs">卡顿: </span>
                              <span className="text-sm font-semibold text-amber-600">
                                {stuckCount} 个
                              </span>
                            </div>
                            <div className="text-center">
                              <span className="text-purple-500 text-xs">低分: </span>
                              <span className="text-sm font-semibold text-purple-600">
                                {lowRatingCount} 个
                              </span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-slate-100">
                            {record.overallNotes && (
                              <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                                <p className="text-xs text-indigo-600 mb-1">📝 整体备注</p>
                                <p className="text-sm text-indigo-800">
                                  {record.overallNotes}
                                </p>
                              </div>
                            )}

                            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                              {record.sliceReviews.map((review) => {
                                const slice = slices.find((s) => s.id === review.sliceId);
                                if (!slice) return null;
                                const hasTimeout = review.actualDurationMinutes > slice.durationMinutes;

                                return (
                                  <div
                                    key={review.sliceId}
                                    className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 truncate">
                                        {slice.title}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {review.rehearsalStatus === 'rehearsed' ? (
                                          <>
                                            {formatDuration(review.actualDurationMinutes)}
                                            {hasTimeout && (
                                              <span className="text-red-500 ml-1">
                                                (超{(review.actualDurationMinutes - slice.durationMinutes).toFixed(1)}分)
                                              </span>
                                            )}
                                            {review.isStuck && (
                                              <span className="text-amber-500 ml-2">· 卡顿</span>
                                            )}
                                          </>
                                        ) : (
                                          <span className="text-slate-400">未排练</span>
                                        )}
                                      </p>
                                    </div>
                                    {review.rehearsalStatus === 'rehearsed' && (
                                      <RatingDisplay rating={review.selfRating} />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    暂无复盘记录
                  </h3>
                  <p className="text-slate-500 text-sm mb-6">
                    完成排练后记得填写复盘记录
                  </p>
                  <button
                    onClick={handleStartRehearsal}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    开始第一次排练
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
