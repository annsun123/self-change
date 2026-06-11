"use client";

import type { EveningContext } from "@/types/evening";

interface ShadowRatingGateProps {
  context: EveningContext;
  onComplete: () => void;
}

/**
 * ShadowRatingGate — checks if all active shadows have today's records.
 * If yes, shows completion screen and proceeds.
 * If no, the parent (page.tsx) handles redirect to /shadow-hall.
 */
export function ShadowRatingGate({ context, onComplete }: ShadowRatingGateProps) {
  const recordedTypes = new Set(context.todayShadowRecords.map((r) => r.shadowType));
  const unrecordedShadows = context.activeShadows.filter(
    (s) => !recordedTypes.has(s.shadowType)
  );

  // All shadows recorded — proceed
  if (unrecordedShadows.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg">
          <div className="text-6xl mb-4">🕯️</div>
          <p className="text-stone-400 text-sm">烛火摇曳中，先生抬眼看向你。</p>
          <p className="text-stone-300 leading-relaxed">
            今日战况已录。——好。
          </p>
          <button
            onClick={onComplete}
            className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
          >
            继续 →
          </button>
        </div>
      </div>
    );
  }

  // Unrecorded shadows exist — parent handles redirect
  // This path should not normally render (page.tsx redirects before mounting)
  return null;
}
