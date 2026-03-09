"use client";

import { useState } from "react";
import { useNudges } from "@/hooks/useApi";
import { SYMBOLS } from "@/lib/symbols";
import type { CoachingNudge } from "@/lib/api";

const CATEGORY_META: Record<string, { glyph: string; label: string }> = {
  withdrawal:         { glyph: "☽",  label: "Withdrawal pattern" },
  intensity_seeking:  { glyph: "☉",  label: "Intensity seeking" },
  over_commitment:    { glyph: "♈",  label: "Over-commitment risk" },
  scarcity_lock:      { glyph: "♁",  label: "Scarcity pattern" },
  optimism_bias:      { glyph: "♋",  label: "Optimism bias" },
};

function NudgeCard({
  nudge,
  onDismiss,
}: {
  nudge: CoachingNudge;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[nudge.category] ?? {
    glyph: SYMBOLS.star,
    label: nudge.category,
  };

  const connectionName =
    (nudge.connection as { manualProfile?: { name?: string } } | null | undefined)
      ?.manualProfile?.name ?? null;

  return (
    <div className="bg-bg-card border border-border rounded-xl p-md md:p-lg">
      <div className="flex flex-col md:flex-row md:items-start md:gap-md mb-sm">
        <div className="flex gap-sm items-start flex-1 mb-sm md:mb-0">
          <div className="text-accent text-md md:text-lg leading-none shrink-0">{meta.glyph}</div>
          <div>
            <div className="text-sm text-text-primary capitalize">{meta.label}</div>
            {connectionName && (
              <div className="text-xs text-text-muted mt-0.5">re: {connectionName}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-md">
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-accent opacity-80 hover:opacity-100 transition-opacity"
          >
            {expanded ? "less" : "more"}
          </button>
          <button
            onClick={() => onDismiss(nudge.id)}
            title="Dismiss"
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <p
        className={`text-sm text-text-secondary leading-relaxed ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {nudge.message}
      </p>

      {expanded && (
        <div className="text-xs text-text-muted border-t border-border pt-sm mt-sm leading-relaxed italic">
          <span className="uppercase not-italic tracking-wide text-text-muted mr-sm">Why now</span>
          {nudge.trigger}
        </div>
      )}
    </div>
  );
}

export default function NudgesFeed() {
  const { data: nudges, loading, dismiss } = useNudges();

  if (loading) return null;
  if (!nudges || nudges.length === 0) return null;

  return (
    <section className="mb-xl">
      <div className="flex items-center gap-sm mb-md">
        <span className="text-sm text-text-muted uppercase tracking-wide">
          {SYMBOLS.star} Active Insights
        </span>
        <span className="text-xs text-text-muted bg-bg-elevated border border-border rounded-full px-sm py-0.5">
          {nudges.length}
        </span>
      </div>
      <div className="flex flex-col gap-sm">
        {nudges.map((nudge) => (
          <NudgeCard key={nudge.id} nudge={nudge} onDismiss={dismiss} />
        ))}
      </div>
    </section>
  );
}
