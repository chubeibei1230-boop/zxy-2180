import { ExhibitionSlice } from '../types';
import { formatDuration } from './timeUtils';

export const exportToMarkdown = (slices: ExhibitionSlice[]): string => {
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
  
  let md = '# 讲解词排练清单\n\n';
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `## 概览\n\n`;
  md += `- 总切片数: ${allSlices.length}\n`;
  md += `- 预计总时长（不含临时跳过）: ${formatDuration(totalDuration)}\n`;
  if (allSlices.length !== activeSlices.length) {
    md += `- 临时跳过切片数: ${allSlices.length - activeSlices.length}\n`;
  }
  md += `\n`;
  md += `## 排练清单\n\n`;
  md += `| 序号 | 标题 | 关联展项 | 时长 | 状态 | 关键句 |\n`;
  md += `|------|------|----------|------|------|--------|\n`;
  
  allSlices.forEach((slice, index) => {
    md += `| ${index + 1} | ${slice.title} | ${slice.exhibit} | ${slice.durationMinutes}分钟 | ${statusMap[slice.rehearsalStatus]} | ${slice.keySentence} |\n`;
  });
  
  md += `\n---\n\n`;
  md += `## 详细内容\n\n`;
  
  allSlices.forEach((slice, index) => {
    md += `### ${index + 1}. ${slice.title}\n\n`;
    md += `- **关联展项**: ${slice.exhibit}\n`;
    md += `- **建议时长**: ${slice.durationMinutes}分钟\n`;
    md += `- **排练状态**: ${statusMap[slice.rehearsalStatus]}\n\n`;
    md += `#### 关键句\n\n${slice.keySentence}\n\n`;
    if (slice.errorReminder) {
      md += `#### 易错提醒\n\n${slice.errorReminder}\n\n`;
    }
    if (slice.alternativeVersion) {
      md += `#### 备用说法\n\n${slice.alternativeVersion}\n\n`;
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
