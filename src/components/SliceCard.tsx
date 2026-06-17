import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Edit2,
  Copy,
  Trash2,
  Clock,
  MapPin,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  PauseCircle,
  Scissors,
  SkipForward
} from 'lucide-react';
import { ExhibitionSlice, RehearsalStatus } from '../types';
import { useSliceStore } from '../store/useSliceStore';

interface SliceCardProps {
  slice: ExhibitionSlice;
}

const statusConfig: Record<RehearsalStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  pending: {
    label: '待排练',
    color: 'text-slate-700',
    bgColor: 'bg-slate-100 border-slate-300',
    icon: PauseCircle
  },
  familiar: {
    label: '已熟悉',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-300',
    icon: CheckCircle2
  },
  needShorten: {
    label: '需缩短',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-300',
    icon: Scissors
  },
  skipped: {
    label: '临时跳过',
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-300',
    icon: SkipForward
  }
};

export const SliceCard = ({ slice }: SliceCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: slice.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const { toggleSelected, selectedIds, setEditingSliceId, duplicateSlice, deleteSlice } = useSliceStore();
  const isSelected = selectedIds.includes(slice.id);
  const status = statusConfig[slice.rehearsalStatus];
  const StatusIcon = status.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        bg-white rounded-lg border-2 transition-all duration-200
        ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}
        ${slice.isBackup ? 'opacity-75' : ''}
        ${isDragging ? 'shadow-2xl z-50' : 'shadow-sm hover:shadow-md'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelected(slice.id)}
            className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="font-bold text-slate-800 truncate">{slice.title}</h3>
              {slice.isBackup && (
                <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                  备用
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs rounded border flex items-center gap-1 ${status.bgColor} ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {slice.exhibit}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {slice.durationMinutes}分钟
              </span>
            </div>

            <p className="text-sm text-slate-700 mb-3 line-clamp-2">
              {slice.keySentence}
            </p>

            <div className="flex flex-wrap gap-2">
              {slice.errorReminder && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-amber-700 bg-amber-50 rounded">
                  <AlertTriangle className="w-3 h-3" />
                  有易错提醒
                </span>
              )}
              {slice.alternativeVersion ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-700 bg-emerald-50 rounded">
                  <MessageSquare className="w-3 h-3" />
                  有备用说法
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-700 bg-red-50 rounded">
                  <MessageSquare className="w-3 h-3" />
                  缺少备用说法
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => setEditingSliceId(slice.id)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="编辑"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => duplicateSlice(slice.id)}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              title="复制为备用版本"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteSlice(slice.id)}
              className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
