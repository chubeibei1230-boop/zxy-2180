import { ExhibitionSlice, RehearsalReviewRecord, SessionPlan, ReviewReportData } from '../types';
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

export const exportSessionPlanToMarkdown = (
  plan: SessionPlan,
  slices: ExhibitionSlice[],
  reviewRecords: RehearsalReviewRecord[] = []
): string => {
  const sliceMap = new Map(slices.map((s) => [s.id, s]));
  const planSlices = plan.slices
    .filter((s) => !s.isExcluded)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((s) => sliceMap.get(s.sliceId))
    .filter((s): s is ExhibitionSlice => s !== undefined);
  
  const excludedSlices = plan.slices
    .filter((s) => s.isExcluded)
    .map((s) => sliceMap.get(s.sliceId))
    .filter((s): s is ExhibitionSlice => s !== undefined);

  const totalDuration = planSlices.reduce((sum, s) => sum + s.durationMinutes, 0);
  const diffDuration = totalDuration - plan.targetDurationMinutes;
  
  const planReviews = reviewRecords.filter((r) => r.sessionPlanId === plan.id);
  const latestReview = planReviews.length > 0 ? planReviews[0] : null;

  let md = `# 场次计划：${plan.name}\n\n`;
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  md += `## 场次信息\n\n`;
  md += `- **计划名称**: ${plan.name}\n`;
  md += `- **讲解对象**: ${plan.audience || '未设置'}\n`;
  md += `- **目标总时长**: ${formatDuration(plan.targetDurationMinutes)}\n`;
  md += `- **预计开始时间**: ${new Date(plan.scheduledStartTime).toLocaleString('zh-CN')}\n`;
  md += `- **创建时间**: ${new Date(plan.createdAt).toLocaleString('zh-CN')}\n`;
  md += `- **排练次数**: ${plan.rehearsalCount} 次\n`;
  md += `\n`;

  md += `## 时长预估\n\n`;
  md += `- **预计总时长**: ${formatDuration(totalDuration)}\n`;
  md += `- **目标时长**: ${formatDuration(plan.targetDurationMinutes)}\n`;
  if (diffDuration > 0) {
    md += `- ⚠️ **超出目标**: ${formatDuration(diffDuration)} (超出 ${((diffDuration / plan.targetDurationMinutes) * 100).toFixed(1)}%)\n`;
  } else if (diffDuration < 0) {
    md += `- 💡 **少于目标**: ${formatDuration(Math.abs(diffDuration))} (剩余 ${((Math.abs(diffDuration) / plan.targetDurationMinutes) * 100).toFixed(1)}%的缓冲时间)\n`;
  } else {
    md += `- ✅ **时长匹配**: 与目标时长完全一致\n`;
  }
  md += `- **切片数量**: ${planSlices.length} 个${excludedSlices.length > 0 ? ` (临时排除 ${excludedSlices.length} 个)` : ''}\n`;
  md += `\n`;

  if (latestReview) {
    md += `## 最近一次复盘结论\n\n`;
    const avgRating = latestReview.sliceReviews.length > 0
      ? (latestReview.sliceReviews.reduce((s, r) => s + r.selfRating, 0) / latestReview.sliceReviews.length).toFixed(1)
      : '-';
    const timeoutCount = latestReview.sliceReviews.filter((r) => {
      const sl = sliceMap.get(r.sliceId);
      return sl && r.actualDurationMinutes > sl.durationMinutes;
    }).length;
    const stuckCount = latestReview.sliceReviews.filter((r) => r.isStuck).length;
    const lowRatingCount = latestReview.sliceReviews.filter((r) => r.selfRating <= 2).length;

    md += `- **复盘时间**: ${new Date(latestReview.createdAt).toLocaleString('zh-CN')}\n`;
    md += `- **实际总时长**: ${formatDuration(latestReview.totalActualDurationMinutes)}\n`;
    md += `- **平均自评得分**: ${avgRating} / 5.0 ${getRatingStars(Math.round(parseFloat(avgRating)))}\n`;
    md += `- **超时切片数**: ${timeoutCount}\n`;
    md += `- **卡顿切片数**: ${stuckCount}\n`;
    md += `- **低评分切片数**: ${lowRatingCount}\n`;
    if (latestReview.overallNotes) {
      md += `- **整体备注**: ${latestReview.overallNotes}\n`;
    }
    md += `\n`;
  }

  if (excludedSlices.length > 0) {
    md += `## 临时排除的切片\n\n`;
    excludedSlices.forEach((slice, idx) => {
      md += `${idx + 1}. ${slice.title} (${slice.durationMinutes}分钟)\n`;
    });
    md += `\n`;
  }

  md += `## 切片顺序与清单\n\n`;
  md += `| 序号 | 标题 | 关联展项 | 预计时长 | 关键句 |\n`;
  md += `|------|------|----------|----------|--------|\n`;
  
  planSlices.forEach((slice, index) => {
    md += `| ${index + 1} | ${slice.title} | ${slice.exhibit} | ${slice.durationMinutes}分钟 | ${slice.keySentence} |\n`;
  });
  
  md += `\n---\n\n`;
  md += `## 详细内容\n\n`;
  
  planSlices.forEach((slice, index) => {
    const latest = getLatestReviewForSlice(slice.id, planReviews);
    md += `### ${index + 1}. ${slice.title}\n\n`;
    md += `- **关联展项**: ${slice.exhibit}\n`;
    md += `- **预计时长**: ${slice.durationMinutes}分钟\n`;
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
        md += ` （⚠️ 超出预计 ${(review.actualDurationMinutes - slice.durationMinutes).toFixed(1)} 分钟）`;
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

export const exportReviewReportToMarkdown = (report: ReviewReportData): string => {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  let md = '# 场次复盘报告\n\n';
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  md += `## 一、场次基本信息\n\n`;
  md += `- **场次名称**: ${report.sessionPlanName || '未关联场次计划'}\n`;
  if (report.audience) {
    md += `- **讲解对象**: ${report.audience}\n`;
  }
  md += `- **开始时间**: ${formatDateTime(report.sessionStartTime)}\n`;
  md += `- **结束时间**: ${formatDateTime(report.sessionEndTime)}\n`;
  md += `- **参与切片数**: ${report.totalSlices} 个\n`;
  md += `- **已排练切片**: ${report.rehearsedSlices} 个\n`;
  if (report.skippedSlices > 0) {
    md += `- **跳过切片**: ${report.skippedSlices} 个\n`;
  }
  md += `\n`;

  md += `## 二、整体表现结论\n\n`;
  md += `### 时长对比\n\n`;
  md += `- **计划总时长**: ${formatDuration(report.totalPlannedDurationMinutes)}\n`;
  md += `- **实际总时长**: ${formatDuration(report.totalActualDurationMinutes)}\n`;
  const durationDiff = report.totalActualDurationMinutes - report.totalPlannedDurationMinutes;
  if (durationDiff > 0) {
    md += `- ⚠️ **超时**: ${formatDuration(durationDiff)} (超出 ${((durationDiff / report.totalPlannedDurationMinutes) * 100).toFixed(1)}%)\n`;
  } else if (durationDiff < 0) {
    md += `- 💡 **提前完成**: ${formatDuration(Math.abs(durationDiff))}\n`;
  } else {
    md += `- ✅ **时长匹配**: 与计划时长完全一致\n`;
  }
  md += `\n`;

  md += `### 质量评估\n\n`;
  md += `- **平均自评得分**: ${report.averageRating.toFixed(1)} / 5.0 ${getRatingStars(Math.round(report.averageRating))}\n`;
  md += `- **超时切片数**: ${report.timeoutCount} 个\n`;
  md += `- **卡顿切片数**: ${report.stuckCount} 个\n`;
  md += `- **低评分切片数**: ${report.lowRatingCount} 个\n`;
  md += `\n`;

  if (report.overallNotes) {
    md += `### 整体备注\n\n`;
    md += `${report.overallNotes}\n\n`;
  }

  md += `## 三、问题切片清单\n\n`;

  if (report.prioritySlices.length > 0) {
    md += `### ⚡ 优先优化切片（${report.prioritySlices.length} 个）\n\n`;
    report.prioritySlices.forEach((slice, idx) => {
      const issues = [];
      if (slice.flags.includes('timeout')) issues.push('⏰ 超时');
      if (slice.flags.includes('stuck')) issues.push('⚠️ 卡顿');
      if (slice.flags.includes('lowRating')) issues.push('📊 自评低');

      md += `#### ${idx + 1}. ${slice.sliceTitle}\n\n`;
      md += `- **问题类型**: ${issues.join('、')}\n`;
      md += `- **展项**: ${slice.exhibit}\n`;
      md += `- **计划时长**: ${formatDuration(slice.plannedDurationMinutes)}\n`;
      md += `- **实际时长**: ${formatDuration(slice.actualDurationMinutes)}`;
      if (slice.actualDurationMinutes > slice.plannedDurationMinutes) {
        md += ` （超时 ${formatDuration(slice.actualDurationMinutes - slice.plannedDurationMinutes)}）`;
      }
      md += `\n`;
      md += `- **自评得分**: ${getRatingStars(slice.selfRating)} (${slice.selfRating}/5)\n`;

      if (slice.isStuck && slice.stuckDescription) {
        md += `- **卡顿描述**: ${slice.stuckDescription}\n`;
      }
      if (slice.liveNotes) {
        md += `- **临场备注**: ${slice.liveNotes}\n`;
      }
      if (slice.improvementSuggestion) {
        md += `- **💡 改进建议**: ${slice.improvementSuggestion}\n`;
      }
      md += `\n`;
    });
  } else {
    md += `✅ 本次排练没有发现问题切片，表现优秀！\n\n`;
  }

  md += `## 四、后续优化建议\n\n`;

  if (report.prioritySlices.length > 0) {
    md += `根据本次复盘结果，建议按以下优先级进行优化：\n\n`;

    const timeoutSlices = report.prioritySlices.filter((s) => s.flags.includes('timeout'));
    const stuckSlices = report.prioritySlices.filter((s) => s.flags.includes('stuck'));
    const lowRatingSlices = report.prioritySlices.filter((s) => s.flags.includes('lowRating'));

    if (timeoutSlices.length > 0) {
      md += `### 1. 时长控制优化\n\n`;
      md += `以下切片存在超时问题，建议精简内容或调整讲解重点：\n\n`;
      timeoutSlices.forEach((slice, idx) => {
        md += `${idx + 1}. **${slice.sliceTitle}** - 超时 ${formatDuration(slice.actualDurationMinutes - slice.plannedDurationMinutes)}\n`;
      });
      md += `\n`;
    }

    if (stuckSlices.length > 0) {
      md += `### 2. 流畅度优化\n\n`;
      md += `以下切片存在卡顿问题，建议加强记忆或准备提示卡：\n\n`;
      stuckSlices.forEach((slice, idx) => {
        md += `${idx + 1}. **${slice.sliceTitle}**\n`;
        if (slice.stuckDescription) {
          md += `   - 卡顿原因: ${slice.stuckDescription}\n`;
        }
      });
      md += `\n`;
    }

    if (lowRatingSlices.length > 0) {
      md += `### 3. 内容质量优化\n\n`;
      md += `以下切片自评得分较低，建议重新梳理讲解逻辑和内容：\n\n`;
      lowRatingSlices.forEach((slice, idx) => {
        md += `${idx + 1}. **${slice.sliceTitle}** - 自评 ${slice.selfRating} 分\n`;
      });
      md += `\n`;
    }

    md += `### 4. 行动计划\n\n`;
    md += `- [ ] 优先处理标记为"优先优化"的切片\n`;
    md += `- [ ] 针对超时切片，精简非核心内容\n`;
    md += `- [ ] 针对卡顿切片，加强记忆和练习\n`;
    md += `- [ ] 针对低评分切片，重新优化讲解词\n`;
    md += `- [ ] 完成优化后进行下一轮排练验证\n`;
    md += `\n`;
  } else {
    md += `本次排练表现良好，建议：\n\n`;
    md += `1. 继续保持当前的讲解状态和水平\n`;
    md += `2. 可以尝试挑战更短的讲解时长，提高效率\n`;
    md += `3. 定期复习，防止遗忘\n`;
    md += `4. 可以尝试面对真实观众进行演练\n`;
    md += `\n`;
  }

  md += `## 五、全部切片明细\n\n`;
  md += `| 序号 | 切片名称 | 展项 | 计划时长 | 实际时长 | 自评 | 状态 | 问题标记 |\n`;
  md += `|------|----------|------|----------|----------|------|------|----------|\n`;

  report.allSlices.forEach((slice, idx) => {
    const flags = [];
    if (slice.flags.includes('timeout')) flags.push('超时');
    if (slice.flags.includes('stuck')) flags.push('卡顿');
    if (slice.flags.includes('lowRating')) flags.push('低分');
    const flagsStr = flags.length > 0 ? flags.join('/') : '无';
    const statusStr = slice.rehearsalStatus === 'rehearsed' ? '已排练' : '未排练';

    md += `| ${idx + 1} | ${slice.sliceTitle} | ${slice.exhibit} | ${formatDuration(slice.plannedDurationMinutes)} | ${formatDuration(slice.actualDurationMinutes)} | ${slice.selfRating}/5 | ${statusStr} | ${flagsStr} |\n`;
  });

  md += `\n---\n\n`;
  md += `*本报告由讲解词管理系统自动生成，生成时间：${new Date().toLocaleString('zh-CN')}*\n`;

  return md;
};
