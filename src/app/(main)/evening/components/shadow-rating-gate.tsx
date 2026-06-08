"use client";

import { useState } from "react";
import { ShadowSelfRatingCard } from "@/components/shadow-hall/self-rating-card";
import type { EveningContext } from "@/types/evening";
import { getOpeningContent } from "@/lib/evening-state-machine";

interface ShadowRatingGateProps {
  context: EveningContext;
  onComplete: () => void;
  onRatingSubmit: (
    rating: "+1" | "-1" | "skip" | "breakthrough",
    behaviorRecord: string,
    shadowType: string,
    reflectionDepth: number | null,
    triggerTags: string[],
    behaviorScore: number | null
  ) => Promise<void>;
}

export function ShadowRatingGate({ context, onComplete, onRatingSubmit }: ShadowRatingGateProps) {
  const [ratingShadowIndex, setRatingShadowIndex] = useState(0);
  const [showRatingCard, setShowRatingCard] = useState(false);

  // Check if all active shadows have today's records
  const recordedTypes = new Set(context.todayShadowRecords.map((r) => r.shadowType));
  const unrecordedShadows = context.activeShadows.filter((s) => !recordedTypes.has(s.shadowType));

  // If no shadows need rating, show teacher's line and proceed
  if (unrecordedShadows.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg">
          <div className="text-6xl mb-4">🕯️</div>
          <p className="text-stone-400 text-sm">烛火摇曳中，先生抬眼看向你。</p>
          <p className="text-stone-300 leading-relaxed">
            {unrecordedShadows.length === 0
              ? "今日战况已录。——好。"
              : "且慢，今日战况还没记吧？好歹写上一笔。"}
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

  // Show rating card for first unrecorded shadow
  if (showRatingCard && ratingShadowIndex < unrecordedShadows.length) {
    const shadow = unrecordedShadows[ratingShadowIndex];
    return (
      <ShadowSelfRatingCard
        shadow={{
          id: shadow.shadowType,
          shadow_type: shadow.shadowType,
          current_hp: shadow.currentHp,
          max_hp: shadow.maxHp,
        } as any}
        onSubmit={async (rating, behaviorRecord, reflectionDepth, triggerTags, behaviorScore) => {
          await onRatingSubmit(rating, behaviorRecord, shadow.shadowType, reflectionDepth, triggerTags, behaviorScore);
          if (ratingShadowIndex + 1 < unrecordedShadows.length) {
            setRatingShadowIndex((prev) => prev + 1);
          } else {
            setShowRatingCard(false);
            onComplete();
          }
        }}
        onClose={() => {
          setShowRatingCard(false);
        }}
      />
    );
  }

  // Teacher blocks and asks to record
  // Use context's sessionTone for determining teacher
  const teacher = context.sessionTone === 'positive' ? 'xu' : 'shen';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg">
        <div className="text-6xl mb-4">🕯️</div>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-2xl">{teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</span>
          <span className="text-amber-400 font-medium">
            {teacher === 'shen' ? '申先生' : '徐娘子'}
          </span>
        </div>
        <p className="text-stone-300 leading-relaxed text-lg">
          且慢，今日战况还没记吧？好歹写上一笔。
        </p>
        <button
          onClick={() => setShowRatingCard(true)}
          className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all"
        >
          记录今日战况
        </button>
        <p className="text-stone-500 text-sm">
          先生等着你记录今日战况。
        </p>
      </div>
    </div>
  );
}