import type { DayRecord, ShadowRecord, BehaviorEntry, ShadowType } from '@/types/database';
import type {
  WeeklyCompass,
  LessonQualitySummary,
  ShadowWeekSummary,
  ChronicleEntry,
  ChronicleWeek,
  PatternInsights,
  ReflectionCorrelation,
  TriggerContextDistribution,
  LessonShadowCorrelation,
  TeacherCommentary,
} from '@/types/behavior';
import { getPhaseDisplayInfo } from './game-logic';

// ============ Constants ============

const LESSON_META: Record<string, { label: string; emoji: string }> = {
  reading: { label: '读书', emoji: '📜' },
  writing: { label: '习字', emoji: '🖌️' },
  service: { label: '劳作', emoji: '🪓' },
  meditation: { label: '修心', emoji: '🪷' },
  exercise: { label: '运动', emoji: '🚶' },
};

const SHADOW_META: Record<ShadowType, { name: string; emoji: string }> = {
  arrogance: { name: '逆星', emoji: '⚡' },
  selfishness: { name: '毒疮', emoji: '🕳️' },
};

const BEHAVIOR_CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  work: { label: '工作', emoji: '💼' },
  family: { label: '家庭', emoji: '🏡' },
  social: { label: '社交', emoji: '💬' },
  self: { label: '独处', emoji: '🌿' },
  health: { label: '健康', emoji: '❤️' },
  learning: { label: '学习', emoji: '📝' },
};

// ============ Weekly Compass ============

export function computeWeeklyCompass(
  dayRecords: DayRecord[],
  shadowRecords: ShadowRecord[],
  behaviorEntries: BehaviorEntry[],
  currentPhase: string,
  dayInJourney: number,
  activeShadows: Array<{ shadowType: ShadowType; currentHp: number; maxHp: number }>
): WeeklyCompass {
  const phaseInfo = getPhaseDisplayInfo(currentPhase as 'awakening' | 'self_cultivation' | 'trials' | 'return');

  // Lesson quality summaries
  const lessonSummaries = computeLessonSummaries(dayRecords);

  // Shadow week summaries
  const shadowSummaries = computeShadowSummaries(shadowRecords, activeShadows);

  // Average behavior score
  const allScores = [
    ...shadowRecords.filter(r => r.behavior_score != null).map(r => r.behavior_score!),
    ...behaviorEntries.filter(e => e.score > 0).map(e => e.score),
  ];
  const avgBehaviorScore = allScores.length > 0
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : 0;

  // Trend direction
  const trendDirection = computeTrendDirection(shadowRecords, behaviorEntries);

  // Reflection depth
  const allDepths = shadowRecords.filter(r => r.reflection_depth != null).map(r => r.reflection_depth!);
  const totalReflectionDepth = allDepths.length > 0
    ? Math.round((allDepths.reduce((a, b) => a + b, 0) / allDepths.length) * 10) / 10
    : 0;

  // Teacher commentary
  const teacherCommentary = generateCompassCommentary(
    lessonSummaries,
    shadowSummaries,
    avgBehaviorScore,
    totalReflectionDepth
  );

  return {
    dayInJourney,
    phaseName: phaseInfo.name,
    avgBehaviorScore,
    trendDirection,
    lessonSummaries,
    shadowSummaries,
    totalReflectionDepth,
    teacherCommentary,
  };
}

function computeLessonSummaries(dayRecords: DayRecord[]): LessonQualitySummary[] {
  const lessonTypes = ['reading', 'writing', 'service', 'meditation', 'exercise'];
  const recentRecords = dayRecords.slice(-7); // last 7 days

  return lessonTypes.map(type => {
    const meta = LESSON_META[type] || { label: type, emoji: '📋' };
    const qualities: number[] = [];
    const completedDays: boolean[] = [];

    for (const record of recentRecords) {
      const slot = (record.schedule || []).find(s => s.type === type);
      if (slot) {
        completedDays.push(slot.status === 'done');
        if (slot.quality) qualities.push(slot.quality);
      } else {
        completedDays.push(false);
      }
    }

    const avgQuality = qualities.length > 0
      ? Math.round((qualities.reduce((a, b) => a + b, 0) / qualities.length) * 10) / 10
      : 0;

    const completionRate = completedDays.length > 0
      ? completedDays.filter(Boolean).length / completedDays.length
      : 0;

    // Trend: compare first half vs second half
    const mid = Math.floor(qualities.length / 2);
    const firstHalf = qualities.slice(0, mid);
    const secondHalf = qualities.slice(mid);
    const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
    const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;
    const trend: 'up' | 'down' | 'stable' = secondAvg > firstAvg + 0.5 ? 'up' : secondAvg < firstAvg - 0.5 ? 'down' : 'stable';

    return {
      type,
      label: meta.label,
      emoji: meta.emoji,
      avgQuality,
      completionRate,
      trend,
      completedDays,
    };
  });
}

function computeShadowSummaries(
  shadowRecords: ShadowRecord[],
  activeShadows: Array<{ shadowType: ShadowType; currentHp: number; maxHp: number }>
): ShadowWeekSummary[] {
  return activeShadows.map(shadow => {
    const meta = SHADOW_META[shadow.shadowType];
    const typeRecords = shadowRecords.filter(r => r.shadow_type === shadow.shadowType);
    const triggerCount = typeRecords.filter(r => r.self_rating === '+1').length;
    const resistCount = typeRecords.filter(r => r.self_rating === '-1' || r.self_rating === 'breakthrough').length;

    // Recent HP change from records
    const hpChange = resistCount - triggerCount; // positive = good (HP went down)

    // Trend based on recent records (last 7)
    const recent = typeRecords.slice(-7);
    const recentTrigger = recent.filter(r => r.self_rating === '+1').length;
    const recentResist = recent.filter(r => r.self_rating === '-1' || r.self_rating === 'breakthrough').length;
    const trend: 'up' | 'down' | 'stable' =
      recentResist > recentTrigger ? 'down' : // HP going down = good
      recentTrigger > recentResist ? 'up' :
      'stable';

    return {
      shadowType: shadow.shadowType,
      name: meta.name,
      emoji: meta.emoji,
      triggerCount,
      resistCount,
      currentHp: shadow.currentHp,
      maxHp: shadow.maxHp,
      hpChange,
      trend,
    };
  });
}

function computeTrendDirection(
  shadowRecords: ShadowRecord[],
  behaviorEntries: BehaviorEntry[]
): 'improving' | 'declining' | 'stable' {
  // Compare first half vs second half of records
  const allDates = new Set([
    ...shadowRecords.map(r => r.date),
    ...behaviorEntries.map(e => e.date),
  ]);
  const sortedDates = Array.from(allDates).sort();
  const mid = Math.floor(sortedDates.length / 2);
  const firstHalf = sortedDates.slice(0, mid);
  const secondHalf = sortedDates.slice(mid);

  const firstHalfResist = shadowRecords.filter(r => firstHalf.includes(r.date) && (r.self_rating === '-1' || r.self_rating === 'breakthrough')).length;
  const firstHalfTrigger = shadowRecords.filter(r => firstHalf.includes(r.date) && r.self_rating === '+1').length;
  const secondHalfResist = shadowRecords.filter(r => secondHalf.includes(r.date) && (r.self_rating === '-1' || r.self_rating === 'breakthrough')).length;
  const secondHalfTrigger = shadowRecords.filter(r => secondHalf.includes(r.date) && r.self_rating === '+1').length;

  const firstRatio = firstHalfTrigger > 0 ? firstHalfResist / firstHalfTrigger : 1;
  const secondRatio = secondHalfTrigger > 0 ? secondHalfResist / secondHalfTrigger : 1;

  if (secondRatio > firstRatio + 0.3) return 'improving';
  if (secondRatio < firstRatio - 0.3) return 'declining';
  return 'stable';
}

// ============ Chronicle Timeline ============

export function computeChronicleEntries(
  dayRecords: DayRecord[],
  shadowRecords: ShadowRecord[],
  behaviorEntries: BehaviorEntry[]
): ChronicleWeek[] {
  const allEntries: ChronicleEntry[] = [];

  // Lesson entries from DayRecords
  for (const record of dayRecords) {
    const dayNumber = record.dayNumber || 0;
    for (const slot of (record.schedule || [])) {
      if (slot.status === 'done' || slot.status === 'missed') {
        const meta = LESSON_META[slot.type] || { label: slot.type, emoji: '📋' };
        allEntries.push({
          id: `lesson-${record.id}-${slot.type}`,
          date: record.calendarDate,
          dayNumber,
          entryType: 'lesson',
          category: slot.type,
          icon: meta.emoji,
          title: `${meta.label}${slot.status === 'missed' ? ' (未完成)' : ''}`,
          description: slot.reflection || slot.detail || `${meta.label}·质量 ${slot.quality || '-'}/5`,
          score: slot.quality || null,
          reflection: slot.reflection || null,
          tags: [],
        });
      }
    }

    // Kingly deeds
    for (const deed of (record.kinglyDeeds || [])) {
      allEntries.push({
        id: `deed-${record.id}-${deed.recordedAt}`,
        date: record.calendarDate,
        dayNumber,
        entryType: 'kingly_deed',
        category: 'kingly_deed',
        icon: '⭐',
        title: '王德',
        description: deed.description,
        score: null,
        reflection: null,
        tags: ['王德'],
      });
    }

    // Meditation — skip if already covered by a lesson entry from schedule
    const hasMeditationLesson = (record.schedule || []).some(
      s => s.type === 'meditation' && (s.status === 'done' || s.status === 'missed')
    );
    if (record.meditation && !hasMeditationLesson) {
      allEntries.push({
        id: `med-${record.id}`,
        date: record.calendarDate,
        dayNumber,
        entryType: 'meditation',
        category: 'meditation',
        icon: LESSON_META.meditation.emoji,
        title: '修心',
        description: record.meditation.content || '静坐反思',
        score: null,
        reflection: record.meditation.content || null,
        tags: [],
      });
    }
  }

  // Shadow entries
  for (const sr of shadowRecords) {
    const meta = SHADOW_META[sr.shadow_type] || { name: sr.shadow_type, emoji: '👹' };
    const dayNumber = dayRecords.find(d => d.calendarDate === sr.date)?.dayNumber || 0;
    allEntries.push({
      id: `shadow-${sr.id}`,
      date: sr.date,
      dayNumber,
      entryType: 'shadow',
      category: sr.shadow_type,
      icon: meta.emoji,
      title: `${meta.name} · ${formatRating(sr.self_rating)}`,
      description: sr.behavior_record,
      score: sr.behavior_score,
      reflection: sr.reflection_detail,
      tags: sr.trigger_tags || [],
    });
  }

  // General behavior entries (skip lessons — already covered by day_records.schedule)
  for (const entry of behaviorEntries) {
    if (entry.entry_type === 'lesson') continue; // lessons are already rendered from day_records
    const catMeta = BEHAVIOR_CATEGORY_META[entry.category] || { label: entry.category, emoji: '📝' };
    const dayNumber = dayRecords.find(d => d.calendarDate === entry.date)?.dayNumber || 0;
    allEntries.push({
      id: `behavior-${entry.id}`,
      date: entry.date,
      dayNumber,
      entryType: 'behavior',
      category: entry.category,
      icon: catMeta.emoji,
      title: catMeta.label,
      description: entry.description,
      score: entry.score,
      reflection: entry.reflection,
      tags: entry.tags,
    });
  }

  // Sort by date descending
  allEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group by week
  const weeks: ChronicleWeek[] = [];
  let currentWeek: ChronicleEntry[] = [];
  let currentWeekNumber = 0;

  for (const entry of allEntries) {
    const weekNum = Math.ceil(entry.dayNumber / 7) || 1;
    if (weekNum !== currentWeekNumber) {
      if (currentWeek.length > 0) {
        weeks.push({
          weekNumber: currentWeekNumber,
          label: `第 ${currentWeekNumber} 周`,
          entries: [...currentWeek],
        });
      }
      currentWeekNumber = weekNum;
      currentWeek = [];
    }
    currentWeek.push(entry);
  }

  if (currentWeek.length > 0) {
    weeks.push({
      weekNumber: currentWeekNumber,
      label: `第 ${currentWeekNumber} 周`,
      entries: currentWeek,
    });
  }

  return weeks;
}

// ============ Pattern Insights ============

export function computePatternInsights(
  dayRecords: DayRecord[],
  shadowRecords: ShadowRecord[],
  behaviorEntries: BehaviorEntry[],
  activeShadows: Array<{ shadowType: ShadowType }>
): PatternInsights {
  const reflectionCorrelation = computeReflectionCorrelation(shadowRecords);
  const triggerContexts = computeTriggerContextDistribution(shadowRecords, activeShadows);
  const lessonShadowCorrelations = computeLessonShadowCorrelations(dayRecords, shadowRecords);
  const teacherCommentary = generatePatternCommentary(reflectionCorrelation, triggerContexts, lessonShadowCorrelations);

  return {
    reflectionCorrelation,
    triggerContexts,
    lessonShadowCorrelations,
    teacherCommentary,
  };
}

function computeReflectionCorrelation(shadowRecords: ShadowRecord[]): ReflectionCorrelation {
  const deepRecords = shadowRecords.filter(r => (r.reflection_depth || 0) >= 4);
  const shallowRecords = shadowRecords.filter(r => (r.reflection_depth || 0) <= 2 && r.reflection_depth != null);

  const deepReflectionRate = shadowRecords.length > 0
    ? deepRecords.length / shadowRecords.length
    : 0;

  const shallowReflectionRate = shadowRecords.length > 0
    ? shallowRecords.length / shadowRecords.length
    : 0;

  const deepSuccesses = deepRecords.filter(r => r.self_rating === '-1' || r.self_rating === 'breakthrough').length;
  const deepReflectionSuccessRate = deepRecords.length > 0 ? deepSuccesses / deepRecords.length : 0;

  const shallowSuccesses = shallowRecords.filter(r => r.self_rating === '-1' || r.self_rating === 'breakthrough').length;
  const shallowReflectionSuccessRate = shallowRecords.length > 0 ? shallowSuccesses / shallowRecords.length : 0;

  const deepScores = deepRecords.filter(r => r.behavior_score != null).map(r => r.behavior_score!);
  const deepReflectionAvgScore = deepScores.length > 0
    ? Math.round((deepScores.reduce((a, b) => a + b, 0) / deepScores.length) * 10) / 10
    : 0;

  const shallowScores = shallowRecords.filter(r => r.behavior_score != null).map(r => r.behavior_score!);
  const shallowReflectionAvgScore = shallowScores.length > 0
    ? Math.round((shallowScores.reduce((a, b) => a + b, 0) / shallowScores.length) * 10) / 10
    : 0;

  return {
    deepReflectionRate,
    shallowReflectionRate,
    deepReflectionSuccessRate,
    shallowReflectionSuccessRate,
    deepReflectionAvgScore,
    shallowReflectionAvgScore,
  };
}

function computeTriggerContextDistribution(
  shadowRecords: ShadowRecord[],
  activeShadows: Array<{ shadowType: ShadowType }>
): TriggerContextDistribution[] {
  return activeShadows.map(shadow => {
    const meta = SHADOW_META[shadow.shadowType];
    const typeRecords = shadowRecords.filter(r => r.shadow_type === shadow.shadowType && r.trigger_tags && r.trigger_tags.length > 0);

    const tagCounts: Record<string, number> = {};
    for (const record of typeRecords) {
      for (const tag of (record.trigger_tags || [])) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    const totalTags = Object.values(tagCounts).reduce((a, b) => a + b, 0);
    const contexts = Object.entries(tagCounts)
      .map(([tag, count]) => ({
        tag,
        count,
        percentage: totalTags > 0 ? Math.round((count / totalTags) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      shadowType: shadow.shadowType,
      name: meta.name,
      contexts,
    };
  });
}

function computeLessonShadowCorrelations(
  dayRecords: DayRecord[],
  shadowRecords: ShadowRecord[]
): LessonShadowCorrelation[] {
  const lessonTypes = ['reading', 'writing', 'service', 'meditation', 'exercise'];

  return lessonTypes.map(type => {
    const meta = LESSON_META[type] || { label: type, emoji: '📋' };

    // Build a map: date → lesson quality
    const dateQuality: Record<string, number> = {};
    const dateHasShadowTrigger: Record<string, boolean> = {};

    for (const record of dayRecords) {
      const slot = (record.schedule || []).find(s => s.type === type);
      if (slot?.quality) {
        dateQuality[record.calendarDate] = slot.quality;
      }
    }

    for (const sr of shadowRecords) {
      if (sr.self_rating === '+1') {
        dateHasShadowTrigger[sr.date] = true;
      }
    }

    const highQualityDates = Object.entries(dateQuality).filter(([, q]) => q >= 4);
    const lowQualityDates = Object.entries(dateQuality).filter(([, q]) => q <= 2);

    const highQualityTriggerDays = highQualityDates.filter(([date]) => dateHasShadowTrigger[date]).length;
    const lowQualityTriggerDays = lowQualityDates.filter(([date]) => dateHasShadowTrigger[date]).length;

    const highQualityShadowTriggerRate = highQualityDates.length > 0 ? highQualityTriggerDays / highQualityDates.length : 0;
    const lowQualityShadowTriggerRate = lowQualityDates.length > 0 ? lowQualityTriggerDays / lowQualityDates.length : 0;

    const reduction = lowQualityShadowTriggerRate > 0
      ? Math.round((1 - highQualityShadowTriggerRate / lowQualityShadowTriggerRate) * 100)
      : 0;

    const insight = reduction > 20
      ? `${meta.label}质量高的日子，阴影触发减少约 ${reduction}%`
      : null;

    return {
      lessonType: type,
      label: meta.label,
      emoji: meta.emoji,
      highQualityShadowTriggerRate,
      lowQualityShadowTriggerRate,
      insight,
    };
  });
}

// ============ Teacher Commentary ============

function generateCompassCommentary(
  lessons: LessonQualitySummary[],
  shadows: ShadowWeekSummary[],
  avgBehaviorScore: number,
  totalReflectionDepth: number
): TeacherCommentary {
  const lines: { shen: string[]; xu: string[] } = { shen: [], xu: [] };

  // Best and worst lessons
  const sortedLessons = [...lessons].sort((a, b) => b.avgQuality - a.avgQuality);
  const best = sortedLessons[0];
  const worst = sortedLessons[sortedLessons.length - 1];

  if (best && best.avgQuality >= 3.5) {
    lines.shen.push(`${best.label}坚持得好。`);
  }
  if (worst && worst.avgQuality < 3 && worst.avgQuality > 0) {
    lines.shen.push(`${worst.label}散了些。心不定，万事难成。`);
  }

  // Shadow commentary
  for (const shadow of shadows) {
    if (shadow.trend === 'up') {
      lines.shen.push(`${shadow.name}仍在反复。`);
    } else if (shadow.trend === 'down' && shadow.resistCount > 0) {
      lines.xu.push(`${shadow.name}在退——这是好事。`);
    }
  }

  // Reflection depth
  if (totalReflectionDepth < 2.5 && totalReflectionDepth > 0) {
    lines.xu.push('殿下似乎不愿细想。是太累了，还是不想面对？');
  } else if (totalReflectionDepth >= 4) {
    lines.shen.push('你的反思越来越深了。');
  }

  // Behavior score
  if (avgBehaviorScore >= 7) {
    lines.xu.push('你的应对在进步。继续保持。');
  }

  return {
    shenComment: lines.shen.length > 0 ? lines.shen.join('') : null,
    xuComment: lines.xu.length > 0 ? lines.xu.join('') : null,
  };
}

function generatePatternCommentary(
  reflection: ReflectionCorrelation,
  triggerContexts: TriggerContextDistribution[],
  lessonCorrelations: LessonShadowCorrelation[]
): TeacherCommentary {
  const lines: { shen: string[]; xu: string[] } = { shen: [], xu: [] };

  // Reflection insight
  if (reflection.deepReflectionSuccessRate > reflection.shallowReflectionSuccessRate + 0.3) {
    lines.xu.push('每次深度反思后，第二天的表现都更好。——反思不是惩罚自己，是让自己看见。');
  }

  // Trigger context insight
  for (const tc of triggerContexts) {
    if (tc.contexts.length > 0 && tc.contexts[0].percentage >= 50) {
      lines.shen.push(`${tc.name}在${tc.contexts[0].tag}时最活跃。下次踏入之前，先深吸一口气。`);
    }
  }

  // Lesson-shadow correlation insight
  const significant = lessonCorrelations.filter(c => c.insight != null);
  if (significant.length > 0) {
    lines.shen.push(significant.map(c => c.insight).join(''));
  }

  return {
    shenComment: lines.shen.length > 0 ? lines.shen.join('') : null,
    xuComment: lines.xu.length > 0 ? lines.xu.join('') : null,
  };
}

// ============ Helpers ============

function formatRating(rating: string): string {
  switch (rating) {
    case '+1': return '触发 +1';
    case '-1': return '守住 -1';
    case 'breakthrough': return '崩解！';
    case 'skip': return '跳过';
    default: return rating;
  }
}

export { LESSON_META, SHADOW_META, BEHAVIOR_CATEGORY_META };
