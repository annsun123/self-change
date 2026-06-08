"use client";

import { useEffect, useReducer, useCallback, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createInitialEveningState,
  createInitialEveningContext,
} from "@/types/evening";
import { calculateOpeningTone, transition, generateSettlementData } from "@/lib/evening-state-machine";
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
import { RoundBehaviorJournal } from "./components/rounds/round-behavior-journal";
import type { BehaviorJournalEntry } from "./components/rounds/round-behavior-journal";
import { Round3Shadow } from "./components/rounds/round-3-shadow";
import { Round4Infiltration } from "./components/rounds/round-4-infiltration";
import { Round5Winddown } from "./components/rounds/round-5-winddown";
import { SettlementScreen } from "./components/settlement-screen";

/** Detect Supabase auth errors (expired session, invalid JWT, etc.) */
function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as Record<string, unknown>;
  return (
    e.status === 401 ||
    e.status === 403 ||
    e.code === "PGRST301" ||
    (typeof e.message === "string" && /JWT expired|auth.*token|session.*expired/i.test(e.message))
  );
}

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

  const handleLessonQuality = useCallback((qualities: Record<string, { quality: number; reflection: string; status: 'done' | 'missed' }>) => {
    setCollectedData((prev) => ({ ...prev, lessonQualities: qualities }));
  }, []);

  const handleBehaviorEntries = useCallback((entries: BehaviorJournalEntry[]) => {
    setCollectedData((prev) => ({ ...prev, behaviorEntries: entries }));
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
    lessonQualities: Record<string, { quality: number; reflection: string; status: 'done' | 'missed' }>;
    behaviorEntries: BehaviorJournalEntry[];
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
    lessonQualities: {},
    behaviorEntries: [],
    shadowDiscussions: [],
    infiltrationResponse: null,
  });

  // Ref to always read latest collectedData (avoids stale closure in settlement callback)
  const collectedDataRef = useRef(collectedData);
  collectedDataRef.current = collectedData;

  // handleSettlementComplete MUST be defined before the early return for isLoading
  // to maintain consistent hook order across renders
  const handleSettlementComplete = useCallback(async () => {
    const data = collectedDataRef.current;
    console.log("[Settlement] Starting save...", {
      lessonQualities: data.lessonQualities,
      lessonQualityKeys: Object.keys(data.lessonQualities),
      behaviorEntries: data.behaviorEntries?.length,
    });

    // ── Session guard: refresh if expired ──
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("[Settlement] No session found, redirecting to login");
      router.push("/login");
      return;
    }
    // Check if session is expired and try to refresh
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log("[Settlement] Session expired, attempting refresh...");
      const { data: { session: refreshedSession }, error: refreshError } =
        await supabase.auth.refreshSession();
      if (refreshError || !refreshedSession) {
        console.error("[Settlement] Session refresh failed, redirecting to login", refreshError);
        router.push("/login");
        return;
      }
      console.log("[Settlement] Session refreshed successfully");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("[Settlement] No user after auth check, redirecting to login");
      router.push("/login");
      return;
    }

    const settlementData = generateSettlementData(
      state,
      context.activeShadows.map((s) => ({
        shadowType: s.shadowType,
        currentHp: s.currentHp,
        maxHp: s.maxHp,
      })),
      context.profile.wangde
    );

    try {
      // Apply Wangde changes
      if (state.wangdeDelta > 0 || settlementData.scrollChange !== 0) {
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
              scroll_position: profile.scroll_position + settlementData.scrollChange,
            })
            .eq("id", user.id);
        }
      }

      // Apply shadow HP changes and collect summary
      const shadowChanges: Record<string, { hpChange: number; newHp: number; didCollapse: boolean }> = {};
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

          shadowChanges[shadowType] = {
            hpChange: -damage,
            newHp,
            didCollapse: newHp === 0,
          };
        }
      }

      // Mark daily tasks as completed
      await supabase
        .from("daily_tasks")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("assigned_date", context.today);

      // Save behavior entries to dedicated table
      if (data.behaviorEntries && data.behaviorEntries.length > 0) {
        const behaviorRows = data.behaviorEntries.map((entry) => ({
          user_id: user.id,
          date: context.today,
          entry_type: entry.isKinglyDeed ? 'kingly_deed' : 'general_behavior',
          category: entry.tags.length > 0 ? entry.tags[0] : 'self',
          description: entry.description,
          response: entry.response || null,
          score: entry.score || 0,
          reflection: null,
          tags: entry.tags,
        }));

        const { error: beErr } = await supabase.from("behavior_entries").upsert(behaviorRows);
        if (beErr) {
          console.error("behavior_entries upsert error:", beErr);
          if (isAuthError(beErr)) { router.push("/login"); return; }
        }
      }

      // Save lesson quality entries to behavior_entries table
      if (data.lessonQualities && Object.keys(data.lessonQualities).length > 0) {
        console.log('Saving lesson qualities:', data.lessonQualities);
        const lessonRows = Object.entries(data.lessonQualities)
          .filter(([, q]) => q.quality > 0 || q.reflection)
          .map(([type, q]) => ({
            user_id: user.id,
            date: context.today,
            entry_type: 'lesson',
            category: type,
            description: `${type} · 质量 ${q.quality}/5`,
            response: null,
            score: q.quality || 0,
            reflection: q.reflection || null,
            tags: [] as string[],
          }));

        if (lessonRows.length > 0) {
          const { error: leErr } = await supabase.from("behavior_entries").upsert(lessonRows);
          if (leErr) {
            console.error("lesson quality upsert error:", leErr);
            if (isAuthError(leErr)) { router.push("/login"); return; }
          }
        }
      }

      // Save evening session data
      const sessionPayload = {
        user_id: user.id,
        date: context.today,
        dialogue_path: state.dialoguePath || 'full',
        session_tone: context.sessionTone,
        flag_answer: data.flagAnswer,
        lesson_feedback: data.lessonFeedback,
        shadow_discussions: data.shadowDiscussions,
        infiltration_response: data.infiltrationResponse,
        wangde_delta: state.wangdeDelta,
        scroll_change: settlementData.scrollChange,
        shadow_damage: state.shadowDamage,
      };
      console.log('[Settlement] Saving evening session:', JSON.stringify(sessionPayload));
      const { error: esErr } = await supabase.from("evening_sessions").upsert(sessionPayload);
      if (esErr) {
        console.error("[Settlement] evening_sessions upsert error:", esErr);
        if (isAuthError(esErr)) { router.push("/login"); return; }
      } else {
        console.log("[Settlement] evening_sessions saved OK");
      }

      // Save to day_records
      const flagStatus: 'completed' | 'failed' | 'unmarked' =
        data.flagAnswer === 'completed' ? 'completed' :
        data.flagAnswer === 'not_completed' ? 'failed' :
        'unmarked';

      const { data: existingDay } = await supabase
        .from("day_records")
        .select("id, phase, day_number")
        .eq("user_id", user.id)
        .eq("calendar_date", context.today)
        .maybeSingle();

      // Build enriched schedule from lesson qualities (also handles missing tasks)
      const scheduleFromTasks = (context.todaySchedule?.tasks || []).map((task) => {
        const quality = data.lessonQualities[task.type];
        return {
          type: task.type,
          customLabel: task.content || undefined,
          detail: task.content || undefined,
          startTime: task.start_time || '',
          endTime: task.end_time || '',
          durationMinutes: task.duration || 0,
          status: quality?.status || (task.completed ? 'done' as const : 'unmarked' as const),
          quality: quality?.quality || undefined,
          reflection: quality?.reflection || undefined,
        };
      });

      // Also include lesson qualities that don't have corresponding tasks
      const existingTypes = new Set<string>(scheduleFromTasks.map((s) => s.type));
      const extraFromQualities = Object.entries(data.lessonQualities)
        .filter(([type]) => !existingTypes.has(type))
        .map(([type, q]) => ({
          type: type as 'reading' | 'writing' | 'labor' | 'meditation' | 'exercise',
          startTime: '',
          endTime: '',
          durationMinutes: 0,
          status: q.status,
          quality: q.quality || undefined,
          reflection: q.reflection || undefined,
        }));

      const enrichedSchedule = [...scheduleFromTasks, ...extraFromQualities];

      // Build kingly deeds from behavior entries
      const kinglyDeeds = (data.behaviorEntries || [])
        .filter((e) => e.isKinglyDeed)
        .map((e) => ({
          description: e.description,
          recordedAt: new Date().toISOString(),
          source: 'evening_dialogue' as const,
        }));

      // Build shadow assessments
      const shadowAssessments = (data.shadowDiscussions || []).map((d, i) => ({
        shadowId: d.shadowType,
        shadowType: d.shadowType,
        choice: (context.todayShadowRecords[i]?.selfRating as 'plus' | 'minus' | 'skip' | null) || null,
        record: d.openingResponse || '',
        additionalReflections: d.followUpResponses?.join('；') || undefined,
        submittedAt: new Date().toISOString(),
      }));

      // Build meditation record if there was meditation
      const meditationQuality = data.lessonQualities['meditation'];
      const meditationRecord = meditationQuality?.reflection
        ? {
            content: meditationQuality.reflection,
            submittedAt: new Date().toISOString(),
          }
        : null;

      if (existingDay) {
        const { error: updateErr } = await supabase
          .from("day_records")
          .update({
            schedule: enrichedSchedule,
            kingly_deeds: kinglyDeeds,
            shadow_assessments: shadowAssessments,
            meditation: meditationRecord,
            evening: {
              mode: state.dialoguePath || 'full',
              completedAt: new Date().toISOString(),
            },
            summary: {
              flagStatus,
              shadowChanges,
              virtuePoints: state.wangdeDelta,
              distanceChange: settlementData.scrollChange,
              mentorQuote: settlementData.teacherComment,
            },
            status: 'closing',
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDay.id);
        if (updateErr) {
          console.error("day_records update error:", updateErr);
          if (isAuthError(updateErr)) { router.push("/login"); return; }
        }
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_phase, day_in_journey")
          .eq("id", user.id)
          .single();

        const { error: insertErr } = await supabase.from("day_records").insert({
          user_id: user.id,
          calendar_date: context.today,
          day_number: profile?.day_in_journey || 1,
          phase: profile?.current_phase || 'awakening',
          schedule: enrichedSchedule,
          kingly_deeds: kinglyDeeds,
          shadow_assessments: shadowAssessments,
          meditation: meditationRecord,
          evening: {
            mode: state.dialoguePath || 'full',
            completedAt: new Date().toISOString(),
          },
          summary: {
            flagStatus,
            shadowChanges,
            virtuePoints: state.wangdeDelta,
            distanceChange: settlementData.scrollChange,
            mentorQuote: settlementData.teacherComment,
          },
          status: 'closing',
        });
        if (insertErr) {
          console.error("day_records insert error:", insertErr);
          if (isAuthError(insertErr)) { router.push("/login"); return; }
        }
      }
    } catch (err) {
      console.error("Settlement save failed:", err);
      if (isAuthError(err)) {
        console.error("[Settlement] Auth error in catch, redirecting to login");
        router.push("/login");
        return;
      }
    }

    console.log('[Settlement] Save complete, transitioning to complete phase');
    dispatch({ type: "SET_PHASE", phase: "complete" });
  }, [supabase, state, context, router]); // collectedData read from ref, not needed as dep

  // Navigate to scroll-map when evening completes
  useEffect(() => {
    if (state.phase === "complete") {
      const timer = setTimeout(() => router.push("/scroll-map"), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase, router]);

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
      const meditationHasNegativeTone = meditationTask?.content
        ? /焦虑|担心|害怕|不安|烦躁|生气|难过|伤心|累|压力|烦|苦|痛|悔|愧/.test(meditationTask.content)
        : false;

      // Calculate consecutive same-shadow +1 days
      let consecutiveSameShadowPlus1 = 0;
      const todayPlus1Types = (records || [])
        .filter((r) => r.self_rating === "+1")
        .map((r) => r.shadow_type);
      if (todayPlus1Types.length > 0) {
        // Fetch recent records to count consecutive days
        const { data: recentRecords } = await supabase
          .from("shadow_records")
          .select("date, shadow_type, self_rating")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(14);
        if (recentRecords) {
          for (const shadowType of todayPlus1Types) {
            let count = 1; // today
            for (const rec of recentRecords) {
              if (rec.date >= today) continue; // skip today and future
              if (rec.shadow_type === shadowType && rec.self_rating === "+1") {
                count++;
              } else {
                break; // streak broken
              }
            }
            if (count > consecutiveSameShadowPlus1) {
              consecutiveSameShadowPlus1 = count;
            }
          }
        }
      }

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
        consecutiveSameShadowPlus1,
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
            onRatingSubmit={async (rating, behaviorRecord, shadowType, reflectionDepth, triggerTags, behaviorScore) => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;

              const getTeacherResponse = () => {
                const teacher = shadowType === 'arrogance' ? '申先生' : '徐娘子';
                if (rating === '+1') return '你觉察到了吗？这已经是改变的第一步了。';
                if (rating === '-1') return '这一步太难了。你做到了。';
                if (rating === 'breakthrough') return '恭喜你。但是——你觉得它真的离开了吗？';
                return '';
              };

              await supabase.from("shadow_records").upsert({
                user_id: user.id,
                shadow_type: shadowType,
                date: context.today,
                self_rating: rating,
                behavior_record: behaviorRecord,
                teacher_response: getTeacherResponse(),
                reflection_depth: reflectionDepth,
                trigger_tags: triggerTags,
                behavior_score: behaviorScore,
              });
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
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_behavior_journal" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onLessonFeedback={handleLessonFeedback}
            onLessonQuality={handleLessonQuality}
          />
        );

      case "round_behavior_journal":
        return (
          <RoundBehaviorJournal
            onComplete={() => dispatch({ type: "SET_PHASE", phase: "round_3_shadow" })}
            onExitEarly={() => dispatch({ type: "SET_PHASE", phase: "settlement" })}
            onEntriesSubmit={handleBehaviorEntries}
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
            onExit={handleSettlementComplete}
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