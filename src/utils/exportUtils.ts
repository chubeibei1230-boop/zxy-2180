import { ExhibitionSlice, RehearsalReviewRecord } from '../types';
import { formatDuration } from './timeUtils';

const getLatestReviewForSlice = (
  sliceId: string,
  reviewRecords: RehearsalReviewRecord[]
) => {
  for (const record of reviewRecords) {
    const review = record.sliceReviews.find((r) => r.sliceId === sliceId);
    if (review) return { review, record };
  }
  return null;
};

const getRatingStars = (rating: number): string => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

export const exportToMarkdown = (
  slices: ExhibitionSlice[],
  reviewRecords: RehearsalReviewRecord[] = []
): string => {
  const allSlices = [...slices]
    .filter(s => !s.isBackup)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const activeSlices = allSlices.filter(s => s.rehearsalStatus !== 'skipped');
  
  const totalDuration = activeSlices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const statusMap: Record<string, string> = {
    pending: '待排练',
    familiar: '已熟悉',
    needShorten: '需缩短',
    skipped: '临时跳过'
  };

  const reviewedSlices = allSlices.filter((s) => s.reviewCount > 0);
  const timeoutSlices = allSlices.filter((s) => s.reviewFlags.includes('timeout'));
  const stuckSlices = allSlices.filter((s) => s.reviewFlags.includes('stuck'));
  const lowRatingSlices = allSlices.filter((s) => s.reviewFlags.includes('lowRating'));
  
  let md = '# 讲解词排练清单\n\n';
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `## 概览\n\n`;
  md += `- 总切片数: ${allSlices.length}\n`;
  md += `- 预计总时长（不含临时跳过）: ${formatDuration(totalDuration)}\n`;
  if (allSlices.length !== activeSlices.length) {
    md += `- 临时跳过切片数: ${allSlices.length - activeSlices.length}\n`;
  }
  if (reviewRecords.length > 0) {
    md += `- 复盘总次数: ${reviewRecords.length}\n`;
    md += `- 已复盘切片数: ${reviewedSlices.length}\n`;
    if (timeoutSlices.length > 0) md += `- ⏰ 超时风险切片: ${timeoutSlices.length}\n`;
    if (stuckSlices.length > 0) md += `- ⚠️ 卡顿风险切片: ${stuckSlices.length}\n`;
    if (lowRatingSlices.length > 0) md += `- 📊 自评较低切片: ${lowRatingSlices.length}\n`;
  }
  md += `\n`;

  if (reviewRecords.length > 0) {
    md += `## 最近复盘摘要\n\n`;
    const sortedRecords = [...reviewRecords].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const latestRecord = sortedRecords[0];
    if (latestRecord) {
      const avgRating = latestRecord.sliceReviews.length > 0
        ? (latestRecord.sliceReviews.reduce((s, r) => s + r.selfRating, 0) / latestRecord.sliceReviews.length).toFixed(1)
        : '-';
      md += `- **复盘时间**: ${new Date(latestRecord.createdAt).toLocaleString('zh-CN')}\n`;
      md += `- **实际总时长**: ${formatDuration(latestRecord.totalActualDurationMinutes)}\n`;
      md += `- **参与切片数**: ${latestRecord.sliceReviews.length}\n`;
      md += `- **平均自评得分**: ${avgRating} / 5.0 ${getRatingStars(Math.round(parseFloat(avgRating)))}\n`;
      const timeoutCount = latestRecord.sliceReviews.filter((r) => {
        const sl = slices.find((s) => s.id === r.sliceId);
        return sl && r.actualDurationMinutes > sl.durationMinutes;
      }).length;
      const stuckCount = latestRecord.sliceReviews.filter((r) => r.isStuck).length;
      if (timeoutCount > 0) md += `- **超时切片数**: ${timeoutCount}\n`;
      if (stuckCount > 0) md += `- **卡顿切片数**: ${stuckCount}\n`;
      if (latestRecord.overallNotes) {
        md += `- **整体备注**: ${latestRecord.overallNotes}\n`;
      }
    }
    md += `\n`;

    if (timeoutSlices.length > 0 || stuckSlices.length > 0 || lowRatingSlices.length > 0) {
      md += `## ⚡ 需要优先优化的切片\n\n`;
      const prioritySlices = allSlices
        .filter((s) => s.reviewFlags.length > 0)
        .sort((a, b) => b.reviewFlags.length - a.reviewFlags.length);

      prioritySlices.forEach((slice, idx) => {
        const flags = [];
        if (slice.reviewFlags.includes('timeout')) flags.push('⏰ 易超时');
        if (slice.reviewFlags.includes('stuck')) flags.push('⚠️ 易卡顿');
        if (slice.reviewFlags.includes('lowRating')) flags.push('📊 自评低');
        md += `${idx + 1}. **${slice.title}** - ${flags.join('、')}\n`;
      });
      md += `\n`;
    }
  }

  md += `## 排练清单\n\n`;
  md += `| 序号 | 标题 | 关联展项 | 时长 | 状态 | 复盘标记 | 关键句 |\n`;
  md += `|------|------|----------|------|------|----------|--------|\n`;
  
  allSlices.forEach((slice, index) => {
    const flags = [];
    if (slice.reviewFlags.includes('timeout')) flags.push('超时');
    if (slice.reviewFlags.includes('stuck')) flags.push('卡顿');
    if (slice.reviewFlags.includes('lowRating')) flags.push('低分');
    const flagsStr = flags.length > 0 ? flags.join('/') : (slice.reviewCount > 0 ? `已复盘${slice.reviewCount}次` : '无');
    md += `| ${index + 1} | ${slice.title} | ${slice.exhibit} | ${slice.durationMinutes}分钟 | ${statusMap[slice.rehearsalStatus]} | ${flagsStr} | ${slice.keySentence} |\n`;
  });
  
  md += `\n---\n\n`;
  md += `## 详细内容\n\n`;
  
  allSlices.forEach((slice, index) => {
    const latest = getLatestReviewForSlice(slice.id, reviewRecords);
    md += `### ${index + 1}. ${slice.title}\n\n`;
    md += `- **关联展项**: ${slice.exhibit}\n`;
    md += `- **建议时长**: ${slice.durationMinutes}分钟\n`;
    md += `- **排练状态**: ${statusMap[slice.rehearsalStatus]}\n`;
    if (slice.reviewCount > 0) {
      const flags = [];
      if (slice.reviewFlags.includes('timeout')) flags.push('⏰ 超时风险');
      if (slice.reviewFlags.includes('stuck')) flags.push('⚠️ 卡顿风险');
      if (slice.reviewFlags.includes('lowRating')) flags.push('📊 自评较低');
      md += `- **复盘次数**: ${slice.reviewCount}次${flags.length > 0 ? ` · ${flags.join('、')}` : ''}\n`;
    }
    md += `\n`;
    md += `#### 关键句\n\n${slice.keySentence}\n\n`;
    if (slice.errorReminder) {
      md += `#### 易错提醒\n\n${slice.errorReminder}\n\n`;
    }
    if (slice.alternativeVersion) {
      md += `#### 备用说法\n\n${slice.alternativeVersion}\n\n`;
    }

    if (latest) {
      const { review, record } = latest;
      md += `#### 📋 最近一次复盘（${new Date(record.createdAt).toLocaleDateString('zh-CN')}）\n\n`;
      md += `- **实际耗时**: ${review.actualDurationMinutes}分钟`;
      if (review.actualDurationMinutes > slice.durationMinutes) {
        md += ` （⚠️ 超出建议 ${(review.actualDurationMinutes - slice.durationMinutes).toFixed(1)} 分钟）`;
      } else if (review.actualDurationMinutes < slice.durationMinutes) {
        md += ` （节省 ${(slice.durationMinutes - review.actualDurationMinutes).toFixed(1)} 分钟）`;
      }
      md += `\n`;
      md += `- **自评得分**: ${getRatingStars(review.selfRating)} (${review.selfRating}/5)\n`;
      md += `- **流畅度**: ${review.isStuck ? '⚠️ 有卡顿' : '✅ 流畅'}\n`;
      if (review.isStuck && review.stuckDescription) {
        md += `  - 卡顿描述: ${review.stuckDescription}\n`;
      }
      if (review.liveNotes) {
        md += `- **临场备注**: ${review.liveNotes}\n`;
      }
      if (review.improvementSuggestion) {
        md += `- **💡 改进建议**: ${review.improvementSuggestion}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  });
  
  return md;
};

export const exportToPlainText = (slices: ExhibitionSlice[]): string => {
  const allSlices = [...slices]
    .filter(s => !s.isBackup)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const activeSlices = allSlices.filter(s => s.rehearsalStatus !== 'skipped');
  
  const totalDuration = activeSlices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const statusMap: Record<string, string> = {
    pending: '待排练',
    familiar: '已熟悉',
    needShorten: '需缩短',
    skipped: '临时跳过'
  };
  
  let text = '==============================\n';
  text += '  讲解词排练清单\n';
  text += `  生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
  text += '==============================\n\n';
  text += `总切片数: ${allSlices.length}\n`;
  text += `预计总时长（不含临时跳过）: ${formatDuration(totalDuration)}\n`;
  if (allSlices.length !== activeSlices.length) {
    text += `临时跳过切片数: ${allSlices.length - activeSlices.length}\n`;
  }
  text += '\n';
  text += '------------------------------\n\n';
  
  allSlices.forEach((slice, index) => {
    text += `【${index + 1}】${slice.title}\n`;
    text += `  展项: ${slice.exhibit}\n`;
    text += `  时长: ${slice.durationMinutes}分钟 | 状态: ${statusMap[slice.rehearsalStatus]}\n`;
    text += `  关键句: ${slice.keySentence}\n`;
    if (slice.errorReminder) {
      text += `  ⚠️ 提醒: ${slice.errorReminder}\n`;
    }
    text += '\n';
  });
  
  return text;
};

export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
