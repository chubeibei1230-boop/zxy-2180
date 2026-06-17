import { useMemo, useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  Star,
  ChevronRight,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  Zap,
  Filter,
  FileText
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { ExhibitionSlice, ReviewFlagType } from '../types';
import { formatDuration } from '../utils/timeUtils';

const flagConfig: Record<ReviewFlagType, { label: string; color: string; icon: React.ElementType }> = {
  timeout: {
    label: '易超时',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: Clock
  },
  stuck: {
    label: '易卡顿',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: AlertTriangle
  },
  lowRating: {
    label: '自评较低',
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    icon: Star
  }
};

interface ReviewPanelProps {
  onClose: () => void;
  onJumpToSlice?: (slice: ExhibitionSlice) => void;
  onViewReport?: (recordId: string) => void;
}

export const ReviewPanel = ({ onClose, onJumpToSlice, onViewReport }: ReviewPanelProps) => {
  const { getReviewSummary, getPriorityOptimizationSlices, slices, getAllReviewRecords, sessionPlans } = useSliceStore();

  const summary = getReviewSummary();
  const prioritySlices = getPriorityOptimizationSlices();
  const allRecords = getAllReviewRecords();
  const [selectedTab, setSelectedTab] = useState<'summary' | 'priority' | 'history'>('summary');
  const [selectedSessionPlanId, setSelectedSessionPlanId] = useState<string | null>(null);

  const allSlicesMap = useMemo(() => {
    const map = new Map<string, ExhibitionSlice>();
    slices.forEach((s) => map.set(s.id, s));
    return map;
  }, [slices]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">排练复盘中心</h2>
              <p className="text-sm text-slate-500">查看历史复盘数据，发现需要优化的切片</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-slate-100">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">复盘次数</span>
            </div>
            <p className="text-2xl font-bold text-indigo-700">{summary.totalReviews}</p>
            <p className="text-xs text-indigo-500 mt-0.5">
              {summary.lastReviewDate ? `上次: ${formatDate(summary.lastReviewDate)}` : '暂无记录'}
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-600 font-medium">平均自评</span>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '-'}{' '}
              <span className="text-sm font-normal">/ 5.0</span>
            </p>
            <RatingDisplay rating={Math.round(summary.averageRating)} />
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-red-500" />
              <span className="text-xs text-red-600 font-medium">超时切片</span>
            </div>
            <p className="text-2xl font-bold text-red-700">{summary.timeoutSlices.length}</p>
            <p className="text-xs text-red-500 mt-0.5">需要控制讲解时长</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-purple-600 font-medium">待优化切片</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{prioritySlices.length}</p>
            <p className="text-xs text-purple-500 mt-0.5">标记了问题需要处理</p>
          </div>
        </div>

        <div className="flex gap-1 px-6 py-2 border-b border-slate-100 bg-slate-50">
          {[
            { id: 'summary', label: '问题汇总', icon: AlertCircle },
            { id: 'priority', label: '优先优化', icon: Target },
            { id: 'history', label: '历史记录', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as typeof selectedTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'summary' && (
            <div className="space-y-6">
              {(['timeout', 'stuck', 'lowRating'] as ReviewFlagType[]).map((flagType) => {
                const config = flagConfig[flagType];
                const FlagIcon = config.icon;
                const sliceIds = summary[`${flagType}Slices` as keyof typeof summary] as string[];
                const relatedSlices = sliceIds
                  .map((id) => allSlicesMap.get(id))
                  .filter((s): s is ExhibitionSlice => s !== undefined);

                return (
                  <div key={flagType} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className={`px-4 py-3 flex items-center gap-2 border-b border-slate-200 ${config.color}`}>
                      <FlagIcon className="w-4 h-4" />
                      <span className="font-semibold">{config.label}切片</span>
                      <span className="ml-auto text-sm">{relatedSlices.length} 个</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {relatedSlices.length > 0 ? (
                        relatedSlices.map((slice) => (
                          <div
                            key={slice.id}
                            className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => onJumpToSlice?.(slice)}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-800 truncate">{slice.title}</h4>
                              <p className="text-xs text-slate-500">
                                {slice.exhibit} · 预计 {slice.durationMinutes} 分钟
                              </p>
                            </div>
                            {slice.lastReview && (
                              <div className="ml-4 text-right">
                                <p className="text-xs text-slate-500">上次自评</p>
                                <RatingDisplay rating={slice.lastReview.selfRating} />
                              </div>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-300 ml-2" />
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                          暂无{config.label}的切片，继续加油！
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedTab === 'priority' && (
            <div className="space-y-3">
              {prioritySlices.length > 0 ? (
                prioritySlices.map((slice, index) => (
                  <div
                    key={slice.id}
                    className="p-4 bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:shadow-md cursor-pointer transition-all"
                    onClick={() => onJumpToSlice?.(slice)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-lg font-bold text-sm shadow-md">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-semibold text-slate-800">{slice.title}</h4>
                          <div className="flex gap-1">
                            {slice.reviewFlags.map((flag) => {
                              const cfg = flagConfig[flag];
                              const FlagIcon = cfg.icon;
                              return (
                                <span
                                  key={flag}
                                  className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${cfg.color}`}
                                >
                                  <FlagIcon className="w-3 h-3" />
                                  {cfg.label}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">
                          {slice.exhibit} · 已复盘 {slice.reviewCount} 次
                        </p>
                        {slice.lastReview && (
                          <div className="grid grid-cols-3 gap-3 p-3 bg-white rounded-lg border border-slate-100">
                            <div>
                              <p className="text-xs text-slate-400">实际时长</p>
                              <p className={`text-sm font-semibold ${
                                slice.lastReview.actualDurationMinutes > slice.durationMinutes
                                  ? 'text-red-600' : 'text-emerald-600'
                              }`}>
                                {formatDuration(slice.lastReview.actualDurationMinutes)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">自评得分</p>
                              <RatingDisplay rating={slice.lastReview.selfRating} />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">卡顿情况</p>
                              <p className={`text-sm font-semibold ${
                                slice.lastReview.isStuck ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {slice.lastReview.isStuck ? '有卡顿' : '流畅'}
                              </p>
                            </div>
                          </div>
                        )}
                        {slice.lastReview?.improvementSuggestion && (
                          <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                            <p className="text-xs text-indigo-700">
                              💡 {slice.lastReview.improvementSuggestion}
                            </p>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                    <Zap className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">太棒了！暂无待优化切片</h3>
                  <p className="text-slate-500 text-sm">
                    完成排练后记得填写复盘记录，这里会展示需要优先改进的内容
                  </p>
                </div>
              )}
            </div>
          )}

          {selectedTab === 'history' && (
            <div className="space-y-4">
              {sessionPlans.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600">按场次筛选：</span>
                  <select
                    value={selectedSessionPlanId || ''}
                    onChange={(e) => setSelectedSessionPlanId(e.target.value || null)}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">全部场次</option>
                    {sessionPlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(selectedSessionPlanId ? allRecords.filter(r => r.sessionPlanId === selectedSessionPlanId) : allRecords).length > 0 ? (
                (selectedSessionPlanId ? allRecords.filter(r => r.sessionPlanId === selectedSessionPlanId) : allRecords).map((record, recordIndex, filteredArray) => {
                  const avgRating = record.sliceReviews.length > 0
                    ? record.sliceReviews.reduce((sum, r) => sum + r.selfRating, 0) / record.sliceReviews.length
                    : 0;
                  const timeoutCount = record.sliceReviews.filter((r) => {
                    const slice = allSlicesMap.get(r.sliceId);
                    return slice && r.actualDurationMinutes > slice.durationMinutes;
                  }).length;
                  const stuckCount = record.sliceReviews.filter((r) => r.isStuck).length;
                  const rehearsedCount = record.sliceReviews.filter(
                    (r) => r.rehearsalStatus === 'rehearsed'
                  ).length;

                  const sessionPlan = record.sessionPlanId
                    ? sessionPlans.find((p) => p.id === record.sessionPlanId)
                    : null;

                  return (
                    <div
                      key={record.id}
                      className="rounded-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-lg flex items-center justify-center text-white font-bold">
                            #{filteredArray.length - recordIndex}
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {sessionPlan ? sessionPlan.name : `第 ${filteredArray.length - recordIndex} 次排练`}
                            </h4>
                            <p className="text-xs text-slate-500">
                              {formatDate(record.sessionStartTime)} - {formatDate(record.sessionEndTime)}
                              {!sessionPlan && ' · 无场次计划'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-slate-400">总时长</p>
                            <p className="font-semibold text-slate-700">
                              {formatDuration(record.totalActualDurationMinutes)}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-slate-400">平均得分</p>
                            <RatingDisplay rating={Math.round(avgRating)} />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-slate-100 text-center text-sm">
                        <div>
                          <span className="text-slate-400">已排练: </span>
                          <span className="font-semibold text-slate-700">{rehearsedCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">总数: </span>
                          <span className="font-semibold text-slate-700">{record.sliceReviews.length}</span>
                        </div>
                        <div>
                          <span className="text-red-500">超时: </span>
                          <span className="font-semibold text-red-600">{timeoutCount}</span>
                        </div>
                        <div>
                          <span className="text-amber-500">卡顿: </span>
                          <span className="font-semibold text-amber-600">{stuckCount}</span>
                        </div>
                      </div>

                      {record.overallNotes && (
                        <div className="px-4 py-3 bg-indigo-50/50 border-b border-indigo-100">
                          <p className="text-xs text-indigo-600 mb-1">📝 整体备注</p>
                          <p className="text-sm text-indigo-800">{record.overallNotes}</p>
                        </div>
                      )}

                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {record.sliceReviews.map((review) => {
                          const slice = allSlicesMap.get(review.sliceId);
                          if (!slice) return null;
                          const hasTimeout = review.actualDurationMinutes > slice.durationMinutes;

                          return (
                            <div key={review.sliceId} className="px-4 py-2 flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 truncate">
                                  {slice.title}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {review.rehearsalStatus === 'rehearsed' ? (
                                    <>
                                      {formatDuration(review.actualDurationMinutes)}
                                      {hasTimeout && (
                                        <span className="text-red-500 ml-1">
                                          (+{(review.actualDurationMinutes - slice.durationMinutes).toFixed(1)}分)
                                        </span>
                                      )}
                                      {review.isStuck && <span className="text-amber-500 ml-2">· 卡顿</span>}
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
                      {onViewReport && (
                        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                          <button
                            onClick={() => onViewReport(record.id)}
                            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-4 h-4" />
                            查看详细复盘报告
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-50 rounded-full flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">
                    {selectedSessionPlanId ? '该场次暂无复盘记录' : '暂无历史复盘记录'}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {selectedSessionPlanId
                      ? '这个场次计划还没有排练复盘记录'
                      : '完成一次排练并填写复盘记录后，这里会展示你的历史数据'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
