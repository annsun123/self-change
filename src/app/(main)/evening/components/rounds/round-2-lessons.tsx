"use client";

import { useState, useEffect, useRef } from "react";
import type { EveningContext, EveningState } from "@/types/evening";
import type { ScheduleTask } from "@/types/database";

interface Round2LessonsProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExitEarly: () => void;
  onLessonFeedback: (feedback: Record<string, string>) => void;
  onLessonQuality: (qualities: Record<string, { quality: number; reflection: string; status: 'done' | 'missed' }>) => void;
}

const LESSON_QUESTIONS: Record<string, { teacher: 'shen' | 'xu'; question: (task: ScheduleTask) => string; followUp?: (userAnswer: string, teacher: 'shen' | 'xu') => string }> = {
  reading: {
    teacher: 'shen',
    question: (task) => `你读了《${task.content || '那本书'}》——读到哪一句时，心里动了一下？`,
    followUp: () => '嗯。记住了就好。',
  },
  writing: {
    teacher: 'xu',
    question: (task) => '今日习字时，写了那几笔时手顺吗？',
    followUp: () => '那就好。手顺了，心也就顺了。',
  },
  service: {
    teacher: 'shen',
    question: (task) => `下午的劳作${task.content ? `「${task.content}」` : ''}，做到后来还顺手吗？`,
    followUp: (userAnswer: string) => {
      const lower = userAnswer.toLowerCase();
      if (lower.includes('顺') || lower.includes('好') || lower.includes('不错') || lower.includes('顺利') || lower.includes('完成')) {
        return '好。手上有活，心里就不乱。';
      }
      if (lower.includes('卡') || lower.includes('难') || lower.includes('不顺') || lower.includes('没做') || lower.includes('没完')) {
        return '不顺也好。手上不顺，至少手上在动。——明日再试。';
      }
      return '知道了。日日动一动，身体才不会背叛你。';
    },
  },
  meditation: {
    teacher: 'xu',
    question: () => '今天在修心的时候，我感觉到你心里有些想法。——你不是写下来了么。那几个字，现在回头看，还如你写时那般重吗？',
  },
  exercise: {
    teacher: 'shen',
    question: () => '今日身体如何？可有什么不适？',
    followUp: () => '嗯。身体是载道的器皿。器皿好，才能走得远。',
  },
};

type Step = 'question' | 'followup' | 'quality' | 'done';

export function Round2Lessons({ context, state, onComplete, onExitEarly, onLessonFeedback, onLessonQuality }: Round2LessonsProps) {
  const tasks = (context.todaySchedule?.tasks || []).filter((t) => t.completed);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [step, setStep] = useState<Step>(tasks.length === 0 ? 'done' : 'question');
  const [currentText, setCurrentText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [allFeedback, setAllFeedback] = useState<Record<string, string>>({});
  const [allQualities, setAllQualities] = useState<Record<string, { quality: number; reflection: string; status: 'done' | 'missed' }>>({});
  const [qualityValue, setQualityValue] = useState<number>(0);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onLessonFeedbackRef = useRef(onLessonFeedback);
  onLessonFeedbackRef.current = onLessonFeedback;
  const onLessonQualityRef = useRef(onLessonQuality);
  onLessonQualityRef.current = onLessonQuality;

  useEffect(() => {
    if (step === 'done') {
      onLessonFeedbackRef.current(allFeedback);
      onLessonQualityRef.current(allQualities);
      setTimeout(() => onCompleteRef.current(), 1500);
    }
  }, [step, allFeedback, allQualities]);

  if (tasks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl">📋</div>
          <p className="text-stone-500">今日无可回顾的功课。</p>
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

  const currentTask = tasks[currentTaskIndex];
  const config = LESSON_QUESTIONS[currentTask?.type];

  const handleAnswer = (answer: string) => {
    // Store feedback
    if (currentTask && answer.trim() && answer !== '不知道') {
      setAllFeedback((prev) => ({ ...prev, [currentTask.type]: answer }));
    }

    setInputValue(answer);

    if (!answer.trim() || answer === '不知道') {
      // Short response, skip follow-up, go to quality
      setStep('quality');
      return;
    }

    // Check if there's a follow-up
    if (config?.followUp) {
      setShowFollowUp(true);
      setCurrentText(config.followUp(answer, config.teacher));
      setStep('followup');
    } else {
      setStep('quality');
    }
  };

  const handleQualitySubmit = () => {
    if (currentTask && qualityValue > 0) {
      setAllQualities((prev) => ({
        ...prev,
        [currentTask.type]: {
          quality: qualityValue,
          reflection: inputValue || '',
          status: 'done' as const,
        },
      }));
    } else if (currentTask) {
      setAllQualities((prev) => ({
        ...prev,
        [currentTask.type]: {
          quality: 0,
          reflection: inputValue || '',
          status: 'done' as const,
        },
      }));
    }
    moveToNextTask();
  };

  const moveToNextTask = () => {
    if (currentTaskIndex + 1 < tasks.length) {
      setCurrentTaskIndex((prev) => prev + 1);
      setStep('question');
      setCurrentText('');
      setInputValue('');
      setShowFollowUp(false);
      setQualityValue(0);
    } else {
      setStep('done');
    }
  };

  const handleContinue = () => {
    if (step === 'followup') {
      setStep('quality');
    } else {
      handleAnswer(inputValue);
    }
  };

  const handleExit = () => {
    onExitEarly();
  };

  if (step === 'done') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="text-4xl">📋</div>
          <p className="text-stone-500">功课已回顾。</p>
          <p className="text-stone-400 text-sm">进入下一轮。</p>
        </div>
      </div>
    );
  }

  // Quality scoring step
  if (step === 'quality') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="text-sm text-stone-500">
            {currentTaskIndex + 1} / {tasks.length}
          </div>

          <p className="text-stone-300 text-sm">
            给自己的完成度打分：
          </p>

          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQualityValue(q === qualityValue ? 0 : q)}
                className={`w-14 h-14 rounded-lg border text-center transition-all text-lg ${
                  qualityValue >= q
                    ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                    : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                }`}
              >
                {qualityValue >= q ? '●' : '○'}
              </button>
            ))}
          </div>
          <p className="text-stone-500 text-xs">
            {qualityValue === 0 ? '轻触打分' :
             qualityValue <= 2 ? '诚实就是进步' :
             qualityValue <= 3 ? '还行，还有空间' :
             qualityValue <= 4 ? '做得不错' :
             '今天很扎实'}
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => moveToNextTask()}
              className="flex-1 py-2 text-stone-500 hover:text-stone-400 border border-stone-700 rounded-lg transition-all text-sm"
            >
              跳过
            </button>
            <button
              onClick={handleQualitySubmit}
              className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all text-sm"
            >
              确认 →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-lg w-full">
        {/* Teacher */}
        <div className="space-y-2">
          <div className="text-5xl">{config?.teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</div>
          <p className="text-amber-400 font-medium">
            {config?.teacher === 'shen' ? '申先生' : '徐娘子'}
          </p>
        </div>

        {/* Task indicator */}
        <div className="text-stone-500 text-sm">
          {currentTaskIndex + 1} / {tasks.length}
        </div>

        {/* Morning meditation content reminder */}
        {currentTask?.type === 'meditation' && currentTask?.content && (
          <div className="p-4 bg-amber-900/10 border border-amber-800/20 rounded-lg">
            <p className="text-amber-500/60 text-xs mb-2">📜 晨间所记</p>
            <p className="text-amber-300/80 text-sm leading-relaxed whitespace-pre-wrap italic">
              「{currentTask.content}」
            </p>
          </div>
        )}

        {/* Question */}
        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
          <p className="text-lg text-stone-200 leading-relaxed whitespace-pre-wrap">
            {config?.question(currentTask) || '今日做得如何？'}
          </p>
        </div>

        {/* Input or follow-up */}
        {!showFollowUp ? (
          <div className="space-y-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="说说你的感受..."
              className="w-full h-24 p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 resize-none focus:outline-none focus:border-amber-600"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleAnswer(inputValue)}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all"
              >
                提交
              </button>
              <button
                onClick={() => handleAnswer('不知道')}
                className="py-3 px-6 text-stone-500 hover:text-stone-400 border border-stone-700 rounded-lg transition-all"
              >
                不知道
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <p className="text-stone-300 leading-relaxed">{currentText}</p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
            >
              继续 →
            </button>
          </div>
        )}

        {/* Exit button */}
        <button
          onClick={handleExit}
          className="text-stone-500 hover:text-stone-400 text-sm pt-4"
        >
          今晚就到这吧
        </button>
      </div>
    </div>
  );
}
