"use client";

import { useState, useEffect } from "react";
import type { ChronicleWeek } from "@/types/behavior";
import { ChronicleEntry } from "./chronicle-entry";

interface ChronicleTimelineProps {
  weeks: ChronicleWeek[];
}

export function ChronicleTimeline({ weeks }: ChronicleTimelineProps) {
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Sync selectedWeekIndex when weeks data loads or changes
  useEffect(() => {
    if (weeks.length > 0) {
      setSelectedWeekIndex(weeks.length - 1);
    }
  }, [weeks]);

  if (weeks.length === 0) {
    return (
      <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
        <h2 className="text-lg font-serif text-amber-400">📜 起居注</h2>
        <p className="text-stone-500 text-center py-12">尚无记录。每日晚间回顾后，这里会渐渐写满。</p>
      </div>
    );
  }

  // Guard: ensure selectedWeekIndex is valid
  const safeIndex = Math.min(Math.max(0, selectedWeekIndex), weeks.length - 1);
  const selectedWeek = weeks[safeIndex];
  const categoryGroups = selectedWeek?.categoryGroups || [];

  const toggleCategory = (key: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
      <h2 className="text-lg font-serif text-amber-400">📜 起居注</h2>

      {/* Week Selector — horizontal scrollable */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1
        [&::-webkit-scrollbar]:hidden
        [-ms-overflow-style:'none']
        [scrollbar-width:'none']">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, i) => (
            <button
              key={week.weekNumber}
              onClick={() => setSelectedWeekIndex(i)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-md text-sm transition-all ${
                i === safeIndex
                  ? "bg-amber-600/20 text-amber-400 border border-amber-600/40"
                  : "bg-stone-800 text-stone-500 hover:text-stone-300 border border-stone-700"
              }`}
            >
              {week.label}
            </button>
          ))}
        </div>
      </div>

      {/* Week header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-stone-800" />
        <span className="text-stone-500 text-sm font-serif">
          {selectedWeek?.label} · {selectedWeek?.entries.length || 0} 条记录
        </span>
        <div className="h-px flex-1 bg-stone-800" />
      </div>

      {/* Category Groups */}
      {categoryGroups.length === 0 ? (
        <p className="text-stone-500 text-center py-8 text-sm">本周暂无记录</p>
      ) : (
        <div className="space-y-2">
          {categoryGroups.map((group) => {
            const isExpanded = expandedCategories.has(group.categoryKey);
            const scoreMax = group.categoryKey.startsWith("lesson") ? 5 : 10;

            return (
              <div
                key={group.categoryKey}
                className="border border-stone-800 rounded-lg overflow-hidden"
              >
                {/* Category Header — clickable */}
                <button
                  onClick={() => toggleCategory(group.categoryKey)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-stone-900/80 hover:bg-stone-900/60 transition-colors text-left"
                >
                  <span className="text-lg flex-shrink-0">{group.icon}</span>

                  <div className="flex-1 min-w-0">
                    <span className="text-stone-200 text-sm font-medium">
                      {group.label}
                    </span>
                    <span className="text-stone-600 text-xs ml-2">
                      {group.entries.length} 条
                    </span>
                  </div>

                  {group.avgScore != null && (
                    <span className="text-amber-400 text-xs font-medium flex-shrink-0 mr-2">
                      {group.avgScore}/{scoreMax}
                    </span>
                  )}

                  <span className="text-stone-600 text-xs flex-shrink-0 transition-transform duration-200"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                  >
                    ▼
                  </span>
                </button>

                {/* Expanded entries */}
                {isExpanded && (
                  <div className="border-t border-stone-800">
                    {group.entries.map((entry) => (
                      <ChronicleEntry key={entry.id} entry={entry} showDay />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom hint */}
      {weeks.length > 0 && (
        <p className="text-stone-600 text-xs text-center pt-2">
          点击类目查看记录 · 每日晚间回顾后更新
        </p>
      )}
    </div>
  );
}
