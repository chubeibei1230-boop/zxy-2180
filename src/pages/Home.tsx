import { useEffect, useRef } from 'react';
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
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Plus, Download, Play, Mic2, TrendingUp, Target, ChevronRight, Clock, AlertTriangle, Star, Zap, FileText } from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { StatsBar } from '../components/StatsBar';
import { FilterPanel } from '../components/FilterPanel';
import { BatchToolbar } from '../components/BatchToolbar';
import { SliceCard } from '../components/SliceCard';
import { SliceEditor } from '../components/SliceEditor';
import { QualityPanel } from '../components/QualityPanel';
import { RehearsalMode } from '../components/RehearsalMode';
import { ReviewForm } from '../components/ReviewForm';
import { ReviewPanel } from '../components/ReviewPanel';
import { ExhibitionSlice, ReviewFlagType } from '../types';

const flagConfig: Record<ReviewFlagType, { color: string; bgColor: string }> = {
  timeout: { color: 'text-red-700', bgColor: 'bg-red-100' },
  stuck: { color: 'text-amber-700', bgColor: 'bg-amber-100' },
  lowRating: { color: 'text-purple-700', bgColor: 'bg-purple-100' }
};

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
    exportChecklist,
    showReviewForm,
    showReviewPanel,
    setShowReviewPanel,
    getReviewSummary,
    getPriorityOptimizationSlices,
    reviewDraft,
    continueFromDraft,
    clearReviewDraft
  } = useSliceStore();

  const filteredSlices = getFilteredSlices();
  const sortedSlices = [...slices].sort((a, b) => a.orderIndex - b.orderIndex);
  const reviewSummary = getReviewSummary();
  const prioritySlices = getPriorityOptimizationSlices();
  const sliceCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const handleJumpToSlice = (slice: ExhibitionSlice) => {
    setShowReviewPanel(false);
    setTimeout(() => {
      const el = sliceCardRefs.current[slice.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.3)';
        setTimeout(() => {
          el.style.boxShadow = '';
        }, 2000);
      }
    }, 300);
  };

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
      {showReviewForm && <ReviewForm />}
      {showReviewPanel && (
        <ReviewPanel
          onClose={() => setShowReviewPanel(false)}
          onJumpToSlice={handleJumpToSlice}
        />
      )}
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
                onClick={() => setShowReviewPanel(true)}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                复盘中心
                {prioritySlices.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-500 text-xs rounded-full font-bold">
                    {prioritySlices.length}
                  </span>
                )}
              </button>
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

      {reviewDraft && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-amber-500 rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">
                  有未完成的复盘记录
                </p>
                <p className="text-xs text-amber-700">
                  {new Date(reviewDraft.sessionStartTime).toLocaleDateString('zh-CN', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })} 的排练复盘尚未完成
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => clearReviewDraft()}
                className="px-3 py-1.5 text-amber-700 hover:bg-amber-200/50 rounded-lg text-sm font-medium transition-colors"
              >
                丢弃
              </button>
              <button
                onClick={() => continueFromDraft()}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                继续填写
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <StatsBar />
        </div>

        {(prioritySlices.length > 0 || reviewSummary.totalReviews > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {prioritySlices.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-lg">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">需要优先优化的切片</h3>
                      <p className="text-xs text-slate-500">
                        根据上次复盘结果，以下切片存在超时、卡顿或自评较低的问题
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowReviewPanel(true)}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
                  >
                    查看全部
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {prioritySlices.slice(0, 4).map((slice) => (
                    <div
                      key={slice.id}
                      ref={(el) => { sliceCardRefs.current[slice.id] = el; }}
                      onClick={() => handleJumpToSlice(slice)}
                      className="p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-800 text-sm line-clamp-1 group-hover:text-orange-700">
                          {slice.title}
                        </h4>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                          #{slice.orderIndex + 1}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{slice.exhibit}</p>
                      <div className="flex gap-1 flex-wrap">
                        {slice.reviewFlags.map((flag) => (
                          <span
                            key={flag}
                            className={`px-1.5 py-0.5 text-xs rounded font-medium ${flagConfig[flag].bgColor} ${flagConfig[flag].color}`}
                          >
                            {flag === 'timeout' && <Clock className="w-3 h-3 inline mr-0.5" />}
                            {flag === 'stuck' && <AlertTriangle className="w-3 h-3 inline mr-0.5" />}
                            {flag === 'lowRating' && <Star className="w-3 h-3 inline mr-0.5" />}
                            {flag === 'timeout' ? '超时' : flag === 'stuck' ? '卡顿' : '低分'}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">近期复盘摘要</h3>
                    <p className="text-xs text-slate-500">最近5次排练复盘记录</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                {reviewSummary.recentReviews.length > 0 ? (
                  reviewSummary.recentReviews.map((record, idx) => {
                    const avgRating = record.sliceReviews.length > 0
                      ? record.sliceReviews.reduce((s, r) => s + r.selfRating, 0) / record.sliceReviews.length
                      : 0;
                    return (
                      <div
                        key={record.id}
                        className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                        onClick={() => setShowReviewPanel(true)}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-500">
                            #{reviewSummary.recentReviews.length - idx} · {formatDateShort(record.createdAt)}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400">切片: </span>
                            <span className="font-medium text-slate-700">{record.sliceReviews.length}</span>
                          </div>
                          <div>
                            <span className="text-red-500">超时: </span>
                            <span className="font-medium text-red-600">
                              {record.sliceReviews.filter((r) => {
                                const sl = slices.find((s) => s.id === r.sliceId);
                                return sl && r.actualDurationMinutes > sl.durationMinutes;
                              }).length}
                            </span>
                          </div>
                          <div>
                            <span className="text-amber-500">卡顿: </span>
                            <span className="font-medium text-amber-600">
                              {record.sliceReviews.filter((r) => r.isStuck).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-500 mb-2">暂无复盘记录</p>
                    <p className="text-xs text-slate-400">
                      完成排练后记得填写复盘，帮助持续优化
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
                        ref={(el) => { sliceCardRefs.current[slice.id] = el; }}
                        className="animate-stagger-fade-in transition-all duration-500"
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
