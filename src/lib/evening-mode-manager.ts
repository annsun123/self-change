export type EveningMode = 'A' | 'B' | 'C';

const PERFUNCTORY_KEY = 'evening_perfunctory_count';
const PERFUNCTORY_DATE_KEY = 'evening_perfunctory_date';

export function getEveningMode(): EveningMode {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 6=Sat

  // Weekend → Mode C
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'C';
  }

  // Check perfunctory history
  const perfunctoryCount = getPerfunctoryCount();
  if (perfunctoryCount >= 3) {
    return 'B';
  }

  // Default → Mode A
  return 'A';
}

export function getPerfunctoryCount(): number {
  if (typeof window === 'undefined') return 0;

  const storedDate = localStorage.getItem(PERFUNCTORY_DATE_KEY);
  const today = new Date().toISOString().split('T')[0];

  // Reset if it's a new day
  if (storedDate !== today) {
    localStorage.setItem(PERFUNCTORY_DATE_KEY, today);
    localStorage.setItem(PERFUNCTORY_KEY, '0');
    return 0;
  }

  return parseInt(localStorage.getItem(PERFUNCTORY_KEY) || '0', 10);
}

export function recordPerfunctory(): void {
  if (typeof window === 'undefined') return;

  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(PERFUNCTORY_DATE_KEY, today);

  const current = getPerfunctoryCount();
  localStorage.setItem(PERFUNCTORY_KEY, String(current + 1));
}

export function resetPerfunctoryCount(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PERFUNCTORY_KEY, '0');
}

// Perfunctory response detection
const PERFUNCTORY_PATTERNS = [
  '没什么特别的',
  '没什么',
  '不知道',
  '没有',
  '还行',
  '一般',
  '差不多',
];

export function isPerfunctoryChoice(choiceText: string): boolean {
  const text = choiceText.trim();
  // Check if matches known perfunctory patterns
  if (PERFUNCTORY_PATTERNS.some(p => text.includes(p))) {
    return true;
  }
  // Very short response
  if (text.length < 8) {
    return true;
  }
  return false;
}