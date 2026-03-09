"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";
import type { BioProfile } from "@/lib/api";
import { SYMBOLS, SEASON_SYMBOLS } from "@/lib/symbols";

const LIGHT_LABELS: Record<string, string> = {
  high_light: "High-Light Profile",
  low_light: "Low-Light Profile",
};
const CHRONO_LABELS: Record<string, string> = {
  lark: "Morning Lark",
  owl: "Night Owl",
  neutral: "Neutral Chronotype",
};
const STRESS_LABELS: Record<string, string> = {
  freeze: "Freeze & Protect",
  expand: "Expand & Adapt",
  fight_flight: "Fight or Flight",
};
const NEURO_COLORS: Record<string, string> = {
  high: "#4a7a5a",
  moderate: "#c9a03a",
  low: "#7a4a3a",
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

type CalibrationStatus = "confirmed" | "adjusted" | "derived";

function calibrationStatus(derived: string, adjusted: string | null): CalibrationStatus {
  if (!adjusted) return "derived";
  return adjusted === derived ? "confirmed" : "adjusted";
}

const STATUS_BORDER: Record<CalibrationStatus, string> = {
  confirmed: "border-success/40",
  adjusted: "border-warning/40",
  derived: "border-transparent",
};
const STATUS_DOT: Record<CalibrationStatus, string> = {
  confirmed: "bg-success",
  adjusted: "bg-warning",
  derived: "bg-transparent",
};
const STATUS_LABELS: Record<CalibrationStatus, string> = {
  confirmed: "confirmed by you",
  adjusted: "adjusted by you",
  derived: "",
};

// ─── Calibration sub-component ────────────────────────────────────────────────

const DIMENSIONS = [
  {
    key: "chronotype" as const,
    label: "Daily Rhythm",
    glyph: "☉\uFE0E",
    question: "Left to your own schedule — no alarms, no obligations — when do you naturally wake up and feel most alive?",
    note: "Answer for your natural state, not your current schedule.",
    options: [
      { value: "lark", label: "Morning", description: "Awake before 7am naturally. Peak energy before noon." },
      { value: "neutral", label: "Middle", description: "No strong preference. Functional across the day." },
      { value: "owl", label: "Evening", description: "Come alive after 9pm. Mornings are a tax." },
    ],
  },
  {
    key: "stressBaseline" as const,
    label: "Under Pressure",
    glyph: "♁\uFE0E",
    question: "When something genuinely threatens something you care about — a relationship, a job, your sense of safety — what happens first?",
    note: "Think of a real moment. Not what you wish you did — what you actually did.",
    options: [
      { value: "freeze", label: "Go quiet", description: "Withdraw. Go internal. Need space before you can respond." },
      { value: "expand", label: "Problem-solve", description: "Immediately look for what can be done. Discomfort drives action." },
      { value: "fight_flight", label: "React", description: "Respond immediately — emotionally, physically, verbally. Deal with it later." },
    ],
  },
  {
    key: "socialSeason" as const,
    label: "Social Energy",
    glyph: "♈\uFE0E",
    question: "Which season do you actually feel most open, most yourself, most willing to let people in?",
    note: "Not when you're busiest — when you feel most socially alive.",
    options: [
      { value: "spring", label: "♈︎ Spring", description: "Something thaws. You want to reconnect, start things, be seen." },
      { value: "summer", label: "♋︎ Summer", description: "Expansive. High capacity. You want people around you." },
      { value: "fall", label: "♎︎ Fall", description: "Deeper, slower connections. You prefer intimacy over volume." },
      { value: "winter", label: "♑︎ Winter", description: "Selective and internal. You protect your energy carefully." },
    ],
  },
];

interface CalibrationAnswers {
  chronotype: string | null;
  stressBaseline: string | null;
  socialSeason: string | null;
}

function ProfileCalibration({
  profile,
  token,
  onUpdated,
}: {
  profile: BioProfile;
  token: string;
  onUpdated: (updated: BioProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<CalibrationAnswers>({
    chronotype: profile.adjustedChronotype ?? null,
    stressBaseline: profile.adjustedStressBaseline ?? null,
    socialSeason: profile.adjustedSocialSeason ?? null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const dim = DIMENSIONS[step - 1];

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const updated = await profileApi.calibrate(
        {
          chronotype: (answers.chronotype as BioProfile["adjustedChronotype"]) ?? undefined,
          stressBaseline: (answers.stressBaseline as BioProfile["adjustedStressBaseline"]) ?? undefined,
          socialSeason: (answers.socialSeason as BioProfile["adjustedSocialSeason"]) ?? undefined,
        },
        token,
      );
      setDone(true);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  if (step === 0) {
    return (
      <div className="bg-bg-card border border-border rounded-xl p-6 md:p-10">
        <div className="flex gap-4 items-start mb-6">
          <div className="text-xl text-accent">{SYMBOLS.star}</div>
          <div>
            <h3 className="text-lg text-text-primary mb-1">Calibrate Your Profile</h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Your profile was derived from birth data and your survey answers.
              Self-knowledge is data too — if something doesn&apos;t fit, you can adjust it.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {DIMENSIONS.map((d, i) => {
            const derivedVal = profile[d.key as keyof BioProfile] as string;
            const adjustedVal = profile[`adjusted${d.key.charAt(0).toUpperCase()}${d.key.slice(1)}` as keyof BioProfile] as string | null;
            const status = calibrationStatus(derivedVal, adjustedVal ?? null);
            const displayVal = adjustedVal || derivedVal;
            const option = d.options.find((o) => o.value === displayVal);

            return (
              <div key={d.key} className="flex items-center justify-between bg-bg-elevated rounded-lg p-4">
                <div className="flex gap-3 items-center">
                  <span className="text-accent">{d.glyph}</span>
                  <div>
                    <div className="text-xs text-text-muted uppercase tracking-wide mb-0.5">{d.label}</div>
                    <div className="text-sm text-text-primary">{option?.label ?? displayVal}</div>
                    {status !== "derived" && (
                      <div className="text-xs text-text-muted italic mt-0.5">{STATUS_LABELS[status]}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setStep(i + 1)}
                  className="text-xs text-text-muted border border-border rounded-md px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
                >
                  {status === "derived" ? "Review" : "Change"}
                </button>
              </div>
            );
          })}
        </div>

        {done && (
          <p className="text-sm text-text-muted italic mt-4">
            {SYMBOLS.star} Profile updated. Compatibility reports will reflect your calibration.
          </p>
        )}
        {error && <p className="text-sm text-danger mt-4">{error}</p>}
      </div>
    );
  }

  const currentAnswer = answers[dim.key];
  const derivedAnswer = profile[dim.key as keyof BioProfile] as string;
  const mismatch = currentAnswer && currentAnswer !== derivedAnswer;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-6 md:p-10">
      <button
        onClick={() => setStep(0)}
        className="text-sm text-text-muted hover:text-accent mb-6 block transition-colors"
      >
        ← All dimensions
      </button>

      <div className="flex gap-3 items-center mb-6">
        <span className="text-xl text-accent">{dim.glyph}</span>
        <span className="text-lg text-text-primary">{dim.label}</span>
      </div>

      <p className="text-base text-text-primary leading-relaxed mb-2">{dim.question}</p>
      <p className="text-sm text-text-muted italic mb-6">{dim.note}</p>

      <div className="flex flex-col gap-3 mb-6">
        {dim.options.map((opt) => {
          const isDerived = opt.value === derivedAnswer;
          const isSelected = opt.value === currentAnswer;
          return (
            <button
              key={opt.value}
              onClick={() => setAnswers((prev) => ({ ...prev, [dim.key]: opt.value }))}
              className={`text-left p-4 rounded-lg border transition-colors ${
                isSelected
                  ? "border-accent bg-accent-dim/20 text-text-primary"
                  : isDerived
                  ? "border-border/60 bg-bg-elevated text-text-secondary"
                  : "border-border bg-bg-elevated text-text-secondary hover:border-border-light"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{opt.label}</span>
                <div className="flex gap-2">
                  {isDerived && (
                    <span className="text-xs text-text-muted border border-border rounded px-2 py-0.5">
                      birth data
                    </span>
                  )}
                  {isSelected && isDerived && (
                    <span className="text-xs text-success border border-success/40 rounded px-2 py-0.5">
                      confirmed
                    </span>
                  )}
                  {isSelected && !isDerived && (
                    <span className="text-xs text-warning border border-warning/40 rounded px-2 py-0.5">
                      your answer
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{opt.description}</p>
            </button>
          );
        })}
      </div>

      {mismatch && (
        <div className="flex gap-3 bg-bg-elevated border border-border rounded-lg p-4 mb-6">
          <span className="text-accent shrink-0">{SYMBOLS.star}</span>
          <p className="text-sm text-text-muted leading-relaxed">
            Your answer differs from what your birth data suggests. That&apos;s fine —
            decades of schedule, genetics, and self-knowledge all count. Your answer
            will take precedence in compatibility scoring.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={async () => { await save(); setStep(0); }}
          disabled={!currentAnswer || loading}
          className="px-8 py-2.5 bg-accent text-text-primary rounded-lg text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving…" : "Save & Return"}
        </button>
      </div>

      {error && <p className="text-sm text-danger mt-4">{error}</p>}
    </div>
  );
}

// ─── ProfileSummary ───────────────────────────────────────────────────────────

interface ProfileSummaryProps {
  profile: BioProfile;
  onProfileUpdated: (updated: BioProfile) => void;
}

export default function ProfileSummary({ profile, onProfileUpdated }: ProfileSummaryProps) {
  const { token } = useAuth();
  const [showCalibration, setShowCalibration] = useState(false);

  const chronotype = profile.adjustedChronotype ?? profile.chronotype;
  const stressBaseline = profile.adjustedStressBaseline ?? profile.stressBaseline;

  const chronoStatus = calibrationStatus(profile.chronotype, profile.adjustedChronotype ?? null);
  const stressStatus = calibrationStatus(profile.stressBaseline, profile.adjustedStressBaseline ?? null);
  const socialStatus = calibrationStatus(
    // socialSeason isn't on BioProfile directly — use adjustedSocialSeason as proxy
    profile.adjustedSocialSeason ?? "",
    profile.adjustedSocialSeason ?? null,
  );

  const anyCalibrated =
    chronoStatus !== "derived" || stressStatus !== "derived" || socialStatus !== "derived";

  const seasonSymbol = SEASON_SYMBOLS[profile.season] ?? SYMBOLS.star;
  const dobYear = new Date(profile.dob).getFullYear();

  return (
    <div className="flex flex-col gap-md">
      <div className="bg-bg-card border border-border rounded-xl p-6 md:p-10">
        {/* Top row */}
        <div className="flex items-start gap-4 mb-8 flex-wrap">
          <div className="text-3xl text-accent leading-none shrink-0">{seasonSymbol}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-xl text-text-primary">Your Biophysical Profile</h2>
            <p className="text-sm text-text-muted mt-1">
              {profile.birthCity}
              {profile.birthState ? `, ${profile.birthState}` : ""} · {dobYear} ·{" "}
              <span className="capitalize text-text-secondary">{profile.season}</span>
            </p>
          </div>
          <button
            onClick={() => setShowCalibration((p) => !p)}
            className="text-sm text-text-muted border border-border rounded-lg px-4 py-2 hover:border-accent hover:text-accent transition-colors whitespace-nowrap shrink-0"
          >
            {showCalibration ? "Done" : anyCalibrated ? "Recalibrate" : "Calibrate"}
          </button>
        </div>

        {/* Traits grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {/* Light Profile */}
          <div className="bg-bg-elevated rounded-lg p-4 border border-transparent">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Light Profile
            </div>
            <div className="text-sm text-text-primary">
              {LIGHT_LABELS[profile.lightProfile] ?? profile.lightProfile}
            </div>
          </div>

          {/* Chronotype */}
          <div className={`bg-bg-elevated rounded-lg p-4 border ${STATUS_BORDER[chronoStatus]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-text-muted uppercase tracking-wide">Chronotype</div>
              {chronoStatus !== "derived" && (
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[chronoStatus]}`} title={STATUS_LABELS[chronoStatus]} />
              )}
            </div>
            <div className="text-sm text-text-primary">
              {CHRONO_LABELS[chronotype] ?? chronotype}
            </div>
            {chronoStatus === "adjusted" && (
              <div className="text-xs text-text-muted italic mt-1">
                derived: {CHRONO_LABELS[profile.chronotype] ?? profile.chronotype}
              </div>
            )}
          </div>

          {/* Stress Response */}
          <div className={`bg-bg-elevated rounded-lg p-4 border ${STATUS_BORDER[stressStatus]}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-text-muted uppercase tracking-wide">Stress Response</div>
              {stressStatus !== "derived" && (
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[stressStatus]}`} title={STATUS_LABELS[stressStatus]} />
              )}
            </div>
            <div className="text-sm text-text-primary">
              {STRESS_LABELS[stressBaseline] ?? stressBaseline}
            </div>
            {stressStatus === "adjusted" && (
              <div className="text-xs text-text-muted italic mt-1">
                derived: {STRESS_LABELS[profile.stressBaseline] ?? profile.stressBaseline}
              </div>
            )}
          </div>

          {/* Vulnerability Window */}
          <div className="bg-bg-elevated rounded-lg p-4 border border-transparent">
            <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
              Vulnerability Window
            </div>
            <div className="text-sm text-text-primary">
              {MONTHS[profile.vulnerabilityStartMonth - 1]}–{MONTHS[profile.vulnerabilityEndMonth - 1]}
            </div>
          </div>
        </div>

        {/* Neurotransmitters */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 flex-wrap items-start sm:items-center">
          {(["dopamine", "serotonin"] as const).map((nt) => (
            <div key={nt} className="flex items-center gap-3">
              <span className="text-sm text-text-muted capitalize">{nt}</span>
              <span
                className="text-xs font-mono uppercase tracking-wide px-3 py-1 rounded-full border"
                style={{
                  color: NEURO_COLORS[profile[nt]] ?? "#9a9590",
                  background: `${NEURO_COLORS[profile[nt]] ?? "#9a9590"}22`,
                  borderColor: `${NEURO_COLORS[profile[nt]] ?? "#9a9590"}44`,
                }}
              >
                {profile[nt]}
              </span>
            </div>
          ))}
          {anyCalibrated && (
            <p className="text-xs text-text-muted italic sm:ml-auto">
              {SYMBOLS.star} Some dimensions calibrated from your experience
            </p>
          )}
        </div>
      </div>

      {showCalibration && token && (
        <ProfileCalibration
          profile={profile}
          token={token}
          onUpdated={(updated) => {
            onProfileUpdated(updated);
            setShowCalibration(false);
          }}
        />
      )}
    </div>
  );
}
