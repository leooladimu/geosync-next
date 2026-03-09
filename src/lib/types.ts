/**
 * Shared domain types used across all geoSync services.
 * These mirror the Prisma enums but are plain TypeScript so services
 * stay framework-agnostic (no @prisma/client import in the logic layer).
 */

export type Season = "spring" | "summer" | "fall" | "winter";
export type LightProfile = "high-light" | "low-light";
export type LatitudeTier = "high" | "mid" | "low";
export type Chronotype = "lark" | "owl" | "neutral";
export type StressResponse = "freeze" | "expand" | "fight-flight";
export type NeuroLevel = "high" | "moderate" | "low";
export type CompatibilityTier = "high" | "moderate" | "low";
export type SeasonalTier = "protective" | "moderate" | "risky";
export type EnergyLevel = "rising" | "peak" | "dipping" | "low";
export type MismatchRisk = "low" | "moderate" | "high";
export type NudgeCategory =
  | "withdrawal"
  | "over-commitment"
  | "intensity-seeking"
  | "scarcity-lock"
  | "optimism-bias";

export type Openness = "quick" | "gradual" | "situational";
export type ConflictStyle = "resolve-now" | "process-first" | "avoid";

// ─── Survey ───────────────────────────────────────────────────────────────────

export interface Survey {
  openness: Openness;
  stressResponse: StressResponse;
  socialSeason: Season;
  conflictStyle: ConflictStyle;
}

// ─── BioProfile (derived layer) ───────────────────────────────────────────────

export interface VulnerabilityWindow {
  startMonth: number; // 1–12
  endMonth: number;   // 1–12
}

export interface Neurotransmitters {
  dopamine: NeuroLevel;
  serotonin: NeuroLevel;
}

/** The derived portion of a BioProfile — output of bioProfile.service.derive() */
export interface DerivedProfile {
  season: Season;
  lightProfile: LightProfile;
  latitudeTier: LatitudeTier;
  chronotype: Chronotype;
  stressBaseline: StressResponse;
  vulnerabilityWindow: VulnerabilityWindow;
  neurotransmitters: Neurotransmitters;
}

// ─── Compatibility report ─────────────────────────────────────────────────────

export interface ChronotypeDimension {
  score: number;
  tier: CompatibilityTier;
  insight: string;
  warning: string;
  strategy: string;
  detail: { a: Chronotype; b: Chronotype };
}

export interface StressDimension {
  score: number;
  tier: CompatibilityTier;
  archetype: string;
  dynamic: string;
  toxicLoop: string | null;
  circuitBreaker: string;
  detail: { a: StressResponse; b: StressResponse };
}

export interface SeasonalDimension {
  score: number;
  tier: SeasonalTier;
  insight: string;
  strategy: string;
  overlapMonths: number;
  detail: { a: VulnerabilityWindow; b: VulnerabilityWindow };
}

export interface CompatibilityReport {
  scores: {
    overall: number;
    chronotype: number;
    stress: number;
    seasonal: number;
  };
  tiers: {
    chronotype: CompatibilityTier;
    stress: CompatibilityTier;
    seasonal: SeasonalTier;
  };
  archetype: string;
  dimensions: {
    chronotype: ChronotypeDimension;
    stress: StressDimension;
    seasonal: SeasonalDimension;
  };
  generatedAt: Date;
}

// ─── Forecast ─────────────────────────────────────────────────────────────────

export interface ForecastUserState {
  energyLevel: EnergyLevel;
  inVulnerabilityWindow: boolean;
}

export interface ForecastMonth {
  month: number;
  year: number;
  userA: ForecastUserState;
  userB: ForecastUserState;
  mismatchRisk: MismatchRisk;
  recommendations: string[];
  scripts: string[];
}

// ─── Nudge ────────────────────────────────────────────────────────────────────

export interface NudgeCandidate {
  category: NudgeCategory;
  trigger: string;
  message: string;
}

// ─── Connection (lean shape for nudge service) ────────────────────────────────

export interface ConnectionForNudge {
  id: string;
  connectedUserId?: string | null;
  manualProfile?: { name?: string } | null;
}

// ─── Profile (full document shape for nudge service) ─────────────────────────

export interface ProfileForNudge {
  derived: DerivedProfile;
}
