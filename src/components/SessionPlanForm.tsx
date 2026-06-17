import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Save,
  ArrowLeft,
  GripVertical,
  Plus,
  Minus,
  Check,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSliceStore } from '../store/useSliceStore';
import { formatDuration } from '../utils/timeUtils';
import { ExhibitionSlice, SessionPlanSlice, DurationRiskLevel } from '../types';

const toDateTimeLocalValue = (date: Date) => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

interface SessionPlanFormProps {
  onClose: () => void;
}

interface SortableSliceItemProps {
  slice: ExhibitionSlice;
  isExcluded: boolean;
  onToggleExclude: () => void;
}

const SortableSliceItem = ({ slice, isExcluded, onToggleExclude }: SortableSliceItemProps) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
        isExcluded
          ? 'bg-slate-50 border-slate-200 opacity-60'
          : 'bg-white border-slate-200 hover:border-indigo-300'
      } ${isDragging ? 'shadow-lg z-10' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <button
        onClick={onToggleExclude}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
          isExcluded
            ? 'border-slate-300 bg-white'
            : 'border-indigo-500 bg-indigo-500'
        }`}
      >
        {!isExcluded && <Check className="w-3 h-3 text-white" />}
      </button>

      <div className="flex-1 min-w-0">
        <h4 className={`font-medium text-sm truncate ${isExcluded ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {slice.title}
        </h4>
        <p className="text-xs text-slate-500 truncate">{slice.exhibit}</p>
      </div>

      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Clock className="w-3.5 h-3.5" />
        {slice.durationMinutes}分钟
      </div>
    </div>
  );
};

export const SessionPlanForm = ({ onClose }: SessionPlanFormProps) => {
  const {
    slices,
    editingSessionPlanId,
    getSessionPlan,
    addSessionPlan,
    updateSessionPlan,
    getSessionPlanDurationRisk
  } = useSliceStore();

  const editingPlan = editingSessionPlanId ? getSessionPlan(editingSessionPlanId) : null;

  const [name, setName] = useState(editingPlan?.name || '');
  const [audience, setAudience] = useState(editingPlan?.audience || '');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState(
    editingPlan?.targetDurationMinutes || 30
  );
  const [scheduledStartTime, setScheduledStartTime] = useState(() => {
    if (editingPlan?.scheduledStartTime) {
      const date = new Date(editingPlan.scheduledStartTime);
      return toDateTimeLocalValue(date);
    }
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return toDateTimeLocalValue(now);
  });

  const [planSlices, setPlanSlices] = useState<SessionPlanSlice[]>(() => {
    if (editingPlan) {
      return [...editingPlan.slices].sort((a, b) => a.orderIndex - b.orderIndex);
    }
    return slices
      .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s, index) => ({
        sliceId: s.id,
        orderIndex: index,
        isExcluded: false
      }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const activeSlices = useMemo(() => {
    const sliceMap = new Map(slices.map((s) => [s.id, s]));
    return planSlices
      .filter((s) => !s.isExcluded)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => sliceMap.get(s.sliceId))
      .filter((s): s is ExhibitionSlice => s !== undefined);
  }, [planSlices, slices]);

  const excludedSlices = useMemo(() => {
    const sliceMap = new Map(slices.map((s) => [s.id, s]));
    return planSlices
      .filter((s) => s.isExcluded)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((s) => sliceMap.get(s.sliceId))
      .filter((s): s is ExhibitionSlice => s !== undefined);
  }, [planSlices, slices]);

  const totalDuration = useMemo(() => {
    return activeSlices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [activeSlices]);

  const durationRisk = useMemo(() => {
    const diffMinutes = totalDuration - targetDurationMinutes;
    const percent = targetDurationMinutes > 0 ? (diffMinutes / targetDurationMinutes) * 100 : 0;

    let level: DurationRiskLevel = 'normal';
    if (diffMinutes > 0) {
      if (percent >= 20) {
        level = 'danger';
      } else if (percent >= 10) {
        level = 'warning';
      }
    } else if (diffMinutes < 0) {
      level = 'warning';
    }

    return { level, diffMinutes, percent };
  }, [totalDuration, targetDurationMinutes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPlanSlices((prev) => {
        const activeIndex = prev.findIndex((s) => s.sliceId === active.id);
        const overIndex = prev.findIndex((s) => s.sliceId === over.id);
        if (activeIndex === -1 || overIndex === -1) return prev;

        const newSlices = [...prev];
        const [removed] = newSlices.splice(activeIndex, 1);
        newSlices.splice(overIndex, 0, removed);

        return newSlices.map((s, index) => ({ ...s, orderIndex: index }));
      });
    }
  };

  const toggleSliceExcluded = (sliceId: string) => {
    setPlanSlices((prev) =>
      prev.map((s) =>
        s.sliceId === sliceId ? { ...s, isExcluded: !s.isExcluded } : s
      )
    );
  };

  const includeAllSlices = () => {
    setPlanSlices((prev) => prev.map((s) => ({ ...s, isExcluded: false })));
  };

  const excludeAllSlices = () => {
    setPlanSlices((prev) => prev.map((s) => ({ ...s, isExcluded: true })));
  };

  const resetToDefaultOrder = () => {
    setPlanSlices(
      slices
        .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((s, index) => ({
          sliceId: s.id,
          orderIndex: index,
          isExcluded: planSlices.find(ps => ps.sliceId === s.id)?.isExcluded ?? false
        }))
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入计划名称');
      return;
    }
    if (targetDurationMinutes <= 0) {
      alert('目标时长必须大于0');
      return;
    }
    if (activeSlices.length === 0) {
      alert('请至少选择一个切片');
      return;
    }

    const planData = {
      name: name.trim(),
      audience: audience.trim(),
      targetDurationMinutes,
      scheduledStartTime: new Date(scheduledStartTime).toISOString(),
      slices: planSlices
    };

    if (editingSessionPlanId) {
      updateSessionPlan(editingSessionPlanId, planData);
    } else {
      addSessionPlan(planData);
    }

    onClose();
  };

  const allSliceIds = slices
    .filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
    .map((s) => s.id);

  const availableSlices = allSliceIds.filter(
    (id) => !planSlices.find((s) => s.sliceId === id)
  );

  const addAvailableSlice = (sliceId: string) => {
    setPlanSlices((prev) => [
      ...prev,
      { sliceId, orderIndex: prev.length, isExcluded: false }
    ]);
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {editingPlan ? '编辑场次计划' : '新建场次计划'}
              </h2>
              <p className="text-sm text-slate-500">
                填写场次信息，选择要使用的讲解切片
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  计划名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：春季研学活动第一场"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  讲解对象
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="例如：小学生、老年团、VIP客户"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  目标总时长（分钟） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={targetDurationMinutes}
                  onChange={(e) => setTargetDurationMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                  min="1"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  预计开始时间
                </label>
                <input
                  type="datetime-local"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${getRiskColor()}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {durationRisk.level === 'danger' && <AlertTriangle className="w-5 h-5" />}
                  {durationRisk.level === 'warning' && <Info className="w-5 h-5" />}
                  {durationRisk.level === 'normal' && <Check className="w-5 h-5" />}
                  <span className="font-medium">时长预估</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {formatDuration(totalDuration)}
                    <span className="text-sm font-normal opacity-75 ml-2">
                      / 目标 {formatDuration(targetDurationMinutes)}
                    </span>
                  </p>
                  <p className="text-sm">
                    {durationRisk.diffMinutes > 0 ? (
                      <span>超出 {formatDuration(durationRisk.diffMinutes)} ({durationRisk.percent.toFixed(1)}%)</span>
                    ) : durationRisk.diffMinutes < 0 ? (
                      <span>剩余 {formatDuration(Math.abs(durationRisk.diffMinutes))} ({Math.abs(durationRisk.percent).toFixed(1)}%缓冲)</span>
                    ) : (
                      <span>与目标完全匹配</span>
                    )}
                  </p>
                </div>
              </div>
              {durationRisk.level !== 'normal' && (
                <p className="text-sm mt-2 opacity-80">
                  {durationRisk.level === 'danger'
                    ? '⚠️ 预计时长严重超出目标，建议减少切片或精简内容'
                    : durationRisk.diffMinutes > 0
                    ? '⚠️ 预计时长略超目标，请注意控制讲解节奏'
                    : '💡 预计时长短于目标较多，可考虑增加内容或放慢语速'}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">本场切片</h3>
                  <p className="text-sm text-slate-500">
                    已选 {activeSlices.length} 个 · 共 {planSlices.length} 个
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={resetToDefaultOrder}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    恢复默认顺序
                  </button>
                  <button
                    onClick={includeAllSlices}
                    className="px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    全部包含
                  </button>
                  <button
                    onClick={excludeAllSlices}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Minus className="w-3 h-3" />
                    全部排除
                  </button>
                </div>
              </div>

              {planSlices.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={planSlices.map((s) => s.sliceId)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                      {planSlices.map((planSlice) => {
                        const slice = slices.find((s) => s.id === planSlice.sliceId);
                        if (!slice) return null;
                        return (
                          <SortableSliceItem
                            key={slice.id}
                            slice={slice}
                            isExcluded={planSlice.isExcluded}
                            onToggleExclude={() => toggleSliceExcluded(slice.id)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500">暂无切片，请从下方添加</p>
                </div>
              )}
            </div>

            {availableSlices.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">
                  可添加的切片 ({availableSlices.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableSlices.map((sliceId) => {
                    const slice = slices.find((s) => s.id === sliceId);
                    if (!slice) return null;
                    return (
                      <div
                        key={slice.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-slate-800 truncate">
                            {slice.title}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">{slice.exhibit}</p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {slice.durationMinutes}分钟
                        </span>
                        <button
                          onClick={() => addAvailableSlice(slice.id)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingPlan ? '保存修改' : '创建计划'}
          </button>
        </div>
      </div>
    </div>
  );
};
