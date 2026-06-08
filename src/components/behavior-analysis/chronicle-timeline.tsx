"use client";

import type { ChronicleWeek } from "@/types/behavior";
import { ChronicleEntry } from "./chronicle-entry";

interface ChronicleTimelineProps {
  weeks: ChronicleWeek[];
}

export function ChronicleTimeline({ weeks }: ChronicleTimelineProps) {
  if (weeks.length === 0) {
    return (
      <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
        <h2 className="text-lg font-serif text-amber-400">📜 起居注</h2>
        <p className="text-stone-500 text-center py-12">尚无记录。每日晚间回顾后，这里会渐渐写满。</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-stone-900/50 border border-stone-800 rounded-xl space-y-4">
      <h2 className="text-lg font-serif text-amber-400 sticky top-0 z-10">📜 起居注</h2>

      <div className="space-y-6">
        {weeks.map((week) => (
          <div key={week.weekNumber}>
            {/* Week header */}
            <div className="flex items-center gap-3 mb-3 px-4">
              <div className="h-px flex-1 bg-stone-800" />
              <span className="text-stone-500 text-sm font-serif">{week.label}</span>
              <div className="h-px flex-1 bg-stone-800" />
            </div>

            {/* Week entries */}
            <div className="border border-stone-800 rounded-lg overflow-hidden">
              {week.entries.map((entry) => (
                <ChronicleEntry key={entry.id} entry={entry} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
