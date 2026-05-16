"use client";

import { useState, useEffect, useRef } from "react";
import type { EveningContext, EveningState, ShadowRecordContext } from "@/types/evening";
import type { ShadowType } from "@/types/database";
import { selectShadowSituation } from "@/lib/evening-state-machine";

interface Round3ShadowProps {
  context: EveningContext;
  state: EveningState;
  onComplete: () => void;
  onExitEarly: () => void;
  onWangdeChange: (delta: number) => void;
  onShadowDamage: (shadowType: ShadowType, damage: number) => void;
  onShadowDiscussions: (discussions: Array<{
    shadowType: ShadowType;
    situation: 'A' | 'B' | 'C' | 'D';
    openingResponse: string;
    followUpResponses: string[];
    closingResponse: string;
  }>) => void;
}

const SHADOW_NAMES: Record<string, string> = {
  arrogance: '逆星',
  selfishness: '毒疮',
};

const FOLLOW_UP_QUESTIONS = {
  A: [
    "那一刻，你知道自己正在被它控制吗？",
    "如果让时间倒流回那一刻，你会怎么做？",
    "事后回想，你觉得是什么先引动了它？",
    "当时有人在场吗？他们看到了吗？",
    "如果徐娘子当时站在旁边，她会说什么？",
  ],
  B: [
    "那一刻，你心里是平静的，还是在用力克制？",
    "你马上就想到了这么做，还是犹豫过？",
    "有了这次的经验，下次遇到同样情况你会怎么做？",
    "你觉得今日能守住，跟读书/修心有关吗？",
    "这是你第一次做到，还是已经熟练了？",
  ],
  C: [
    "上一次崩解时，你有这个感觉吗？",
    "这一次跟上次比，有什么不一样？",
    "如果它下次回来，你认得它吗？",
  ],
};

export function Round3Shadow({
  context,
  state,
  onComplete,
  onExitEarly,
  onWangdeChange,
  onShadowDamage,
  onShadowDiscussions,
}: Round3ShadowProps) {
  const records = context.todayShadowRecords;
  const [currentRecordIndex, setCurrentRecordIndex] = useState(0);
  const [step, setStep] = useState<'situation' | 'opening' | 'followup' | 'closing' | 'done'>(
    records.length === 0 ? 'done' : 'situation'
  );
  const [currentText, setCurrentText] = useState('');
  const [teacher, setTeacher] = useState<'shen' | 'xu'>('shen');
  const [followUpCount, setFollowUpCount] = useState(0);
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<ShadowRecordContext | null>(null);
  const [allDiscussions, setAllDiscussions] = useState<Array<{
    shadowType: ShadowType;
    situation: 'A' | 'B' | 'C' | 'D';
    openingResponse: string;
    followUpResponses: string[];
    closingResponse: string;
  }>>([]);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onShadowDiscussionsRef = useRef(onShadowDiscussions);
  onShadowDiscussionsRef.current = onShadowDiscussions;

  useEffect(() => {
    if (step === 'done') {
      // Finalize and send discussion data
      const rec = selectedRecord || records[currentRecordIndex];
      const currentSituation = rec ? selectShadowSituation(rec) : 'D';
      const finalDiscussion = {
        shadowType: rec?.shadowType || 'arrogance' as ShadowType,
        situation: currentSituation as 'A' | 'B' | 'C' | 'D',
        openingResponse: userResponses[0] || '',
        followUpResponses: userResponses.slice(1, -1),
        closingResponse: userResponses[userResponses.length - 1] || '',
      };
      const updatedDiscussions = [...allDiscussions, finalDiscussion];
      setAllDiscussions(updatedDiscussions);
      onShadowDiscussionsRef.current(updatedDiscussions);
      setTimeout(() => onCompleteRef.current(), 2000);
    }
  }, [step, selectedRecord, records, currentRecordIndex, userResponses, allDiscussions]);

  // No records - show situation D (skip)
  if (records.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-lg">
          <div className="text-5xl">🖤</div>
          <div className="text-amber-400 font-medium">申先生</div>
          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">
              今日看来跟阴影没碰上面。——也好。它没来，你也省了力气。
              但别以为它走了。明日留心。
            </p>
          </div>
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

  // Multiple records - ask which to discuss first
  if (step === 'situation' && records.length > 1) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="text-5xl">👩‍🏫</div>
          <div className="text-amber-400 font-medium">徐娘子</div>
          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">
              今天跟好几位都有交手。——先从哪一个说起？
            </p>
          </div>
          <div className="space-y-3">
            {records.map((record, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedRecord(record);
                  setStep('opening');
                  setCurrentRecordIndex(index);
                }}
                className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
              >
                <span className="text-amber-500 mr-2">○</span>
                {SHADOW_NAMES[record.shadowType]}（{
                  record.selfRating === '+1' ? '触发了' :
                  record.selfRating === '-1' ? '守住了' :
                  record.selfRating === 'breakthrough' ? '崩解' : '跳过'
                }）
              </button>
            ))}
          </div>
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

  // Single record or user selected one
  const currentRecord = selectedRecord || records[currentRecordIndex];
  const situation = selectShadowSituation(currentRecord);

  // Situation D - skip
  if (situation === 'D' || currentRecord.selfRating === 'skip') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-4 max-w-lg">
          <div className="text-5xl">👨‍🏫</div>
          <div className="text-amber-400 font-medium">申先生</div>
          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">
              今日看来跟{SHADOW_NAMES[currentRecord.shadowType]}没碰上面。——也好。
              它没来，你也省了力气。但别以为它走了。明日留心。
            </p>
          </div>
          <button
            onClick={onExitEarly}
            className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
          >
            继续 →
          </button>
        </div>
      </div>
    );
  }

  // Situation A - triggered (+1)
  if (situation === 'A' || currentRecord.selfRating === '+1') {
    if (step === 'situation') {
      setTeacher('shen');
      setCurrentText(`今天记下了${SHADOW_NAMES[currentRecord.shadowType]}的事——跟我说说，当时心里在想什么？`);
      setStep('opening');
      return renderCurrentStep();
    }

    if (step === 'opening' && !userResponses.length) {
      // Show opening question
      return renderCurrentStep();
    }

    if (step === 'followup' && followUpCount < 2) {
      // Show random follow-up
      const questions = FOLLOW_UP_QUESTIONS.A;
      const q = questions[Math.floor(Math.random() * questions.length)];
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👨‍🏫</div>
            <div className="text-amber-400 font-medium">申先生</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{q}</p>
            </div>
            <FollowUpInput
              onSubmit={(answer) => {
                setUserResponses([...userResponses, answer]);
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText('明日如果再遇到同样的情况，你有什么打算吗？');
                }
              }}
              onSkip={() => {
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText('明日如果再遇到同样的情况，你有什么打算吗？');
                }
              }}
            />
            <button onClick={onExitEarly} className="text-stone-500 hover:text-stone-400 text-sm">
              今晚就到这吧
            </button>
          </div>
        </div>
      );
    }

    if (step === 'closing') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👨‍🏫</div>
            <div className="text-amber-400 font-medium">申先生</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{currentText}</p>
            </div>
            <ClosingInput
              onSubmit={() => {
                setStep('done');
                // Apply shadow damage
                onShadowDamage(currentRecord.shadowType, 1);
              }}
            />
          </div>
        </div>
      );
    }
  }

  // Situation B - held firm (-1)
  if (situation === 'B' || currentRecord.selfRating === '-1') {
    if (step === 'situation') {
      setTeacher('xu');
      setCurrentText(`今天挡住了${SHADOW_NAMES[currentRecord.shadowType]}的一击——跟我说说，怎么做到的？`);
      setStep('opening');
      return renderCurrentStep();
    }

    if (step === 'followup' && followUpCount < 2) {
      const questions = FOLLOW_UP_QUESTIONS.B;
      const q = questions[Math.floor(Math.random() * questions.length)];
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👩‍🏫</div>
            <div className="text-amber-400 font-medium">徐娘子</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{q}</p>
            </div>
            <FollowUpInput
              onSubmit={(answer) => {
                setUserResponses([...userResponses, answer]);
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText('能守住一次，就能守住第二次。记住今日的感觉。');
                }
              }}
              onSkip={() => {
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText('能守住一次，就能守住第二次。记住今日的感觉。');
                }
              }}
            />
            <button onClick={onExitEarly} className="text-stone-500 hover:text-stone-400 text-sm">
              今晚就到这吧
            </button>
          </div>
        </div>
      );
    }

    if (step === 'closing') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👨‍🏫</div>
            <div className="text-amber-400 font-medium">申先生</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{currentText}</p>
            </div>
            <button
              onClick={() => {
                setStep('done');
                onShadowDamage(currentRecord.shadowType, -1);
                onWangdeChange(1);
              }}
              className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
            >
              继续 →
            </button>
          </div>
        </div>
      );
    }
  }

  // Situation C - breakthrough
  if (situation === 'C' || currentRecord.selfRating === 'breakthrough') {
    if (step === 'situation') {
      setTeacher('xu');
      setCurrentText('恭喜你。但是——');
      setStep('opening');
      return renderCurrentStep();
    }

    if (step === 'followup' && followUpCount < 2) {
      const questions = FOLLOW_UP_QUESTIONS.C;
      const q = questions[Math.floor(Math.random() * questions.length)];
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👨‍🏫</div>
            <div className="text-amber-400 font-medium">申先生</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{q}</p>
            </div>
            <FollowUpInput
              onSubmit={(answer) => {
                setUserResponses([...userResponses, answer]);
                setFollowUpCount(followUpCount + 1);
              }}
              onSkip={() => {
                setFollowUpCount(followUpCount + 1);
              }}
            />
            <button onClick={onExitEarly} className="text-stone-500 hover:text-stone-400 text-sm">
              今晚就到这吧
            </button>
          </div>
        </div>
      );
    }

    if (step === 'closing') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👨‍🏫</div>
            <div className="text-amber-400 font-medium">申先生</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">
                它还会回来的。但你知道它长什么样了。这就是你最大的武器。
              </p>
            </div>
            <div className="p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <p className="text-stone-300">徐娘子：「而且这一次，你留下了印记。它会记得你。」</p>
            </div>
            <button
              onClick={() => {
                setStep('done');
                onShadowDamage(currentRecord.shadowType, -99); // Shatter
                onWangdeChange(3);
              }}
              className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
            >
              继续 →
            </button>
          </div>
        </div>
      );
    }
  }

  return renderCurrentStep();

  function renderCurrentStep() {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="text-5xl">{teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</div>
          <div className="text-amber-400 font-medium">
            {teacher === 'shen' ? '申先生' : '徐娘子'}
          </div>
          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">{currentText}</p>
          </div>
          <FollowUpInput
            onSubmit={(answer) => {
              setUserResponses([answer]);
              setStep('followup');
            }}
            onSkip={() => {
              setUserResponses(['（沉默）']);
              setStep('closing');
              setCurrentText(situation === 'A'
                ? '有数就好。走吧。'
                : '能守住一次，就能守住第二次。记住今日的感觉。');
            }}
          />
          <button onClick={onExitEarly} className="text-stone-500 hover:text-stone-400 text-sm">
            今晚就到这吧
          </button>
        </div>
      </div>
    );
  }
}

function FollowUpInput({ onSubmit, onSkip }: { onSubmit: (answer: string) => void; onSkip: () => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="说说你的想法..."
        className="w-full h-24 p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 resize-none focus:outline-none focus:border-amber-600"
      />
      <div className="flex gap-3">
        <button
          onClick={() => onSubmit(value)}
          className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all"
        >
          提交
        </button>
        <button
          onClick={onSkip}
          className="py-3 px-6 text-stone-500 hover:text-stone-400 border border-stone-700 rounded-lg transition-all"
        >
          不知道
        </button>
      </div>
    </div>
  );
}

function ClosingInput({ onSubmit }: { onSubmit: () => void }) {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="说说你的打算..."
        className="w-full h-24 p-4 bg-stone-900/50 border border-stone-800 rounded-lg text-stone-200 placeholder-stone-600 resize-none focus:outline-none focus:border-amber-600"
      />
      <button
        onClick={onSubmit}
        className="w-full py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
      >
        有数就好。走吧。 →
      </button>
    </div>
  );
}