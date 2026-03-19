/**
 * forecast.service.ts
 *
 * Generates a 3-month seasonal forecast for a connection based on two
 * DerivedProfiles. Pure function — zero DB calls.
 */

import type {
  DerivedProfile,
  Season,
  EnergyLevel,
  MismatchRisk,
  ForecastUserState,
  ForecastMonth,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isInWindow(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) return month >= startMonth && month <= endMonth;
  return month >= startMonth || month <= endMonth;
}

function getCurrentSeason(month: number): Season {
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "fall";
  return "winter";
}

function getOppositeSeason(season: Season): Season {
  const opposites: Record<Season, Season> = {
    spring: "fall", fall: "spring",
    summer: "winter", winter: "summer",
  };
  return opposites[season];
}

function isApproachingSeason(currentMonth: number, targetSeason: Season): boolean {
  const seasonMonths: Record<Season, number[]> = {
    spring: [3, 4, 5], summer: [6, 7, 8],
    fall: [9, 10, 11], winter: [12, 1, 2],
  };
  const targetMonths = seasonMonths[targetSeason];
  const idx = targetMonths.indexOf(currentMonth);
  if (idx > 0 && idx <= 2) return true;
  if (targetSeason === "winter" && (currentMonth === 10 || currentMonth === 11)) return true;
  return false;
}

function getEnergyLevel(profile: DerivedProfile, currentMonth: number): EnergyLevel {
  const { vulnerabilityWindow, season } = profile;
  const { startMonth, endMonth } = vulnerabilityWindow;

  if (isInWindow(currentMonth, startMonth, endMonth)) return "low";

  const peakSeason = getOppositeSeason(season);
  if (getCurrentSeason(currentMonth) === peakSeason) return "peak";
  if (isApproachingSeason(currentMonth, peakSeason)) return "rising";
  return "dipping";
}

function assessMismatchRisk(a: ForecastUserState, b: ForecastUserState): MismatchRisk {
  if (a.energyLevel === "low" && b.energyLevel === "low") return "high";
  if (a.inVulnerabilityWindow && b.inVulnerabilityWindow) return "high";
  if (
    (a.energyLevel === "low" && b.energyLevel === "peak") ||
    (a.energyLevel === "peak" && b.energyLevel === "low")
  ) return "moderate";
  return "low";
}

function generateRecommendations(a: ForecastUserState, b: ForecastUserState, risk: MismatchRisk): string[] {
  const recs: string[] = [];

  if (risk === "high") {
    recs.push("Schedule important conversations for when both energy levels rise");
    recs.push("Lean on external support systems during this period");
    recs.push("Postpone major decisions if possible");
  } else if (risk === "moderate") {
    recs.push("The higher-energy partner takes lead in planning");
    recs.push("Use async communication for sensitive topics");
  } else {
    recs.push("Good window for relationship growth and deep conversations");
  }

  if (a.energyLevel === "low" && b.energyLevel !== "low")
    recs.push("Partner B provides stability while Partner A recharges");
  if (b.energyLevel === "low" && a.energyLevel !== "low")
    recs.push("Partner A provides stability while Partner B recharges");

  return recs;
}

function generateScripts(a: ForecastUserState, b: ForecastUserState, risk: MismatchRisk): string[] {
  const scripts: string[] = [];

  if (risk === "high") {
    scripts.push("I'm noticing we're both in a low-energy period. Let's table this for a few days.");
    scripts.push("This feels like it's about timing more than substance. Can we check back next week?");
  }
  if (a.energyLevel === "low" && b.energyLevel !== "low")
    scripts.push("I'm in my recharge window. Can you hold space while I process?");
  if (b.energyLevel === "low" && a.energyLevel !== "low")
    scripts.push("I can see you're in your low period. What do you need from me right now?");

  return scripts;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * generateForecast(profileA, profileB, startMonth?, startYear?) → ForecastMonth[]
 *
 * Returns a 3-month forecast array starting from the given month/year
 * (defaults to the current month).
 */
export function generateForecast(
  profileA: DerivedProfile,
  profileB: DerivedProfile,
  startMonth: number | null = null,
  startYear: number | null = null,
): ForecastMonth[] {
  const now = new Date();
  const month = startMonth ?? now.getMonth() + 1;
  const year = startYear ?? now.getFullYear();

  return Array.from({ length: 3 }, (_, i) => {
    const forecastMonth = ((month - 1 + i) % 12) + 1;
    const forecastYear = year + Math.floor((month - 1 + i) / 12);

    const userA: ForecastUserState = {
      energyLevel: getEnergyLevel(profileA, forecastMonth),
      inVulnerabilityWindow: isInWindow(
        forecastMonth,
        profileA.vulnerabilityWindow.startMonth,
        profileA.vulnerabilityWindow.endMonth,
      ),
    };

    const userB: ForecastUserState = {
      energyLevel: getEnergyLevel(profileB, forecastMonth),
      inVulnerabilityWindow: isInWindow(
        forecastMonth,
        profileB.vulnerabilityWindow.startMonth,
        profileB.vulnerabilityWindow.endMonth,
      ),
    };

    const mismatchRisk = assessMismatchRisk(userA, userB);
    const recommendations = generateRecommendations(userA, userB, mismatchRisk);
    const scripts = generateScripts(userA, userB, mismatchRisk);

    return { month: forecastMonth, year: forecastYear, userA, userB, mismatchRisk, recommendations, scripts };
  });
}
