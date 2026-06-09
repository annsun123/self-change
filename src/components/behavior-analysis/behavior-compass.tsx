"use client";

import { useState } from "react";
import type { WeeklyCompass } from "@/types/behavior";

interface BehaviorCompassProps {
  compass: WeeklyCompass;
  previousCompass?: WeeklyCompass | null;
  previousVoided?: boolean;
}

export function BehaviorCompass({ compass, previousCompass, previousVoided }: BehaviorCompassProps) {
  const [showPrevious, setShowPrevious] = useState(false);

  const trendEmoji = compass.trendDirection === 'improving' ? '↗' : compass.trendDirection === 'declining' ? '↘' : '→';
  const trendColor = compass.trendDirection === 'improving' ? 'text-green-400' : compass.trendDirection === 'declining' ? 'text-red-400' : 'text-stone-400';

  const hasNoData = compass.totalEntries === 0;
  const isAssessmentDone = hasNoData && !!previousCompass;

  return (
    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-serif text-amber-400">
            📜 行为录
          </h2>
          <p className="text-stone-500 text-sm">
            小结 · {compass.periodLabel}
          </p>
        </div>
        <div className="text-right">
          {isAssessmentDone ? (
            <div className="space-y-1">
              <p className="text-green-400 text-sm font-medium">✅ 已完成考核</p>
              <button
                onClick={() => setShowPrevious(true)}
                className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
              >
                查看上阶段 ▼
              </button>
            </div>
          ) : (
            <>
              <span className={`text-2xl font-bold ${hasNoData ? 'text-stone-600' : trendColor}`}>{trendEmoji}</span>
              <p className="text-stone-400 text-xs">本阶段态势</p>
            </>
          )}
        </div>
      </div>

      {hasNoData ? (
        <div className="py-8 text-center">
          <p className="text-stone-500 text-sm">本阶段暂无记录</p>
          <p className="text-stone-600 text-xs mt-1">每日晚间回顾后更新</p>
        </div>
      ) : (
        <>
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
        </>
      )}

      {/* ─── Previous Period Review ─── */}
      {previousCompass && (
        <div className="pt-3 border-t border-stone-800">
          <button
            onClick={() => setShowPrevious(!showPrevious)}
            className="w-full flex items-center justify-between py-2 text-left hover:bg-stone-900/30 rounded-lg px-2 transition-colors"
          >
            <span className="text-stone-400 text-sm font-serif">
              📋 上一阶段回顾 · {previousCompass.periodLabel}
            </span>
            <span className="text-stone-600 text-xs transition-transform duration-200"
              style={{ transform: showPrevious ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
          </button>

          {showPrevious && (
            <div className="mt-2 p-4 bg-stone-900/40 border border-stone-800/50 rounded-lg space-y-3">
              {previousVoided ? (
                <p className="text-stone-500 text-sm text-center py-4">
                  上一阶段未考核，已作废
                </p>
              ) : previousCompass.totalEntries === 0 ? (
                <p className="text-stone-500 text-sm text-center py-4">
                  上一阶段无行为记录
                </p>
              ) : (
                <>
                  {/* Previous stats */}
                  <div className="flex gap-4 text-sm">
                    <div className="flex-1 p-2 bg-stone-900/80 border border-stone-800 rounded-lg text-center">
                      <p className="text-stone-500 text-xs">平均行为分</p>
                      <p className="text-amber-400 font-medium">{previousCompass.avgBehaviorScore || '-'}</p>
                    </div>
                    <div className="flex-1 p-2 bg-stone-900/80 border border-stone-800 rounded-lg text-center">
                      <p className="text-stone-500 text-xs">反思深度</p>
                      <p className="text-amber-400 font-medium">{previousCompass.totalReflectionDepth || '-'}</p>
                    </div>
                  </div>

                  {/* Previous lesson quality */}
                  {previousCompass.lessonSummaries.length > 0 && (
                    <div>
                      <h4 className="text-stone-500 text-xs mb-2">日课质量</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {previousCompass.lessonSummaries.map((lesson) => (
                          <div key={lesson.type} className="flex items-center gap-1.5 px-2 py-1 bg-stone-900/80 rounded text-xs">
                            <span>{lesson.emoji}</span>
                            <span className="text-stone-400">{lesson.label}</span>
                            <span className="text-amber-400 ml-auto">
                              {lesson.avgQuality > 0 ? lesson.avgQuality.toFixed(1) : '-'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Previous shadows */}
                  {previousCompass.shadowSummaries.length > 0 && (
                    <div>
                      <h4 className="text-stone-500 text-xs mb-2">阴影态势</h4>
                      {previousCompass.shadowSummaries.map((shadow) => (
                        <div key={shadow.shadowType} className="flex items-center justify-between px-2 py-1 bg-stone-900/80 rounded text-xs">
                          <span>{shadow.emoji} {shadow.name}</span>
                          <span className="text-stone-400">
                            触发 {shadow.triggerCount} · 守住 {shadow.resistCount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-stone-600 text-xs text-center pt-1">
                    {previousCompass.totalEntries} 条行为记录
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
