export type RehearsalStatus = 'pending' | 'familiar' | 'needShorten' | 'skipped';

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
}

export interface AppActions {
  addSlice: (slice: Omit<ExhibitionSlice, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
}
