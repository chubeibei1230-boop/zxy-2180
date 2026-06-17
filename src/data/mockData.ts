import { ExhibitionSlice } from '../types';
import { generateId } from '../utils/timeUtils';

const now = new Date().toISOString();

export const mockSlices: ExhibitionSlice[] = [
  {
    id: generateId(),
    title: '序厅开场',
    exhibit: '博物馆序厅',
    durationMinutes: 3,
    keySentence: '欢迎各位来到我们博物馆，今天将由我带领大家参观这个展览。',
    errorReminder: '注意控制语速，开场要热情有感染力',
    alternativeVersion: '大家好，欢迎参观本次展览，我是今天的讲解员XXX。',
    rehearsalStatus: 'familiar',
    orderIndex: 0,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '青铜鼎介绍',
    exhibit: '第一展厅-青铜展区',
    durationMinutes: 5,
    keySentence: '这件青铜鼎铸造于商代晚期，重达200公斤，是我们馆的镇馆之宝之一。',
    errorReminder: '不要把"司母戊鼎"说成"司母戊大方鼎"，正确名称是"后母戊鼎"',
    alternativeVersion: '现在大家看到的这件青铜器是商代的青铜鼎，它的铸造工艺代表了当时最高的冶金水平。',
    rehearsalStatus: 'pending',
    orderIndex: 1,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '陶瓷器发展史',
    exhibit: '第二展厅-陶瓷展区',
    durationMinutes: 8,
    keySentence: '中国陶瓷的发展可以追溯到新石器时代，经过数千年的演变，到宋代达到了艺术巅峰。',
    errorReminder: '区分"陶器"和"瓷器"的三个标准：原料、温度、吸水性',
    alternativeVersion: '',
    rehearsalStatus: 'needShorten',
    orderIndex: 2,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '青花瓷器详解',
    exhibit: '第二展厅-陶瓷展区',
    durationMinutes: 12,
    keySentence: '青花瓷始创于唐代，成熟于元代，在明清时期达到鼎盛，成为中国最具代表性的瓷器品种。',
    errorReminder: '注意元代青花和明代青花在发色上的区别',
    alternativeVersion: '大家现在看到的青花瓷是中国瓷器中的名贵品种，它用钴料在瓷胎上绘画，然后罩上透明釉，经高温一次烧成。',
    rehearsalStatus: 'pending',
    orderIndex: 3,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '书画作品欣赏',
    exhibit: '第三展厅-书画展区',
    durationMinutes: 6,
    keySentence: '这幅《山水图》是明代画家唐寅的真迹，体现了吴门画派的典型风格。',
    errorReminder: '唐寅就是唐伯虎，但讲解时建议用正式名称"唐寅"',
    alternativeVersion: '眼前这幅山水画出自明代著名画家唐寅之手，画面布局疏密得当，意境深远。',
    rehearsalStatus: 'skipped',
    orderIndex: 4,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '结束语',
    exhibit: '出口大厅',
    durationMinutes: 2,
    keySentence: '今天的参观就到这里，感谢各位的聆听，如有任何问题欢迎随时提问。',
    errorReminder: '记得提醒观众可以扫二维码获取更多展品信息',
    alternativeVersion: '非常感谢大家的耐心聆听，希望这次参观能给您留下美好的印象。',
    rehearsalStatus: 'familiar',
    orderIndex: 5,
    isBackup: false,
    createdAt: now,
    updatedAt: now
  },
  {
    id: generateId(),
    title: '青花瓷器详解（简版）',
    exhibit: '第二展厅-陶瓷展区',
    durationMinutes: 6,
    keySentence: '青花瓷是中国最具代表性的瓷器品种，始创于唐，成熟于元，鼎盛于明清。',
    errorReminder: '注意元代青花和明代青花在发色上的区别',
    alternativeVersion: '眼前的青花瓷用钴料绘画后罩透明釉高温烧成，呈现出白地蓝花的艺术效果。',
    rehearsalStatus: 'pending',
    orderIndex: 6,
    isBackup: true,
    parentId: 'placeholder',
    createdAt: now,
    updatedAt: now
  }
];
