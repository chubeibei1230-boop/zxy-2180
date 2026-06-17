import { useMemo, useRef, useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  Star,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  Zap,
  Filter,
  Download,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  Edit3,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { ReviewFlagType, ReviewReportSliceData, ExhibitionSlice } from '../types';
import { formatDuration } from '../utils/timeUtils';

const flagConfig: Record<ReviewFlagType, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  timeout: {
    label: '超时',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Clock
  },
  stuck: {
    label: '卡顿',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: AlertTriangle
  },
  lowRating: {
    label: '低评分',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Star
  }
};

interface ReviewReportProps {
  onClose: () => void;
  onJumpToSlice?: (slice: ExhibitionSlice) => void;
}

export const ReviewReport = ({ onClose, onJumpToSlice }: ReviewReportProps) => {
  const {
    getAllReviewRecords,
    getReviewReportData,
    sessionPlans,
    slices,
    exportReviewReport,
    viewingReviewRecordId
  } = useSliceStore();

  const allRecords = getAllReviewRecords();
  const [selectedSessionPlanId, setSelectedSessionPlanId] = useState<string | null>(null);
  const [activeRecordId, setActiveRecordId] = useState<string | null>(viewingReviewRecordId || (allRecords.length > 0 ? allRecords[0].id : null));
  const [expandedSliceId, setExpandedSliceId] = useState<string | null>(null);
  const [showRecordList, setShowRecordList] = useState(false);
  const sliceRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const reportData = useMemo(() => {
    if (!activeRecordId) return undefined;
    return getReviewReportData(activeRecordId);
  }, [activeRecordId, getReviewReportData]);

  const filteredRecords = useMemo(() => {
    if (selectedSessionPlanId) {
      return allRecords.filter((r) => r.sessionPlanId === selectedSessionPlanId);
    }
    return allRecords;
  }, [allRecords, selectedSessionPlanId]);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const RatingDisplay = ({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`${sizeClass} ${
              s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSelectRecord = (recordId: string) => {
    setActiveRecordId(recordId);
    setExpandedSliceId(null);
    setShowRecordList(false);
  };

  const handleJumpToPrioritySlice = (sliceData: ReviewReportSliceData) => {
    setExpandedSliceId(sliceData.sliceId);
    setTimeout(() => {
      const el = sliceRefs.current[sliceData.sliceId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.4)';
        setTimeout(() => {
          el.style.boxShadow = '';
        }, 2000);
      }
    }, 100);
  };

  const handleEditSlice = (sliceData: ReviewReportSliceData) => {
    const slice = slices.find((s) => s.id === sliceData.sliceId);
    if (slice && onJumpToSlice) {
      onJumpToSlice(slice);
      onClose();
    }
  };

  const getDurationStatus = (planned: number, actual: number) => {
    const diff = actual - planned;
    const percent = planned > 0 ? (diff / planned) * 100 : 0;
    if (percent >= 20) return { level: 'danger', text: '严重超时', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (percent >= 10) return { level: 'warning', text: '略微超时', color: 'text-amber-600', bgColor: 'bg-amber-50' };
    if (percent < -10) return { level: 'warning', text: '提前较多', color: 'text-blue-600', bgColor: 'bg-blue-50' };
    return { level: 'normal', text: '时长正常', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  };

  const ProgressBar = ({ planned, actual }: { planned: number; actual: number }) => {
    const percent = planned > 0 ? Math.min((actual / planned) * 100, 150) : 0;
    const barColor = percent > 120 ? 'bg-red-500' : percent > 100 ? 'bg-amber-500' : 'bg-emerald-500';
    return (
      <div className="w-full">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden relative">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
          {percent > 100 && (
            <div
              className="h-full bg-red-400/50 rounded-r-full absolute top-0 left-0"
              style={{ width: `${Math.min(percent, 150) - 100}%`, marginLeft: '66.67%' }}
            />
          )}
          <div
            className="absolute top-0 h-full w-0.5 bg-slate-400"
            style={{ left: '66.67%' }}
          />
        </div>
      </div>
    );
  };

  const SliceDetailCard = ({ sliceData, index }: { sliceData: ReviewReportSliceData; index: number }) => {
    const isExpanded = expandedSliceId === sliceData.sliceId;
    const durationStatus = getDurationStatus(sliceData.plannedDurationMinutes, sliceData.actualDurationMinutes);
    const isRehearsed = sliceData.rehearsalStatus === 'rehearsed';

    return (
      <div
        ref={(el) => { sliceRefs.current[sliceData.sliceId] = el; }}
        className={`rounded-xl border overflow-hidden transition-all duration-300 ${
          sliceData.isPriority
            ? 'border-orange-300 bg-gradient-to-br from-orange-50/50 to-white'
            : 'border-slate-200 bg-white'
        }`}
      >
        <div
          className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
          onClick={() => setExpandedSliceId(isExpanded ? null : sliceData.sliceId)}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            sliceData.isPriority ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-medium text-slate-800 truncate">{sliceData.sliceTitle}</h4>
              {sliceData.isPriority && (
                <span className="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded font-medium">
                  优先优化
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 truncate">{sliceData.exhibit}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">实际时长</p>
              <p className={`text-sm font-semibold ${durationStatus.color}`}>
                {formatDuration(sliceData.actualDurationMinutes)}
              </p>
            </div>
            {isRehearsed && (
              <div className="hidden md:block">
                <RatingDisplay rating={sliceData.selfRating} size="sm" />
              </div>
            )}
            <div className="flex gap-1">
              {sliceData.flags.map((flag) => {
                const cfg = flagConfig[flag];
                const FlagIcon = cfg.icon;
                return (
                  <span
                    key={flag}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border`}
                    title={cfg.label}
                  >
                    <FlagIcon className="w-3.5 h-3.5" />
                  </span>
                );
              })}
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>

        {isExpanded && isRehearsed && (
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">时长对比</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">计划时长</span>
                    <span className="font-medium text-slate-700">{formatDuration(sliceData.plannedDurationMinutes)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">实际时长</span>
                    <span className={`font-semibold ${durationStatus.color}`}>{formatDuration(sliceData.actualDurationMinutes)}</span>
                  </div>
                  <ProgressBar planned={sliceData.plannedDurationMinutes} actual={sliceData.actualDurationMinutes} />
                  <div className={`text-xs text-center py-1 rounded ${durationStatus.bgColor} ${durationStatus.color}`}>
                    {durationStatus.text}
                    {sliceData.actualDurationMinutes !== sliceData.plannedDurationMinutes && (
                      <span className="ml-1">
                        ({sliceData.actualDurationMinutes > sliceData.plannedDurationMinutes ? '+' : ''}
                        {(sliceData.actualDurationMinutes - sliceData.plannedDurationMinutes).toFixed(1)} 分钟)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700">自评得分</span>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <RatingDisplay rating={sliceData.selfRating} size="lg" />
                  <span className="text-2xl font-bold text-slate-700">{sliceData.selfRating}</span>
                  <span className="text-slate-400">/ 5</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {sliceData.isStuck ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      有卡顿
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                      <CheckCircle2 className="w-3 h-3" />
                      流畅
                    </span>
                  )}
                </div>
              </div>
            </div>

            {sliceData.isStuck && sliceData.stuckDescription && (
              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">卡顿描述</span>
                </div>
                <p className="text-sm text-amber-700">{sliceData.stuckDescription}</p>
              </div>
            )}

            {sliceData.liveNotes && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">临场备注</span>
                </div>
                <p className="text-sm text-blue-700">{sliceData.liveNotes}</p>
              </div>
            )}

            {sliceData.improvementSuggestion && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">改进建议</span>
                </div>
                <p className="text-sm text-emerald-700">{sliceData.improvementSuggestion}</p>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSlice(sliceData);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                编辑讲解词
              </button>
            </div>
          </div>
        )}

        {isExpanded && !isRehearsed && (
          <div className="px-4 pb-4 border-t border-slate-100">
            <div className="py-6 text-center text-slate-400">
              <XCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">该切片本次未排练</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!reportData && allRecords.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">场次复盘报告</h2>
                <p className="text-sm text-slate-500">查看单次排练的详细复盘数据</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">暂无复盘记录</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                完成一次排练并填写复盘记录后，就可以在这里查看详细的复盘报告了
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">场次复盘报告</h2>
              <p className="text-sm text-slate-500">
                {reportData?.sessionPlanName || '未关联场次计划'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => reportData && exportReviewReport(reportData.recordId)}
              disabled={!reportData}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-4 flex-shrink-0">
          <div className="relative flex-1 max-w-sm">
            <button
              onClick={() => setShowRecordList(!showRecordList)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
            >
              <span className="text-slate-700 font-medium">
                {reportData ? formatDateShort(reportData.sessionStartTime) : '选择复盘记录'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showRecordList ? 'rotate-180' : ''}`} />
            </button>
            {showRecordList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {sessionPlans.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 px-2 py-1">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={selectedSessionPlanId || ''}
                        onChange={(e) => setSelectedSessionPlanId(e.target.value || null)}
                        className="flex-1 text-sm border-0 focus:ring-0 p-0 bg-transparent"
                      >
                        <option value="">全部场次</option>
                        {sessionPlans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record, idx) => {
                    const plan = record.sessionPlanId
                      ? sessionPlans.find((p) => p.id === record.sessionPlanId)
                      : null;
                    const isActive = record.id === activeRecordId;
                    return (
                      <button
                        key={record.id}
                        onClick={() => handleSelectRecord(record.id)}
                        className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors ${
                          isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {plan?.name || `第 ${filteredRecords.length - idx} 次排练`}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDateShort(record.sessionStartTime)}
                            </p>
                          </div>
                          <div className="text-xs text-slate-500">
                            {formatDuration(record.totalActualDurationMinutes)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm">
                    暂无复盘记录
                  </div>
                )}
              </div>
            )}
          </div>
          {reportData && (
            <div className="flex items-center gap-4 text-sm text-slate-600 flex-1 justify-end">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDateTime(reportData.sessionStartTime)}
              </span>
              {reportData.audience && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {reportData.audience}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {reportData ? (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-indigo-600 font-medium">实际总时长</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">
                    {formatDuration(reportData.totalActualDurationMinutes)}
                  </p>
                  <p className="text-xs text-indigo-500 mt-1">
                    计划: {formatDuration(reportData.totalPlannedDurationMinutes)}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-amber-600 font-medium">平均自评</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-700">
                    {reportData.averageRating > 0 ? reportData.averageRating.toFixed(1) : '-'}
                  </p>
                  <div className="mt-1">
                    <RatingDisplay rating={Math.round(reportData.averageRating)} size="sm" />
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">排练完成</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-700">
                    {reportData.rehearsedSlices} / {reportData.totalSlices}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">
                    {reportData.skippedSlices > 0
                      ? `${reportData.skippedSlices} 个未排练`
                      : '全部完成'}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs text-red-600 font-medium">问题切片</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700">
                    {reportData.prioritySlices.length}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    超时 {reportData.timeoutCount} · 卡顿 {reportData.stuckCount} · 低分 {reportData.lowRatingCount}
                  </p>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  整体表现
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">时长完成度</span>
                      <span className={`text-sm font-semibold ${
                        reportData.totalActualDurationMinutes > reportData.totalPlannedDurationMinutes
                          ? 'text-red-600'
                          : reportData.totalActualDurationMinutes < reportData.totalPlannedDurationMinutes * 0.9
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                      }`}>
                        {reportData.totalPlannedDurationMinutes > 0
                          ? ((reportData.totalActualDurationMinutes / reportData.totalPlannedDurationMinutes) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          reportData.totalActualDurationMinutes > reportData.totalPlannedDurationMinutes
                            ? 'bg-red-500'
                            : reportData.totalActualDurationMinutes < reportData.totalPlannedDurationMinutes * 0.9
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            (reportData.totalActualDurationMinutes / reportData.totalPlannedDurationMinutes) * 100,
                            150
                          )}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-400">
                      <span>计划 {formatDuration(reportData.totalPlannedDurationMinutes)}</span>
                      <span>实际 {formatDuration(reportData.totalActualDurationMinutes)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-red-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-lg font-bold">{reportData.timeoutCount}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">超时</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-amber-600">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-lg font-bold">{reportData.stuckCount}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">卡顿</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-purple-600">
                            <Star className="w-4 h-4" />
                            <span className="text-lg font-bold">{reportData.lowRatingCount}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">低评分</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {reportData.overallNotes && (
                  <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-800">整体备注</span>
                    </div>
                    <p className="text-sm text-indigo-700">{reportData.overallNotes}</p>
                  </div>
                )}
              </div>

              {reportData.prioritySlices.length > 0 && (
                <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500 rounded-lg">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      优先优化切片
                      <span className="text-sm font-normal text-orange-600">
                        ({reportData.prioritySlices.length} 个)
                      </span>
                    </h3>
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">
                      点击快速定位
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reportData.prioritySlices.map((slice, idx) => (
                      <button
                        key={slice.sliceId}
                        onClick={() => handleJumpToPrioritySlice(slice)}
                        className="p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 hover:shadow-md transition-all text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                            #{idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-800 truncate group-hover:text-orange-700 transition-colors">
                              {slice.sliceTitle}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{slice.exhibit}</p>
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {slice.flags.map((flag) => {
                                const cfg = flagConfig[flag];
                                const FlagIcon = cfg.icon;
                                return (
                                  <span
                                    key={flag}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border`}
                                  >
                                    <FlagIcon className="w-3 h-3" />
                                    {cfg.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  切片详情
                  <span className="text-sm font-normal text-slate-500">
                    (共 {reportData.totalSlices} 个)
                  </span>
                </h3>
                <div className="space-y-3">
                  {reportData.allSlices.map((slice, idx) => (
                    <SliceDetailCard key={slice.sliceId} sliceData={slice} index={idx} />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500">请选择一条复盘记录查看详情</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
