import { createClient } from "@/lib/supabase/server";
import type { DayRecord, DaySummary } from "@/types/database";

/**
 * Create a new DayRecord for a given user and day number.
 */
export async function createDayRecord(
  userId: string,
  dayNumber: number,
  calendarDate: string,
  phase: string = 'awakening'
): Promise<DayRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('day_records')
    .insert({
      user_id: userId,
      day_number: dayNumber,
      calendar_date: calendarDate,
      phase,
      status: 'planning',
    })
    .select()
    .single();

  if (error) throw error;
  return mapRowToRecord(data);
}

/**
 * Fetch the latest DayRecord for a user by day_number desc.
 */
async function fetchLatestDayRecord(userId: string): Promise<DayRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .order('day_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToRecord(data) : null;
}

/**
 * Fetch a specific DayRecord by user and day number.
 */
async function getDayRecord(
  userId: string,
  dayNumber: number
): Promise<DayRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('day_records')
    .select('*')
    .eq('user_id', userId)
    .eq('day_number', dayNumber)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToRecord(data) : null;
}

/**
 * resolveDay — determines the current DayRecord on app load.
 *
 * Logic:
 * 1. No records → create Day 1 (planning)
 * 2. Latest is planning or in_progress → return it
 * 3. Latest is closing + evening not completed → restore
 * 4. Latest is closing + evening completed → create next day
 */
export async function resolveDay(userId: string): Promise<DayRecord> {
  const latestDay = await fetchLatestDayRecord(userId);

  // New user — create Day 1
  if (!latestDay) {
    const today = new Date().toISOString().split('T')[0];
    return createDayRecord(userId, 1, today);
  }

  // Active day — return it
  if (latestDay.status === 'planning' || latestDay.status === 'in_progress') {
    return latestDay;
  }

  // Closing — check if evening is completed
  if (latestDay.status === 'closing') {
    if (!latestDay.evening.completedAt) {
      // Evening in progress — restore
      return latestDay;
    }
    // Evening completed — move to next day
    const nextDay = await getDayRecord(userId, latestDay.dayNumber + 1);
    if (nextDay) return nextDay;

    const nextDate = getNextCalendarDate(latestDay.calendarDate);
    return createDayRecord(userId, latestDay.dayNumber + 1, nextDate, latestDay.phase);
  }

  return latestDay;
}

/**
 * Called when user enters evening dialogue.
 * Sets current DayRecord to closing and creates the next day's record.
 */
export async function enterEveningMode(dayRecord: DayRecord): Promise<{
  current: DayRecord;
  next: DayRecord;
}> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Set current day to closing
  const { data: current } = await supabase
    .from('day_records')
    .update({ status: 'closing', updated_at: new Date().toISOString() })
    .eq('id', dayRecord.id)
    .select()
    .single();

  if (!current) throw new Error('Failed to close day record');

  // 2. Create next day's record (planning)
  const nextCalendarDate = getNextCalendarDate(dayRecord.calendarDate);
  const { data: next } = await supabase
    .from('day_records')
    .insert({
      user_id: dayRecord.userId,
      day_number: dayRecord.dayNumber + 1,
      calendar_date: nextCalendarDate,
      phase: dayRecord.phase,
      status: 'planning',
    })
    .select()
    .single();

  if (!next) throw new Error('Failed to create next day record');

  return {
    current: mapRowToRecord(current),
    next: mapRowToRecord(next),
  };
}

/**
 * finalizeDay — apply settlement and mark evening as completed.
 */
export async function finalizeDay(
  dayN: DayRecord,
  summary: DaySummary
): Promise<DayRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('day_records')
    .update({
      evening: {
        mode: dayN.evening.mode,
        completedAt: new Date().toISOString(),
      },
      summary: summary as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dayN.id)
    .select()
    .single();

  if (error) throw error;
  return mapRowToRecord(data);
}

/**
 * Check for absences and return effects to apply.
 * Called when user returns after a gap.
 */
export async function handleAbsence(
  userId: string,
  dayRecord: DayRecord
): Promise<Array<{ type: 'shadow_hp_plus_1' } | { type: 'distance_regression'; steps: number }>> {
  const supabase = await createClient();

  // Find the last closing day with a completed evening
  const { data: lastCompleted } = await supabase
    .from('day_records')
    .select('calendar_date, evening')
    .eq('user_id', userId)
    .eq('status', 'closing')
    .order('day_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastCompleted) return [];

  const completedDate = lastCompleted.evening?.completedAt;
  if (!completedDate) return [];

  const lastActive = new Date(completedDate);
  const now = new Date();
  const daysAbsent = Math.floor(
    (now.getTime() - lastActive.getTime()) / (24 * 60 * 60 * 1000)
  );

  const effects: Array<
    { type: 'shadow_hp_plus_1' } | { type: 'distance_regression'; steps: number }
  > = [];

  // Every 3 days = shadow HP +1
  if (daysAbsent >= 3) {
    const missedThrees = Math.floor(daysAbsent / 3);
    for (let i = 0; i < missedThrees; i++) {
      effects.push({ type: 'shadow_hp_plus_1' });
    }
  }

  // Every 7 days = road retracts
  if (daysAbsent >= 7) {
    const stepsBack = Math.floor(daysAbsent / 7);
    effects.push({ type: 'distance_regression', steps: stepsBack });
  }

  return effects;
}

// ─── Helpers ───

function mapRowToRecord(row: Record<string, unknown>): DayRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    dayNumber: row.day_number as number,
    calendarDate: row.calendar_date as string,
    phase: row.phase as DayRecord['phase'],
    flag: row.flag as DayRecord['flag'],
    schedule: row.schedule as DayRecord['schedule'],
    shadowAssessments: row.shadow_assessments as DayRecord['shadowAssessments'],
    kinglyDeeds: row.kingly_deeds as DayRecord['kinglyDeeds'],
    meditation: row.meditation as DayRecord['meditation'],
    evening: row.evening as DayRecord['evening'],
    summary: row.summary as DayRecord['summary'],
    status: row.status as DayRecord['status'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function getNextCalendarDate(currentDate: string): string {
  const d = new Date(currentDate);
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}
