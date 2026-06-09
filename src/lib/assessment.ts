/**
 * 殿前考核 (Assessment) — Weekly progress evaluation
 *
 * Assessment days: Tuesday (2) and Saturday (6)
 * Evaluates behavior records since the last assessment to determine
 * how many steps the prince advances toward the palace.
 */

import type { BehaviorEntry, ShadowRecord } from "@/types/database";

// ============ Constants ============

/** Days of the week that allow assessment (0=Sun, 2=Tue, 6=Sat) */
const ASSESSMENT_DAYS = new Set([2, 6]); // Tuesday, Saturday

/** Total steps to return to the palace */
export const TOTAL_STEPS = 10_000;

// ============ Day Checks ============

/** Check if today is an assessment day */
export function canAssessToday(): boolean {
  const today = new Date();
  return ASSESSMENT_DAYS.has(today.getDay());
}

/** Get the next assessment day name */
export function getNextAssessmentDay(): { name: string; daysUntil: number } {
  const today = new Date();
  const currentDay = today.getDay();

  // Find next assessment day
  const upcoming = [2, 6, 2 + 7].find((d) => d > currentDay) || 2 + 7;
  const daysUntil = upcoming - currentDay;
  const dayName = upcoming % 7 === 2 ? "周二" : "周六";

  return { name: dayName, daysUntil };
}

/** Get the previous assessment date (or null for first time) */
function getLastAssessmentDate(): Date | null {
  const today = new Date();
  const currentDay = today.getDay();

  // Calculate days since last assessment
  let daysSince = 0;
  if (currentDay === 2) daysSince = 3; // Tue → last Sat (3 days ago)
  else if (currentDay === 6) daysSince = 4; // Sat → last Tue (4 days ago)
  else if (currentDay < 2) daysSince = currentDay + 1; // Sun(1) / Mon(2) → last Sat
  else if (currentDay < 6) daysSince = currentDay - 2; // Wed/Thu/Fri → last Tue
  else daysSince = 0; // Shouldn't happen

  if (daysSince <= 0) return null; // First assessment ever

  const lastDate = new Date(today);
  lastDate.setDate(lastDate.getDate() - daysSince);
  return lastDate;
}

// ============ Assessment Computation ============

export interface AssessmentResult {
  /** Average behavior score (non-lesson entries) */
  avgBehaviorScore: number;
  /** Whether avg behavior score exceeds threshold */
  behaviorPassed: boolean;
  /** Shadows with HP decrease of 2+ in this period */
  shadowsDefeated: Array<{ shadowType: string; name: string; hpDrop: number }>;
  /** Whether any shadow was significantly defeated */
  shadowPassed: boolean;
  /** Number of kingly deeds in this period */
  kinglyDeedCount: number;
  /** Whether there were kingly deeds */
  kinglyDeedPassed: boolean;
  /** Total steps earned */
  totalSteps: number;
  /** Breakdown of steps */
  stepBreakdown: Array<{ label: string; earned: boolean }>;
  /** Total behavior entries considered */
  totalEntries: number;
}

const SHADOW_NAMES: Record<string, string> = {
  arrogance: "逆星",
  selfishness: "毒疮",
};

export function computeAssessment(
  behaviorEntries: BehaviorEntry[],
  shadowRecords: ShadowRecord[],
  currentScrollPosition: number
): AssessmentResult {
  // --- 1. Average behavior score (general_behavior + kingly_deed only, skip lessons) ---
  const generalEntries = behaviorEntries.filter(
    (e) => e.entry_type === "general_behavior" || e.entry_type === "kingly_deed"
  );
  const scores = generalEntries.filter((e) => e.score > 0).map((e) => e.score);
  const avgBehaviorScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0;
  const behaviorPassed = avgBehaviorScore > 4;

  // --- 2. Shadow HP drops ---
  // Group shadow records by shadow_type, calculate HP change
  const shadowByType: Record<string, ShadowRecord[]> = {};
  for (const sr of shadowRecords) {
    if (!shadowByType[sr.shadow_type]) shadowByType[sr.shadow_type] = [];
    shadowByType[sr.shadow_type].push(sr);
  }

  const shadowsDefeated: AssessmentResult["shadowsDefeated"] = [];
  for (const [shadowType, records] of Object.entries(shadowByType)) {
    // Count resist/minus events (HP decreasing actions)
    const resistCount = records.filter(
      (r) => r.self_rating === "-1" || r.self_rating === "breakthrough"
    ).length;
    const triggerCount = records.filter((r) => r.self_rating === "+1").length;
    const hpDrop = resistCount - triggerCount; // net HP decrease

    if (hpDrop >= 2) {
      shadowsDefeated.push({
        shadowType,
        name: SHADOW_NAMES[shadowType] || shadowType,
        hpDrop,
      });
    }
  }
  const shadowPassed = shadowsDefeated.length > 0;

  // --- 3. Kingly deeds ---
  const kinglyDeedCount = behaviorEntries.filter(
    (e) => e.entry_type === "kingly_deed"
  ).length;
  const kinglyDeedPassed = kinglyDeedCount > 0;

  // --- Compute total steps ---
  let totalSteps = 0;
  const stepBreakdown: AssessmentResult["stepBreakdown"] = [];

  if (behaviorPassed) {
    totalSteps += 1;
    stepBreakdown.push({ label: `平均行为分 ${avgBehaviorScore}/10 > 4`, earned: true });
  } else {
    stepBreakdown.push({
      label:
        avgBehaviorScore > 0
          ? `平均行为分 ${avgBehaviorScore}/10（需 > 4）`
          : "暂无行为记录",
      earned: false,
    });
  }

  if (shadowPassed) {
    totalSteps += 1;
    const names = shadowsDefeated.map((s) => `${s.name} HP -${s.hpDrop}`);
    stepBreakdown.push({ label: `阴影战果：${names.join("、")}`, earned: true });
  } else {
    stepBreakdown.push({ label: "阴影 HP 下降不足 2", earned: false });
  }

  if (kinglyDeedPassed) {
    totalSteps += 1;
    stepBreakdown.push({ label: `王德之举 ${kinglyDeedCount} 次`, earned: true });
  } else {
    stepBreakdown.push({ label: "本周暂无王德之举", earned: false });
  }

  return {
    avgBehaviorScore,
    behaviorPassed,
    shadowsDefeated,
    shadowPassed,
    kinglyDeedCount,
    kinglyDeedPassed,
    totalSteps,
    stepBreakdown,
    totalEntries: generalEntries.length,
  };
}

// ============ Encouragement Messages ============

const ENCOURAGEMENTS = [
  "考核之日未至。静心修炼，殿下。",
  "路虽远，行则将至。继续前行吧。",
  "每一次反思，都是在为王宫的方向校准一步。",
  "申先生说过：不急不躁，方能致远。",
  "徐娘子说：殿下今日所为，已在回宫的路上刻下了痕迹。",
  "回宫不是终点，是新的开始。珍惜每一日。",
];

let _encouragementIndex = 0;

export function getEncouragement(): string {
  const msg = ENCOURAGEMENTS[_encouragementIndex % ENCOURAGEMENTS.length];
  _encouragementIndex++;
  return msg;
}

// ============ Period-based fetcher helpers ============

/** Get the date range for the current assessment period */
export function getAssessmentPeriod(): { since: string; until: string } {
  const today = new Date();
  const until = today.toISOString().split("T")[0];

  const lastAssessment = getLastAssessmentDate();
  const since = lastAssessment
    ? lastAssessment.toISOString().split("T")[0]
    : new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // Default: last 4 days

  return { since, until };
}
