"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/api";
import { SYMBOLS } from "@/lib/symbols";

// ─── Custom accordion select ──────────────────────────────────────────────────

interface SelectOption { value: string; label: string; icon?: string }

function CustomSelect({
  value, onChange, options, placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`w-full text-left px-4 py-3 pr-10 rounded-lg border transition-colors text-base relative
          ${value ? "text-text-primary border-accent/40" : "text-text-secondary border-border"}
          bg-bg-elevated hover:border-accent/60 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20
          ${open ? "rounded-b-none" : ""}`}
      >
        {selected ? selected.label : placeholder}
        <span
          className={`absolute right-4 top-1/2 -translate-y-1/2 border-x-[6px] border-x-transparent border-t-[6px] border-t-accent transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 bg-bg-card border border-accent/40 border-t-0 rounded-b-lg shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left px-4 py-3 flex items-center gap-2 text-base transition-colors border-l-[3px]
                ${value === opt.value
                  ? "bg-accent/10 border-l-accent text-accent"
                  : "border-l-transparent text-text-primary hover:bg-accent/10 hover:border-l-accent hover:text-accent"}
                not-last:border-b not-last:border-border/30`}
            >
              {opt.icon && <span className="opacity-80">{opt.icon}</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Onboarding page ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const { token } = useAuth();
  const router    = useRouter();

  const [formData, setFormData] = useState({
    dob: "",
    birthLocation: { city: "", state: "", country: "" },
    survey: { openness: "", stressResponse: "", socialSeason: "", conflictStyle: "" },
  });

  function update(section: "birthLocation" | "survey", field: string, value: string) {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as Record<string, string>), [field]: value },
    }));
  }

  function canProceed() {
    if (step === 1) return !!(formData.dob && formData.birthLocation.city && formData.birthLocation.country);
    if (step === 2) return !!(formData.survey.openness && formData.survey.stressResponse);
    if (step === 3) return !!(formData.survey.socialSeason && formData.survey.conflictStyle);
    return false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await profileApi.create(formData, token!);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary px-6 py-12">
      {/* Header */}
      <header className="max-w-2xl xl:max-w-3xl mx-auto mb-10 md:mb-12 text-center">
        <div className="text-5xl xl:text-6xl mb-3 md:mb-4">{SYMBOLS.earth}</div>
        <h1 className="text-3xl xl:text-4xl font-semibold mb-2 md:mb-3">
          Build Your Biological Profile
        </h1>
        <p className="text-base md:text-lg text-text-secondary mb-8">
          We&apos;ll use your birth data and 4 simple questions to generate your compatibility blueprint
        </p>

        {/* Progress bar */}
        <div className="max-w-sm mx-auto mb-6 md:mb-10 h-[4px] bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === step ? "bg-accent" : i < step ? "bg-border-light" : "bg-border"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Card */}
      <main className="max-w-2xl xl:max-w-3xl mx-auto">
        <div className="bg-bg-card border border-border rounded-2xl p-8 md:p-12">

          {/* ── Step 1: Birth Data ── */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold mb-2 md:mb-3">Step 1: Birth Data</h2>
              <p className="text-base text-text-secondary mb-6 md:mb-8 leading-relaxed">
                Your date and location of birth create the foundation of your biological profile.
              </p>

              <div className="bg-bg-elevated border-l-[3px] border-l-accent rounded-r-lg px-4 py-3 mb-6 md:mb-8">
                <div className="font-semibold text-accent text-sm mb-1">🌍 Why this matters</div>
                <p className="text-sm text-text-secondary leading-snug">
                  Season of birth affects neurotransmitter development, while latitude influences stress response
                  patterns. This isn&apos;t astrology — it&apos;s environmental imprinting.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-sm md:text-base">Date of Birth</label>
                  <input
                    type="date" required value={formData.dob}
                    onChange={(e) => setFormData((p) => ({ ...p, dob: e.target.value }))}
                    className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-base">Birth Location</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input placeholder="City" required value={formData.birthLocation.city}
                      onChange={(e) => update("birthLocation", "city", e.target.value)}
                      className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                    <input placeholder="State / Province" value={formData.birthLocation.state}
                      onChange={(e) => update("birthLocation", "state", e.target.value)}
                      className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                    <input placeholder="Country" required value={formData.birthLocation.country}
                      onChange={(e) => update("birthLocation", "country", e.target.value)}
                      className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" />
                  </div>
                </div>

                <div className="flex justify-end mt-4 md:mt-6">
                  <button type="submit" disabled={!canProceed()}
                    className="w-full sm:w-auto bg-accent text-text-primary font-semibold text-sm md:text-base px-6 md:px-8 py-3 md:py-3.5 rounded-lg transition-colors hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed">
                    Next Step
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 2: Social Patterns ── */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold mb-2 md:mb-3">Step 2: Social Patterns</h2>
              <p className="text-base text-text-secondary mb-6 md:mb-8 leading-relaxed">
                How you approach people and situations reveals your underlying biological patterns.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); setStep(3); }} className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-sm md:text-base">
                    When meeting new people, you tend to be:
                  </label>
                  <CustomSelect
                    value={formData.survey.openness}
                    onChange={(v) => update("survey", "openness", v)}
                    placeholder="Select your style…"
                    options={[
                      { value: "quick",       label: "Quick to open up",       icon: "💫" },
                      { value: "gradual",     label: "Gradual and measured",   icon: "🌱" },
                      { value: "situational", label: "Depends on the situation", icon: "🔄" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-sm md:text-base">
                    Under stress, your first instinct is to:
                  </label>
                  <CustomSelect
                    value={formData.survey.stressResponse}
                    onChange={(v) => update("survey", "stressResponse", v)}
                    placeholder="Select your response…"
                    options={[
                      { value: "freeze",       label: "Freeze and withdraw", icon: "❄️" },
                      { value: "expand",       label: "Expand and engage",   icon: "🌊" },
                      { value: "fight-flight", label: "Fight or flight",     icon: "⚡" },
                    ]}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
                  <button type="button" onClick={() => setStep(1)}
                    className="w-full sm:w-auto border border-border text-text-secondary font-semibold text-sm md:text-base px-6 py-3 rounded-lg transition-colors hover:border-accent hover:text-accent">
                    Back
                  </button>
                  <button type="submit" disabled={!canProceed()}
                    className="w-full sm:w-auto bg-accent text-text-primary font-semibold text-sm md:text-base px-6 md:px-8 py-3 rounded-lg transition-colors hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed">
                    Next Step
                  </button>
                </div>
              </form>
            </>
          )}

          {/* ── Step 3: Relationship Patterns ── */}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold mb-2 md:mb-3">Step 3: Relationship Patterns</h2>
              <p className="text-base text-text-secondary mb-6 md:mb-8 leading-relaxed">
                Your social and conflict patterns complete your compatibility blueprint.
              </p>

              <div className="bg-bg-elevated border-l-[3px] border-l-accent rounded-r-lg px-4 py-3 mb-6 md:mb-8">
                <div className="font-semibold text-accent text-sm mb-1">🧠 The science</div>
                <p className="text-sm text-text-secondary leading-snug">
                  These answers help us understand your chronotype, seasonal preferences, and conflict resolution
                  style — all biologically influenced patterns that affect compatibility.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-sm md:text-base">
                    You feel most energized and social during:
                  </label>
                  <CustomSelect
                    value={formData.survey.socialSeason}
                    onChange={(v) => update("survey", "socialSeason", v)}
                    placeholder="Select your season…"
                    options={[
                      { value: "spring", label: "Spring (new beginnings)", icon: "🌸" },
                      { value: "summer", label: "Summer (peak energy)",    icon: "☀️" },
                      { value: "fall",   label: "Fall (cozy connections)", icon: "🍂" },
                      { value: "winter", label: "Winter (intimate bonds)", icon: "❄️" },
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-text-secondary text-sm md:text-base">
                    When conflicts arise, you prefer to:
                  </label>
                  <CustomSelect
                    value={formData.survey.conflictStyle}
                    onChange={(v) => update("survey", "conflictStyle", v)}
                    placeholder="Select your approach…"
                    options={[
                      { value: "resolve-now",    label: "Resolve immediately",          icon: "⚡" },
                      { value: "process-first",  label: "Process first, then resolve",  icon: "🧘" },
                      { value: "avoid",          label: "Avoid and let time heal",      icon: "🕊️" },
                    ]}
                  />
                </div>

                {error && (
                  <div className="px-4 py-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                    {error}
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6">
                  <button type="button" onClick={() => setStep(2)}
                    className="w-full sm:w-auto border border-border text-text-secondary font-semibold text-sm md:text-base px-6 py-3 rounded-lg transition-colors hover:border-accent hover:text-accent">
                    Back
                  </button>
                  <button type="submit" disabled={!canProceed() || loading}
                    className="w-full sm:w-auto bg-accent text-text-primary font-semibold text-sm md:text-base px-6 md:px-8 py-3 rounded-lg transition-colors hover:bg-accent-light disabled:opacity-60 disabled:cursor-not-allowed">
                    {loading ? "Creating Profile…" : "Complete Profile"}
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
