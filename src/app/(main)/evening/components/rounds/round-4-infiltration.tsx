"use client";

import { useState, useEffect, useRef } from "react";
import type { EveningContext, EveningState } from "@/types/evening";
import { evaluateRound4Triggers } from "@/lib/evening-state-machine";

interface Round4InfiltrationProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExitEarly: () => void;
  onInfiltrationResponse: (response: string | null) => void;
}

export function Round4Infiltration({ context, state, onComplete, onExitEarly, onInfiltrationResponse }: Round4InfiltrationProps) {
  const [step, setStep] = useState<'checking' | 'question' | 'response' | 'done'>(
    'checking'
  );
  const [triggerText, setTriggerText] = useState('');
  const [teacher, setTeacher] = useState<'shen' | 'xu'>('shen');
  const [responseText, setResponseText] = useState('');
  const [inputValue, setInputValue] = useState('');

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onInfiltrationResponseRef = useRef(onInfiltrationResponse);
  onInfiltrationResponseRef.current = onInfiltrationResponse;

  useEffect(() => {
    // Evaluate triggers
    const trigger = evaluateRound4Triggers({
      todayShadowRecords: context.todayShadowRecords,
      didMeditation: context.didMeditation,
      meditationHasNegativeTone: context.meditationHasNegativeTone,
      lessonCompletionRate: context.lessonCompletionRate,
      latestLessonTime: context.latestLessonTime,
      flagStatus: state.flagStatus,
      hasAnyTask: context.todaySchedule?.hasAnyTask || false,
      consecutiveSameShadowPlus1: context.consecutiveSameShadowPlus1,
    });

    if (trigger) {
      setTriggerText(trigger.prompt);
      setTeacher(trigger.teacher);
      setStep('question');
    } else {
      setStep('done');
    }
  }, [context, state.flagStatus]);

  useEffect(() => {
    if (step === 'done') {
      onInfiltrationResponseRef.current(responseText || null);
      setTimeout(() => onCompleteRef.current(), 1000);
    }
  }, [step, responseText]);

  if (step === 'done' || !triggerText) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl">🕯️</div>
          <p className="text-stone-500">无触发源，跳过暗线渗透。</p>
          <p className="text-stone-400 text-sm">进入下一轮。</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (answer: string) => {
    setResponseText(answer || '（沉默）');
    setStep('response');
    setTimeout(() => {
      setStep('done');
    }, 2000);
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg w-full">
        <div className="space-y-2">
          <div className="text-5xl">{teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</div>
          <p className="text-amber-400 font-medium">
            {teacher === 'shen' ? '申先生' : '徐娘子'}
          </p>
        </div>

        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
          <p className="text-lg text-stone-200 leading-relaxed">{triggerText}</p>
        </div>

        {step === 'question' && (
          <div className="space-y-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="说说你的想法..."
              className="w-full h-24 p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 resize-none focus:outline-none focus:border-amber-600"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmit(inputValue)}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all"
              >
                提交
              </button>
              <button
                onClick={() => handleSubmit('')}
                className="py-3 px-6 text-stone-500 hover:text-stone-400 border border-stone-700 rounded-lg transition-all"
              >
                不知道
              </button>
            </div>
          </div>
        )}

        {step === 'response' && (
          <div className="space-y-4">
            <div className="p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <p className="text-stone-300 leading-relaxed">
                {responseText === '（沉默）'
                  ? '无妨。时候到了自然会说。'
                  : '嗯。记住了。'}
              </p>
            </div>
            <p className="text-stone-500 text-sm animate-pulse">进入下一轮...</p>
          </div>
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