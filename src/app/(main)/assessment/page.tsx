"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  canAssessToday,
  getNextAssessmentDay,
  getEncouragement,
  getAssessmentPeriod,
  computeAssessment,
  TOTAL_STEPS,
} from "@/lib/assessment";
import type { AssessmentResult } from "@/lib/assessment";
import type { BehaviorEntry, ShadowRecord } from "@/types/database";

export default function AssessmentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAssessmentDay, setIsAssessmentDay] = useState(false);
  const [alreadyAssessed, setAlreadyAssessed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [nextAssessment, setNextAssessment] = useState<{ name: string; daysUntil: number } | null>(null);
  const [encouragement, setEncouragement] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const today = new Date().toISOString().split("T")[0];
      const assessable = canAssessToday();
      setIsAssessmentDay(assessable);

      if (!assessable) {
        setNextAssessment(getNextAssessmentDay());
        setEncouragement(getEncouragement());
        setLoading(false);
        return;
      }

      // Load profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("scroll_position, last_assessment_date")
        .eq("id", user.id)
        .single();

      if (!profile) { setLoading(false); return; }

      setCurrentPosition(profile.scroll_position || 0);

      // Check if already assessed today
      if (profile.last_assessment_date === today) {
        setAlreadyAssessed(true);
        setLoading(false);
        return;
      }

      // Fetch period data
      const { since, until } = getAssessmentPeriod();

      const { data: behaviorEntries } = await supabase
        .from("behavior_entries")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", since)
        .lte("date", until)
        .order("date", { ascending: false });

      const { data: shadowRecords } = await supabase
        .from("shadow_records")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", since)
        .lte("date", until)
        .order("date", { ascending: false });

      const assessmentResult = computeAssessment(
        (behaviorEntries || []) as BehaviorEntry[],
        (shadowRecords || []) as ShadowRecord[],
        profile.scroll_position || 0
      );

      setResult(assessmentResult);
      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleApply = useCallback(async () => {
    if (!result || result.totalSteps === 0) return;

    setApplying(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setApplying(false); return; }

    const today = new Date().toISOString().split("T")[0];
    const newPosition = Math.min(TOTAL_STEPS, currentPosition + result.totalSteps);

    const { error } = await supabase
      .from("profiles")
      .update({
        scroll_position: newPosition,
        last_assessment_date: today,
      })
      .eq("id", user.id);

    if (error) {
      console.error("Assessment update failed:", error);
      setApplying(false);
      return;
    }

    setCurrentPosition(newPosition);
    setApplied(true);
    setApplying(false);
  }, [result, currentPosition, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">准备考核中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center gap-3">
        <button onClick={() => router.push("/scroll-map")} className="text-stone-500 hover:text-stone-300">
          ← 返回
        </button>
        <h1 className="text-xl font-serif text-amber-400">⚔ 殿前考核</h1>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-6 pt-8">
        {/* ─── Non-Assessment Day ─── */}
        {!isAssessmentDay && nextAssessment && (
          <div className="text-center space-y-8">
            <div className="text-6xl">🏯</div>
            <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
              <p className="text-amber-400 text-lg font-serif">
                「{encouragement}」
              </p>
              <div className="pt-4 border-t border-stone-800">
                <p className="text-stone-500 text-sm">
                  下次考核：{nextAssessment.name}（{nextAssessment.daysUntil} 天后）
                </p>
                <p className="text-stone-600 text-xs mt-1">
                  考核日为每周二、周六
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/scroll-map")}
              className="text-stone-500 hover:text-stone-400 text-sm"
            >
              返回主页
            </button>
          </div>
        )}

        {/* ─── Already Assessed Today ─── */}
        {isAssessmentDay && alreadyAssessed && (
          <div className="text-center space-y-8">
            <div className="text-6xl">✅</div>
            <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
              <p className="text-amber-400 text-lg font-serif">
                今日考核已完成。
              </p>
              <p className="text-stone-400 text-sm">
                下次考核日见，殿下。
              </p>
            </div>
            <button
              onClick={() => router.push("/scroll-map")}
              className="text-stone-500 hover:text-stone-400 text-sm"
            >
              返回主页
            </button>
          </div>
        )}

        {/* ─── Assessment Day — Results ─── */}
        {isAssessmentDay && !alreadyAssessed && result && (
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <div className="text-5xl">⚔</div>
              <h2 className="text-xl font-serif text-amber-400">考核结果</h2>
              <p className="text-stone-500 text-sm">
                依据近日行为录评判
              </p>
            </div>

            {/* Step breakdown */}
            <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
              {result.stepBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-lg ${item.earned ? "" : "opacity-30"}`}>
                      {item.earned ? "✅" : "⬜"}
                    </span>
                    <span className={`text-sm ${item.earned ? "text-stone-200" : "text-stone-600"}`}>
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${item.earned ? "text-amber-400" : "text-stone-700"}`}>
                    {item.earned ? "+1 步" : "—"}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-stone-800 pt-4 flex items-center justify-between">
                <span className="text-stone-300 font-serif">本次前进</span>
                <span className="text-amber-400 text-xl font-bold">{result.totalSteps} 步</span>
              </div>
            </div>

            {/* Distance info */}
            <div className="p-4 bg-stone-900/30 border border-stone-800/50 rounded-lg text-center space-y-2">
              <p className="text-stone-500 text-sm">当前距王宫</p>
              <p className="text-amber-400 text-3xl font-serif">
                {TOTAL_STEPS - currentPosition - result.totalSteps >= 0
                  ? (TOTAL_STEPS - currentPosition - result.totalSteps).toLocaleString()
                  : "0"}
              </p>
              <p className="text-stone-600 text-xs">步</p>
              <div className="flex items-center justify-center gap-1 pt-1">
                <span className="text-stone-600 text-xs">
                  {currentPosition.toLocaleString()} →
                </span>
                <span className="text-amber-400 text-xs font-medium">
                  {(currentPosition + result.totalSteps).toLocaleString()}
                </span>
                <span className="text-stone-600 text-xs">
                  / {TOTAL_STEPS.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Apply button */}
            <button
              onClick={handleApply}
              disabled={applying || applied || result.totalSteps === 0}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 rounded-lg text-stone-100 font-medium text-lg transition-all"
            >
              {applying
                ? "记录中..."
                : applied
                  ? "已记录 ✓"
                  : result.totalSteps === 0
                    ? "本次无步数进账"
                    : "确认考核 · 前进"}
            </button>

            {result.totalSteps === 0 && !applied && (
              <p className="text-center text-stone-600 text-sm">
                三项考核均未通过。继续努力，下次考核必定有所收获。
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
