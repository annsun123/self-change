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
  const onExitRef = useRef(onExit);
  const completedRef = useRef(false);

  console.log('[SettlementScreen] Rendering, countdown:', countdown);

  // Keep refs updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onExitRef.current = onExit;
  }, [onComplete, onExit]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Trigger completion when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && !completedRef.current) {
      completedRef.current = true;
      console.log('[SettlementScreen] Countdown reached 0, calling onComplete');
      onCompleteRef.current();
    }
  }, [countdown]);

  const handleSkip = () => {
    console.log('[SettlementScreen] Skip button clicked, calling onExit');
    if (!completedRef.current) {
      completedRef.current = true;
      onExitRef.current();
    }
  };

  const [saving, setSaving] = useState(false);

  const handleViewBehavior = () => {
    console.log('[SettlementScreen] View behavior analysis clicked — saving first');
    if (!completedRef.current) {
      completedRef.current = true;
      setSaving(true);
      // Trigger save, then navigate after a short delay
      onExitRef.current();
      setTimeout(() => {
        window.location.href = '/behavior-analysis';
      }, 2000);
    } else {
      window.location.href = '/behavior-analysis';
    }
  };

  const settlementData = generateSettlementData(
    state,
    context.activeShadows.map((s) => ({
      shadowType: s.shadowType,
      currentHp: s.currentHp,
      maxHp: s.maxHp,
    })),
    context.profile.wangde
  );

  const teacherComment = settlementData.teacherComment;
  const teacher = settlementData.direction === 'negative' ? 'xu' : 'shen';

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
                        className={`text-sm ${
                          i < hpAfter ? 'text-amber-500' : 'text-stone-600'
                        }`}
                      >
                        {i < hpAfter ? '⬛' : '⬜'}
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
            {'即将进入结算'}
          </div>
          <div className="text-amber-500/60 text-4xl font-light">
            {countdown}
          </div>
          <p className="text-stone-500 text-sm">秒后自动跳转</p>
        </div>

        {/* Skip button */}
        <div className="space-y-3">
          <button
            onClick={handleSkip}
            className="w-full py-3 text-stone-500 hover:text-stone-400 text-sm transition-all"
          >
            跳过 →
          </button>
          <button
            onClick={handleViewBehavior}
            disabled={saving}
            className="w-full py-2 text-stone-600 hover:text-stone-400 disabled:text-stone-700 text-xs transition-all"
          >
            {saving ? '保存中...' : '📜 查看行为录'}
          </button>
        </div>
      </div>
    </div>
  );
}