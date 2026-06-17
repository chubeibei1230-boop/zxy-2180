import { ExhibitionSlice, QualityIssue, QualityIssueType } from '../types';
import { generateId } from './timeUtils';

const levenshteinDistance = (a: string, b: string): number => {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

const calculateSimilarity = (a: string, b: string): number => {
  if (!a || !b) return 0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLen;
};

const checkDuplicateKeySentences = (slices: ExhibitionSlice[]): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  const sortedSlices = [...slices].filter(s => !s.isBackup && s.rehearsalStatus !== 'skipped').sort((a, b) => a.orderIndex - b.orderIndex);
  
  for (let i = 0; i < sortedSlices.length - 1; i++) {
    const current = sortedSlices[i];
    const next = sortedSlices[i + 1];
    const similarity = calculateSimilarity(current.keySentence, next.keySentence);
    
    if (similarity > 0.6) {
      issues.push({
        id: generateId(),
        type: 'duplicate',
        severity: similarity > 0.8 ? 'error' : 'warning',
        message: `相邻切片"${current.title}"与"${next.title}"的关键句相似度较高(${Math.round(similarity * 100)}%)，建议调整避免重复`,
        sliceId: current.id,
        relatedSliceId: next.id
      });
    }
  }
  return issues;
};

const checkTooLongDuration = (slices: ExhibitionSlice[]): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  const threshold = 10;
  
  slices.filter(s => !s.isBackup).forEach(slice => {
    if (slice.durationMinutes > threshold) {
      issues.push({
        id: generateId(),
        type: 'tooLong',
        severity: 'warning',
        message: `切片"${slice.title}"时长(${slice.durationMinutes}分钟)超过建议阈值(${threshold}分钟)，建议拆分`,
        sliceId: slice.id
      });
    }
  });
  return issues;
};

const checkMissingAlternative = (slices: ExhibitionSlice[]): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  
  slices.filter(s => !s.isBackup).forEach(slice => {
    if (!slice.alternativeVersion || slice.alternativeVersion.trim().length === 0) {
      issues.push({
        id: generateId(),
        type: 'missingAlternative',
        severity: 'warning',
        message: `切片"${slice.title}"缺少备用说法，建议补充以应对突发情况`,
        sliceId: slice.id
      });
    }
  });
  return issues;
};

const checkTransitionGap = (slices: ExhibitionSlice[]): QualityIssue[] => {
  const issues: QualityIssue[] = [];
  const sortedSlices = [...slices].filter(s => !s.isBackup).sort((a, b) => a.orderIndex - b.orderIndex);
  
  for (let i = 0; i < sortedSlices.length - 1; i++) {
    const current = sortedSlices[i];
    const next = sortedSlices[i + 1];
    
    if (current.rehearsalStatus === 'skipped' && next.rehearsalStatus !== 'skipped') {
      issues.push({
        id: generateId(),
        type: 'transitionGap',
        severity: 'warning',
        message: `切片"${current.title}"被跳过，需注意"${next.title}"的开场衔接是否自然`,
        sliceId: next.id,
        relatedSliceId: current.id
      });
    }
  }
  return issues;
};

export const runAllChecks = (slices: ExhibitionSlice[]): QualityIssue[] => {
  return [
    ...checkDuplicateKeySentences(slices),
    ...checkTooLongDuration(slices),
    ...checkMissingAlternative(slices),
    ...checkTransitionGap(slices)
  ];
};

export const getIssueTypeLabel = (type: QualityIssueType): string => {
  const labels: Record<QualityIssueType, string> = {
    duplicate: '关键句重复',
    tooLong: '单段过长',
    missingAlternative: '缺少备用说法',
    transitionGap: '衔接断点'
  };
  return labels[type];
};
