# CLAUDE.md

自我改变 (Self-Change) — a character-transformation app using a Korean dynasty narrative (exiled prince returning home) as metaphor for personal growth.

## Project Context

This is a Next.js 16 project bootstrapped with `create-next-app`. The user is Ann, a Python/Streamlit developer learning vibe coding with Claude.

**Tech Stack:**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4 + shadcn/ui components
- Supabase (Auth + Database)
- Zustand (client state)
- SWR (data fetching)
- @anthropic-ai/sdk (installed but NOT used in MVP — see below)

**Important:** Do NOT call Claude API in MVP phase. Dialogue trees are pre-designed JSON state machines, not AI-generated. This is intentional: faster, cheaper, more predictable.

## Key Design Documents

- `app-design.md` — Full design spec: philosophy, 4-phase journey, shadow/wangde systems, daily cycle
- `app-design-dialogue.md` — Complete AI dialogue trees (teacher-student conversations: 申先生 & 徐娘子)

**Read these files before making any changes to understand the full design vision.**

## Core Design Principles (Non-Negotiable)

1. **Identity-driven > habit-driven** — "I am a runner" > "I run every day"
2. **AI adaptive > fixed plans** — Push when user is strong, shrink to minimal action when weak
3. **Reflection > recording** — What was learned matters more than streak count
4. **Understanding low points > punishing missed days** — Never reset progress to zero

## Key Mechanics

- **Two shadow enemies**: 逆星 (arrogance, HP7) and 毒疮 (selfishness, HP7)
- **王德 (Wangde)** — positive virtue accumulation system, separate from shadow combat
- **4-phase linear journey**: Awakening → Self-Cultivation → Trials → Return
- **Daily cycle**: Morning ritual (2-3min) → Daytime (silent) → Evening dialogue (5-9min, core)

## UI Constraints

- No percentage-based progress — use visual grids (⬛/⬜ for HP, golden veins on character)
- No gamified streaks or consecutive-day counters
- App stays invisible during daytime
- Dialogue is structured (JSON state machine), not AI-generated in MVP

## MVP Scope

First version only:
- [ ] Day 0 onboarding dialogue (complete dialogue tree from app-design-dialogue.md)
- [ ] Morning ritual (one-line daily assignment)
- [ ] Evening dialogue (choice-based, JSON state machine)
- [ ] 逆星 HP tracking
- [ ] Wangde counter
- [ ] Scroll map (static display, prince position changes)
- [ ] Supabase Auth

**Not in MVP:** 毒疮, afternoon check-in, minister events, complex animations

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Entry: login / redirect
│   ├── onboarding/page.tsx         # Day 0 dialogue
│   ├── (main)/                     # Authenticated routes
│   │   ├── scroll-map/page.tsx     # Main map interface
│   │   ├── morning/page.tsx        # Morning ritual
│   │   └── evening/page.tsx        # Evening dialogue
│   └── api/                        # API routes
├── components/ui/                  # shadcn/ui components
├── data/
│   └── dialogue-trees/            # JSON dialogue trees
├── lib/
│   ├── dialogue-engine.ts          # JSON state machine
│   ├── game-logic.ts               # Shadow HP, Wangde, position
│   └── supabase/                   # Client/admin/server
└── types/
    └── database.ts                 # All DB types (Phase, Shadow, etc.)
```

## Types Reference

All types are in `src/types/database.ts`:
- `Phase`: 'awakening' | 'self_cultivation' | 'trials' | 'return'
- `ShadowType`: 'arrogance' | 'selfishness'
- `Profile`, `Shadow`, `DailyTask`, `Dialogue`, `DialogueMessage`, `Artifact`

Game state types in `src/types/game.ts`:
- `ShadowState`, `VirtueState`, `ScrollState`, `DialogueEffect`

## Game Logic Rules

**Shadow HP (逆星 starts at 7/7):**
- HP increases when: user acts arrogant, disputes/dismisses others, neglects studies, app unused for days
- HP decreases when: user humbles self, admits fault, says "you're right", completes daily tasks
- HP → 0 = shadow shatters → artifact earned
- Shadow can resurrect (5 HP after first shatter, 3 after second)

**Wangde accumulation:**
- User performs virtue action (see app-design.md section「王德之光」)
- Visual: golden veins grow from feet to head on prince character
- Every 3 Wangde = one vein segment

**Scroll position:**
- Progress = distance from starting point (not percentage)
- Good day = prince moves forward on map
- Bad day = prince moves backward (not reset)
- Weather changes based on recent performance

## Development Commands

```bash
cd "/d/Trae CN/documents/app_design/self-change"
npm run dev   # Start dev server on localhost:3000
npm run build # Build for production
```

## Notes for Future Sessions

- Always read CLAUDE.md and app-design.md first when starting work
- Dialogue trees are pre-designed JSON, not AI-generated
- If adding AI later, use @anthropic-ai/sdk (already installed)
- Supabase project needs environment variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY