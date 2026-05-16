import type {
  EveningPhase,
  EveningState,
  EveningContext,
  DialoguePath,
  SessionTone,
  FlagStatus,
  ShadowRecordContext,
  ShadowSituation,
  OpeningTone,
  OpeningContent,
  SettlementData,
} from '@/types/evening';
import type { ShadowType } from '@/types/database';

// ============ Phase Transitions ============

export function canTransition(
  from: EveningPhase,
  to: EveningPhase,
  state: EveningState
): boolean {
  const validTransitions: Record<EveningPhase, EveningPhase[]> = {
    loading: ['night_transition'],
    night_transition: ['rating_check'],
    rating_check: ['opening_choice'],
    opening_choice: ['round_0_candlelight', 'settlement'], // full or quick
    round_0_candlelight: ['round_1_flag'],
    round_1_flag: ['round_2_lessons', 'round_3_shadow', 'round_4_infiltration', 'round_5_winddown', 'settlement'],
    round_2_lessons: ['round_3_shadow', 'round_4_infiltration', 'round_5_winddown', 'settlement'],
    round_3_shadow: ['round_4_infiltration', 'round_5_winddown', 'settlement'],
    round_4_infiltration: ['round_5_winddown', 'settlement'],
    round_5_winddown: ['settlement'],
    settlement: ['complete'],
    complete: [],
  };

  return validTransitions[from]?.includes(to) ?? false;
}

export function transition(
  state: EveningState,
  to: EveningPhase,
  updates?: Partial<EveningState>
): EveningState {
  return {
    ...state,
    ...updates,
    phase: to,
  };
}

// ============ Opening Tone Calculation ============

export function calculateOpeningTone(ctx: EveningContext): SessionTone {
  let positiveSignals = 0;
  let negativeSignals = 0;

  // Shadow self-rating signals
  for (const record of ctx.todayShadowRecords) {
    if (record.selfRating === '-1' || record.selfRating === 'breakthrough') {
      positiveSignals++;
    } else if (record.selfRating === '+1') {
      negativeSignals++;
    }
    // 'skip' = no signal
  }

  // Goal/flag signals
  if (ctx.profile.todayGoalAchieved === true) {
    positiveSignals++;
  } else if (ctx.profile.todayGoalAchieved === false) {
    negativeSignals++;
  }

  // Lesson completion signals
  if (ctx.lessonCompletionRate > 0.5) {
    positiveSignals++;
  } else if (ctx.lessonCompletionRate === 0 && ctx.todaySchedule?.hasAnyTask) {
    negativeSignals++;
  }

  // If nothing is marked, treat as neutral
  if (positiveSignals === 0 && negativeSignals === 0) {
    return 'neutral';
  }

  if (positiveSignals > negativeSignals) {
    return 'positive';
  }
  if (negativeSignals > positiveSignals) {
    return 'negative';
  }
  return 'neutral';
}

export function getOpeningContent(tone: SessionTone): OpeningContent {
  switch (tone) {
    case 'positive':
      return {
        tone: 'high',
        teacher: 'xu',
        text: '看你的样子，今天过得不错。——来，说说看，还是直接看地图？',
      };
    case 'negative':
      return {
        tone: 'low',
        teacher: 'shen',
        text: '想坐就坐坐，不想的话，看看结果早点休息也好。',
      };
    default:
      return {
        tone: 'normal',
        teacher: 'shen',
        text: '回来了。——今晚想多聊两句，还是看看结果就去歇着？',
      };
  }
}

// ============ Flag Status Helpers ============

export function getFlagStatusForRound1(
  flagStatus: FlagStatus,
  hasGoal: boolean
): {
  autoResponse: boolean;
  autoResponseText: string;
  shouldSkipToRound2: boolean;
} {
  // If goal was marked completed
  if (flagStatus === true) {
    return {
      autoResponse: true,
      autoResponseText: '今日的旗，立住了。——好。',
      shouldSkipToRound2: false,
    };
  }

  // If goal was marked NOT completed
  if (flagStatus === false) {
    return {
      autoResponse: true,
      autoResponseText: '立旗容易守旗难。说说看，是什么绊住了你？',
      shouldSkipToRound2: false,
    };
  }

  // Unmarked - user was asked "今早你立了个旗。——还在吗？"
  // Response handling happens in Round 1 component
  return {
    autoResponse: false,
    autoResponseText: '',
    shouldSkipToRound2: false,
  };
}

export function getFlagUserResponseOutcome(
  userAnswer: 'completed' | 'not_completed' | 'forgot' | 'skip'
): {
  tone: SessionTone;
  teacher: 'shen' | 'xu';
  responseText: string;
  skipToNextRound: boolean;
} {
  switch (userAnswer) {
    case 'completed':
      return {
        tone: 'positive',
        teacher: 'shen',
        responseText: '好。能立得住，就不容易。明日的事明日再说，先好好记住今日这份感觉。',
        skipToNextRound: false,
      };
    case 'not_completed':
      return {
        tone: 'negative',
        teacher: 'xu',
        responseText: '立旗容易守旗难。说说看，是什么绊住了你？',
        skipToNextRound: false,
      };
    case 'forgot':
      return {
        tone: 'neutral',
        teacher: 'shen',
        responseText: '一心二用，也是常有的事。无妨。',
        skipToNextRound: true, // Skip to Round 2
      };
    case 'skip':
      return {
        tone: 'neutral',
        teacher: 'shen',
        responseText: '无妨。有些事放在心里比说出来好。',
        skipToNextRound: true, // Skip to Round 2
      };
  }
}

// ============ Round 3 Shadow Situation Selection ============

export function selectShadowSituation(
  record: ShadowRecordContext
): ShadowSituation {
  if (record.selfRating === 'breakthrough' || record.selfRating === '+1') {
    return 'A'; // triggered
  }
  if (record.selfRating === '-1') {
    return 'B'; // held firm
  }
  return 'D'; // skip / today irrelevant
}

// ============ Round 4 Trigger Evaluation ============

interface TriggerConditionContext {
  todayShadowRecords: ShadowRecordContext[];
  didMeditation: boolean;
  meditationHasNegativeTone: boolean;
  lessonCompletionRate: number;
  latestLessonTime: string | null;
  flagStatus: FlagStatus;
  hasAnyTask: boolean;
  consecutiveSameShadowPlus1: number;
}

export interface Trigger {
  source: string;
  teacher: 'shen' | 'xu';
  prompt: string;
}

const TRIGGERS: Array<{
  source: string;
  condition: (ctx: TriggerConditionContext) => boolean;
  teacher: 'shen' | 'xu';
  prompt: string;
}> = [
  {
    source: 'apology_after_conflict',
    condition: (ctx) => ctx.todayShadowRecords.some(
      (r) => r.selfRating === '+1' && r.behaviorRecord.includes('道歉')
    ),
    teacher: 'xu',
    prompt: '你今天写了跟人争执后道了歉。——先争后和，这一日下来，心里是堵着的多，还是松快的多？',
  },
  {
    source: 'held_minus_one',
    condition: (ctx) => ctx.todayShadowRecords.some((r) => r.selfRating === '-1'),
    teacher: 'shen',
    prompt: '你今天拦住了自己一次。——拦下的时候，脑子里想的是「不该这样」，还是「可以不这样」？',
  },
  {
    source: 'meditation_negative',
    condition: (ctx) => ctx.didMeditation && ctx.meditationHasNegativeTone,
    teacher: 'xu',
    prompt: '你写的那件事，到现在还在想吗？',
  },
  {
    source: 'late_lesson',
    condition: (ctx) =>
      ctx.latestLessonTime !== null && ctx.latestLessonTime > '21:00',
    teacher: 'shen',
    prompt: '这个时辰还在劳作。——是白天没心思做，还是只有晚上才静得下心？',
  },
  {
    source: 'flag_not_done',
    condition: (ctx) =>
      ctx.flagStatus === false && ctx.lessonCompletionRate > 0.5,
    teacher: 'xu',
    prompt: '今日的事都做了，但你自己立的旗没完成。——你心里更在意哪一个？',
  },
  {
    source: 'skip_shadow',
    condition: (ctx) => ctx.todayShadowRecords.some((r) => r.selfRating === 'skip'),
    teacher: 'shen',
    prompt: '今天没交手，但你说不定明天就会遇上。心里有准备吗？',
  },
  {
    source: 'zero_lessons_minus_one',
    condition: (ctx) =>
      ctx.lessonCompletionRate === 0 &&
      ctx.hasAnyTask &&
      ctx.todayShadowRecords.some((r) => r.selfRating === '-1'),
    teacher: 'xu',
    prompt: '今天功课没碰，倒是跟自己的阴影打了一场。——你觉得这两件事，哪个更重要？',
  },
  {
    source: 'consecutive_same',
    condition: (ctx) => ctx.consecutiveSameShadowPlus1 > 1,
    teacher: 'shen',
    prompt: '这已经是{天数}天逆星的事了。——你发现了什么规律吗？',
  },
];

export function evaluateRound4Triggers(
  ctx: TriggerConditionContext
): Trigger | null {
  for (const trigger of TRIGGERS) {
    if (trigger.condition(ctx)) {
      return {
        source: trigger.source,
        teacher: trigger.teacher,
        prompt: trigger.prompt,
      };
    }
  }
  return null;
}

// ============ Settlement Data Generation ============

export function generateSettlementData(
  state: EveningState,
  currentShadows: Array<{ shadowType: ShadowType; currentHp: number; maxHp: number }>,
  profileWangde: number
): SettlementData {
  const direction = determineSessionDirection(state);
  const teacherComment = getTeacherCommentByDirection(direction);
  const shadowHpAfter: Record<ShadowType, number> = {
    arrogance: 0,
    selfishness: 0,
  };

  for (const shadow of currentShadows) {
    const damage = state.shadowDamage[shadow.shadowType] || 0;
    shadowHpAfter[shadow.shadowType] = Math.max(0, shadow.currentHp - damage);
  }

  const scrollChange = direction === 'positive' ? 1 : direction === 'negative' ? -1 : 0;

  return {
    direction,
    teacherComment,
    shadowHpAfter,
    wangdeAfter: profileWangde + state.wangdeDelta,
    scrollChange,
  };
}

function determineSessionDirection(state: EveningState): SessionTone {
  // Based on accumulated data
  if (state.wangdeDelta > 0) return 'positive';

  const totalShadowDamage = Object.values(state.shadowDamage).reduce(
    (sum, d) => sum + d,
    0
  );
  if (totalShadowDamage > 0) return 'positive';

  // If flag was completed
  if (state.flagStatus === true) return 'positive';

  // If flag was marked not completed
  if (state.flagStatus === false) return 'negative';

  return 'neutral';
}

function getTeacherCommentByDirection(direction: SessionTone): string {
  switch (direction) {
    case 'positive':
      return '今日是实在的一步。';
    case 'negative':
      return '不是每一天都是好日子，但好日子都是从不好的日子里长出来的。';
    default:
      return '路还长。慢慢走。';
  }
}

// ============ Quick Path (看看结果) ============

export function getQuickPathTeacherComment(
  tone: SessionTone
): { teacher: 'shen' | 'xu'; text: string } {
  switch (tone) {
    case 'positive':
      return { teacher: 'shen', text: '好。去吧。明日继续。' };
    case 'negative':
      return { teacher: 'xu', text: '今天不容易。——先睡。' };
    default:
      return { teacher: 'shen', text: '知道了。今晚好好歇着。' };
  }
}

// ============ Wind Down (Round 5) Variants ============

export function getWindDownContent(
  tone: SessionTone
): { teacher: 'shen' | 'xu'; text: string } {
  switch (tone) {
    case 'negative':
      return {
        teacher: 'xu',
        text: '不是每一天都要往前走的。有时候，能停下来看看自己在哪里，就已经是在走了。去吧，好好睡。明日的事，明日再说。',
      };
    case 'positive':
      return {
        teacher: 'shen',
        text: '今日值得记上一笔。去歇着吧。——明日，路会短一些。',
      };
    default:
      return {
        teacher: 'shen',
        text: '好了，时候不早了。你今天做的事，我都看在眼里。——去歇着吧。',
      };
  }
}

// ============ Weekend Detection ============

export function isWeekend(): boolean {
  const day = new Date().getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

export function getWeekendVariant(): 'saturday' | 'sunday' | null {
  const day = new Date().getDay();
  if (day === 6) return 'saturday';
  if (day === 0) return 'sunday';
  return null;
}