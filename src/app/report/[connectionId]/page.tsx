"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCompatibilityReport, useForecast, useConnection } from "@/hooks/useApi";
import { SYMBOLS } from "@/lib/symbols";
import type { SeasonalForecast } from "@/lib/api";

// ─── Score helpers ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  high:           "#4a7a5a",
  protective:     "#4a7a5a",
  moderate:       "#c9a03a",
  low:            "#7a3a3a",
  risky:          "#7a3a3a",
  "friction-prone": "#7a3a3a",
};

function DimBar({ score, tier }: { score: number; tier: string }) {
  const color = TIER_COLORS[tier] ?? "#c9a03a";
  return (
    <div className="flex-1 h-1 bg-border rounded-full relative">
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${score}%`, backgroundColor: color }}
      />
    </div>
  );
}

function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const r     = (size - 16) / 2;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  return (
    <svg width={size} height={size} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700"
      />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="middle"
        fill="var(--color-text-primary)" fontSize={size * 0.2} fontWeight={700}>
        {score}%
      </text>
    </svg>
  );
}

// ─── Forecast strip ───────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const RISK_COLORS: Record<string, string> = {
  low:      "text-[#4a7a5a]",
  moderate: "text-[#c9a03a]",
  high:     "text-[#7a3a3a]",
};

function ForecastStrip({ forecast }: { forecast: SeasonalForecast[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
      {forecast.slice(0, 3).map((f) => (
        <div key={f.id} className="bg-bg-card border border-border rounded-lg p-4">
          <div className="text-xs text-text-muted uppercase tracking-wide mb-2">
            {MONTH_NAMES[f.month - 1]} {f.year}
          </div>
          <div className={`font-semibold text-sm mb-3 capitalize ${RISK_COLORS[f.mismatchRisk] ?? "text-text-secondary"}`}>
            {f.mismatchRisk} risk
          </div>
          {f.recommendations.slice(0, 1).map((r, i) => (
            <p key={i} className="text-xs text-text-secondary leading-relaxed">{r}</p>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompatibilityReportPage({
  params,
}: {
  params: Promise<{ connectionId: string }>;
}) {
  const { connectionId } = use(params);
  const router = useRouter();
  useAuth(); // ensure provider is present

  const { data: report, loading: reportLoading, error: reportError } = useCompatibilityReport(connectionId);
  const { data: connection, loading: connLoading } = useConnection(connectionId);
  const { data: forecast } = useForecast(connectionId);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (reportLoading || connLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted text-base">
        {SYMBOLS.earth} Loading report…
      </div>
    );
  }
  if (reportError || !report) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted text-base px-4 text-center">
        Something went wrong: {reportError ?? "Report not found"}
      </div>
    );
  }

  const name = connection?.connectedUser?.name ?? (connection?.manualProfile as { name?: string } | null)?.name ?? "Your Connection";
  const dims = report.dimensions as Record<string, { summary?: string; toxicLoop?: string; script?: string; insight?: string }>;
  const scores = { overall: report.scoreOverall, chronotype: report.scoreChronotype, stress: report.scoreStress, seasonal: report.scoreSeasonal };
  const tiers  = { chronotype: report.tierChronotype, stress: report.tierStress, seasonal: report.tierSeasonal };

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <div className="flex justify-between items-center px-6 py-4 md:py-5 border-b border-border">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs md:text-sm text-text-muted hover:text-accent transition-colors"
        >
          ← Dashboard
        </button>
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/science" className="text-xs md:text-sm text-text-secondary no-underline hover:text-accent transition-colors">
            The Science
          </Link>
          <Link href="/dashboard" className="font-display text-lg md:text-xl text-accent no-underline hover:text-accent-light">
            {SYMBOLS.earth} geoSync
          </Link>
        </div>
      </div>

      <main className="max-w-2xl xl:max-w-3xl mx-auto px-6 py-10 flex flex-col gap-8 md:gap-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 md:gap-10">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent mb-2">Compatibility Report</div>
            <h1 className="text-2xl md:text-3xl text-text-primary mb-1">{name}</h1>
            <div className="text-xs md:text-sm text-text-muted capitalize mt-1">{connection?.type}</div>
          </div>
          <div className="bg-bg-card border border-border rounded-xl p-4 md:p-6 text-center min-w-[140px] md:min-w-[180px]">
            <div className="text-2xl text-accent-dim mb-2">{SYMBOLS.star}</div>
            <div className="text-xs uppercase tracking-widest text-text-muted mb-1">Your Dynamic</div>
            <div className="font-display text-base text-text-primary">{report.archetype}</div>
          </div>
        </div>

        {/* Score section */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-center">
          <ScoreRing score={scores.overall} size={160} />
          <div className="w-full flex flex-col gap-4 md:gap-6">
            {(["chronotype","stress","seasonal"] as const).map((dim) => (
              <div key={dim} className="flex flex-wrap sm:flex-nowrap items-center gap-2 md:gap-4">
                <span className="text-xs md:text-sm text-text-secondary w-full sm:w-[140px] shrink-0">
                  {dim === "chronotype" ? "Chronotype Sync" : dim === "stress" ? "Stress Response" : "Seasonal Rhythm"}
                </span>
                <DimBar score={scores[dim]} tier={tiers[dim]} />
                <span className="font-mono text-sm text-text-muted w-9 text-right">{scores[dim]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-text-muted italic border-l-2 border-accent-dim pl-3 md:pl-4 leading-relaxed">
          {SYMBOLS.star} A low score isn&apos;t a verdict — it&apos;s a user manual. The couples who struggle
          aren&apos;t the incompatible ones; they&apos;re the ones who don&apos;t know they&apos;re incompatible.
        </p>

        {/* Dimensions */}
        <div className="flex flex-col gap-4 md:gap-6">
          <h2 className="text-lg md:text-xl text-text-primary mb-1">The Three Dimensions</h2>
          {[
            { glyph: "☉", label: "Chronotype Sync",    key: "chronotype", tier: tiers.chronotype, score: scores.chronotype },
            { glyph: "♁", label: "Stress Response",     key: "stress",    tier: tiers.stress,     score: scores.stress    },
            { glyph: SYMBOLS.star, label: "Seasonal Rhythm", key: "seasonal", tier: tiers.seasonal, score: scores.seasonal },
          ].map(({ glyph, label, key, tier, score }) => {
            const isOpen = !!expanded[key];
            const dim = dims[key];
            const hasMore = !!(dim?.toxicLoop || dim?.insight);
            return (
              <div key={key} className="bg-bg-card border border-border rounded-xl overflow-hidden transition-all">
                {/* Always-visible header row — clickable if there's more to show */}
                <button
                  type="button"
                  onClick={() => hasMore && toggle(key)}
                  className={`w-full text-left p-4 md:p-6 flex items-start gap-3 transition-colors ${hasMore ? "hover:bg-bg-elevated cursor-pointer" : "cursor-default"}`}
                >
                  <span className="text-accent text-lg mt-0.5 shrink-0">{glyph}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-base md:text-lg text-text-primary">{label}</h3>
                      <span className="ml-auto text-xs uppercase tracking-wide text-text-muted">{tier}</span>
                      <span className="font-mono text-sm text-text-muted">{score}%</span>
                    </div>
                    {dim?.summary && (
                      <p className="text-sm text-text-secondary leading-relaxed">{dim.summary}</p>
                    )}
                  </div>
                  {hasMore && (
                    <span className={`text-accent text-xs mt-1 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                      ▾
                    </span>
                  )}
                </button>

                {/* Expandable detail section */}
                {isOpen && hasMore && (
                  <div className="px-4 md:px-6 pb-5 flex flex-col gap-4 border-t border-border">
                    {dim?.toxicLoop && (
                      <div className="mt-4 flex gap-3 bg-danger/5 border border-danger/20 rounded-lg p-4">
                        <span className="text-danger shrink-0 mt-0.5">⚠</span>
                        <div>
                          <div className="text-xs font-semibold text-danger uppercase tracking-wide mb-1">Watch for</div>
                          <p className="text-sm text-text-secondary leading-relaxed">{dim.toxicLoop}</p>
                        </div>
                      </div>
                    )}
                    {dim?.insight && (
                      <div className="flex gap-3 bg-accent/5 border border-accent/20 rounded-lg p-4">
                        <span className="text-accent shrink-0 mt-0.5">{SYMBOLS.star}</span>
                        <div>
                          <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">Insight</div>
                          <p className="text-sm text-text-secondary leading-relaxed">{dim.insight}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Strategies */}
        {(dims.chronotype?.script || dims.stress?.script || dims.seasonal?.script) && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg md:text-xl text-text-primary mb-1">Relationship Strategies</h2>
            {[
              { key: "chronotype", label: "Chronotype" },
              { key: "stress",     label: "Stress Response" },
              { key: "seasonal",   label: "Seasonal" },
            ].map(({ key, label }) =>
              dims[key]?.script ? (
                <div key={key} className="bg-bg-elevated border-l-[3px] border-l-accent rounded-r-lg px-4 py-3">
                  <div className="text-xs font-semibold text-accent mb-1 uppercase tracking-wide">{label}</div>
                  <p className="text-sm text-text-secondary leading-relaxed">{dims[key].script}</p>
                </div>
              ) : null,
            )}
          </div>
        )}

        {/* Forecast */}
        {forecast && forecast.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg md:text-xl text-text-primary mb-1">Next 90 Days</h2>
            <ForecastStrip forecast={forecast} />
          </div>
        )}
      </main>
    </div>
  );
}
