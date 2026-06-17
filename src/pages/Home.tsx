import { useEffect } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus, Download, Play, Mic2 } from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { StatsBar } from '../components/StatsBar';
import { FilterPanel } from '../components/FilterPanel';
import { BatchToolbar } from '../components/BatchToolbar';
import { SliceCard } from '../components/SliceCard';
import { SliceEditor } from '../components/SliceEditor';
import { QualityPanel } from '../components/QualityPanel';
import { RehearsalMode } from '../components/RehearsalMode';

export default function Home() {
  const {
    slices,
    getFilteredSlices,
    reorderSlices,
    runQualityCheck,
    isRehearsalMode,
    setRehearsalMode,
    editingSliceId,
    setEditingSliceId,
    exportChecklist
  } = useSliceStore();

  const filteredSlices = getFilteredSlices();
  const sortedSlices = [...slices].sort((a, b) => a.orderIndex - b.orderIndex);

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

  useEffect(() => {
    runQualityCheck();
  }, [runQualityCheck]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderSlices(active.id as string, over.id as string);
    }
  };

  const handleNewSlice = () => {
    setEditingSliceId(null);
  };

  const handleCloseEditor = () => {
    setEditingSliceId(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isRehearsalMode && <RehearsalMode />}
      {editingSliceId !== undefined && (
        <SliceEditor sliceId={editingSliceId} onClose={handleCloseEditor} />
      )}

      <header className="bg-gradient-to-r from-slate-800 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/30 rounded-xl">
                <Mic2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">讲解词管理系统</h1>
                <p className="text-xs text-slate-300">展览讲解员专属 · 高效整理 · 智能提醒</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportChecklist}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                导出清单
              </button>
              <button
                onClick={() => setRehearsalMode(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                排练模式
              </button>
              <button
                onClick={handleNewSlice}
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新建切片
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <StatsBar />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <FilterPanel />
            <QualityPanel />
          </div>

          <div className="lg:col-span-3">
            <BatchToolbar />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedSlices.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {filteredSlices.length > 0 ? (
                    filteredSlices.map((slice, index) => (
                      <div
                        key={slice.id}
                        className="animate-stagger-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <SliceCard slice={slice} />
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                        <Mic2 className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        暂无讲解切片
                      </h3>
                      <p className="text-slate-500 mb-4">
                        {slices.length > 0
                          ? '当前筛选条件下没有匹配的切片，请调整筛选条件'
                          : '点击上方"新建切片"按钮开始创建你的第一个讲解切片'}
                      </p>
                      {slices.length === 0 && (
                        <button
                          onClick={handleNewSlice}
                          className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          新建切片
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          <p>讲解词管理系统 · 数据本地存储 · 支持导出排练清单</p>
          <p className="mt-1 text-xs text-slate-400">
            提示：所有数据保存在浏览器本地，清除浏览器数据会导致数据丢失，请定期导出备份
          </p>
        </div>
      </footer>
    </div>
  );
}
