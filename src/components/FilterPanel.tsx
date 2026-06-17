import { Search, Filter, X } from 'lucide-react';
import { useSliceStore } from '../store/useSliceStore';

export const FilterPanel = () => {
  const { filters, setFilters, getExhibitList } = useSliceStore();
  const exhibits = getExhibitList();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFilters({
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  const clearFilters = () => {
    setFilters({
      exhibit: '',
      rehearsalStatus: '',
      minDuration: 0,
      maxDuration: 999,
      reminderType: '',
      searchKeyword: ''
    });
  };

  const hasActiveFilters =
    filters.exhibit ||
    filters.rehearsalStatus ||
    filters.minDuration > 0 ||
    filters.maxDuration < 999 ||
    filters.reminderType ||
    filters.searchKeyword;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">筛选条件</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            清除筛选
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="searchKeyword"
              value={filters.searchKeyword}
              onChange={handleChange}
              placeholder="搜索标题、关键句..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">关联展项</label>
          <select
            name="exhibit"
            value={filters.exhibit}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">全部展项</option>
            {exhibits.map((exhibit) => (
              <option key={exhibit} value={exhibit}>
                {exhibit}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">排练状态</label>
          <select
            name="rehearsalStatus"
            value={filters.rehearsalStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="pending">待排练</option>
            <option value="familiar">已熟悉</option>
            <option value="needShorten">需缩短</option>
            <option value="skipped">临时跳过</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">时长范围（分钟）</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="minDuration"
              value={filters.minDuration || ''}
              onChange={handleChange}
              placeholder="最小"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              name="maxDuration"
              value={filters.maxDuration === 999 ? '' : filters.maxDuration}
              onChange={handleChange}
              placeholder="最大"
              min="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">提醒类型</label>
          <select
            name="reminderType"
            value={filters.reminderType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">全部</option>
            <option value="hasError">含有易错提醒</option>
            <option value="missingAlternative">缺少备用说法</option>
          </select>
        </div>
      </div>
    </div>
  );
};
