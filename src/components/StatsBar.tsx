import { Clock, Layers, AlertTriangle, CheckCircle, TrendingUp, Target } from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { formatDuration } from '../utils/timeUtils';

export const StatsBar = () => {
  const { slices, getTotalDuration, qualityIssues, getReviewSummary, getPriorityOptimizationSlices } = useSliceStore();

  const totalSlices = slices.filter((s) => !s.isBackup).length;
  const backupSlices = slices.filter((s) => s.isBackup).length;
  const totalDuration = getTotalDuration();
  const familiarCount = slices.filter((s) => s.rehearsalStatus === 'familiar' && !s.isBackup).length;
  const errorCount = qualityIssues.filter((i) => i.severity === 'error').length;
  const warningCount = qualityIssues.filter((i) => i.severity === 'warning').length;
  const progressPercent = totalSlices > 0 ? Math.round((familiarCount / totalSlices) * 100) : 0;

  const reviewSummary = getReviewSummary();
  const prioritySlices = getPriorityOptimizationSlices();

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">讲解切片</p>
            <p className="text-xl font-bold">
              {totalSlices}
              {backupSlices > 0 && (
                <span className="text-sm font-normal text-slate-400 ml-1">
                  (+{backupSlices})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Clock className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">预计总时长</p>
            <p className="text-xl font-bold">{formatDuration(totalDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">排练进度</p>
            <p className="text-xl font-bold">
              {familiarCount}/{totalSlices}
              <span className="text-sm font-normal text-slate-400 ml-1">({progressPercent}%)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${errorCount > 0 ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
            <AlertTriangle className={`w-6 h-6 ${errorCount > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-xs text-slate-400">质量问题</p>
            <p className="text-xl font-bold">
              {errorCount > 0 && <span className="text-red-400">{errorCount}错 </span>}
              {warningCount > 0 && <span className="text-amber-400">{warningCount}警</span>}
              {errorCount === 0 && warningCount === 0 && <span className="text-emerald-400">无</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400">复盘次数</p>
            <p className="text-xl font-bold text-purple-300">{reviewSummary.totalReviews}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${prioritySlices.length > 0 ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
            <Target className={`w-6 h-6 ${prioritySlices.length > 0 ? 'text-orange-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-xs text-slate-400">待优化</p>
            <p className={`text-xl font-bold ${prioritySlices.length > 0 ? 'text-orange-300' : 'text-emerald-300'}`}>
              {prioritySlices.length}
            </p>
          </div>
        </div>
      </div>

      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
