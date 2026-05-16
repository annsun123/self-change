"use client";

import { useState } from "react";
import type { Shadow, ShadowRecord } from "@/types/database";

interface ShadowSelfRatingCardProps {
  shadow: Shadow;
  onSubmit: (rating: '+1' | '-1' | 'skip' | 'breakthrough', behaviorRecord: string) => Promise<void>;
  onClose: () => void;
}

export function ShadowSelfRatingCard({ shadow, onSubmit, onClose }: ShadowSelfRatingCardProps) {
  const [rating, setRating] = useState<'+1' | '-1' | 'skip' | null>(null);
  const [behaviorRecord, setBehaviorRecord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shadowName = shadow.shadow_type === 'arrogance' ? '逆星' : '毒疮';
  const shadowDesc = shadow.shadow_type === 'arrogance' ? '高傲' : '自私';

  const handleSubmit = async () => {
    if (!rating) {
      setError('请选择一个选项');
      return;
    }

    // Check for breakthrough condition (HP would go to 0 with -1)
    const wouldBreakthrough = rating === '-1' && shadow.current_hp === 1;

    if (rating === '-1' && behaviorRecord.trim().length === 0) {
      setError('请描述今天的行为');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const finalRating = wouldBreakthrough ? 'breakthrough' : rating;
      await onSubmit(finalRating, behaviorRecord.trim());
    } catch (e) {
      setError('提交失败，请重试');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-700 rounded-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-serif text-amber-400">今日与{shadowName}的战斗</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-300">✕</button>
        </div>

        {/* HP Display */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-2xl">🖤</span>
          <span className="text-stone-300">{shadowName} HP：{shadow.current_hp}/{shadow.max_hp}</span>
        </div>

        {/* Rating Options */}
        <div className="space-y-3 mb-4">
          <p className="text-stone-300 text-sm">今天我是否被{shadowName}影响了？</p>

          <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
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

          <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
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

          <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
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

        {/* Behavior Record - only required for +1/-1 */}
        {rating && rating !== 'skip' && (
          <div className="mb-4">
            <label className="block text-stone-300 text-sm mb-2">
              行为记录（必填）：
            </label>
            <textarea
              value={behaviorRecord}
              onChange={(e) => setBehaviorRecord(e.target.value)}
              placeholder={`例：今天开会时不由自主地反驳了同事的方案，语气很傲慢。意识到之后，我向他说了对不起。`}
              className="w-full h-32 p-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-amber-600"
            />
          </div>
        )}

        {/* Error */}
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3">
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