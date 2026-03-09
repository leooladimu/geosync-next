/**
 * nudge.service.ts
 *
 * Analyzes a user's BioProfile + connections and generates coaching nudges.
 * Unlike the original, this version is DB-agnostic — it returns candidate
 * nudges and lets the caller (API route) handle deduplication and persistence
 * via the Prisma `db` client. This keeps the logic pure and testable.
 */

import type {
  NudgeCandidate,
  NudgeCategory,
  ProfileForNudge,
  ConnectionForNudge,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function isInWindow(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) return month >= startMonth && month <= endMonth;
  return month >= startMonth || month <= endMonth;
}

function connectionName(connection: ConnectionForNudge): string {
  return (
    (connection.manualProfile?.name) ??
    "this person"
  );
}

// ─── Nudge generators ─────────────────────────────────────────────────────────

function checkWithdrawal(
  profile: ProfileForNudge,
  connection: ConnectionForNudge,
  currentMonth: number,
): NudgeCandidate | null {
  const { vulnerabilityWindow, stressBaseline } = profile.derived;
  if (!isInWindow(currentMonth, vulnerabilityWindow.startMonth, vulnerabilityWindow.endMonth)) return null;
  if (stressBaseline !== "freeze") return null;

  const name = connectionName(connection);
  return {
    category: "withdrawal",
    trigger: `Current month (${MONTH_NAMES[currentMonth - 1]}) falls in your vulnerability window with a freeze stress response`,
    message: `You're entering your natural low period. Your instinct right now is to go quiet — with ${name} and with yourself. Before you do: let them know it's seasonal, not personal. One sentence is enough. Silence without context reads as rejection.`,
  };
}

function checkIntensitySeeking(
  profile: ProfileForNudge,
  connection: ConnectionForNudge,
  currentMonth: number,
): NudgeCandidate | null {
  const { neurotransmitters, vulnerabilityWindow } = profile.derived;
  if (neurotransmitters.dopamine !== "low") return null;
  if (!isInWindow(currentMonth, vulnerabilityWindow.startMonth, vulnerabilityWindow.endMonth)) return null;

  const name = connectionName(connection);
  return {
    category: "intensity-seeking",
    trigger: "Low dopamine baseline active during vulnerability window",
    message: `Your baseline is craving stimulation right now. That's biology, not boredom with ${name}. Before you create friction to feel something — try naming what you actually need. Intensity and intimacy aren't the same thing.`,
  };
}

function checkOverCommitment(
  profile: ProfileForNudge,
  connection: ConnectionForNudge,
  currentMonth: number,
): NudgeCandidate | null {
  const { lightProfile, neurotransmitters } = profile.derived;
  if (lightProfile !== "high-light" || neurotransmitters.serotonin !== "high") return null;
  if (![5, 6, 7, 8].includes(currentMonth)) return null;

  const name = connectionName(connection);
  return {
    category: "over-commitment",
    trigger: "High-light profile in peak season — over-commitment risk elevated",
    message: `You're at peak energy right now and everything feels possible with ${name}. That's real — but your optimism is outpacing the relationship's actual timeline. What have you promised lately that your future self will have to deliver on?`,
  };
}

function checkScarcityLock(
  profile: ProfileForNudge,
  connection: ConnectionForNudge,
): NudgeCandidate | null {
  const { latitudeTier, stressBaseline } = profile.derived;
  if (latitudeTier !== "high" || stressBaseline !== "freeze") return null;

  const name = connectionName(connection);
  return {
    category: "scarcity-lock",
    trigger: "High-latitude freeze profile — scarcity pattern possible",
    message: `Your profile shows a strong loyalty baseline — which is a strength. But loyalty and obligation aren't the same thing. Are you still with ${name} because you genuinely want to be, or because leaving feels like losing something you can't replace?`,
  };
}

function checkOptimismBias(
  profile: ProfileForNudge,
  connection: ConnectionForNudge,
  currentMonth: number,
): NudgeCandidate | null {
  const { lightProfile, chronotype } = profile.derived;
  if (lightProfile !== "high-light" || chronotype !== "lark") return null;
  if (![3, 4, 5].includes(currentMonth)) return null;

  const name = connectionName(connection);
  return {
    category: "optimism-bias",
    trigger: "High-light lark profile in spring — optimism bias peak",
    message: `Spring is your most optimistic season, which means it's also your most selective-memory season. You're likely minimizing friction with ${name} that was real in winter. Don't make structural decisions about this relationship until June — in either direction.`,
  };
}

function checkSeasonalSelfAwareness(
  profile: ProfileForNudge,
  currentMonth: number,
): NudgeCandidate | null {
  const { vulnerabilityWindow } = profile.derived;
  const { startMonth } = vulnerabilityWindow;
  const warningMonth = ((startMonth - 2 + 12) % 12) + 1;
  if (currentMonth !== warningMonth) return null;

  return {
    category: "withdrawal",
    trigger: `One month before vulnerability window opens (${MONTH_NAMES[startMonth - 1]})`,
    message: `Your natural low period starts next month. This is your heads-up. It's a good time to: shore up routines, communicate expectations to people close to you, and avoid scheduling anything that requires you to be "on." You already know what this feels like — plan for it this time.`,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * getCandidateNudges(profile, connections) → NudgeCandidate[][]
 *
 * Returns candidates grouped by connection:
 *   - index 0: self-directed nudge (connectionId: null)
 *   - index 1…n: per-connection nudges
 *
 * The API route is responsible for deduplication (skip if same category is
 * already active/undismissed for that connection) and for persisting via `db`.
 */
export function getCandidateNudges(
  profile: ProfileForNudge,
  connections: ConnectionForNudge[],
): Array<{ connectionId: string | null; nudge: NudgeCandidate }> {
  const currentMonth = new Date().getMonth() + 1;
  const results: Array<{ connectionId: string | null; nudge: NudgeCandidate }> = [];

  // Self-directed nudge
  const selfNudge = checkSeasonalSelfAwareness(profile, currentMonth);
  if (selfNudge) results.push({ connectionId: null, nudge: selfNudge });

  // Per-connection nudges
  for (const connection of connections) {
    const candidates = [
      checkWithdrawal(profile, connection, currentMonth),
      checkIntensitySeeking(profile, connection, currentMonth),
      checkOverCommitment(profile, connection, currentMonth),
      checkScarcityLock(profile, connection),
      checkOptimismBias(profile, connection, currentMonth),
    ];

    for (const nudge of candidates) {
      if (nudge) results.push({ connectionId: connection.id, nudge });
    }
  }

  return results;
}

/**
 * Convenience type for the API route to use when persisting nudges.
 */
export type { NudgeCandidate, NudgeCategory };
