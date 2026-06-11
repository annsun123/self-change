import type { Phase, ShadowType } from "@/types/database";
import type {
  ShadowDamageResult,
  VirtueChangeResult,
  ScrollState,
} from "@/types/game";

// 阴影HP配置
const SHADOW_INITIAL_HP: Record<ShadowType, number> = {
  arrogance: 7,
  selfishness: 7,
};

// 王德纹路阈值
const WANGDE_THRESHOLDS = [3, 6, 9, 12, 15];

// 天气判断
export type Weather = "clear" | "cloudy" | "storm" | "rainbow";

export function calculateWeather(
  recentPerformance: number // 最近7天的表现分数，正数=好，负数=差
): Weather {
  if (recentPerformance >= 3) return "clear";
  if (recentPerformance >= 0) return "cloudy";
  if (recentPerformance >= -2) return "rainbow"; // 雨天后的彩虹，代表韧性
  return "storm";
}

// 计算阴影伤害结果
export function calculateShadowDamage(
  currentHp: number,
  maxHp: number,
  shatterCount: number,
  damage: number
): ShadowDamageResult {
  const hpBefore = currentHp;
  let hpAfter = Math.max(0, currentHp - damage);
  let didShatter = false;
  let newMaxHp: number | null = null;

  // 如果HP降到0，阴影破碎
  if (hpAfter === 0) {
    didShatter = true;
    // 计算复活后的HP
    shatterCount += 1;
    if (shatterCount === 1) {
      newMaxHp = 5; // 第一次复活HP上限5
    } else if (shatterCount === 2) {
      newMaxHp = 3; // 第二次复活HP上限3
    } else {
      newMaxHp = 3; // 之后稳定在3
    }
    hpAfter = newMaxHp;
  }

  return {
    shadowType: "arrogance", // 调用者需要填充正确的type
    hpBefore,
    hpAfter,
    delta: damage,
    didShatter,
    newMaxHp,
  };
}

// 计算阴影HP变化
export function applyShadowDamage(
  currentHp: number,
  damage: number
): { newHp: number; didShatter: boolean } {
  const newHp = Math.max(0, currentHp - damage);
  return {
    newHp,
    didShatter: newHp === 0,
  };
}

// 计算王德变化
export function applyWangdeChange(
  currentWangde: number,
  delta: number
): VirtueChangeResult {
  const beforeVal = currentWangde;
  const afterVal = Math.max(0, currentWangde + delta);

  // 检查是否达到新阈值
  let didReachThreshold = false;
  let thresholdReached: number | null = null;

  for (const threshold of WANGDE_THRESHOLDS) {
    if (beforeVal < threshold && afterVal >= threshold) {
      didReachThreshold = true;
      thresholdReached = threshold;
      break;
    }
  }

  return {
    beforeVal,
    afterVal,
    delta,
    didReachThreshold,
    thresholdReached,
  };
}

// 计算滚动位置变化
export function calculateScrollPositionChange(
  currentPosition: number,
  performanceScore: number // 正数=前进，负数=后退
): number {
  // 每天的位置变化范围 [-3, +5]
  const change = Math.max(-3, Math.min(5, performanceScore));
  return Math.max(0, currentPosition + change);
}

// 获取当前阶段的显示信息
export function getPhaseDisplayInfo(phase: Phase): {
  name: string;
  description: string;
  emoji: string;
} {
  switch (phase) {
    case "awakening":
      return {
        name: "流放之醒",
        description: "认清自我，正视阴影",
        emoji: "🌅",
      };
    case "self_cultivation":
      return {
        name: "修身养德",
        description: "练习暂停，积累善行",
        emoji: "📖",
      };
    case "trials":
      return {
        name: "考验之路",
        description: "面对挑战，坚守正道",
        emoji: "⚔️",
      };
    case "return":
      return {
        name: "归乡登基",
        description: "回归本心，帮助他人",
        emoji: "👑",
      };
    default:
      return {
        name: "未知",
        description: "",
        emoji: "❓",
      };
  }
}

// 获取天气emoji
export function getWeatherEmoji(weather: Weather): string {
  switch (weather) {
    case "clear":
      return "☀️";
    case "cloudy":
      return "⛅";
    case "storm":
      return "⛈️";
    case "rainbow":
      return "🌈";
    default:
      return "🌤️";
  }
}

// 判断今天是否已完成晨间/晚间
export function hasCompletedMorningToday(lastCompletedDate: string | null): boolean {
  if (!lastCompletedDate) return false;
  const today = new Date().toISOString().split("T")[0];
  return lastCompletedDate === today;
}

// 获取今日功课选项（第二阶段）
export const DAILY_TASKS = [
  {
    category: "reading",
    emoji: "📖",
    name: "读书",
    description: "学习经典，反思自我",
    shadowTarget: "arrogance" as ShadowType,
  },
  {
    category: "writing",
    emoji: "✍️",
    name: "习字",
    description: "静心书写，记录反思",
    shadowTarget: "selfishness" as ShadowType,
  },
  {
    category: "service",
    emoji: "🛠️",
    name: "劳作",
    description: "帮助他人，实践善行",
    shadowTarget: "selfishness" as ShadowType,
  },
  {
    category: "meditation",
    emoji: "❤️",
    name: "修心",
    description: "静坐暂停，觉察当下",
    shadowTarget: "arrogance" as ShadowType,
  },
];

// 计算阶段进度（用于显示）
export function calculatePhaseProgress(
  dayInJourney: number,
  currentPhase: Phase
): { phaseDays: number; totalDays: number } {
  switch (currentPhase) {
    case "awakening":
      return { phaseDays: dayInJourney, totalDays: 14 };
    case "self_cultivation":
      return { phaseDays: dayInJourney - 14, totalDays: 28 };
    case "trials":
      return { phaseDays: dayInJourney - 42, totalDays: 21 };
    case "return":
      return { phaseDays: dayInJourney - 63, totalDays: 14 };
    default:
      return { phaseDays: 0, totalDays: 100 };
  }
}