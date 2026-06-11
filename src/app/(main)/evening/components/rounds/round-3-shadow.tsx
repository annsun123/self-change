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

// 逆星 (arrogance) specific follow-up questions
const ARROGANCE_FOLLOWUPS = {
  A: [
    "那一刻，你觉得自己比别人高明吗？",
    "如果你当时站在听你说话的人的角度，你听到的是什么？",
    "事后回想，是什么先让你有了'我是对的'这个念头？",
    "当时有人反驳你吗？你听了多少？",
    "如果申先生坐在旁边，他会用什么样的眼神看你？",
  ],
  B: [
    "你是怎样把到嘴边的那句话咽下去的？",
    "咽下去之后，心里是难过还是释然？",
    "有了这次的经验，下次遇到同样情况你会怎么做？",
    "你觉得今日能低头，跟读书/修心有关吗？",
    "这是你第一次放低姿态，还是已经熟练了？",
  ],
};

// 毒疮 (selfishness) specific follow-up questions
const SELFISHNESS_FOLLOWUPS = {
  A: [
    "那一刻，你是没注意到对方的需要，还是注意到了却不想管？",
    "你有没有想过对方当时的感受？",
    "事后回想，是什么让你选择了'先管好自己'？",
    "如果徐娘子恰好看到了，她会怎么说？",
    "你觉得对方察觉到你的冷漠了吗？",
  ],
  B: [
    "你是怎么从'不想管'跨到'我帮一下'的？",
    "帮完之后，心里是什么感觉？",
    "下次再有同类的事，你觉得会更容易还是更难？",
    "今日这份体贴，是天生的还是练出来的？",
    "你觉得自己变了吗？哪怕一点点？",
  ],
};

// Shared breakthrough questions (used for both shadows)
const BREAKTHROUGH_FOLLOWUPS = [
  "上一次崩解时，你有这个感觉吗？",
  "这一次跟上次比，有什么不一样？",
  "如果它下次回来，你认得它吗？",
];

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
  const askedIndicesRef = useRef<Set<number>>(new Set());
  // Track which records have been fully discussed (for multi-record iteration)
  const discussedIndicesRef = useRef<Set<number>>(new Set());
  const [situationCOpeningPhase, setSituationCOpeningPhase] = useState(0);
  const [closingVariant, setClosingVariant] = useState<'shen' | 'xu'>(
    Math.random() > 0.5 ? 'shen' : 'xu'
  );

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onShadowDiscussionsRef = useRef(onShadowDiscussions);
  onShadowDiscussionsRef.current = onShadowDiscussions;
  const doneRef = useRef(false);
  const allDiscussionsRef = useRef<Array<{
    shadowType: ShadowType;
    situation: 'A' | 'B' | 'C' | 'D';
    openingResponse: string;
    followUpResponses: string[];
    closingResponse: string;
  }>>([]);

  useEffect(() => {
    if (step === 'done' && !doneRef.current) {
      doneRef.current = true;

      // Accumulate the current discussion
      const rec = selectedRecord || records[currentRecordIndex];
      const currentSituation = rec ? selectShadowSituation(rec) : 'D';
      const finalDiscussion = {
        shadowType: rec?.shadowType || 'arrogance' as ShadowType,
        situation: currentSituation as 'A' | 'B' | 'C' | 'D',
        openingResponse: userResponses[0] || '',
        followUpResponses: userResponses.slice(1, -1),
        closingResponse: userResponses[userResponses.length - 1] || '',
      };
      const updatedDiscussions = [...allDiscussionsRef.current, finalDiscussion];
      allDiscussionsRef.current = updatedDiscussions;
      setAllDiscussions(updatedDiscussions);
      onShadowDiscussionsRef.current(updatedDiscussions);

      // Mark this record as discussed
      const idx = selectedRecord
        ? records.findIndex(r => r === selectedRecord)
        : currentRecordIndex;
      if (idx >= 0) discussedIndicesRef.current.add(idx);

      // Check if there are remaining undiscussed records
      const remaining = records.filter(
        (_, i) => !discussedIndicesRef.current.has(i)
      );

      if (remaining.length > 0) {
        // More records to discuss — brief pause then return to selection
        setTimeout(() => {
          doneRef.current = false;
          askedIndicesRef.current = new Set();
          setUserResponses([]);
          setFollowUpCount(0);
          setSelectedRecord(null);
          setSituationCOpeningPhase(0);
          setClosingVariant(Math.random() > 0.5 ? 'shen' : 'xu');
          setStep('situation');
        }, 1500);
      } else {
        // All records discussed — proceed to next phase
        setTimeout(() => onCompleteRef.current(), 2000);
      }
    }
  }, [step, selectedRecord, records, currentRecordIndex, userResponses]);

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

  // Compute undiscussed records (ones not yet discussed in this session)
  const undiscussedRecords = records.filter(
    (_, i) => !discussedIndicesRef.current.has(i)
  );

  // Multiple undiscussed records — ask which to discuss first
  if (step === 'situation' && undiscussedRecords.length > 1) {
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
            {undiscussedRecords.map((record) => (
              <button
                key={record.shadowType}
                onClick={() => {
                  doneRef.current = false;
                  askedIndicesRef.current = new Set();
                  const originalIndex = records.indexOf(record);
                  setSelectedRecord(record);
                  setCurrentRecordIndex(originalIndex);
                  setStep('opening');
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

  // Exactly one undiscussed record — auto-select and proceed
  if (step === 'situation' && undiscussedRecords.length === 1) {
    const next = undiscussedRecords[0];
    const nextIdx = records.indexOf(next);
    // Auto-advance via effect to avoid setState during render
    setTimeout(() => {
      doneRef.current = false;
      askedIndicesRef.current = new Set();
      setSelectedRecord(next);
      setCurrentRecordIndex(nextIdx);
      setStep('opening');
    }, 0);
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-stone-500 animate-pulse">...</div>
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
      askedIndicesRef.current = new Set();
      doneRef.current = false;
      setTeacher('shen');
      setCurrentText(
          currentRecord.shadowType === 'arrogance'
            ? `今天记下了逆星的事——跟我说说，当时那股"我对，别人错"的感觉，是从哪来的？`
            : `今天记下了毒疮的事——跟我说说，当时那个"先顾自己"的念头，是哪个瞬间冒出来的？`
        );
      setStep('opening');
      return renderCurrentStep();
    }

    if (step === 'opening' && !userResponses.length) {
      // Show opening question
      return renderCurrentStep();
    }

    if (step === 'followup' && followUpCount < 2) {
      // Show random follow-up (no repeats)
      const pool = currentRecord.shadowType === 'arrogance'
        ? ARROGANCE_FOLLOWUPS.A
        : SELFISHNESS_FOLLOWUPS.A;
      const allQuestions = pool;
      const available = allQuestions
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => !askedIndicesRef.current.has(i));
      const pick = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : { q: allQuestions[Math.floor(Math.random() * allQuestions.length)], i: -1 };
      if (pick.i >= 0) askedIndicesRef.current.add(pick.i);
      const q = pick.q;
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
      askedIndicesRef.current = new Set();
      doneRef.current = false;
      setClosingVariant(Math.random() > 0.5 ? 'shen' : 'xu');
      setTeacher('xu');
      setCurrentText(
          currentRecord.shadowType === 'arrogance'
            ? `今天挡住了逆星的一击——跟我说说，你是怎么样在张口之前，先停了一下？`
            : `今天挡住了毒疮的一击——跟我说说，你是怎么从"与我何干"跨到了"我可以帮一下"的？`
        );
      setStep('opening');
      return renderCurrentStep();
    }

    if (step === 'followup' && followUpCount < 2) {
      const poolB = currentRecord.shadowType === 'arrogance'
        ? ARROGANCE_FOLLOWUPS.B
        : SELFISHNESS_FOLLOWUPS.B;
      const allQuestionsB = poolB;
      const availableB = allQuestionsB
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => !askedIndicesRef.current.has(i));
      const pickB = availableB.length > 0
        ? availableB[Math.floor(Math.random() * availableB.length)]
        : { q: allQuestionsB[Math.floor(Math.random() * allQuestionsB.length)], i: -1 };
      if (pickB.i >= 0) askedIndicesRef.current.add(pickB.i);
      const qB = pickB.q;
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👩‍🏫</div>
            <div className="text-amber-400 font-medium">徐娘子</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">{qB}</p>
            </div>
            <FollowUpInput
              onSubmit={(answer) => {
                setUserResponses([...userResponses, answer]);
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText(
                    closingVariant === 'shen'
                      ? '能守住一次，就能守住第二次。记住今日的感觉。'
                      : '下次它再来，你觉得你还能守住吗？'
                  );
                }
              }}
              onSkip={() => {
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
                  setCurrentText(
                    closingVariant === 'shen'
                      ? '能守住一次，就能守住第二次。记住今日的感觉。'
                      : '下次它再来，你觉得你还能守住吗？'
                  );
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
      if (closingVariant === 'xu') {
        return (
          <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-6 max-w-lg w-full">
              <div className="text-5xl">👩‍🏫</div>
              <div className="text-amber-400 font-medium">徐娘子</div>
              <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
                <p className="text-lg text-stone-200 leading-relaxed">{currentText}</p>
              </div>
              <FollowUpInput
                onSubmit={() => {
                  setStep('done');
                  onShadowDamage(currentRecord.shadowType, -1);
                  onWangdeChange(1);
                }}
                onSkip={() => {
                  setStep('done');
                  onShadowDamage(currentRecord.shadowType, -1);
                  onWangdeChange(1);
                }}
              />
            </div>
          </div>
        );
      }
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
      askedIndicesRef.current = new Set();
      doneRef.current = false;
      setSituationCOpeningPhase(0);
      setTeacher('xu');
      setCurrentText('恭喜你。但是——');
      setStep('opening');
      return renderSituationCOpening(0);
    }

    if (step === 'opening') {
      if (situationCOpeningPhase === 0) {
        // Phase 0: 徐娘子's half-sentence, then auto-advance to 申先生
        return renderSituationCOpening(0);
      }
      // Phase 1: 申先生 completes the thought, collect user response
      return renderSituationCOpening(1);
    }

    if (step === 'followup' && followUpCount < 2) {
      const allQuestions = BREAKTHROUGH_FOLLOWUPS;
      const available = allQuestions
        .map((q, i) => ({ q, i }))
        .filter(({ i }) => !askedIndicesRef.current.has(i));
      const pick = available.length > 0
        ? available[Math.floor(Math.random() * available.length)]
        : { q: allQuestions[Math.floor(Math.random() * allQuestions.length)], i: -1 };
      if (pick.i >= 0) askedIndicesRef.current.add(pick.i);
      const q = pick.q;
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
                }
              }}
              onSkip={() => {
                setFollowUpCount(followUpCount + 1);
                if (followUpCount + 1 >= 2) {
                  setStep('closing');
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

  function renderSituationCOpening(phase: number) {
    if (phase === 0) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-lg w-full">
            <div className="text-5xl">👩‍🏫</div>
            <div className="text-amber-400 font-medium">徐娘子</div>
            <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
              <p className="text-lg text-stone-200 leading-relaxed">恭喜你。但是——</p>
            </div>
            <button
              onClick={() => {
                setSituationCOpeningPhase(1);
                setTeacher('shen');
                setCurrentText('——你觉得它真的离开了吗？');
              }}
              className="mt-4 px-8 py-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 rounded-lg text-amber-400 transition-all"
            >
              继续 →
            </button>
          </div>
        </div>
      );
    }
    // Phase 1: 申先生 completes the thought
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="text-5xl">👨‍🏫</div>
          <div className="text-amber-400 font-medium">申先生</div>
          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">——你觉得它真的离开了吗？</p>
          </div>
          <FollowUpInput
            onSubmit={(answer) => {
              setUserResponses([answer]);
              setStep('followup');
            }}
            onSkip={() => {
              setUserResponses(['（沉默）']);
              setStep('closing');
            }}
          />
          <button onClick={onExitEarly} className="text-stone-500 hover:text-stone-400 text-sm">
            今晚就到这吧
          </button>
        </div>
      </div>
    );
  }

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