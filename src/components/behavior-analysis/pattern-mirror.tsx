"use client";

import type { PatternInsights } from "@/types/behavior";

interface PatternMirrorProps {
  patterns: PatternInsights;
}

export function PatternMirror({ patterns }: PatternMirrorProps) {
  const { reflectionCorrelation, triggerContexts, lessonShadowCorrelations, teacherCommentary } = patterns;

  const hasAnyData =
    reflectionCorrelation.deepReflectionRate > 0 ||
    triggerContexts.some((tc) => tc.contexts.length > 0) ||
    lessonShadowCorrelations.some((c) => c.insight != null);

  if (!hasAnyData) {
    return (
      <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
        <h2 className="text-lg font-serif text-amber-400">🪞 明镜</h2>
        <p className="text-stone-500 text-center py-12">
          数据还不够。多记录几天后，这里会浮现出你的行为模式。
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-5">
      <h2 className="text-lg font-serif text-amber-400">🪞 明镜 · 模式与洞察</h2>

      {/* Reflection Correlation */}
      {reflectionCorrelation.deepReflectionRate > 0 && (
        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-lg space-y-3">
          <h3 className="text-stone-300 text-sm">反思深度 vs 行为改善</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-stone-900/50 rounded">
              <p className="text-stone-500 text-xs mb-1">深度反思(4-5)的日子</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">阴影守住率</span>
                  <span className="text-green-400">{Math.round(reflectionCorrelation.deepReflectionSuccessRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">平均行为分</span>
                  <span className="text-amber-400">{reflectionCorrelation.deepReflectionAvgScore}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-stone-900/50 rounded">
              <p className="text-stone-500 text-xs mb-1">浅层反思(1-2)的日子</p>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-400">阴影守住率</span>
                  <span className="text-red-400">{Math.round(reflectionCorrelation.shallowReflectionSuccessRate * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-400">平均行为分</span>
                  <span className="text-amber-400">{reflectionCorrelation.shallowReflectionAvgScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lesson-Shadow Correlations */}
      {lessonShadowCorrelations.some((c) => c.insight != null) && (
        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-lg space-y-3">
          <h3 className="text-stone-300 text-sm">功课质量 vs 阴影活跃度</h3>
          <div className="space-y-2">
            {lessonShadowCorrelations
              .filter((c) => c.insight != null)
              .map((corr) => (
                <div key={corr.lessonType} className="flex items-center gap-2 text-sm">
                  <span>{corr.emoji}</span>
                  <span className="text-stone-400">
                    &ldquo;{corr.insight}&rdquo;
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Trigger Context Distribution */}
      {triggerContexts.some((tc) => tc.contexts.length > 0) && (
        <div className="p-4 bg-stone-900/80 border border-stone-800 rounded-lg space-y-3">
          <h3 className="text-stone-300 text-sm">触发情境分布</h3>
          {triggerContexts.map((tc) => (
            <div key={tc.shadowType} className="space-y-2">
              <p className="text-stone-400 text-xs">{tc.name} 触发场景：</p>
              <div className="space-y-1.5">
                {tc.contexts.slice(0, 5).map((ctx) => (
                  <div key={ctx.tag} className="flex items-center gap-2">
                    <span className="text-stone-500 text-xs w-12">{ctx.tag}</span>
                    <div className="flex-1 h-3 bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-600/60 rounded-full transition-all"
                        style={{ width: `${ctx.percentage}%` }}
                      />
                    </div>
                    <span className="text-stone-500 text-xs w-10 text-right">{ctx.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher Commentary */}
      {(teacherCommentary.shenComment || teacherCommentary.xuComment) && (
        <div className="space-y-2 pt-2 border-t border-stone-800">
          {teacherCommentary.shenComment && (
            <div className="flex items-start gap-2">
              <span className="text-sm">👨‍🏫</span>
              <p className="text-stone-400 text-sm italic">
                —— 申先生：「{teacherCommentary.shenComment}」
              </p>
            </div>
          )}
          {teacherCommentary.xuComment && (
            <div className="flex items-start gap-2">
              <span className="text-sm">👩‍🏫</span>
              <p className="text-stone-400 text-sm italic">
                —— 徐娘子：「{teacherCommentary.xuComment}」
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
