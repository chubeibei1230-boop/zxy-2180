import { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronRight, Copy, Clock, MessageSquare, GitMerge } from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';
import { QualityIssueType } from '../types';
import { getIssueTypeLabel } from '../utils/qualityChecker';

const issueIcons: Record<QualityIssueType, React.ElementType> = {
  duplicate: Copy,
  tooLong: Clock,
  missingAlternative: MessageSquare,
  transitionGap: GitMerge
};

export const QualityPanel = () => {
  const { qualityIssues, setEditingSliceId } = useSliceStore();
  const [expanded, setExpanded] = useState(true);

  const errors = qualityIssues.filter((i) => i.severity === 'error');
  const warnings = qualityIssues.filter((i) => i.severity === 'warning');

  const handleIssueClick = (sliceId: string) => {
    setEditingSliceId(sliceId);
  };

  if (qualityIssues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-100 rounded">
            <AlertTriangle className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-700">质量检查</h3>
        </div>
        <div className="text-center py-6 text-emerald-600">
          <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium">检查通过</p>
          <p className="text-sm text-slate-500 mt-1">暂未发现问题</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded ${errors.length > 0 ? 'bg-red-100' : 'bg-amber-100'}`}>
            <AlertTriangle className={`w-4 h-4 ${errors.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-700">质量检查</h3>
            <p className="text-xs text-slate-500">
              发现 {errors.length} 个错误，{warnings.length} 个警告
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 max-h-96 overflow-y-auto">
          {qualityIssues.map((issue) => {
            const Icon = issueIcons[issue.type];
            return (
              <button
                key={issue.id}
                onClick={() => handleIssueClick(issue.sliceId)}
                className={`w-full p-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors ${
                  issue.severity === 'error' ? 'hover:bg-red-50' : 'hover:bg-amber-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded mt-0.5 flex-shrink-0 ${
                      issue.severity === 'error' ? 'bg-red-100' : 'bg-amber-100'
                    }`}
                  >
                    {issue.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        issue.severity === 'error'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {issue.severity === 'error' ? '错误' : '警告'}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Icon className="w-3 h-3" />
                        {getIssueTypeLabel(issue.type)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{issue.message}</p>
                    <p className="text-xs text-indigo-600 mt-1">点击查看详情</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
