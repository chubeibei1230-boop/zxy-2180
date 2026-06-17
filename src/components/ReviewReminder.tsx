import { useState } from 'react';
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  Star,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from 'lucide-react';
import { ExhibitionSlice, ReviewFlagType } from '../types';

interface ReviewReminderProps {
  slice: ExhibitionSlice;
}

const flagConfig: Record<ReviewFlagType, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  timeout: {
    label: '上次超时',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: Clock
  },
  stuck: {
    label: '上次卡顿',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle
  },
  lowRating: {
    label: '自评较低',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    icon: Star
  }
};

export const ReviewReminder = ({ slice }: ReviewReminderProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!slice.lastReview && slice.reviewFlags.length === 0) {
    return null;
  }

  const lastReview = slice.lastReview;
  const hasTimeout = slice.reviewFlags.includes('timeout');
  const hasStuck = slice.reviewFlags.includes('stuck');
  const hasLowRating = slice.reviewFlags.includes('lowRating');

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-2 border-amber-200 rounded-xl animate-slide-up">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-semibold text-amber-800">上次复盘提醒</h4>
            <div className="flex gap-1 flex-wrap">
              {slice.reviewFlags.map((flag) => {
                const config = flagConfig[flag];
                const FlagIcon = config.icon;
                return (
                  <span
                    key={flag}
                    className={`px-2 py-0.5 text-xs rounded-lg border flex items-center gap-1 font-medium ${config.bgColor} ${config.color}`}
                  >
                    <FlagIcon className="w-3 h-3" />
                    {config.label}
                  </span>
                );
              })}
            </div>
          </div>
          <p className="text-xs text-amber-600">
            点击展开查看上次排练的具体问题和改进建议
          </p>
        </div>
        <button className="p-1 text-amber-500 hover:bg-amber-100 rounded transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && lastReview && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className={`w-3.5 h-3.5 ${hasTimeout ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500">上次时长</span>
              </div>
              <p className={`text-lg font-bold ${hasTimeout ? 'text-red-600' : 'text-slate-700'}`}>
                {lastReview.actualDurationMinutes}
                <span className="text-xs font-normal text-slate-400 ml-0.5">分钟</span>
              </p>
              {hasTimeout && (
                <p className="text-xs text-red-500 mt-0.5">
                  +{(lastReview.actualDurationMinutes - slice.durationMinutes).toFixed(1)}分
                </p>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className={`w-3.5 h-3.5 ${hasStuck ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500">流畅度</span>
              </div>
              <p className={`text-lg font-bold ${hasStuck ? 'text-amber-600' : 'text-emerald-600'}`}>
                {lastReview.isStuck ? '有卡顿' : '流畅'}
              </p>
              {lastReview.isStuck && lastReview.stuckDescription && (
                <p className="text-xs text-amber-500 mt-0.5 line-clamp-1">
                  {lastReview.stuckDescription}
                </p>
              )}
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <Star className={`w-3.5 h-3.5 ${hasLowRating ? 'text-purple-500' : 'text-slate-400'}`} />
                <span className="text-xs text-slate-500">自评得分</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= lastReview.selfRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">复盘次数</span>
              </div>
              <p className="text-lg font-bold text-slate-700">
                {slice.reviewCount}
                <span className="text-xs font-normal text-slate-400 ml-0.5">次</span>
              </p>
            </div>
          </div>

          {lastReview.stuckDescription && (
            <div className="p-3 bg-amber-100/50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-700 mb-1">🎯 卡顿片段描述</p>
              <p className="text-sm text-amber-800">{lastReview.stuckDescription}</p>
            </div>
          )}

          {lastReview.liveNotes && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">📝 上次临场备注</p>
              <p className="text-sm text-blue-800">{lastReview.liveNotes}</p>
            </div>
          )}

          {lastReview.improvementSuggestion && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs font-medium text-emerald-700 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" />
                改进建议（重点关注）
              </p>
              <p className="text-sm text-emerald-800 font-medium">
                {lastReview.improvementSuggestion}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
