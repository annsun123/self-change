"use client";

import type { WeeklyCompass } from "@/types/behavior";

interface BehaviorCompassProps {
  compass: WeeklyCompass;
}

export function BehaviorCompass({ compass }: BehaviorCompassProps) {
  const trendEmoji = compass.trendDirection === 'improving' ? '↗' : compass.trendDirection === 'declining' ? '↘' : '→';
  const trendColor = compass.trendDirection === 'improving' ? 'text-green-400' : compass.trendDirection === 'declining' ? 'text-red-400' : 'text-stone-400';

  return (
    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-amber-400">
            📜 行为录
          </h2>
          <p className="text-stone-500 text-sm">
            第 {compass.dayInJourney} 天 · {compass.phaseName}
          </p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${trendColor}`}>{trendEmoji}</span>
          <p className="text-stone-400 text-xs">本周态势</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 text-sm">
        <div className="flex-1 p-3 bg-stone-900/80 border border-stone-800 rounded-lg text-center">
          <p className="text-stone-500 text-xs">平均行为分</p>
          <p className="text-amber-400 text-xl font-medium">{compass.avgBehaviorScore || '-'}</p>
        </div>
        <div className="flex-1 p-3 bg-stone-900/80 border border-stone-800 rounded-lg text-center">
          <p className="text-stone-500 text-xs">反思深度</p>
          <p className="text-amber-400 text-xl font-medium">{compass.totalReflectionDepth || '-'}</p>
        </div>
      </div>

      {/* Lesson Quality Grid */}
      {compass.lessonSummaries.length > 0 && (
        <div>
          <h3 className="text-stone-400 text-xs mb-3 uppercase tracking-wider">日课质量</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {compass.lessonSummaries.map((lesson) => (
              <div
                key={lesson.type}
                className="p-3 bg-stone-900/80 border border-stone-800 rounded-lg"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{lesson.emoji}</span>
                  <span className="text-stone-300 text-sm">{lesson.label}</span>
                </div>
                <div className="flex items-center gap-1 mb-1.5">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <span
                      key={q}
                      className={`text-xs ${
                        lesson.avgQuality >= q ? 'text-amber-400' : 'text-stone-700'
                      }`}
                    >
                      {lesson.avgQuality >= q ? '●' : '○'}
                    </span>
                  ))}
                  <span className="text-stone-500 text-xs ml-1">
                    {lesson.avgQuality > 0 ? lesson.avgQuality.toFixed(1) : '-'}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {lesson.completedDays.map((done, i) => (
                    <span
                      key={i}
                      className={`text-xs ${done ? 'text-green-500' : 'text-stone-700'}`}
                      title={done ? '完成' : '未完成'}
                    >
                      {done ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
                {lesson.trend !== 'stable' && (
                  <span className={`text-xs ${lesson.trend === 'up' ? 'text-green-500' : 'text-red-400'}`}>
                    {lesson.trend === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shadow Summaries */}
      {compass.shadowSummaries.length > 0 && (
        <div>
          <h3 className="text-stone-400 text-xs mb-3 uppercase tracking-wider">阴影态势</h3>
          <div className="space-y-2">
            {compass.shadowSummaries.map((shadow) => (
              <div
                key={shadow.shadowType}
                className="flex items-center justify-between p-3 bg-stone-900/80 border border-stone-800 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span>{shadow.emoji}</span>
                  <span className="text-stone-300 text-sm">{shadow.name}</span>
                  <span className={`text-xs ${shadow.trend === 'down' ? 'text-green-400' : shadow.trend === 'up' ? 'text-red-400' : 'text-stone-500'}`}>
                    {shadow.trend === 'down' ? '↓' : shadow.trend === 'up' ? '↑' : '→'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-red-400">触发 {shadow.triggerCount}次</span>
                  <span className="text-green-400">守住 {shadow.resistCount}次</span>
                  <span className="text-stone-400">
                    HP {shadow.currentHp}/{shadow.maxHp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Commentary */}
      {(compass.teacherCommentary.shenComment || compass.teacherCommentary.xuComment) && (
        <div className="space-y-2 pt-2 border-t border-stone-800">
          {compass.teacherCommentary.shenComment && (
            <div className="flex items-start gap-2">
              <span className="text-sm">👨‍🏫</span>
              <p className="text-stone-400 text-sm italic">
                —— 申先生：「{compass.teacherCommentary.shenComment}」
              </p>
            </div>
          )}
          {compass.teacherCommentary.xuComment && (
            <div className="flex items-start gap-2">
              <span className="text-sm">👩‍🏫</span>
              <p className="text-stone-400 text-sm italic">
                —— 徐娘子：「{compass.teacherCommentary.xuComment}」
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
