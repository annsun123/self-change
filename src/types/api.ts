import type { DailyTask, DialogueMessage, DialogueStatus, TaskStatus, ShadowType } from './database';

export interface GameStateResponse {
  profile: {
    current_phase: string;
    wangde: number;
    day_in_journey: number;
    scroll_position: number;
    onboarding_complete: boolean;
  };
  shadows: {
    id: string;
    shadow_type: ShadowType;
    current_hp: number;
    max_hp: number;
    shatter_count: number;
    is_active: boolean;
  }[];
  todayTask: DailyTask | null;
  todayDialogue: {
    id: string;
    status: DialogueStatus;
    teacher: string;
  } | null;
}

export interface CreateTaskResponse {
  id: string;
  description: string;
  category: string;
  targetShadow: ShadowType | null;
  assignedDate: string;
}

export interface UpdateTaskRequest {
  status: TaskStatus;
}

export interface SubmitChoiceRequest {
  messageId: string;
  chosenChoiceId: string;
}

export interface SubmitChoiceResponse {
  nextMessage: DialogueMessage | null;
  effects: {
    shadowChanges: Record<ShadowType, number>;
    wangdeChange: number;
    narrativeEvents: string[];
  };
  dialogueStatus: DialogueStatus;
}

export interface CreateDialogueResponse {
  dialogue: {
    id: string;
    teacher: string;
    status: DialogueStatus;
    messages: DialogueMessage[];
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}
