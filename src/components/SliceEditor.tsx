import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { ExhibitionSlice, RehearsalStatus } from '../types';
import { useSliceStore } from '../store/useSliceStore';

interface SliceEditorProps {
  sliceId: string | null;
  onClose: () => void;
}

const statusOptions: { value: RehearsalStatus; label: string }[] = [
  { value: 'pending', label: '待排练' },
  { value: 'familiar', label: '已熟悉' },
  { value: 'needShorten', label: '需缩短' },
  { value: 'skipped', label: '临时跳过' }
];

export const SliceEditor = ({ sliceId, onClose }: SliceEditorProps) => {
  const { slices, addSlice, updateSlice } = useSliceStore();
  const isEditing = !!sliceId;
  const existingSlice = slices.find((s) => s.id === sliceId);

  const [formData, setFormData] = useState({
    title: '',
    exhibit: '',
    durationMinutes: 5,
    keySentence: '',
    errorReminder: '',
    alternativeVersion: '',
    rehearsalStatus: 'pending' as RehearsalStatus,
    isBackup: false,
    orderIndex: slices.length
  });

  useEffect(() => {
    if (existingSlice) {
      setFormData({
        title: existingSlice.title,
        exhibit: existingSlice.exhibit,
        durationMinutes: existingSlice.durationMinutes,
        keySentence: existingSlice.keySentence,
        errorReminder: existingSlice.errorReminder,
        alternativeVersion: existingSlice.alternativeVersion,
        rehearsalStatus: existingSlice.rehearsalStatus,
        isBackup: existingSlice.isBackup,
        orderIndex: existingSlice.orderIndex
      });
    } else {
      setFormData({
        title: '',
        exhibit: '',
        durationMinutes: 5,
        keySentence: '',
        errorReminder: '',
        alternativeVersion: '',
        rehearsalStatus: 'pending',
        isBackup: false,
        orderIndex: useSliceStore.getState().slices.length
      });
    }
  }, [existingSlice, slices.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && sliceId) {
      updateSlice(sliceId, formData);
    } else {
      addSlice(formData);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? '编辑讲解切片' : '新建讲解切片'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                标题 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="输入切片标题"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                关联展项 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="exhibit"
                value={formData.exhibit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="例如：第一展厅-青铜展区"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                建议时长（分钟） <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                排练状态
              </label>
              <select
                name="rehearsalStatus"
                value={formData.rehearsalStatus}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              关键句 <span className="text-red-500">*</span>
            </label>
            <textarea
              name="keySentence"
              value={formData.keySentence}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="这段讲解的核心内容，需要准确表达的关键信息"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              易错提醒
            </label>
            <textarea
              name="errorReminder"
              value={formData.errorReminder}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="容易说错的知识点、需要注意的发音或术语"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              备用说法
            </label>
            <textarea
              name="alternativeVersion"
              value={formData.alternativeVersion}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="另一种表达方式，应对时间充裕或紧迫的不同场景"
            />
          </div>

          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="isBackup"
              name="isBackup"
              checked={formData.isBackup}
              onChange={(e) => setFormData((prev) => ({ ...prev, isBackup: e.target.checked }))}
              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isBackup" className="ml-2 text-sm text-slate-700">
              标记为备用版本
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isEditing ? '保存修改' : '创建切片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
