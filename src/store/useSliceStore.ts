import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState,
  AppActions,
  ExhibitionSlice,
  Filters,
  RehearsalReviewRecord,
  ReviewFlagType,
  SessionPlan
} from '../types';
import { generateId } from '../utils/timeUtils';
import { runAllChecks } from '../utils/qualityChecker';
import { exportToMarkdown, downloadFile, exportSessionPlanToMarkdown } from '../utils/exportUtils';
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
  editingSliceId: null,
  reviewRecords: [],
  showReviewForm: false,
  showReviewPanel: false,
  sessionStartTime: null,
  reviewDraft: null,
  sliceRehearsalData: [],
  sessionPlans: [],
  showSessionPlanPanel: false,
  showSessionPlanForm: false,
  editingSessionPlanId: null,
  activeSessionPlanId: null,
  viewingSessionPlanId: null
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
          updatedAt: now,
          reviewCount: 0,
          reviewFlags: [],
          lastReview: null
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
            updatedAt: now,
            reviewCount: 0,
            reviewFlags: [],
            lastReview: null
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
            set({ currentRehearsalIndex: 0 });
          }
          const startTime = new Date().toISOString();
          set({
            sessionStartTime: startTime,
            sliceRehearsalData: activeSlices.map((s) => ({
              sliceId: s.id,
              elapsedSeconds: 0,
              isCompleted: false
            }))
          });
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
        const { slices, reviewRecords } = get();
        const content = exportToMarkdown(slices, reviewRecords);
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
      },

      updateSliceElapsed: (sliceId, elapsedSeconds, isCompleted) => {
        set((state) => {
          const updatedData = state.sliceRehearsalData.map((d) =>
            d.sliceId === sliceId
              ? { ...d, elapsedSeconds, isCompleted }
              : d
          );
          return { sliceRehearsalData: updatedData };
        });
      },

      saveRehearsalReview: (recordData) => {
        const now = new Date().toISOString();
        const { activeSessionPlanId } = get();
        const newRecord: RehearsalReviewRecord = {
          ...recordData,
          id: generateId(),
          createdAt: now,
          sessionPlanId: activeSessionPlanId || undefined
        };

        set((state) => {
          const updatedSlices = state.slices.map((slice) => {
            const sliceReview = recordData.sliceReviews.find(
              (r) => r.sliceId === slice.id && r.rehearsalStatus === 'rehearsed'
            );
            if (!sliceReview) return slice;

            const newFlags: ReviewFlagType[] = [];
            if (sliceReview.actualDurationMinutes > slice.durationMinutes) {
              newFlags.push('timeout');
            }
            if (sliceReview.isStuck) {
              newFlags.push('stuck');
            }
            if (sliceReview.selfRating <= 2) {
              newFlags.push('lowRating');
            }

            return {
              ...slice,
              lastReview: sliceReview,
              reviewCount: slice.reviewCount + 1,
              reviewFlags: newFlags,
              updatedAt: now
            };
          });

          let updatedSessionPlans = state.sessionPlans;
          if (activeSessionPlanId) {
            updatedSessionPlans = state.sessionPlans.map((plan) =>
              plan.id === activeSessionPlanId
                ? {
                    ...plan,
                    rehearsalCount: plan.rehearsalCount + 1,
                    lastRehearsalId: newRecord.id,
                    updatedAt: now
                  }
                : plan
            );
          }

          return {
            reviewRecords: [newRecord, ...state.reviewRecords],
            slices: updatedSlices,
            sessionPlans: updatedSessionPlans,
            showReviewForm: false,
            sessionStartTime: null,
            reviewDraft: null,
            sliceRehearsalData: [],
            activeSessionPlanId: null
          };
        });
        get().runQualityCheck();
      },

      saveReviewDraft: (draft) => {
        set({
          reviewDraft: draft,
          showReviewForm: false
        });
      },

      clearReviewDraft: () => {
        set({
          reviewDraft: null,
          sessionStartTime: null,
          sliceRehearsalData: []
        });
      },

      continueFromDraft: () => {
        const draft = get().reviewDraft;
        if (draft) {
          set({
            showReviewForm: true
          });
        }
      },

      getReviewSummary: () => {
        const { reviewRecords, slices } = get();
        const timeoutSlices: string[] = [];
        const stuckSlices: string[] = [];
        const lowRatingSlices: string[] = [];

        slices.forEach((slice) => {
          if (slice.reviewFlags.includes('timeout')) timeoutSlices.push(slice.id);
          if (slice.reviewFlags.includes('stuck')) stuckSlices.push(slice.id);
          if (slice.reviewFlags.includes('lowRating')) lowRatingSlices.push(slice.id);
        });

        const allRatings = reviewRecords.flatMap((r) =>
          r.sliceReviews
            .filter((s) => s.rehearsalStatus === 'rehearsed')
            .map((s) => s.selfRating)
        );
        const averageRating = allRatings.length > 0
          ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
          : 0;

        const sortedRecords = [...reviewRecords].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return {
          totalReviews: reviewRecords.length,
          lastReviewDate: sortedRecords[0]?.createdAt || null,
          averageRating,
          timeoutSlices,
          stuckSlices,
          lowRatingSlices,
          recentReviews: sortedRecords.slice(0, 5)
        };
      },

      getAllReviewRecords: () => {
        const { reviewRecords } = get();
        return [...reviewRecords].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getSliceLatestReview: (sliceId) => {
        const { reviewRecords } = get();
        for (const record of reviewRecords) {
          const review = record.sliceReviews.find((r) => r.sliceId === sliceId);
          if (review) return review;
        }
        return undefined;
      },

      getPriorityOptimizationSlices: () => {
        const { slices } = get();
        return slices
          .filter((s) => !s.isBackup && s.reviewFlags.length > 0)
          .sort((a, b) => b.reviewFlags.length - a.reviewFlags.length);
      },

      setShowReviewForm: (show) => {
        set({ showReviewForm: show });
      },

      setShowReviewPanel: (show) => {
        set({ showReviewPanel: show });
      },

      setSessionStartTime: (time) => {
        set({ sessionStartTime: time });
      },

      setShowSessionPlanPanel: (show) => {
        set({ showSessionPlanPanel: show });
      },

      setShowSessionPlanForm: (show) => {
        set({ showSessionPlanForm: show });
      },

      setEditingSessionPlanId: (id) => {
        set({ editingSessionPlanId: id });
      },

      setViewingSessionPlanId: (id) => {
        set({ viewingSessionPlanId: id });
      },

      setActiveSessionPlanId: (id) => {
        set({ activeSessionPlanId: id });
      },

      addSessionPlan: (planData) => {
        const now = new Date().toISOString();
        const newPlan: SessionPlan = {
          ...planData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
          rehearsalCount: 0
        };
        set((state) => ({
          sessionPlans: [...state.sessionPlans, newPlan]
        }));
      },

      updateSessionPlan: (id, updates) => {
        set((state) => ({
          sessionPlans: state.sessionPlans.map((plan) =>
            plan.id === id
              ? { ...plan, ...updates, updatedAt: new Date().toISOString() }
              : plan
          )
        }));
      },

      deleteSessionPlan: (id) => {
        set((state) => ({
          sessionPlans: state.sessionPlans.filter((plan) => plan.id !== id),
          viewingSessionPlanId: state.viewingSessionPlanId === id ? null : state.viewingSessionPlanId,
          activeSessionPlanId: state.activeSessionPlanId === id ? null : state.activeSessionPlanId
        }));
      },

      getSessionPlan: (id) => {
        return get().sessionPlans.find((p) => p.id === id);
      },

      getSessionPlanDuration: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        if (!plan) return 0;
        const { slices } = get();
        const activeSliceIds = plan.slices
          .filter((s) => !s.isExcluded)
          .map((s) => s.sliceId);
        return slices
          .filter((s) => activeSliceIds.includes(s.id))
          .reduce((sum, s) => sum + s.durationMinutes, 0);
      },

      getSessionPlanDurationRisk: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        if (!plan) return { level: 'normal' as const, diffMinutes: 0, percent: 0 };
        
        const actualDuration = get().getSessionPlanDuration(planId);
        const targetDuration = plan.targetDurationMinutes;
        const diffMinutes = actualDuration - targetDuration;
        const percent = targetDuration > 0 ? (diffMinutes / targetDuration) * 100 : 0;

        let level: 'normal' | 'warning' | 'danger' = 'normal';
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
      },

      getSessionPlanActiveSlices: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        if (!plan) return [];
        const { slices } = get();
        const activeSlices = plan.slices
          .filter((s) => !s.isExcluded)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((s) => slices.find((slice) => slice.id === s.sliceId))
          .filter((s): s is ExhibitionSlice => s !== undefined);
        return activeSlices;
      },

      getSessionPlanReviews: (planId) => {
        const { reviewRecords } = get();
        return reviewRecords
          .filter((r) => r.sessionPlanId === planId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getSessionPlanLatestReview: (planId) => {
        const reviews = get().getSessionPlanReviews(planId);
        return reviews[0];
      },

      startRehearsalWithPlan: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        if (!plan) return;

        const activeSlices = get().getSessionPlanActiveSlices(planId);
        if (activeSlices.length === 0) return;

        set({
          isRehearsalMode: true,
          currentRehearsalIndex: 0,
          activeSessionPlanId: planId,
          sessionStartTime: new Date().toISOString(),
          sliceRehearsalData: activeSlices.map((s) => ({
            sliceId: s.id,
            elapsedSeconds: 0,
            isCompleted: false
          }))
        });
      },

      exportSessionPlanChecklist: (planId) => {
        const plan = get().sessionPlans.find((p) => p.id === planId);
        const { slices, reviewRecords } = get();
        if (!plan) return;

        const content = exportSessionPlanToMarkdown(plan, slices, reviewRecords);
        const filename = `场次计划_${plan.name}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.md`;
        downloadFile(content, filename, 'text/markdown');
      }
    }),
    {
      name: 'exhibition-slice-storage',
      partialize: (state) => ({
        slices: state.slices,
        filters: state.filters,
        reviewRecords: state.reviewRecords,
        reviewDraft: state.reviewDraft,
        sliceRehearsalData: state.sliceRehearsalData,
        sessionPlans: state.sessionPlans
      })
    }
  )
);
