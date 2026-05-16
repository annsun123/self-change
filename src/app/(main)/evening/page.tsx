"use client";

import { useEffect, useReducer, useCallback, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createInitialEveningState,
  createInitialEveningContext,
} from "@/types/evening";
import { calculateOpeningTone, transition } from "@/lib/evening-state-machine";
import type {
  EveningPhase,
  EveningState,
  EveningContext,
  DialoguePath,
  FlagStatus,
} from "@/types/evening";
import type { ShadowType, ScheduleTask } from "@/types/database";

// Import round components
import { NightTransition } from "./components/night-transition";
import { ShadowRatingGate } from "./components/shadow-rating-gate";
import { TeacherOpening } from "./components/teacher-opening";
import { Round0Candlelight } from "./components/rounds/round-0-candlelight";
import { Round1Flag } from "./components/rounds/round-1-flag";
import { Round2Lessons } from "./components/rounds/round-2-lessons";
import { Round3Shadow } from "./components/rounds/round-3-shadow";
import { Round4Infiltration } from "./components/rounds/round-4-infiltration";
import { Round5Winddown } from "./components/rounds/round-5-winddown";
import { SettlementScreen } from "./components/settlement-screen";

type Action =
  | { type: "SET_PHASE"; phase: EveningPhase }
  | { type: "SET_DIALOGUE_PATH"; path: DialoguePath }
  | { type: "SET_FLAG_STATUS"; status: FlagStatus }
  | { type: "SET_LESSON_FEEDBACK"; taskType: string; feedback: string }
  | { type: "ADD_WANGDE"; delta: number }
  | { type: "ADD_SHADOW_DAMAGE"; shadowType: ShadowType; damage: number }
  | { type: "SET_SHADOW_CONTEXT"; context: EveningContext["todayShadowRecords"][0] | null }
  | { type: "INCREMENT_ROUND3_FOLLOWUP" }
  | { type: "SET_ROUND4_TRIGGER"; source: string }
  | { type: "SET_SETTLEMENT_DATA"; data: EveningState["settlementData"] }
  | { type: "RESET"; state: EveningState };

function eveningReducer(state: EveningState, action: Action): EveningState {
  switch (action.type) {
    case "SET_PHASE":
      return transition(state, action.phase);
    case "SET_DIALOGUE_PATH":
      return { ...state, dialoguePath: action.path };
    case "SET_FLAG_STATUS":
      return { ...state, flagStatus: action.status };
    case "SET_LESSON_FEEDBACK":
      return {
        ...state,
        lessonFeedback: {
          ...state.lessonFeedback,
          [action.taskType]: action.feedback,
        },
      };
    case "ADD_WANGDE":
      return { ...state, wangdeDelta: state.wangdeDelta + action.delta };
    case "ADD_SHADOW_DAMAGE":
      return {
        ...state,
        shadowDamage: {
          ...state.shadowDamage,
          [action.shadowType]: (state.shadowDamage[action.shadowType] || 0) + action.damage,
        },
      };
    case "SET_SHADOW_CONTEXT":
      return { ...state, currentShadowContext: action.context };
    case "INCREMENT_ROUND3_FOLLOWUP":
      return { ...state, round3FollowUpCount: state.round3FollowUpCount + 1 };
    case "SET_ROUND4_TRIGGER":
      return { ...state, round4TriggerSource: action.source };
    case "SET_SETTLEMENT_DATA":
      return { ...state, settlementData: action.data };
    case "RESET":
      return action.state;
    default:
      return state;
  }
}

export default function EveningPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Stable callbacks to avoid triggering child useEffect re-runs
  const handleFlagAnswer = useCallback((answer: 'completed' | 'not_completed' | 'forgot' | 'skip' | null) => {
    setCollectedData((prev) => ({ ...prev, flagAnswer: answer }));
  }, []);

  const handleLessonFeedback = useCallback((feedback: Record<string, string>) => {
    setCollectedData((prev) => ({ ...prev, lessonFeedback: feedback }));
  }, []);

  const handleShadowDiscussions = useCallback((discussions: Array<{ shadowType: ShadowType; situation: 'A' | 'B' | 'C' | 'D'; openingResponse: string; followUpResponses: string[]; closingResponse: string }>) => {
    setCollectedData((prev) => ({ ...prev, shadowDiscussions: discussions }));
  }, []);

  const handleInfiltrationResponse = useCallback((response: string | null) => {
    setCollectedData((prev) => ({ ...prev, infiltrationResponse: response }));
  }, []);

  const [state, dispatch] = useReducer(eveningReducer, createInitialEveningState());
  const [context, setContext] = useState<EveningContext>(createInitialEveningContext());
  const [isLoading, setIsLoading] = useState(true);

  // Collected session data for persistence
  const [collectedData, setCollectedData] = useState<{
    flagAnswer: 'completed' | 'not_completed' | 'forgot' | 'skip' | null;
    lessonFeedback: Record<string, string>;
    shadowDiscussions: Array<{
      shadowType: ShadowType;
      situation: 'A' | 'B' | 'C' | 'D';
      openingResponse: string;
      followUpResponses: string[];
      closingResponse: string;
    }>;
    infiltrationResponse: string | null;
  }>({
    flagAnswer: null,
    lessonFeedback: {},
    shadowDiscussions: [],
    infiltrationResponse: null,
  });

  // handleSettlementComplete MUST be defined before the early return for isLoading
  // to maintain consistent hook order across renders
  const handleSettlementComplete = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !state.settlementData) return;

    // Apply Wangde changes
    if (state.wangdeDelta > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("wangde, scroll_position")
        .eq("id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            wangde: profile.wangde + state.wangdeDelta,
            scroll_position: profile.scroll_position + state.settlementData!.scrollChange,
          })
          .eq("id", user.id);
      }
    }

    // Apply shadow HP changes
    for (const [shadowType, damage] of Object.entries(state.shadowDamage)) {
      if (damage === 0) continue;

      const { data: shadow } = await supabase
        .from("shadows")
        .select("current_hp")
        .eq("user_id", user.id)
        .eq("shadow_type", shadowType)
        .single();

      if (shadow) {
        const newHp = Math.max(0, shadow.current_hp - damage);
        await supabase
          .from("shadows")
          .update({
            current_hp: newHp,
            last_damaged_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("shadow_type", shadowType);
      }
    }

    // Mark daily tasks as completed
    await supabase
      .from("daily_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("assigned_date", context.today);

    // Save evening session data
    await supabase.from("evening_sessions").upsert({
      user_id: user.id,
      date: context.today,
      dialogue_path: state.dialoguePath || 'full',
      session_tone: context.sessionTone,
      flag_answer: collectedData.flagAnswer,
      lesson_feedback: collectedData.lessonFeedback,
      shadow_discussions: collectedData.shadowDiscussions,
      infiltration_response: collectedData.infiltrationResponse,
      wangde_delta: state.wangdeDelta,
      scroll_change: state.settlementData?.scrollChange || 0,
      shadow_damage: state.shadowDamage,
    });

    dispatch({ type: "SET_PHASE", phase: "complete" });
    setTimeout(() => router.push("/scroll-map"), 2000);
  }, [supabase, state, context.today, router, collectedData]);

  // Initialize evening session
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      // Load today's schedule
      const { data: schedule } = await supabase
        .from("daily_schedules")
        .select("tasks")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      // Load active shadows
      const { data: shadows } = await supabase
        .from("shadows")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true);

      // Load today's shadow records
      const { data: records } = await supabase
        .from("shadow_records")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);

      // Calculate derived flags
      const tasks: ScheduleTask[] = schedule?.tasks || [];
      const completedTasks = tasks.filter((t) => t.completed);
      const lessonCompletionRate = tasks.length > 0 ? completedTasks.length / tasks.length : 0;

      const meditationTask = tasks.find((t) => t.type === "meditation");
      const didMeditation = !!meditationTask?.content;
      const meditationHasNegativeTone = false;

      const latestLessonTime = tasks.length > 0
        ? tasks
            .filter((t) => t.end_time)
            .sort((a, b) => (b.end_time || "").localeCompare(a.end_time || ""))[0]?.end_time
        : null;

      const apologyAfterConflict = records?.some(
        (r) => r.self_rating === "+1" && r.behavior_record?.includes("道歉")
      ) || false;

      // Build context
      const newContext: EveningContext = {
        today,
        profile: {
          wangde: profile.wangde,
          scrollPosition: profile.scroll_position,
          dayInJourney: profile.day_in_journey,
          todayGoal: profile.today_goal,
          todayGoalAchieved: profile.today_goal_achieved,
          todayGoalShadow: null,
        },
        todaySchedule: {
          tasks,
          hasAnyTask: tasks.length > 0,
        },
        todayShadowRecords: (records || []).map((r) => ({
          shadowType: r.shadow_type as ShadowType,
          selfRating: r.self_rating as "+1" | "-1" | "skip" | "breakthrough",
          behaviorRecord: r.behavior_record || "",
          teacherResponse: r.teacher_response,
        })),
        activeShadows: (shadows || []).map((s) => ({
          shadowType: s.shadow_type as ShadowType,
          name: s.shadow_type === "arrogance" ? "逆星" : "毒疮",
          currentHp: s.current_hp,
          maxHp: s.max_hp,
        })),
        didMeditation,
        meditationHasNegativeTone,
        lessonCompletionRate,
        latestLessonTime,
        apologyAfterConflict,
        consecutiveSameShadowPlus1: 0,
        sessionTone: "neutral",
        dialoguePath: null,
      };

      newContext.sessionTone = calculateOpeningTone(newContext);
      setContext(newContext);

      // Initialize state with flag status
      dispatch({ type: "SET_FLAG_STATUS", status: profile.today_goal_achieved });

      setIsLoading(false);
      dispatch({ type: "SET_PHASE", phase: "night_transition" });
    };

    init();
  }, [router, supabase]);

  // Loading state - defined AFTER handleSettlementComplete to maintain hook order
  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">烛火摇曳中...</div>
      </div>
    );
  }

  const renderPhase = () => {
    switch (state.phase) {
      case "night_transition":
        return (
          <NightTransition
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "rating_check" })}
          />
        );

      case "rating_check":
        return (
          <ShadowRatingGate
            context={context}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "opening_choice" })}
            onRatingSubmit={async () => {
              dispatch({ type: "SET_PHASE", phase: "opening_choice" });
            }}
          />
        );

      case "opening_choice":
        return (
          <TeacherOpening
            context={context}
            onChoice={(path) => {
              dispatch({ type: "SET_DIALOGUE_PATH", path });
              if (path === "quick") {
                dispatch({ type: "SET_PHASE", phase: "settlement" });
              } else {
                dispatch({ type: "SET_PHASE", phase: "round_0_candlelight" });
              }
            }}
          />
        );

      case "round_0_candlelight":
        return (
          <Round0Candlelight
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_1_flag" })}
          />
        );

      case "round_1_flag":
        return (
          <Round1Flag
            context={context}
            state={state}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_2_lessons" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onFlagAnswer={handleFlagAnswer}
          />
        );

      case "round_2_lessons":
        return (
          <Round2Lessons
            context={context}
            state={state}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_3_shadow" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onLessonFeedback={handleLessonFeedback}
          />
        );

      case "round_3_shadow":
        return (
          <Round3Shadow
            context={context}
            state={state}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_4_infiltration" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onWangdeChange={(delta) => dispatch({ type: "ADD_WANGDE", delta })}
            onShadowDamage={(type, damage) => dispatch({ type: "ADD_SHADOW_DAMAGE", shadowType: type, damage })}
            onShadowDiscussions={handleShadowDiscussions}
          />
        );

      case "round_4_infiltration":
        return (
          <Round4Infiltration
            context={context}
            state={state}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_5_winddown" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onInfiltrationResponse={handleInfiltrationResponse}
          />
        );

      case "round_5_winddown":
        return (
          <Round5Winddown
            context={context}
            state={state}
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
          />
        );

      case "settlement":
        return (
          <SettlementScreen
            context={context}
            state={state}
            onComplete={handleSettlementComplete}
            onExit={() => dispatch({ type: "SET_PHASE", phase: "complete" })}
          />
        );

      case "complete":
        return (
          <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col items-center justify-center">
            <div className="text-center space-y-6">
              <div className="text-6xl">✨</div>
              <h2 className="text-2xl font-serif text-amber-400">晚安，殿下</h2>
              <p className="text-stone-400">明日再会。</p>
              <p className="text-stone-500 text-sm animate-pulse">返回主界面...</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 text-stone-100 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-amber-900/10 to-transparent" />
      </div>

      <header className="p-4 border-b border-stone-800/50 relative z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/scroll-map")}
            className="text-sm text-stone-500 hover:text-stone-300"
          >
            ← 返回
          </button>
          <span className="text-amber-500/60 text-xs">🌙 晚间对话</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative z-10">
        {renderPhase()}
      </main>
    </div>
  );
}