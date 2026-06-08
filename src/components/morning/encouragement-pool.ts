// 劳作鼓励语库 - 12句随机
export const ENCOURAGEMENT_POOL = [
  '劳作是支撑所有活动的根本，今日也以感谢的心劳作吧。',
  '你手中的笔与百姓手中的犁，都是撑起这个世界的脊梁。',
  '种下一日的勤勉，收得一寸的踏实。今日的劳作，他日自会开花。',
  '疲惫不是软弱，而是你认真活过的证据。',
  '大国从一寸田埂开始，仁政从一日勤务起步。',
  '今日流下的每一滴汗，都在为回到王宫的那条路铺砖。',
  '申先生年轻时抄了十年文书——那些抄写没有一个字是白费的。',
  '不必想今天能不能做完，只问今天有没有开始。',
  '大人和大人物的区别，在于大人物连小事也亲手做。',
  '劳作完看看你的手——它比昨天更有力量了。',
  '这块田是你自己的。别人替你耕不了的。',
  '今日埋头，是为了明日抬头时不心虚。',
];

// 获取随机鼓励语（可避免重复）
let lastIndex = -1;
export function getRandomEncouragement(): string {
  let index = Math.floor(Math.random() * ENCOURAGEMENT_POOL.length);
  // Avoid repeating last one
  if (index === lastIndex && ENCOURAGEMENT_POOL.length > 1) {
    index = (index + 1) % ENCOURAGEMENT_POOL.length;
  }
  lastIndex = index;
  return ENCOURAGEMENT_POOL[index];
}

// 五门功课配置
export const FIVE_TASKS = [
  {
    type: 'reading' as const,
    emoji: '📖',
    name: '读书',
    description: '学习经典，反思自我',
    placeholder: '例：《大学》第三章',
    durations: ['15分钟', '30分钟', '1小时'],
  },
  {
    type: 'writing' as const,
    emoji: '✍️',
    name: '习字',
    description: '静心书写，记录反思',
    placeholder: '例：练习今日说的三句话的表述',
    durations: ['15分钟', '30分钟', '45分钟'],
    options: ['书艺（练字/书法）', '演说（练习公开说话）', '烹饪（练习煮饭）', '乐器（弹琴/吹笛）'],
  },
  {
    type: 'service' as const,
    emoji: '🛠️',
    name: '劳作',
    description: '帮助他人，实践善行',
    placeholder: '例：完成项目原型设计',
    durations: ['30分钟', '1小时', '2小时', '半天'],
    hasEncouragement: true,
  },
  {
    type: 'meditation' as const,
    emoji: '🧘',
    name: '修心',
    description: '静坐暂停，觉察当下',
    placeholder: '记录今日感悟',
    isMeditation: true,
  },
  {
    type: 'exercise' as const,
    emoji: '🏃',
    name: '养身',
    description: '锻炼身体，养护根本',
    placeholder: '例：晨起散步',
    durations: ['15分钟', '20分钟', '30分钟'],
    options: ['晨起散步（15分钟）', '拉伸/太极（20分钟）', '冷水洗漱（儒生晨洗仪式）', '健康饮食（今日注意饮食）', '早睡（今晚__点前就寝）'],
  },
];

// 时间→时段映射
export function getPeriodOfDay(time: string): string {
  if (!time) return '';

  const hour = parseInt(time.split(':')[0], 10);

  if (hour >= 4 && hour < 9) return '晨起';
  if (hour >= 9 && hour < 12) return '上午';
  if (hour >= 12 && hour < 15) return '午间';
  if (hour >= 15 && hour < 19) return '午后';
  if (hour >= 19 && hour < 23) return '晚间';
  return '夜深';
}

// 根据时间排序的时段顺序
const PERIOD_ORDER = ['晨起', '上午', '午间', '午后', '晚间', '夜深'];

interface SortableTask {
  type: string;
  content: string;
  start_time?: string | null;
}

export function sortTasksByTime(tasks: SortableTask[]): SortableTask[] {
  return [...tasks].sort((a, b) => {
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;

    const periodA = getPeriodOfDay(a.start_time);
    const periodB = getPeriodOfDay(b.start_time);

    const indexA = PERIOD_ORDER.indexOf(periodA);
    const indexB = PERIOD_ORDER.indexOf(periodB);

    if (indexA !== indexB) return indexA - indexB;
    return a.start_time.localeCompare(b.start_time);
  });
}