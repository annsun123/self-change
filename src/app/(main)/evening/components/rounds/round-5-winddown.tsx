"use client";

import { useState, useEffect, useRef } from "react";
import type { EveningContext, EveningState } from "@/types/evening";
import { getWindDownContent } from "@/lib/evening-state-machine";

interface Round5WinddownProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExitEarly: () => void;
}

export function Round5Winddown({ context, state, onComplete, onExitEarly }: Round5WinddownProps) {
  const [step, setStep] = useState<'show' | 'done'>('show');
  const windDown = getWindDownContent(context.sessionTone);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const timer = setTimeout(() => {
      setStep('done');
      setTimeout(() => onCompleteRef.current(), 2000);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg w-full">
        <div className="space-y-2">
          <div className="text-5xl">🌙</div>
          <p className="text-amber-400 font-medium">
            {windDown.teacher === 'shen' ? '申先生' : '徐娘子'}
          </p>
        </div>

        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
          <p className="text-lg text-stone-200 leading-relaxed whitespace-pre-wrap">
            {windDown.text}
          </p>
        </div>

        {step === 'show' && (
          <p className="text-stone-500 text-sm animate-pulse pt-4">
            画面渐暗，烛火熄灭一角...
          </p>
        )}

        {step === 'done' && (
          <p className="text-stone-500 text-sm animate-pulse">
            「今日小结」结算画面即将浮现...
          </p>
        )}

        <button
          onClick={onExitEarly}
          className="text-stone-500 hover:text-stone-400 text-sm pt-4"
        >
          今晚就到这吧
        </button>
      </div>
    </div>
  );
}