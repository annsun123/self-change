"use client";

import { useState } from "react";
import type { Shadow, ShadowRecord } from "@/types/database";
import { ChevronRight } from "lucide-react";

interface BattleLogDetailProps {
  shadow: Shadow;
  records: ShadowRecord[];
  onBack: () => void;
}

export function BattleLogDetail({ shadow, records, onBack }: BattleLogDetailProps) {
  const shadowName = shadow.shadow_type === 'arrogance' ? '逆星' : '毒疮';
  const shadowDesc = shadow.shadow_type === 'arrogance' ? '高傲' : '自私';

  // Calculate stats
  const activeDays = records.length;
  const positiveCount = records.filter(r => r.self_rating === '+1').length;
  const negativeCount = records.filter(r => r.self_rating === '-1').length;
  const breakthroughCount = records.filter(r => r.self_rating === 'breakthrough').length;

  // Recent trend (last 7 days)
  const recentRecords = records.slice(0, 7);
  const trend = recentRecords.length > 0
    ? recentRecords.filter(r => r.self_rating === '+1').length > recentRecords.filter(r => r.self_rating === '-1').length
      ? '↗' : recentRecords.filter(r => r.self_rating === '+1').length < recentRecords.filter(r => r.self_rating === '-1').length
      ? '↘' : '→'
    : '→';

  const getRatingSymbol = (rating: string) => {
    switch (rating) {
      case '+1': return <span className="text-red-400">+1</span>;
      case '-1': return <span className="text-green-400">-1</span>;
      case 'breakthrough': return <span className="text-amber-400">崩解！</span>;
      case 'skip': return <span className="text-stone-500">跳过</span>;
      default: return rating;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="p-4 border-b border-stone-800 flex items-center gap-4">
        <button onClick={onBack} className="text-stone-500 hover:text-stone-300">
          ← 返回
        </button>
        <div>
          <h1 className="text-lg font-serif text-amber-400">
            {shadowName}（{shadowDesc}）· 战斗档案
          </h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Shadow Status */}
        <div className="p-4 bg-stone-900/50 rounded-xl border border-stone-800 space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🖤</span>
            <div>
              <p className="text-stone-200">
                当前HP：{shadow.current_hp}/{shadow.max_hp}
              </p>
              <p className="text-stone-500 text-sm">
                第{shadow.current_round}轮 {!shadow.is_active ? '（休眠中）' : ''}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-stone-500">累计崩解：</span>
              <span className="text-amber-400">{shadow.shatter_count}次</span>
            </div>
            <div>
              <span className="text-stone-500">态势：</span>
              <span className="text-stone-300">{trend}</span>
            </div>
          </div>

          {/* HP Bar */}
          <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all"
              style={{ width: `${(shadow.current_hp / shadow.max_hp) * 100}%` }}
            />
          </div>
        </div>

        {/* Battle Log */}
        <div>
          <h3 className="text-sm text-stone-500 mb-3">战斗日志（倒序）</h3>
          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-stone-600 text-center py-8">暂无战斗记录</p>
            ) : (
              records.map((record, index) => (
                <div key={record.id} className="p-4 bg-stone-900/30 border border-stone-800 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-500 text-sm">{record.date}</span>
                      <span className="font-medium">{getRatingSymbol(record.self_rating)}</span>
                    </div>
                    {record.self_rating === 'breakthrough' && (
                      <span className="text-amber-400 text-xs">✨ 崩解</span>
                    )}
                  </div>

                  <p className="text-stone-300 text-sm">{record.behavior_record}</p>

                  {record.teacher_response && (
                    <div className="flex items-start gap-2 pt-2 border-t border-stone-800">
                      <span className="text-stone-500">💬</span>
                      <p className="text-stone-400 text-sm italic">先生的话：「{record.teacher_response}」</p>
                    </div>
                  )}

                  {record.reflection_detail && (
                    <div className="flex items-start gap-2 pt-2 border-t border-stone-800">
                      <span className="text-stone-500">📝</span>
                      <p className="text-stone-400 text-sm">反思详录：{record.reflection_detail}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Battle Summary */}
        {records.length > 0 && (
          <div>
            <h3 className="text-sm text-stone-500 mb-3">战斗摘要</h3>
            <div className="p-4 bg-stone-900/30 rounded-lg border border-stone-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">活跃天数：</span>
                <span className="text-stone-300">{activeDays}天</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">自评次数：</span>
                <span className="text-stone-300">{records.length}次（+{positiveCount} / -{negativeCount}）</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}