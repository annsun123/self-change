import type { ShadowType } from './database';

// ============ Weekly Compass ============

export interface LessonQualitySummary {
  type: string; // 'reading' | 'writing' | 'labor' | 'meditation' | 'exercise'
  label: string; // '读书' | '习字' | '劳作' | '修心' | '运动'
  emoji: string;
  avgQuality: number; // average quality score 1-5
  completionRate: number; // 0-1
  trend: 'up' | 'down' | 'stable';
  completedDays: boolean[]; // last 7 days: true = done
}

export interface ShadowWeekSummary {
  shadowType: ShadowType;
  name: string;
  emoji: string;
  triggerCount: number; // times triggered this week (+1)
  resistCount: number; // times resisted this week (-1)
  currentHp: number;
  maxHp: number;
  hpChange: number; // delta this week
  trend: 'up' | 'down' | 'stable'; // is it getting better?
}

export interface WeeklyCompass {
  dayInJourney: number;
  phaseName: string;
  periodLabel: string; // "周六—周二"
  avgBehaviorScore: number; // average across all behavior entries in period
  trendDirection: 'improving' | 'declining' | 'stable';
  lessonSummaries: LessonQualitySummary[];
  shadowSummaries: ShadowWeekSummary[];
  totalReflectionDepth: number; // avg across all reflections in period
  totalEntries: number; // total entries in period
  teacherCommentary: TeacherCommentary;
}

// ============ Chronicle Timeline ============

export type ChronicleEntryType = 'lesson' | 'shadow' | 'behavior' | 'kingly_deed' | 'meditation';

export interface ChronicleEntry {
  id: string;
  date: string;
  dayNumber: number;
  entryType: ChronicleEntryType;
  category: string; // 'reading' | 'arrogance' | 'work' | etc.
  icon: string; // emoji
  title: string; // short label
  description: string; // main text
  score: number | null; // 1-5 or 1-10
  reflection: string | null;
  tags: string[];
  isExpanded?: boolean;
}

export interface ChronicleCategoryGroup {
  categoryKey: string;        // 'lesson:writing' | 'shadow:arrogance' | 'kingly_deed' | 'behavior:work'
  label: string;              // '日课 · 习字'
  icon: string;               // '🖌️'
  entries: ChronicleEntry[];  // 该类目下所有条目
  avgScore: number | null;    // 平均分
}

export interface ChronicleWeek {
  weekNumber: number;
  label: string; // "第 4 周"
  entries: ChronicleEntry[];
  categoryGroups: ChronicleCategoryGroup[];
}

// ============ Pattern Insights ============

export interface ReflectionCorrelation {
  deepReflectionRate: number; // % of days with reflection_depth >= 4
  shallowReflectionRate: number;
  deepReflectionSuccessRate: number; // % of shadow resist (-1) when deep reflection
  shallowReflectionSuccessRate: number;
  deepReflectionAvgScore: number;
  shallowReflectionAvgScore: number;
}

export interface TriggerContextDistribution {
  shadowType: ShadowType;
  name: string;
  contexts: Array<{
    tag: string;
    count: number;
    percentage: number;
  }>;
}

export interface LessonShadowCorrelation {
  lessonType: string;
  label: string;
  emoji: string;
  highQualityShadowTriggerRate: number; // shadow trigger % when lesson quality >= 4
  lowQualityShadowTriggerRate: number; // shadow trigger % when lesson quality <= 2
  insight: string | null; // "修心质量高的日子，逆星触发减少 60%"
}

export interface PatternInsights {
  reflectionCorrelation: ReflectionCorrelation;
  triggerContexts: TriggerContextDistribution[];
  lessonShadowCorrelations: LessonShadowCorrelation[];
  teacherCommentary: TeacherCommentary;
}

// ============ Teacher Commentary ============

export interface TeacherCommentary {
  shenComment: string | null;
  xuComment: string | null;
}
