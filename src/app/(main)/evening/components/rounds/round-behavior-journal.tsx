"use client";

import { useState, useEffect, useRef } from "react";

interface RoundBehaviorJournalProps {
  onComplete: () => void;
  onExitEarly: () => void;
  onEntriesSubmit: (entries: BehaviorJournalEntry[]) => void;
}

export interface BehaviorJournalEntry {
  description: string;
  response: string;
  score: number; // 1-10
  tags: string[];
  isKinglyDeed: boolean;
}

const BEHAVIOR_TAGS = [
  { value: '工作', emoji: '💼' },
  { value: '家庭', emoji: '🏠' },
  { value: '社交', emoji: '🗣️' },
  { value: '独处', emoji: '🧘' },
  { value: '健康', emoji: '💪' },
  { value: '学习', emoji: '📚' },
];

export function RoundBehaviorJournal({ onComplete, onExitEarly, onEntriesSubmit }: RoundBehaviorJournalProps) {
  const [entries, setEntries] = useState<BehaviorJournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<'opening' | 'form' | 'scoring' | 'done'>('opening');

  // Form state
  const [description, setDescription] = useState('');
  const [response, setResponse] = useState('');
  const [score, setScore] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [isKinglyDeed, setIsKinglyDeed] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onEntriesSubmitRef = useRef(onEntriesSubmit);
  onEntriesSubmitRef.current = onEntriesSubmit;

  useEffect(() => {
    if (step === 'done') {
      onEntriesSubmitRef.current(entries);
      setTimeout(() => onCompleteRef.current(), 1500);
    }
  }, [step, entries]);

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleAddEntry = () => {
    if (!description.trim()) return;

    setEntries(prev => [...prev, {
      description: description.trim(),
      response: response.trim(),
      score,
      tags,
      isKinglyDeed,
    }]);

    // Reset form
    setDescription('');
    setResponse('');
    setScore(0);
    setTags([]);
    setIsKinglyDeed(false);
    setStep('opening');
  };

  const handleAddAnother = () => {
    setDescription('');
    setResponse('');
    setScore(0);
    setTags([]);
    setIsKinglyDeed(false);
    setStep('form');
  };

  const handleDone = () => {
    setStep('done');
  };

  const handleExit = () => {
    onExitEarly();
  };

  // Opening: ask if there's anything to record
  if (step === 'opening') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-lg w-full">
          <div className="space-y-2">
            <div className="text-5xl">👩‍🏫</div>
            <p className="text-amber-400 font-medium">徐娘子</p>
          </div>

          <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
            <p className="text-lg text-stone-200 leading-relaxed">
              今天还发生了什么事？值得记下来的。
            </p>
            <p className="text-stone-500 text-sm mt-2">
              不一定是跟阴影交手。帮了谁、学了什么、做对了或做错了什么——都可以。
            </p>
          </div>

          {entries.length > 0 && (
            <div className="space-y-2">
              <p className="text-stone-400 text-sm">已记录 {entries.length} 条：</p>
              {entries.map((entry, i) => (
                <div key={i} className="p-3 bg-stone-800/30 border border-stone-700 rounded-lg text-left">
                  <p className="text-stone-300 text-sm">{entry.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.score > 0 && (
                      <span className="text-amber-400 text-xs">评分 {entry.score}/10</span>
                    )}
                    {entry.isKinglyDeed && (
                      <span className="text-amber-400 text-xs">⭐ 王德</span>
                    )}
                    {entry.tags.map(t => (
                      <span key={t} className="text-stone-500 text-xs px-1.5 py-0.5 bg-stone-800 rounded">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg text-stone-100 font-medium transition-all"
            >
              记一笔
            </button>
            <button
              onClick={handleDone}
              className="flex-1 py-3 border border-stone-700 hover:border-stone-600 rounded-lg text-stone-400 transition-all"
            >
              {entries.length > 0 ? '记完了' : '没什么特别的'}
            </button>
          </div>

          <button onClick={handleExit} className="text-stone-500 hover:text-stone-400 text-sm">
            今晚就到这吧
          </button>
        </div>
      </div>
    );
  }

  // Form step
  if (step === 'form') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-5 max-w-lg w-full">
          <p className="text-stone-400 text-sm">记下今天发生的事</p>

          {/* Description */}
          <div>
            <label className="block text-stone-300 text-sm mb-2 text-left">发生了什么事？</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例：开会时主动帮新同事解释了一个概念。"
              className="w-full h-20 p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-amber-600 text-sm"
            />
          </div>

          {/* Response */}
          <div>
            <label className="block text-stone-300 text-sm mb-2 text-left">你是怎么应对的？</label>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="例：停下来想了想，用他能理解的方式解释了一遍。"
              className="w-full h-20 p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-amber-600 text-sm"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-stone-300 text-sm mb-2 text-left">情境标签（可多选）</label>
            <div className="flex flex-wrap gap-1.5">
              {BEHAVIOR_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => toggleTag(tag.value)}
                  className={`px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                    tags.includes(tag.value)
                      ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                      : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                  }`}
                >
                  {tag.emoji} {tag.value}
                </button>
              ))}
            </div>
          </div>

          {/* Kingly Deed toggle */}
          <div className="flex items-center gap-3 justify-center">
            <button
              type="button"
              onClick={() => setIsKinglyDeed(!isKinglyDeed)}
              className={`px-4 py-2 rounded-full border text-sm transition-all ${
                isKinglyDeed
                  ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                  : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
              }`}
            >
              ⭐ {isKinglyDeed ? '这是王德之举' : '标记为王德？'}
            </button>
          </div>

          {/* Score */}
          <div>
            <label className="block text-stone-300 text-sm mb-2 text-left">
              给自己的应对打几分？
            </label>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScore(s === score ? 0 : s)}
                  className={`py-2 rounded-lg border text-center transition-all text-sm ${
                    score === s
                      ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                      : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={handleAddEntry}
            disabled={!description.trim()}
            className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 rounded-lg text-stone-100 font-medium transition-all"
          >
            记录这一条 →
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('opening')} className="flex-1 py-2 text-stone-500 hover:text-stone-400 text-sm">
              ← 返回
            </button>
            <button onClick={handleDone} className="flex-1 py-2 text-stone-500 hover:text-stone-400 text-sm">
              不记了，继续
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Done - brief transition
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="text-4xl">📝</div>
        <p className="text-stone-500">
          {entries.length > 0 ? `已记录 ${entries.length} 条。` : '今日无事可记。'}
        </p>
        <p className="text-stone-400 text-sm">继续下一轮。</p>
      </div>
    </div>
  );
}
