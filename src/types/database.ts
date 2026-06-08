// Phase types
export type Phase = 'awakening' | 'self_cultivation' | 'trials' | 'return';
export type ShadowType = 'arrogance' | 'selfishness';
export type TaskStatus = 'assigned' | 'attempted' | 'completed' | 'skipped';
export type TeacherType = 'shen_xiansheng' | 'xu_niangzi';
export type SpeakerType = 'teacher' | 'user' | 'system';
export type DialogueStatus = 'in_progress' | 'completed' | 'abandoned';

// Profile
export interface Profile {
  id: string;
  username: string | null;
  nickname: string | null;
  avatar_url: string | null;
  current_phase: Phase;
  wangde: number;
  consecutive_days: number;
  last_completed_date: string | null;
  scroll_position: number;
  day_in_journey: number;
  onboarding_complete: boolean;
  today_goal: string | null;
  today_goal_achieved: boolean;
  wangde_veins: number;
  created_at: string;
  updated_at: string;
}

// Shadow
export interface Shadow {
  id: string;
  user_id: string;
  shadow_type: ShadowType;
  current_hp: number;
  max_hp: number;
  shatter_count: number;
  current_round: number; // 1-4+
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_damaged_at: string | null;
}

// Shadow Progress - per shadow tracking (for round/HP mechanics)
export interface ShadowProgress {
  shadow_type: ShadowType;
  current_round: number; // 1-4+
  current_hp: number; // 7/5/3/1 based on round
  max_hp: number;
  total_breakthroughs: number;
  status: 'active' | 'dormant';
  last_active_date: string | null;
}

// Shadow Self Rating Record - daily self-assessment
export interface ShadowRecord {
  id: string;
  user_id: string;
  shadow_type: ShadowType;
  date: string; // "YYYY-MM-DD"
  self_rating: '+1' | '-1' | 'skip' | 'breakthrough';
  behavior_record: string; // required, user's description of what happened
  reflection_detail: string | null; // added after evening dialogue follow-up
  teacher_response: string | null; // auto-generated teacher response
  reflection_depth: number | null; // 1-5, how deeply did user reflect
  trigger_tags: string[] | null; // e.g. ['与人交谈', '工作中', '压力下']
  behavior_score: number | null; // 1-10 holistic self-assessment
  created_at: string;
}

// Daily Schedule Template - full day planning
export interface DailySchedule {
  id: string;
  user_id: string;
  date: string;
  goal_text: string | null;
  goal_shadow: ShadowType | null;
  goal_reward: string | null;
  tasks: ScheduleTask[];
  created_at: string;
}

export interface ScheduleTask {
  type: 'reading' | 'writing' | 'service' | 'meditation' | 'exercise';
  content: string;
  start_time: string | null; // "HH:mm"
  end_time: string | null;
  duration: number | null; // minutes
  completed: boolean;
}

// Daily Task
export interface DailyTask {
  id: string;
  user_id: string;
  assigned_date: string;
  task_description: string;
  task_category: string | null;
  target_shadow: ShadowType | null;
  status: TaskStatus;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// Dialogue
export interface Dialogue {
  id: string;
  user_id: string;
  daily_task_id: string | null;
  teacher: TeacherType;
  dialogue_date: string;
  phase_at_time: Phase | null;
  summary: string | null;
  status: DialogueStatus;
  started_at: string;
  completed_at: string | null;
  wangde_delta: number;
  shadow_damage_dealt: Record<ShadowType, number> | null;
}

// Dialogue Message
export interface Choice {
  id: string;
  text: string;
  consequence_hint: 'honest' | 'proud' | 'avoidant' | 'reflective' | 'defiant';
}

export interface DialogueMessage {
  id: string;
  dialogue_id: string;
  sequence_order: number;
  speaker: SpeakerType;
  content: string;
  choices: Choice[] | null;
  chosen_choice_id: string | null;
  shadow_effect: Record<ShadowType, number> | null;
  wangde_effect: number;
  narrative_flag: string | null;
  created_at: string;
}

// Wangde Event
export interface WangdeEvent {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  source_id: string | null;
  narrative_unlock: boolean;
  created_at: string;
}

// Artifact
export interface Artifact {
  id: string;
  user_id: string;
  artifact_type: string;
  artifact_name: string;
  shadow_that_dropped: ShadowType | null;
  earned_at: string;
  narrative_text: string | null;
}

// Narrative Event
export interface NarrativeEvent {
  id: string;
  user_id: string;
  event_key: string;
  triggered_at: string;
  event_data: Record<string, unknown> | null;
}

// Evening Session - persisted evening dialogue data
export interface EveningSession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  dialogue_path: 'full' | 'quick';
  session_tone: 'positive' | 'neutral' | 'negative' | null;
  flag_answer: 'completed' | 'not_completed' | 'forgot' | 'skip' | null;
  lesson_feedback: Record<string, string>; // e.g., { reading: "...", writing: "..." }
  shadow_discussions: ShadowDiscussion[];
  infiltration_response: string | null;
  wangde_delta: number;
  scroll_change: number;
  shadow_damage: Record<ShadowType, number>; // e.g., { arrogance: -1, selfishness: 0 }
  created_at: string;
  updated_at: string;
}

export interface ShadowDiscussion {
  shadowType: ShadowType;
  situation: 'A' | 'B' | 'C' | 'D';
  openingResponse: string;
  followUpResponses: string[];
  closingResponse: string;
}

// ===== DayRecord — single-day container =====
export type DayStatus = 'planning' | 'in_progress' | 'closing';

export interface DayRecord {
  id: string;
  userId: string;
  dayNumber: number;
  calendarDate: string;
  phase: Phase;

  flag: Flag;
  schedule: HomeworkSlot[];
  shadowAssessments: ShadowAssessmentRecord[];
  kinglyDeeds: KinglyDeed[];
  meditation: MeditationRecord | null;

  evening: {
    mode: 'full' | 'quick' | 'skipped' | null;
    completedAt: string | null;
  };

  summary: DaySummary | null;
  status: DayStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Flag {
  text: string;
  associatedShadowIds: string[];
  reward: string;
  status: 'completed' | 'failed' | 'unmarked';
  source: 'morning_plan' | 'evening' | 'day_panel' | null;
  confirmedAt: string | null;
}

export interface HomeworkSlot {
  type: 'reading' | 'writing' | 'labor' | 'meditation' | 'exercise';
  customLabel?: string;
  detail?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'unmarked' | 'done' | 'missed';
  quality?: number;      // 1-5 self-rating
  reflection?: string;   // free-text reflection on this lesson
}

export interface ShadowAssessmentRecord {
  shadowId: string;
  shadowType: ShadowType;
  choice: 'plus' | 'minus' | 'skip' | null;
  record: string;
  additionalReflections?: string;
  submittedAt: string | null;
}

export interface KinglyDeed {
  description: string;
  recordedAt: string;
  source: 'day_self_assessment' | 'evening_dialogue';
}

// Behavior Entry — general daily behavior journal (non-shadow, non-lesson)
export interface BehaviorEntry {
  id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  entry_type: 'lesson' | 'general_behavior' | 'kingly_deed' | 'meditation';
  category: string; // 'reading'|'writing'|'labor'|'meditation'|'exercise'|'work'|'family'|'social'|'self'|'health'
  description: string; // what happened
  response: string | null; // how I responded
  score: number; // 1-10 (or 1-5 for lessons)
  reflection: string | null; // free text reflection
  tags: string[]; // e.g. ['工作中', '压力下']
  created_at: string;
}

export interface MeditationRecord {
  content: string;
  guidedPrompt?: string;
  submittedAt: string;
}

export interface DaySummary {
  flagStatus: 'completed' | 'failed' | 'unmarked';
  shadowChanges: Record<string, {
    hpChange: number;
    newHp: number;
    didCollapse: boolean;
  }>;
  virtuePoints: number;
  distanceChange: number;
  mentorQuote: string;
}
