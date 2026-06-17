import { useState } from 'react';
import {
  X,
  Plus,
  Play,
  Calendar,
  Clock,
  Users,
  FileText,
  Trash2,
  Eye,
  Edit2,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { formatDuration } from '../utils/timeUtils';
import { SessionPlan } from '../types';
import { SessionPlanForm } from './SessionPlanForm';
import { SessionPlanDetail } from './SessionPlanDetail';

interface SessionPlanPanelProps {
  onClose: () => void;
}

export const SessionPlanPanel = ({ onClose }: SessionPlanPanelProps) => {
  const {
    sessionPlans,
    setShowSessionPlanForm,
    showSessionPlanForm,
    editingSessionPlanId,
    setEditingSessionPlanId,
    viewingSessionPlanId,
    setViewingSessionPlanId,
    deleteSessionPlan,
    getSessionPlanDuration,
    getSessionPlanDurationRisk,
    startRehearsalWithPlan,
    getSessionPlanLatestReview,
    exportSessionPlanChecklist
  } = useSliceStore();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNewPlan = () => {
    setEditingSessionPlanId(null);
    setShowSessionPlanForm(true);
  };

  const handleEditPlan = (planId: string) => {
    setEditingSessionPlanId(planId);
    setShowSessionPlanForm(true);
  };

  const handleViewDetail = (planId: string) => {
    setViewingSessionPlanId(planId);
  };

  const handleStartRehearsal = (planId: string) => {
    startRehearsalWithPlan(planId);
    onClose();
  };

  const handleDelete = (planId: string) => {
    deleteSessionPlan(planId);
    setDeleteConfirmId(null);
  };

  const getRiskBadge = (planId: string) => {
    const risk = getSessionPlanDurationRisk(planId);
    const actualDuration = getSessionPlanDuration(planId);
    
    if (risk.level === 'danger') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded">
          <AlertTriangle className="w-3 h-3" />
          超时风险 ({formatDuration(actualDuration)})
        </span>
      );
    } else if (risk.level === 'warning' && risk.diffMinutes > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded">
          <AlertTriangle className="w-3 h-3" />
          略微超时 ({formatDuration(actualDuration)})
        </span>
      );
    } else if (risk.level === 'warning' && risk.diffMinutes < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded">
          <Clock className="w-3 h-3" />
          时长不足 ({formatDuration(actualDuration)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
        <CheckCircle className="w-3 h-3" />
        时长正常 ({formatDuration(actualDuration)})
      </span>
    );
  };

  const sortedPlans = [...sessionPlans].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  if (showSessionPlanForm) {
    return <SessionPlanForm onClose={() => setShowSessionPlanForm(false)} />;
  }

  if (viewingSessionPlanId) {
    return <SessionPlanDetail planId={viewingSessionPlanId} onClose={() => setViewingSessionPlanId(null)} />;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">讲解场次计划</h2>
              <p className="text-sm text-slate-500">
                管理你的讲解场次计划，按计划排练和复盘
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewPlan}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建场次
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {sortedPlans.length > 0 ? (
            <div className="space-y-4">
              {sortedPlans.map((plan) => {
                const latestReview = getSessionPlanLatestReview(plan.id);
                const activeSliceCount = plan.slices.filter((s) => !s.isExcluded).length;
                
                return (
                  <div
                    key={plan.id}
                    className="bg-gradient-to-r from-white to-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-all overflow-hidden"
                  >
                    {deleteConfirmId === plan.id && (
                      <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-700">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">确定要删除这个场次计划吗？</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 text-sm text-slate-600 hover:bg-white rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="px-3 py-1.5 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          >
                            确认删除
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">
                            {plan.name}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                            {plan.audience && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {plan.audience}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              目标 {formatDuration(plan.targetDurationMinutes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDateTime(plan.scheduledStartTime)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {activeSliceCount} 个切片
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {getRiskBadge(plan.id)}
                        </div>
                      </div>

                      {latestReview && (
                        <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                          <div className="flex items-center gap-2 text-purple-700 text-sm mb-1">
                            <TrendingUp className="w-4 h-4" />
                            <span className="font-medium">最近一次复盘</span>
                            <span className="text-purple-500 text-xs">
                              {formatDateTime(latestReview.createdAt)}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="text-purple-500">实际时长: </span>
                              <span className="font-medium text-purple-700">
                                {formatDuration(latestReview.totalActualDurationMinutes)}
                              </span>
                            </div>
                            <div>
                              <span className="text-purple-500">排练次数: </span>
                              <span className="font-medium text-purple-700">
                                {plan.rehearsalCount} 次
                              </span>
                            </div>
                            <div>
                              <span className="text-purple-500">已排练: </span>
                              <span className="font-medium text-purple-700">
                                {latestReview.sliceReviews.filter((r) => r.rehearsalStatus === 'rehearsed').length} 个
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => handleStartRehearsal(plan.id)}
                          disabled={activeSliceCount === 0}
                          className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          按此计划排练
                        </button>
                        <button
                          onClick={() => handleViewDetail(plan.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          详情
                        </button>
                        <button
                          onClick={() => handleEditPlan(plan.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={() => exportSessionPlanChecklist(plan.id)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          导出
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(plan.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                暂无场次计划
              </h3>
              <p className="text-slate-500 text-sm mb-6">
                创建一个讲解场次计划，围绕一次真实讲解任务进行准备和排练
              </p>
              <button
                onClick={handleNewPlan}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                创建第一场计划
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
