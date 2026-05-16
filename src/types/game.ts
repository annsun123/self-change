import type { Phase, ShadowType } from './database';

export interface ShadowState {
  shadowType: ShadowType;
  currentHp: number;
  maxHp: number;
  shatterCount: number;
  isActive: boolean;
}

export interface VirtueState {
  current: number;
  max: number;
  nextThreshold: number;
}

export interface ScrollState {
  position: number;
  phase: Phase;
  weather: 'clear' | 'cloudy' | 'storm' | 'rainbow';
}

export interface ShadowDamageResult {
  shadowType: ShadowType;
  hpBefore: number;
  hpAfter: number;
  delta: number;
  didShatter: boolean;
  newMaxHp: number | null;
}

export interface VirtueChangeResult {
  beforeVal: number;
  afterVal: number;
  delta: number;
  didReachThreshold: boolean;
  thresholdReached: number | null;
}

export interface DialogueEffect {
  shadowChanges: Record<ShadowType, number>;
  wangdeChange: number;
  narrativeEvents: string[];
  artifactEarned?: { type: string; name: string };
}
