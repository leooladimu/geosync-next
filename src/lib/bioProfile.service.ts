/**
 * bioProfile.service.ts
 *
 * Takes raw user input (DOB, coordinates, survey) and derives the full
 * biological profile. Pure function — zero DB calls.
 */

import type {
  Season,
  LightProfile,
  LatitudeTier,
  Chronotype,
  StressResponse,
  DerivedProfile,
  Survey,
  VulnerabilityWindow,
} from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

// Northern hemisphere month → season (1-indexed)
const NH_SEASON_MAP: Record<number, Season> = {
  1: "winter", 2: "winter", 3: "spring",
  4: "spring", 5: "spring", 6: "summer",
  7: "summer", 8: "summer", 9: "fall",
  10: "fall",  11: "fall",  12: "winter",
};

// Photoperiod trend at birth month — used for chronotype derivation
const PHOTOPERIOD_TREND: Record<number, "lengthening" | "shortening" | "peak" | "trough"> = {
  1: "lengthening", 2: "lengthening", 3: "lengthening",
  4: "lengthening", 5: "lengthening", 6: "peak",
  7: "shortening",  8: "shortening",  9: "shortening",
  10: "shortening", 11: "shortening", 12: "trough",
};

// Vulnerability window by birth season
const VULNERABILITY_WINDOWS: Record<Season, VulnerabilityWindow> = {
  spring: { startMonth: 3, endMonth: 5 },
  summer: { startMonth: 6, endMonth: 8 },
  fall:   { startMonth: 9, endMonth: 12 },
  winter: { startMonth: 1, endMonth: 3 },
};

// ─── Derivation helpers ───────────────────────────────────────────────────────

function deriveSeason(dob: Date | string, lat: number): Season {
  const month = new Date(dob).getMonth() + 1;
  const season = NH_SEASON_MAP[month];

  if (lat < 0) {
    const flip: Record<Season, Season> = {
      spring: "fall", fall: "spring",
      summer: "winter", winter: "summer",
    };
    return flip[season];
  }

  return season;
}

function deriveLightProfile(season: Season): LightProfile {
  return season === "spring" || season === "summer" ? "high-light" : "low-light";
}

function deriveLatitudeTier(lat: number): LatitudeTier {
  const abs = Math.abs(lat);
  if (abs >= 50) return "high";
  if (abs >= 30) return "mid";
  return "low";
}

function deriveChronotype(dob: Date | string, surveyStressResponse: StressResponse): Chronotype {
  const month = new Date(dob).getMonth() + 1;
  const trend = PHOTOPERIOD_TREND[month];

  if (trend === "lengthening") return "lark";
  if (trend === "shortening")  return "owl";
  if (trend === "trough") return surveyStressResponse === "fight-flight" ? "owl" : "neutral";
  if (trend === "peak")   return surveyStressResponse === "expand"       ? "lark" : "neutral";
  return "neutral";
}

function deriveStressBaseline(surveyStressResponse: StressResponse, latitudeTier: LatitudeTier): StressResponse {
  if (latitudeTier === "high") {
    const amplified: Record<StressResponse, StressResponse> = {
      freeze: "freeze",
      expand: "freeze",
      "fight-flight": "fight-flight",
    };
    return amplified[surveyStressResponse];
  }
  return surveyStressResponse;
}

function deriveNeurotransmitters(season: Season, latitudeTier: LatitudeTier) {
  const isLowLight  = season === "fall" || season === "winter";
  const isHighLat   = latitudeTier === "high";

  const dopamine = isLowLight && isHighLat ? "low"
    : isLowLight || isHighLat ? "moderate"
    : "high";

  const serotonin = !isLowLight && !isHighLat ? "high"
    : isLowLight && isHighLat ? "low"
    : "moderate";

  return { dopamine, serotonin } as const;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * derive(dob, lat, lng, survey) → DerivedProfile
 *
 * @param dob  — date of birth (Date or ISO string)
 * @param lat  — birth latitude
 * @param lng  — birth longitude (reserved for future use)
 * @param survey — completed behavioral survey
 */
export function derive(
  dob: Date | string,
  lat: number,
  lng: number,
  survey: Survey,
): DerivedProfile {
  const season             = deriveSeason(dob, lat);
  const lightProfile       = deriveLightProfile(season);
  const latitudeTier       = deriveLatitudeTier(lat);
  const chronotype         = deriveChronotype(dob, survey.stressResponse);
  const stressBaseline     = deriveStressBaseline(survey.stressResponse, latitudeTier);
  const neurotransmitters  = deriveNeurotransmitters(season, latitudeTier);
  const vulnerabilityWindow = VULNERABILITY_WINDOWS[season];

  return {
    season,
    lightProfile,
    latitudeTier,
    chronotype,
    stressBaseline,
    vulnerabilityWindow,
    neurotransmitters,
  };
}
