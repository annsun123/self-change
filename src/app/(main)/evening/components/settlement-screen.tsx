"use client";

import { useEffect, useState, useRef } from "react";
import type { EveningContext, EveningState } from "@/types/evening";
import { generateSettlementData, getQuickPathTeacherComment } from "@/lib/evening-state-machine";

interface SettlementScreenProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExit: () => void;
}

export function SettlementScreen({ context, state, onComplete, onExit }: SettlementScreenProps) {
  const [countdown, setCountdown] = useState(15);
  const [isQuickPath] = useState(state.dialoguePath === 'quick');
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Skip if already completed
    if (completedRef.current) return;
    completedRef.current = false;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          completedRef.current = true;
          onCompleteRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty deps - only run once on mount

  const settlementData = generateSettlementData(
    state,
    context.activeShadows.map((s) => ({
      shadowType: s.shadowType,
      currentHp: s.currentHp,
      maxHp: s.maxHp,
    })),
    context.profile.wangde
  );

  // For quick path, get the direct comment
  const quickComment = isQuickPath ? getQuickPathTeacherComment(context.sessionTone) : null;
  const teacherComment = quickComment?.text || settlementData.teacherComment;
  const teacher = quickComment?.teacher || (settlementData.direction === 'negative' ? 'xu' : 'shen');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">📊</div>
          <h2 className="text-2xl font-serif text-amber-400">今日小结</h2>
        </div>

        {/* Stats */}
        <div className="space-y-4 p-6 bg-stone-900/50 rounded-xl border border-stone-800">
          {context.activeShadows.map((shadow) => {
            const hpAfter = settlementData.shadowHpAfter[shadow.shadowType] || shadow.currentHp;
            const hpPercent = hpAfter / shadow.maxHp;
            return (
              <div key={shadow.shadowType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {shadow.shadowType === 'arrogance' ? '🖤' : '💀'}
                  </span>
                  <span className="text-stone-300">
                    {shadow.shadowType === 'arrogance' ? '逆星' : '毒疮'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 text-sm">
                    {hpAfter}/{shadow.maxHp}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: shadow.maxHp }).map((_, i) => (
                      <span
                        key={i}
                        className={`w-3 h-3 ${
                          i < hpAfter ? 'text-amber-500' : 'text-stone-700'
                        }`}
                      >
                        ●
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {state.wangdeDelta > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-stone-800">
              <span className="text-stone-400">王德</span>
              <span className="text-amber-400 font-medium">+{state.wangdeDelta}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <span className="text-stone-400">离家距离</span>
            <span className="text-stone-300">
              {settlementData.scrollChange > 0 ? '前进一程' : settlementData.scrollChange < 0 ? '后退一程' : '不变'}
            </span>
          </div>
        </div>

        {/* Teacher comment */}
        <div className="p-4 bg-stone-900/30 border border-stone-800/50 rounded-lg text-center">
          <p className="text-stone-400 text-sm mb-2">
            {teacher === 'shen' ? '—— 申先生' : '—— 徐娘子'}
          </p>
          <p className="text-stone-200 leading-relaxed italic">
            「{teacherComment}」
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center space-y-2">
          <div className="text-stone-600 text-sm">
            {isQuickPath ? '快速结算' : '即将进入结算'}
          </div>
          <div className="text-amber-500/60 text-4xl font-light">
            {countdown}
          </div>
          <p className="text-stone-500 text-sm">秒后自动跳转</p>
        </div>

        {/* Skip button */}
        <button
          onClick={onExit}
          className="w-full py-3 text-stone-500 hover:text-stone-400 text-sm transition-all"
        >
          跳过 →
        </button>
      </div>
    </div>
  );
}