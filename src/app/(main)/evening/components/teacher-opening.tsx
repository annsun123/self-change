"use client";

import { getOpeningContent, calculateOpeningTone } from "@/lib/evening-state-machine";
import type { EveningContext, DialoguePath } from "@/types/evening";

interface TeacherOpeningProps {
  context: EveningContext;
  onChoice: (path: DialoguePath) => void;
}

export function TeacherOpening({ context, onChoice }: TeacherOpeningProps) {
  const tone = calculateOpeningTone(context);
  const opening = getOpeningContent(tone);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-lg w-full">
        {/* Teacher avatar */}
        <div className="space-y-2">
          <div className="text-6xl mb-4">{opening.teacher === 'shen' ? '👨‍🏫' : '👩‍🏫'}</div>
          <p className="text-amber-400 font-medium text-lg">
            {opening.teacher === 'shen' ? '申先生' : '徐娘子'}
          </p>
        </div>

        {/* Opening line */}
        <div className="p-6 bg-stone-900/80 border border-stone-800 rounded-xl">
          <p className="text-lg text-stone-200 leading-relaxed whitespace-pre-wrap">
            {opening.text}
          </p>
        </div>

        {/* Choice buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => onChoice("full")}
            className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/50 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-amber-500">○</span>
              <span>多聊两句，今日有事想说。</span>
            </div>
            <p className="text-stone-500 text-sm mt-1 ml-6">约4-6分钟</p>
          </button>

          <button
            onClick={() => onChoice("quick")}
            className="w-full p-4 bg-stone-800/50 hover:bg-stone-800 border border-stone-700 hover:border-amber-600/50 rounded-lg text-left text-stone-200 hover:text-amber-200 transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="text-amber-500">○</span>
              <span>看看结果就好，明日再说。</span>
            </div>
            <p className="text-stone-500 text-sm mt-1 ml-6">15秒</p>
          </button>
        </div>
      </div>
    </div>
  );
}