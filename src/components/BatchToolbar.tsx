import { CheckCircle2, PauseCircle, Scissors, SkipForward, X } from 'lucide-react';
import { RehearsalStatus } from '../types';
import { useSliceStore } from '../store/useSliceStore';

const batchActions: { status: RehearsalStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'pending', label: '标记待排练', icon: PauseCircle, color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
  { status: 'familiar', label: '标记已熟悉', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  { status: 'needShorten', label: '标记需缩短', icon: Scissors, color: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
  { status: 'skipped', label: '标记临时跳过', icon: SkipForward, color: 'bg-red-100 text-red-700 hover:bg-red-200' }
];

export const BatchToolbar = () => {
  const { selectedIds, clearSelection, batchUpdateStatus, getFilteredSlices, selectAll } = useSliceStore();
  const filteredCount = getFilteredSlices().length;
  const hasSelection = selectedIds.length > 0;

  if (!hasSelection && filteredCount === 0) return null;

  return (
    <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-indigo-700 font-medium">
            已选择 {selectedIds.length} 项
          </span>
          {selectedIds.length < filteredCount && (
            <button
              onClick={selectAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline"
            >
              全选当前筛选结果 ({filteredCount}项)
            </button>
          )}
          <button
            onClick={clearSelection}
            className="p-1 hover:bg-indigo-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-indigo-600" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {batchActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.status}
                onClick={() => batchUpdateStatus(action.status)}
                disabled={!hasSelection}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
