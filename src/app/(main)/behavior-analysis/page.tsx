"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DayRecord, ShadowRecord, BehaviorEntry, ShadowType } from "@/types/database";
import type { WeeklyCompass, ChronicleWeek, PatternInsights } from "@/types/behavior";
import {
  computeWeeklyCompass,
  computeChronicleEntries,
  computePatternInsights,
} from "@/lib/behavior-analytics";
import { BehaviorCompass } from "@/components/behavior-analysis/behavior-compass";
import { ChronicleTimeline } from "@/components/behavior-analysis/chronicle-timeline";
import { PatternMirror } from "@/components/behavior-analysis/pattern-mirror";

type Tab = 'compass' | 'chronicle' | 'mirror';

export default function BehaviorAnalysisPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('compass');

  // Computed data
  const [compass, setCompass] = useState<WeeklyCompass | null>(null);
  const [previousCompass, setPreviousCompass] = useState<WeeklyCompass | null>(null);
  const [previousVoided, setPreviousVoided] = useState(false);
  const [chronicle, setChronicle] = useState<ChronicleWeek[]>([]);
  const [patterns, setPatterns] = useState<PatternInsights | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Load profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

      // Load day records (last 30 days)
      const { data: dayRecords, error: dayError } = await supabase
        .from('day_records')
        .select('*')
        .eq('user_id', user.id)
        .order('day_number', { ascending: true })
        .limit(30);

      if (dayError) console.error('day_records load error:', dayError);

      // Load shadow records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: shadowRecords, error: shadowError } = await supabase
        .from('shadow_records')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (shadowError) console.error('shadow_records load error:', shadowError);

      // Load behavior entries (last 30 days) — table may not exist yet
      let behaviorEntries: BehaviorEntry[] = [];
      try {
        const { data: beData, error: beError } = await supabase
          .from('behavior_entries')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
          .order('date', { ascending: false });

        if (beError) {
          console.error('behavior_entries load error:', beError);
        } else {
          behaviorEntries = (beData || []) as BehaviorEntry[];
        }
      } catch (e) {
        console.error('behavior_entries table may not exist:', e);
      }

      // Load active shadows
      const { data: shadows } = await supabase
        .from('shadows')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const parsedDayRecords = (dayRecords || []).map(mapDayRecord);
      const parsedShadowRecords = (shadowRecords || []) as ShadowRecord[];
      const parsedBehaviorEntries = behaviorEntries;
      const activeShadows = (shadows || []).map((s: Record<string, unknown>) => ({
        shadowType: s.shadow_type as ShadowType,
        currentHp: s.current_hp as number,
        maxHp: s.max_hp as number,
      }));

      // Compute analytics

      // Determine assessment periods
      const today = new Date().toISOString().split('T')[0];
      const profileData = profile as Record<string, unknown> | null;
      const lastAssessment = (profileData?.last_assessment_date as string) || undefined;

      // Current period: since last assessment → today
      const currentSince = lastAssessment || thirtyDaysAgo.toISOString().split('T')[0];
      const currentUntil = today;

      const compassData = computeWeeklyCompass(
        parsedDayRecords,
        parsedShadowRecords,
        parsedBehaviorEntries,
        profile?.current_phase || 'awakening',
        profile?.day_in_journey || 1,
        activeShadows,
        { since: currentSince, until: currentUntil }
      );

      // Previous period: the assessment period before the last assessment
      let prevCompassData: WeeklyCompass | null = null;
      let isPrevVoided = false;

      if (lastAssessment) {
        const prevUntil = lastAssessment;
        const prevDate = new Date(lastAssessment);
        const prevDay = prevDate.getDay();

        // Days back to previous assessment day
        let daysBack = 0;
        if (prevDay === 2) daysBack = 3;       // Tue → last Sat
        else if (prevDay === 6) daysBack = 4;  // Sat → last Tue

        if (daysBack > 0) {
          prevDate.setDate(prevDate.getDate() - daysBack);
          const prevSince = prevDate.toISOString().split('T')[0];

          prevCompassData = computeWeeklyCompass(
            parsedDayRecords,
            parsedShadowRecords,
            parsedBehaviorEntries,
            profile?.current_phase || 'awakening',
            profile?.day_in_journey || 1,
            activeShadows,
            { since: prevSince, until: prevUntil }
          );

          // Voided if no entries in the previous period
          isPrevVoided = prevCompassData.totalEntries === 0;
        }
      }

      const chronicleData = computeChronicleEntries(
        parsedDayRecords,
        parsedShadowRecords,
        parsedBehaviorEntries
      );

      const patternData = computePatternInsights(
        parsedDayRecords,
        parsedShadowRecords,
        parsedBehaviorEntries,
        activeShadows
      );

      setCompass(compassData);
      setPreviousCompass(prevCompassData);
      setPreviousVoided(isPrevVoided);
      setChronicle(chronicleData);
      setPatterns(patternData);
      } catch (e) {
        console.error('Behavior analysis load error:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-amber-400 animate-pulse">翻阅起居注中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-20 p-4 border-b border-stone-800 bg-stone-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/scroll-map')}
              className="text-stone-500 hover:text-stone-300 text-sm"
            >
              ← 返回
            </button>
            <h1 className="text-xl font-serif text-amber-400">📜 宫廷实录</h1>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mt-3 bg-stone-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('compass')}
            className={`flex-1 py-2 rounded-md text-sm transition-all ${
              activeTab === 'compass'
                ? 'bg-stone-800 text-amber-400'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            🧭 总览
          </button>
          <button
            onClick={() => setActiveTab('chronicle')}
            className={`flex-1 py-2 rounded-md text-sm transition-all ${
              activeTab === 'chronicle'
                ? 'bg-stone-800 text-amber-400'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            📜 起居注
          </button>
          <button
            onClick={() => setActiveTab('mirror')}
            className={`flex-1 py-2 rounded-md text-sm transition-all ${
              activeTab === 'mirror'
                ? 'bg-stone-800 text-amber-400'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            🪞 明镜
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6 pb-20">
        {activeTab === 'compass' && compass && (
          <BehaviorCompass
            compass={compass}
            previousCompass={previousCompass}
            previousVoided={previousVoided}
          />
        )}

        {activeTab === 'chronicle' && (
          <ChronicleTimeline weeks={chronicle} />
        )}

        {activeTab === 'mirror' && patterns && (
          <PatternMirror patterns={patterns} />
        )}
      </main>

      {/* Bottom navigation hint */}
      <div className="fixed bottom-4 left-4 right-4 text-center">
        <p className="text-stone-600 text-xs">
          每日晚间回顾后，起居注会更新。
        </p>
      </div>
    </div>
  );
}

// Map DB row to DayRecord
function mapDayRecord(row: Record<string, unknown>): DayRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    dayNumber: row.day_number as number,
    calendarDate: row.calendar_date as string,
    phase: row.phase as DayRecord['phase'],
    flag: row.flag as DayRecord['flag'] || { text: '', associatedShadowIds: [], reward: '', status: 'unmarked', source: null, confirmedAt: null },
    schedule: row.schedule as DayRecord['schedule'] || [],
    shadowAssessments: row.shadow_assessments as DayRecord['shadowAssessments'] || [],
    kinglyDeeds: row.kingly_deeds as DayRecord['kinglyDeeds'] || [],
    meditation: row.meditation as DayRecord['meditation'] || null,
    evening: row.evening as DayRecord['evening'] || { mode: null, completedAt: null },
    summary: row.summary as DayRecord['summary'] || null,
    status: row.status as DayRecord['status'] || 'planning',
    createdAt: row.created_at as string || '',
    updatedAt: row.updated_at as string || '',
  };
}
