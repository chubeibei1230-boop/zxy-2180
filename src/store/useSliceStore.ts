import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppActions, ExhibitionSlice, Filters, RehearsalStatus } from '../types';
import { generateId } from '../utils/timeUtils';
import { runAllChecks } from '../utils/qualityChecker';
import { exportToMarkdown, downloadFile } from '../utils/exportUtils';
import { mockSlices } from '../data/mockData';

const initialFilters: Filters = {
  exhibit: '',
  rehearsalStatus: '',
  minDuration: 0,
  maxDuration: 999,
  reminderType: '',
  searchKeyword: ''
};

const initialState: AppState = {
  slices: mockSlices,
  filters: initialFilters,
  selectedIds: [],
  qualityIssues: [],
  isRehearsalMode: false,
  currentRehearsalIndex: 0,
  editingSliceId: null
};

export const useSliceStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addSlice: (sliceData) => {
        const now = new Date().toISOString();
        const newSlice: ExhibitionSlice = {
          ...sliceData,
          id: generateId(),
          createdAt: now,
          updatedAt: now
        };
        set((state) => ({
          slices: [...state.slices, newSlice]
        }));
        get().runQualityCheck();
      },

      updateSlice: (id, updates) => {
        set((state) => ({
          slices: state.slices.map((slice) =>
            slice.id === id
              ? { ...slice, ...updates, updatedAt: new Date().toISOString() }
              : slice
          )
        }));
        get().runQualityCheck();
      },

      deleteSlice: (id) => {
        set((state) => ({
          slices: state.slices.filter((slice) => slice.id !== id),
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id)
        }));
        get().runQualityCheck();
      },

      duplicateSlice: (id) => {
        const slice = get().slices.find((s) => s.id === id);
        if (slice) {
          const now = new Date().toISOString();
          const newSlice: ExhibitionSlice = {
            ...slice,
            id: generateId(),
            title: `${slice.title}（副本）`,
            isBackup: true,
            parentId: id,
            orderIndex: get().slices.length,
            createdAt: now,
            updatedAt: now
          };
          set((state) => ({
            slices: [...state.slices, newSlice]
          }));
          get().runQualityCheck();
        }
      },

      reorderSlices: (activeId, overId) => {
        set((state) => {
          const activeIndex = state.slices.findIndex((s) => s.id === activeId);
          const overIndex = state.slices.findIndex((s) => s.id === overId);
          if (activeIndex === -1 || overIndex === -1) return state;

          const newSlices = [...state.slices];
          const [removed] = newSlices.splice(activeIndex, 1);
          newSlices.splice(overIndex, 0, removed);

          return {
            slices: newSlices.map((slice, index) => ({
              ...slice,
              orderIndex: index
            }))
          };
        });
        get().runQualityCheck();
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters }
        }));
      },

      toggleSelected: (id) => {
        set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter((selectedId) => selectedId !== id)
            : [...state.selectedIds, id]
        }));
      },

      selectAll: () => {
        const filteredSlices = get().getFilteredSlices();
        set({
          selectedIds: filteredSlices.map((s) => s.id)
        });
      },

      clearSelection: () => {
        set({ selectedIds: [] });
      },

      batchUpdateStatus: (status) => {
        const { selectedIds } = get();
        set((state) => ({
          slices: state.slices.map((slice) =>
            selectedIds.includes(slice.id)
              ? { ...slice, rehearsalStatus: status, updatedAt: new Date().toISOString() }
              : slice
          )
        }));
        get().runQualityCheck();
      },

      setRehearsalMode: (isActive) => {
        set({ isRehearsalMode: isActive });
        if (isActive) {
          const activeSlices = get()
            .slices.filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
            .sort((a, b) => a.orderIndex - b.orderIndex);
          if (activeSlices.length > 0) {
            const firstIndex = get().slices.findIndex((s) => s.id === activeSlices[0].id);
            set({ currentRehearsalIndex: firstIndex });
          }
        }
      },

      setCurrentRehearsalIndex: (index) => {
        set({ currentRehearsalIndex: index });
      },

      setEditingSliceId: (id) => {
        set({ editingSliceId: id });
      },

      runQualityCheck: () => {
        const issues = runAllChecks(get().slices);
        set({ qualityIssues: issues });
      },

      exportChecklist: () => {
        const { slices } = get();
        const content = exportToMarkdown(slices);
        const filename = `讲解词排练清单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
        downloadFile(content, filename, 'text/markdown');
      },

      getTotalDuration: () => {
        return get()
          .slices.filter((s) => !s.isBackup && s.rehearsalStatus !== 'skipped')
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getFilteredSlices: () => {
        const { slices, filters } = get();
        return slices
          .filter((slice) => {
            if (filters.exhibit && slice.exhibit !== filters.exhibit) return false;
            if (filters.rehearsalStatus && slice.rehearsalStatus !== filters.rehearsalStatus) return false;
            if (slice.durationMinutes < filters.minDuration || slice.durationMinutes > filters.maxDuration) return false;
            if (filters.reminderType) {
              if (filters.reminderType === 'hasError' && !slice.errorReminder) return false;
              if (filters.reminderType === 'missingAlternative' && slice.alternativeVersion) return false;
            }
            if (filters.searchKeyword) {
              const keyword = filters.searchKeyword.toLowerCase();
              return (
                slice.title.toLowerCase().includes(keyword) ||
                slice.keySentence.toLowerCase().includes(keyword) ||
                slice.exhibit.toLowerCase().includes(keyword)
              );
            }
            return true;
          })
          .sort((a, b) => a.orderIndex - b.orderIndex);
      },

      getExhibitList: () => {
        const exhibits = new Set(get().slices.map((s) => s.exhibit));
        return Array.from(exhibits);
      }
    }),
    {
      name: 'exhibition-slice-storage',
      partialize: (state) => ({
        slices: state.slices,
        filters: state.filters
      })
    }
  )
);
