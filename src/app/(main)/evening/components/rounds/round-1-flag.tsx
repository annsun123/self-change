"use client";

import { useState } from "react";
import type { EveningContext, EveningState } from "@/types/evening";
import { getFlagStatusForRound1, getFlagUserResponseOutcome } from "@/lib/evening-state-machine";

interface Round1FlagProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExitEarly: () => void;
  onFlagAnswer: (answer: 'completed' | 'not_completed' | 'forgot' | 'skip' | null) => void;
}

export function Round1Flag({ context, state, onComplete, onExitEarly, onFlagAnswer }: Round1FlagProps) {
  const { flagStatus } = state;
  const hasGoal = !!context.profile.todayGoal;

  // Auto-response case: flag was already marked
  const autoResponse = getFlagStatusForRound1(flagStatus, hasGoal);

  const [step, setStep] = useState<'question' | 'response' | 'done'>(
    autoResponse.autoResponse ? 'response' : 'question'
  );
  const [responseText, setResponseText] = useState(autoResponse.autoResponse ? autoResponse.autoResponseText : '');
  const [teacher] = useState<'shen' | 'xu'>(
    flagStatus === false ? 'xu' : 'shen'
  );

  const handleUserResponse = (answer: 'completed' | 'not_completed' | 'forgot' | 'skip') => {
    const outcome = getFlagUserResponseOutcome(answer);
    setResponseText(outcome.responseText);
    setStep('response');
    onFlagAnswer(answer);

    if (outcome.skipToNextRound) {
      setTimeout(onComplete, 2000);
    }
  };

  const handleContinue = () => {
    onComplete();
  };

  const handleExit = () => {
    onExitEarly();
  };

  // No goal set - skip round 1
  if (!hasGoal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl">🚩</div>
          <p className="text-stone-500">今日未立旗。</p>
          <button
            onClick={handleContinue}
            className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
          >
            继续 →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg w-full">
        {/* Teacher */}
        <div className="space-y-2">
          <div className="text-5xl">{teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</div>
          <p className="text-amber-400 font-medium">
            {teacher === 'shen' ? '申先生' : '徐娘子'}
          </p>
        </div>

        {/* Question or Response */}
        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
          <p className="text-lg text-stone-200 leading-relaxed whitespace-pre-wrap">
            {step === 'question' ? (
              hasGoal
                ? `今早你立了个旗。——还在吗？\n\n「${context.profile.todayGoal}」`
                : '今日未立旗。'
            ) : (
              responseText
            )}
          </p>
        </div>

        {/* User response buttons - only show during question step */}
        {step === 'question' && hasGoal && (
          <div className="space-y-3">
            <button
              onClick={() => handleUserResponse('completed')}
              className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
            >
              <span className="text-amber-500 mr-2">○</span>
              立住了，完成了。
            </button>

            <button
              onClick={() => handleUserResponse('not_completed')}
              className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
            >
              <span className="text-amber-500 mr-2">○</span>
              没守住，绊住了。
            </button>

            <button
              onClick={() => handleUserResponse('forgot')}
              className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
            >
              <span className="text-amber-500 mr-2">○</span>
              一心二用，立了没留意。
            </button>

            <button
              onClick={() => handleUserResponse('skip')}
              className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
            >
              <span className="text-amber-500 mr-2">○</span>
              不想说了。
            </button>
          </div>
        )}

        {/* Continue / Exit buttons */}
        <div className="flex gap-4 pt-4">
          {step === 'response' && (
            <button
              onClick={handleContinue}
              className="flex-1 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
            >
              继续 →
            </button>
          )}

          <button
            onClick={handleExit}
            className="py-3 px-6 text-stone-500 hover:text-stone-400 text-sm"
          >
            今晚就到这吧
          </button>
        </div>
      </div>
    </div>
  );
}