import type { ShadowType, ScheduleTask } from './database';

// ============ Evening Phase State Machine ============

export type EveningPhase =
  | 'loading'
  | 'night_transition'
  | 'rating_check'
  | 'opening_choice'
  | 'round_0_candlelight'
  | 'round_1_flag'
  | 'round_2_lessons'
  | 'round_behavior_journal'
  | 'round_3_shadow'
  | 'round_4_infiltration'
  | 'round_5_winddown'
  | 'settlement'
  | 'complete';

export type DialoguePath = 'full' | 'quick';

export type SessionTone = 'positive' | 'neutral' | 'negative';

export type FlagStatus = boolean | null; // true=完成, false=未完成, null=未标记

// ============ Evening Context (data from DB) ============

export interface EveningContext {
  today: string; // YYYY-MM-DD
  profile: {
    wangde: number;
    scrollPosition: number;
    dayInJourney: number;
    todayGoal: string | null;
    todayGoalAchieved: FlagStatus;
    todayGoalShadow: ShadowType | null;
  };
  todaySchedule: {
    tasks: ScheduleTask[];
    hasAnyTask: boolean;
  } | null;
  todayShadowRecords: ShadowRecordContext[];
  activeShadows: Array<{
    shadowType: ShadowType;
    name: string;
    currentHp: number;
    maxHp: number;
  }>;
  // Derived flags for Round 4 triggers
  didMeditation: boolean;
  meditationHasNegativeTone: boolean;
  lessonCompletionRate: number; // 0-1
  latestLessonTime: string | null; // HH:mm
  apologyAfterConflict: boolean;
  consecutiveSameShadowPlus1: number;
  // Session state
  sessionTone: SessionTone;
  dialoguePath: DialoguePath | null;
}

export interface ShadowRecordContext {
  shadowType: ShadowType;
  selfRating: '+1' | '-1' | 'skip' | 'breakthrough';
  behaviorRecord: string;
  teacherResponse: string | null;
}

// ============ Evening State (runtime state) ============

export interface EveningState {
  phase: EveningPhase;
  dialoguePath: DialoguePath | null;
  // Data collected during dialogue
  flagStatus: FlagStatus;
  lessonFeedback: Record<string, string>; // task type -> feeling
  selectedShadowIndex: number;
  // Accumulated effects
  wangdeDelta: number;
  shadowDamage: Record<ShadowType, number>;
  // Round 3 specific
  currentShadowContext: ShadowRecordContext | null;
  round3FollowUpCount: number;
  // Round 4 specific
  round4TriggerSource: string | null;
  // Settlement data
  settlementData: SettlementData | null;
}

export interface SettlementData {
  direction: SessionTone;
  teacherComment: string;
  shadowHpAfter: Record<ShadowType, number>;
  wangdeAfter: number;
  scrollChange: number;
}

// ============ Round 3 Shadow Battle Types ============

export type ShadowSituation = 'A' | 'B' | 'C' | 'D';

export interface Round3DialogueNode {
  id: string;
  speaker: 'shen' | 'xu' | 'system';
  text: string;
  isQuestion?: boolean;
  isClosing?: boolean;
  followUpOptions?: string[]; // for collecting user response
}

export interface Round3DialogueTree {
  [nodeId: string]: Round3DialogueNode;
}

// ============ Round 4 Infiltration Types ============

export interface InfiltrationTrigger {
  source: string;
  condition: (ctx: EveningContext) => boolean;
  teacher: 'shen' | 'xu';
  prompt: string;
}

export interface InfiltrationResult {
  triggered: boolean;
  trigger: InfiltrationTrigger | null;
  userResponse: string | null;
  skipToNext: boolean;
}

// ============ Evening Opening Types ============

export type OpeningTone = 'normal' | 'high' | 'low';

export interface OpeningContent {
  tone: OpeningTone;
  teacher: 'shen' | 'xu';
  text: string;
}

// ============ Helper Types ============

// Data collected during evening session for persistence
export interface CollectedSessionData {
  dialoguePath: DialoguePath;
  sessionTone: SessionTone;
  flagAnswer: 'completed' | 'not_completed' | 'forgot' | 'skip' | null;
  lessonFeedback: Record<string, string>;
  shadowDiscussions: ShadowDiscussionData[];
  infiltrationResponse: string | null;
}

export interface ShadowDiscussionData {
  shadowType: ShadowType;
  situation: 'A' | 'B' | 'C' | 'D';
  openingResponse: string;
  followUpResponses: string[];
  closingResponse: string;
}

export function createInitialEveningState(): EveningState {
  return {
    phase: 'loading',
    dialoguePath: null,
    flagStatus: null,
    lessonFeedback: {},
    selectedShadowIndex: 0,
    wangdeDelta: 0,
    shadowDamage: { arrogance: 0, selfishness: 0 },
    currentShadowContext: null,
    round3FollowUpCount: 0,
    round4TriggerSource: null,
    settlementData: null,
  };
}

export function createInitialEveningContext(): EveningContext {
  return {
    today: new Date().toISOString().split('T')[0],
    profile: {
      wangde: 0,
      scrollPosition: 0,
      dayInJourney: 0,
      todayGoal: null,
      todayGoalAchieved: null,
      todayGoalShadow: null,
    },
    todaySchedule: null,
    todayShadowRecords: [],
    activeShadows: [],
    didMeditation: false,
    meditationHasNegativeTone: false,
    lessonCompletionRate: 0,
    latestLessonTime: null,
    apologyAfterConflict: false,
    consecutiveSameShadowPlus1: 0,
    sessionTone: 'neutral',
    dialoguePath: null,
  };
}