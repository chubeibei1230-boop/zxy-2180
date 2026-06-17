export type RehearsalStatus = 'pending' | 'familiar' | 'needShorten' | 'skipped';
export type SelfRating = 1 | 2 | 3 | 4 | 5;
export type ReviewFlagType = 'timeout' | 'stuck' | 'lowRating';

export interface SliceReview {
  sliceId: string;
  actualDurationMinutes: number;
  isStuck: boolean;
  stuckDescription: string;
  liveNotes: string;
  selfRating: SelfRating;
  improvementSuggestion: string;
}

export interface RehearsalReviewRecord {
  id: string;
  sessionStartTime: string;
  sessionEndTime: string;
  totalActualDurationMinutes: number;
  overallNotes: string;
  sliceReviews: SliceReview[];
  createdAt: string;
}

export interface ReviewSummary {
  totalReviews: number;
  lastReviewDate: string | null;
  averageRating: number;
  timeoutSlices: string[];
  stuckSlices: string[];
  lowRatingSlices: string[];
  recentReviews: RehearsalReviewRecord[];
}

export interface ExhibitionSlice {
  id: string;
  title: string;
  exhibit: string;
  durationMinutes: number;
  keySentence: string;
  errorReminder: string;
  alternativeVersion: string;
  rehearsalStatus: RehearsalStatus;
  orderIndex: number;
  isBackup: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  lastReview?: SliceReview | null;
  reviewCount: number;
  reviewFlags: ReviewFlagType[];
}

export interface Filters {
  exhibit: string;
  rehearsalStatus: string;
  minDuration: number;
  maxDuration: number;
  reminderType: string;
  searchKeyword: string;
}

export type QualityIssueType = 'duplicate' | 'tooLong' | 'missingAlternative' | 'transitionGap';

export interface QualityIssue {
  id: string;
  type: QualityIssueType;
  severity: 'warning' | 'error';
  message: string;
  sliceId: string;
  relatedSliceId?: string;
}

export interface AppState {
  slices: ExhibitionSlice[];
  filters: Filters;
  selectedIds: string[];
  qualityIssues: QualityIssue[];
  isRehearsalMode: boolean;
  currentRehearsalIndex: number;
  editingSliceId: string | null | undefined;
  reviewRecords: RehearsalReviewRecord[];
  showReviewForm: boolean;
  showReviewPanel: boolean;
  sessionStartTime: string | null;
}

export interface AppActions {
  addSlice: (slice: Omit<ExhibitionSlice, 'id' | 'createdAt' | 'updatedAt' | 'reviewCount' | 'reviewFlags'>) => void;
  updateSlice: (id: string, updates: Partial<ExhibitionSlice>) => void;
  deleteSlice: (id: string) => void;
  duplicateSlice: (id: string) => void;
  reorderSlices: (activeId: string, overId: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  toggleSelected: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  batchUpdateStatus: (status: RehearsalStatus) => void;
  setRehearsalMode: (isActive: boolean) => void;
  setCurrentRehearsalIndex: (index: number) => void;
  setEditingSliceId: (id: string | null | undefined) => void;
  runQualityCheck: () => void;
  exportChecklist: () => void;
  getTotalDuration: () => number;
  getFilteredSlices: () => ExhibitionSlice[];
  getExhibitList: () => string[];
  saveRehearsalReview: (record: Omit<RehearsalReviewRecord, 'id' | 'createdAt'>) => void;
  getReviewSummary: () => ReviewSummary;
  getSliceLatestReview: (sliceId: string) => SliceReview | undefined;
  getPriorityOptimizationSlices: () => ExhibitionSlice[];
  setShowReviewForm: (show: boolean) => void;
  setShowReviewPanel: (show: boolean) => void;
  setSessionStartTime: (time: string | null) => void;
}
