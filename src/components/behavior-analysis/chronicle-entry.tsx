"use client";

import { useState } from "react";
import type { ChronicleEntry as ChronicleEntryType } from "@/types/behavior";

interface ChronicleEntryProps {
  entry: ChronicleEntryType;
  showDay?: boolean;
}

export function ChronicleEntry({ entry, showDay = false }: ChronicleEntryProps) {
  const [expanded, setExpanded] = useState(false);

  const scoreMax = entry.entryType === 'lesson' ? 5 : 10;

  const scoreColor = entry.score != null
    ? entry.score >= (entry.entryType === 'lesson' ? 4 : 7) ? 'text-green-400' : entry.score >= (entry.entryType === 'lesson' ? 2 : 4) ? 'text-amber-400' : 'text-red-400'
    : 'text-stone-500';

  const entryTypeLabel = entry.entryType === 'lesson' ? '日课'
    : entry.entryType === 'shadow' ? '阴影'
    : entry.entryType === 'kingly_deed' ? '王德'
    : entry.entryType === 'meditation' ? '修心'
    : '行为';

  return (
    <div
      className={`group cursor-pointer transition-all ${
        expanded ? 'bg-stone-900/40' : 'hover:bg-stone-900/20'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800/50">
        {/* Day number badge */}
        {showDay && (
          <span className="text-stone-600 text-xs flex-shrink-0 w-10 text-right font-mono">
            D{entry.dayNumber}
          </span>
        )}

        {/* Type icon */}
        <span className="text-lg flex-shrink-0 w-8 text-center">{entry.icon}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {!showDay && (
              <span className="text-stone-500 text-xs">{entryTypeLabel}</span>
            )}
            <span className="text-stone-200 text-sm truncate">{entry.title}</span>
            {entry.score != null && (
              <span className={`text-xs font-medium ${scoreColor}`}>{entry.score}/{scoreMax}</span>
            )}
          </div>
          <p className="text-stone-500 text-xs truncate mt-0.5">{entry.description}</p>
        </div>

        {/* Tags */}
        <div className="flex gap-1 flex-shrink-0">
          {entry.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-stone-600 text-xs px-1.5 py-0.5 bg-stone-800/50 rounded">
              {tag}
            </span>
          ))}
          {entry.tags.length > 2 && (
            <span className="text-stone-600 text-xs">+{entry.tags.length - 2}</span>
          )}
        </div>

        {/* Expand indicator */}
        <span className="text-stone-600 text-xs">{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded reflection */}
      {expanded && entry.reflection && (
        <div className="px-4 py-3 pl-16 bg-stone-900/50 border-b border-stone-800/30">
          <p className="text-stone-400 text-sm leading-relaxed whitespace-pre-wrap">
            {entry.reflection}
          </p>
        </div>
      )}
    </div>
  );
}
