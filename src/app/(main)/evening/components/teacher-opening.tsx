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

  const sceneDescription = tone === 'positive'
    ? '烛火暖黄。先生抬眼看向你，目光中是难得的温和。'
    : tone === 'negative'
    ? '烛火昏暗。茅屋里很静，只有风声。先生等了一会儿才开口。'
    : '烛火摇曳中，先生抬眼看向你。';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-8 max-w-lg w-full">
        {/* Scene description */}
        <p className="text-stone-500 text-sm italic">{sceneDescription}</p>
        {/* Teacher avatar */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <img
              src={opening.teacher === 'shen' ? '/images/characters/shen-xiansheng.png' : '/images/characters/xu-niangzi.png'}
              alt={opening.teacher === 'shen' ? '申先生' : '徐娘子'}
              className="w-32 h-32 object-cover rounded-full border-2 border-amber-600/30 shadow-lg shadow-amber-900/20"
            />
          </div>
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