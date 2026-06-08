"use client";

import { useState } from "react";
import type { Shadow } from "@/types/database";

interface ShadowSelfRatingCardProps {
  shadow: Shadow;
  onSubmit: (
    rating: '+1' | '-1' | 'skip' | 'breakthrough',
    behaviorRecord: string,
    reflectionDepth: number | null,
    triggerTags: string[],
    behaviorScore: number | null
  ) => Promise<void>;
  onClose: () => void;
}

const TRIGGER_TAG_OPTIONS = [
  { value: '与人交谈', label: '与人交谈', emoji: '🗣️' },
  { value: '工作中', label: '工作中', emoji: '💼' },
  { value: '压力下', label: '压力下', emoji: '😰' },
  { value: '独处时', label: '独处时', emoji: '🧘' },
  { value: '家中', label: '家中', emoji: '🏠' },
  { value: '放松时', label: '放松时', emoji: '☕' },
];

const REFLECTION_DEPTH_LABELS: Record<number, string> = {
  1: '只是记了一笔',
  2: '稍微想了想',
  3: '认真想了一下',
  4: '坐下来细想了',
  5: '想了很久很久',
};

export function ShadowSelfRatingCard({ shadow, onSubmit, onClose }: ShadowSelfRatingCardProps) {
  const [rating, setRating] = useState<'+1' | '-1' | 'skip' | null>(null);
  const [behaviorRecord, setBehaviorRecord] = useState('');
  const [reflectionDepth, setReflectionDepth] = useState<number | null>(null);
  const [triggerTags, setTriggerTags] = useState<string[]>([]);
  const [behaviorScore, setBehaviorScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shadowName = shadow.shadow_type === 'arrogance' ? '逆星' : '毒疮';
  const shadowDesc = shadow.shadow_type === 'arrogance' ? '高傲' : '自私';

  const toggleTag = (tag: string) => {
    setTriggerTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!rating) {
      setError('请选择一个选项');
      return;
    }

    const wouldBreakthrough = rating === '-1' && shadow.current_hp === 1;

    if ((rating === '-1' || rating === '+1') && behaviorRecord.trim().length === 0) {
      setError('请描述今天的行为');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const finalRating = wouldBreakthrough ? 'breakthrough' : rating;
      await onSubmit(
        finalRating,
        behaviorRecord.trim(),
        reflectionDepth,
        triggerTags,
        behaviorScore
      );
      setSubmitting(false);
    } catch (e) {
      setError('提交失败，请重试');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif text-amber-400">今日与{shadowName}的战斗</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-xl">✕</button>
        </div>

        {/* HP Display */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🖤</span>
          <span className="text-stone-300">{shadowName} HP：{shadow.current_hp}/{shadow.max_hp}</span>
        </div>

        {/* Rating Options */}
        <div className="space-y-3 mb-4">
          <p className="text-stone-300 text-sm">今天我是否被{shadowName}影响了？</p>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            rating === '+1' ? 'border-amber-500 bg-amber-900/20' : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
          }`}>
            <input
              type="radio"
              name="rating"
              value="+1"
              checked={rating === '+1'}
              onChange={() => setRating('+1')}
              className="sr-only"
            />
            <span className="text-lg">○</span>
            <div className="flex-1">
              <span className="text-stone-200">是，我犯了{shadowDesc}</span>
              <span className="text-stone-500 text-xs ml-2">→ HP +1</span>
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            rating === '-1' ? 'border-amber-500 bg-amber-900/20' : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
          }`}>
            <input
              type="radio"
              name="rating"
              value="-1"
              checked={rating === '-1'}
              onChange={() => setRating('-1')}
              className="sr-only"
            />
            <span className="text-lg">○</span>
            <div className="flex-1">
              <span className="text-stone-200">否，我守住了</span>
              <span className="text-stone-500 text-xs ml-2">→ HP -1</span>
              {shadow.current_hp === 1 && (
                <span className="text-amber-400 text-xs ml-2">（将触发崩解！）</span>
              )}
            </div>
          </label>

          <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            rating === 'skip' ? 'border-amber-500 bg-amber-900/20' : 'border-stone-700 bg-stone-800/50 hover:border-stone-600'
          }`}>
            <input
              type="radio"
              name="rating"
              value="skip"
              checked={rating === 'skip'}
              onChange={() => setRating('skip')}
              className="sr-only"
            />
            <span className="text-lg">○</span>
            <span className="text-stone-200">今日无关，无变化 → 跳过</span>
          </label>
        </div>

        {/* Behavior Record */}
        {rating && (
          <>
            <div className="mb-4">
              <label className="block text-stone-300 text-sm mb-2">
                行为记录{rating === 'skip' ? '（选填）' : '（必填）'}：
              </label>
              <textarea
                value={behaviorRecord}
                onChange={(e) => setBehaviorRecord(e.target.value)}
                placeholder={
                  rating === 'skip'
                    ? '可有可无，随便记一笔今日为何无关。'
                    : `例：今天开会时不由自主地反驳了同事的方案，语气很傲慢。意识到之后，我向他说了对不起。`
                }
                className="w-full h-28 p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-amber-600 text-sm"
              />
            </div>

            {/* Reflection Depth */}
            <div className="mb-4">
              <label className="block text-stone-300 text-sm mb-2">
                这件事，你想了多久？
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((depth) => (
                  <button
                    key={depth}
                    type="button"
                    onClick={() => setReflectionDepth(depth === reflectionDepth ? null : depth)}
                    className={`flex-1 py-2 rounded-lg border text-center transition-all text-sm ${
                      reflectionDepth && depth <= reflectionDepth
                        ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                        : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    <div className="text-lg mb-0.5">
                      {reflectionDepth && depth <= reflectionDepth ? '●' : '○'}
                    </div>
                    <div className="text-xs">{depth}</div>
                  </button>
                ))}
              </div>
              {reflectionDepth && (
                <p className="text-amber-400/60 text-xs mt-1.5">
                  {REFLECTION_DEPTH_LABELS[reflectionDepth]}
                </p>
              )}
            </div>

            {/* Trigger Context Tags */}
            <div className="mb-4">
              <label className="block text-stone-300 text-sm mb-2">
                是在什么情境下发生的？（可多选）
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TRIGGER_TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.value}
                    type="button"
                    onClick={() => toggleTag(tag.value)}
                    className={`px-2.5 py-1.5 rounded-full text-xs border transition-all ${
                      triggerTags.includes(tag.value)
                        ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                        : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    {tag.emoji} {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Behavior Score */}
            <div className="mb-4">
              <label className="block text-stone-300 text-sm mb-2">
                给自己的应对打几分？
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setBehaviorScore(score === behaviorScore ? null : score)}
                    className={`py-2 rounded-lg border text-center transition-all text-sm ${
                      behaviorScore === score
                        ? 'border-amber-500 bg-amber-900/30 text-amber-300'
                        : 'border-stone-700 bg-stone-800/50 text-stone-500 hover:border-stone-600'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {behaviorScore && (
                <p className="text-amber-400/60 text-xs mt-1.5 text-right">
                  {behaviorScore <= 3 ? '诚实比分数重要。' :
                   behaviorScore <= 6 ? '还有进步的空间。' :
                   behaviorScore <= 8 ? '做得不错。' :
                   '你该为自己骄傲。'}
                </p>
              )}
            </div>
          </>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-stone-700 hover:border-stone-600 rounded-lg text-stone-400 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 rounded-lg text-stone-100 font-medium transition-all"
          >
            {submitting ? '提交中...' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
}
