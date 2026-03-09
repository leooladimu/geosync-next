"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SYMBOLS } from "@/lib/symbols";

const SECTIONS = [
  {
    glyph: "☉\uFE0E",
    id: "chronobiology",
    title: "Chronobiology",
    subtitle: "The science of biological time",
    summary:
      "Your body runs on multiple clocks. Understanding them is the foundation of compatibility.",
    body: [
      "Every cell in your body contains molecular clocks that regulate when hormones are released, when neurotransmitters peak, and when your metabolism shifts gears. These clocks are set partially by genetics, partially by light exposure, and partially by the photoperiod — the ratio of daylight to darkness — during your early development.",
      "The key insight for relationships: people with similar chronotypes experience the world in synchrony. They wake up at similar energy levels, peak together, and wind down together. People with opposing chronotypes are essentially living in different time zones while sharing the same physical space. This creates friction not because either person is wrong, but because their biological realities are out of phase.",
      "Chronotype isn't about preference. It's about the actual circadian phase of your biological systems. An owl forced to wake at 6am is experiencing what researchers call 'social jetlag' — a chronic misalignment between their biological clock and social obligations. Over time, this creates cumulative stress that affects mood, cognition, and relationship capacity.",
    ],
    citations: [
      "Roenneberg, T. (2012). Internal Time: Chronotypes, Social Jet Lag, and Why You're So Tired. Harvard University Press.",
      "Foster, R.G. & Kreitzman, L. (2017). Circadian Rhythms: A Very Short Introduction. Oxford University Press.",
    ],
  },
  {
    glyph: "♁\uFE0E",
    id: "stress-response",
    title: "Stress Response Patterns",
    subtitle: "How threat reorganizes the nervous system",
    summary:
      "Under genuine threat, people don't become better versions of themselves. They become more themselves.",
    body: [
      "When something you care about is genuinely threatened, your nervous system executes pre-programmed response patterns before conscious thought enters the equation. These patterns — freeze, expand/problem-solve, or fight/flight — are shaped by genetics, early environment, and repeated experience. They're not character flaws or virtues. They're biological defaults.",
      "The freeze response (withdrawal, going internal, needing space) is often misread as avoidance or coldness. The expand response (immediate problem-solving, discomfort driving action) is often misread as controlling or insensitive. The fight/flight response (immediate emotional or physical reaction) is often misread as aggression or volatility. In all cases, the misreading creates secondary conflict on top of the original stress.",
      "Compatibility in stress response isn't about matching. It's about complementarity that creates coverage rather than collision. Two freezers may avoid necessary confrontation. Two fighters may escalate unnecessarily. But a freezer paired with someone who can hold ground without forcing engagement — that's protective coverage. The key is knowing what you each do under pressure, and building explicit protocols for those moments.",
    ],
    citations: [
      "Porges, S.W. (2011). The Polyvagal Theory: Neurophysiological Foundations of Emotions, Attachment, Communication, and Self-Regulation. W. W. Norton & Company.",
      "Levine, P.A. (2010). In an Unspoken Voice: How the Body Releases Trauma and Restores Goodness. North Atlantic Books.",
    ],
  },
  {
    glyph: "♈\uFE0E",
    id: "seasonal-imprinting",
    title: "Seasonal Imprinting",
    subtitle: "Why birth season matters more than astrology",
    summary:
      "The photoperiod during your first months of life leaves a persistent signature on your neurobiology.",
    body: [
      "During early development, the ratio of daylight to darkness you experience helps calibrate your developing stress response systems and neurotransmitter baselines. This isn't mystical. It's the same mechanism that sets migration patterns in birds and breeding cycles in mammals — environmental cues shaping biology during critical developmental windows.",
      "Spring and summer births, with their longer photoperiods, correlate with different developmental trajectories than fall and winter births. The effect sizes are modest at the individual level, but they're consistent across large populations. More importantly, they interact with latitude: the seasonal effect is stronger at higher latitudes where photoperiod variation is more extreme.",
      "For relationships, the relevant insight is about vulnerability timing. People tend to have predictable seasonal patterns in their energy, sociability, and resilience. When two people's vulnerability windows overlap — when both are in low-energy, high-stress periods simultaneously — that's when relationships face their hardest tests. Knowing these patterns in advance allows for preparation rather than surprise.",
    ],
    citations: [
      "Torrey, E.F. et al. (1997). Seasonality of births in schizophrenia and bipolar disorder. Schizophrenia Research.",
      "Disanto, G. et al. (2016). Month of birth, vitamin D and risk of immune-mediated disease. BMC Medicine.",
    ],
  },
  {
    glyph: "☽\uFE0E",
    id: "entrainment",
    title: "Behavioral Entrainment",
    subtitle: "Why you might not match your birth data",
    summary:
      "Decades of external schedule can rewire a biological default — and that rewiring is real.",
    body: [
      "The human circadian system is plastic, not fixed. While the photoperiodic imprint at birth sets a baseline, sustained environmental cues — light exposure, meal timing, social schedules, exercise — can shift the expressed chronotype significantly over years and decades.",
      "This is called behavioral entrainment: the process by which your biological clock synchronizes to external time cues. A natural night owl who has worked early shifts for fifteen years may have genuinely entrained to an earlier rhythm. The original imprint still exists at the level of gene expression, but the expressed behavior may have moved substantially toward the imprint's opposite.",
      "A useful mental model: your birth profile is your hardware default. Behavioral entrainment is a persistent software setting that overrides the default while it's maintained. Neither is more 'real' — they operate at different levels. The practical implication is that when the external schedule is removed (retirement, extended leave, sabbatical), many people find themselves drifting back toward their biological default, sometimes to their own surprise.",
      "This is why geoSync includes a calibration step. If your lived experience consistently contradicts what your birth data predicts, your lived experience is the more relevant data point for relationship compatibility purposes. You interact with people from your current expressed state, not your theoretical biological baseline.",
    ],
    citations: [
      "Roenneberg, T. et al. (2012). Social jetlag and obesity. Current Biology.",
      "Wittmann, M. et al. (2006). Social jetlag: misalignment of biological and social time. Chronobiology International.",
      "Monk, T.H. et al. (2000). The relationship of chronotype to sleep duration and sleepiness. Chronobiology International.",
    ],
  },
  {
    glyph: "♁\uFE0E",
    id: "selfknowledge",
    title: "Self-Knowledge as Data",
    subtitle: "When your experience should override the model",
    summary:
      "Population correlations are starting hypotheses. Your consistent self-report is evidence.",
    body: [
      "Every derived profile in geoSync is a Bayesian prior: a prediction based on what is statistically likely given your birth data. Like any prior, it should be updated when evidence contradicts it.",
      "Consistent, cross-context self-knowledge is strong evidence. If you have always understood yourself as a morning person — not occasionally, not when circumstances require it, but as a stable feature of your identity across decades and contexts — that consistency is more reliable than a population-level correlation. The correlation describes what is probable; your experience describes what is actual, at least for you.",
      "The situations where birth data is most likely to be misleading: chronotype in people with more than ten years of externally-structured early schedules; stress response in people who have done significant therapeutic or developmental work around their default patterns; social season in people who have lived in climates dramatically different from their birth latitude.",
      "The situations where birth data is most likely to be accurate despite contradicting self-report: stress response under genuine threat (not day-to-day stress, but the kind that bypasses the frontal lobe); chronotype during extended periods of unconstrained schedule; social energy in the month before and after your vulnerability window.",
      "The calibration feature in geoSync is not an invitation to override the model because you dislike what it says. It is an invitation to override the model because you have better data. Those are different things, and only you can tell the difference.",
    ],
    citations: [
      "Fleeson, W. (2001). Toward a structure- and process-integrated view of personality. Journal of Personality and Social Psychology.",
      "Vazire, S. & Mehl, M.R. (2008). Knowing me, knowing you: the accuracy and unique predictive validity of self-ratings and other-ratings of daily behavior. Journal of Personality and Social Psychology.",
    ],
  },
  {
    glyph: "♎\uFE0E",
    id: "limits",
    title: "The Limits of This Approach",
    subtitle: "What geoSync cannot do",
    summary:
      "Biological compatibility is a real phenomenon, but it's not destiny.",
    body: [
      "geoSync is designed to help you understand pattern-level compatibility: the kinds of friction and flow that tend to emerge when two specific biological profiles interact. It is not designed to predict whether a relationship will succeed, whether you should stay or leave, or whether someone is 'right' for you.",
      "The model says nothing about values, life goals, communication skills, or the willingness to grow and adapt. These factors often override biological friction. Two people with chronotype conflict and opposing stress responses can build excellent relationships if they have explicit protocols, mutual respect, and shared purpose. Conversely, two people with perfect biological compatibility can destroy each other through dishonesty, contempt, or incompatible life goals.",
      "Use this tool as a map of likely terrain, not as a verdict. The couples who struggle aren't the incompatible ones. They're the ones who don't know they're incompatible — who keep trying to operate as if their patterns match when they don't, who blame each other for biological differences that are nobody's fault.",
      "The goal isn't to find someone whose profile matches yours. The goal is to understand the specific kind of mismatch you have, if you have one, and build protocols that protect both of you from its predictable pitfalls. That's work you can do. But you can't do it if you don't know what you're working with.",
    ],
    citations: [
      "Gottman, J.M. & Silver, N. (2015). The Seven Principles for Making Marriage Work. Harmony Books.",
      "Johnson, S.M. (2008). Hold Me Tight: Seven Conversations for a Lifetime of Love. Little, Brown and Company.",
    ],
  },
];

export default function SciencePage() {
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { token } = useAuth();

  const homeLink = token ? "/dashboard" : "/welcome";

  function toggleCard(index: number) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Top bar */}
        <div className="flex justify-between items-center mb-10 pb-6 border-b border-border">
          <Link
            href={homeLink}
            className="text-sm text-text-muted hover:text-accent transition-colors"
          >
            ← {token ? "Dashboard" : "Home"}
          </Link>
          <Link
            href={homeLink}
            className="font-display text-lg text-accent hover:text-accent-light transition-colors"
          >
            {SYMBOLS.earth} geoSync
          </Link>
        </div>

        {/* Header */}
        <div className="flex gap-5 items-start mb-10">
          <div className="text-4xl text-accent leading-none shrink-0">
            {SYMBOLS.star}
          </div>
          <div>
            <h1 className="text-3xl text-text-primary mb-2 font-display">
              The Science Behind geoSync
            </h1>
            <p className="text-base text-text-secondary">
              Biophysical relationship compatibility based on chronobiology, not astrology
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="bg-bg-card border border-border rounded-xl p-6 md:p-8 mb-10">
          <p className="text-base text-text-secondary leading-relaxed mb-4">
            geoSync analyzes relationship compatibility through three biophysical
            dimensions: chronotype (daily energy rhythms), stress response
            (nervous system patterns under threat), and seasonal vulnerability
            (predictable energy cycles throughout the year).
          </p>
          <p className="text-base text-text-secondary leading-relaxed">
            These patterns are grounded in research from circadian biology,
            psychophysiology, and environmental epidemiology. They describe
            tendencies, not destinies — probabilities, not verdicts.
          </p>
        </div>

        {/* Section cards */}
        <div className="flex flex-col gap-4 mb-16">
          {SECTIONS.map((section, index) => {
            const isExpanded = expandedCards.has(index);
            return (
              <div
                key={section.id}
                className="bg-bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Card header row */}
                <button
                  onClick={() => toggleCard(index)}
                  className="w-full text-left p-6 md:p-8 flex gap-4 items-start hover:bg-bg-elevated transition-colors"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  <div className="text-2xl text-accent leading-none shrink-0 mt-0.5">
                    {section.glyph}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl text-text-primary mb-1">
                      {section.title}
                    </h2>
                    <p className="text-sm text-text-muted italic mb-3">
                      {section.subtitle}
                    </p>
                    {/* Summary — always visible */}
                    <p className="text-base text-text-secondary leading-relaxed">
                      {section.summary}
                    </p>
                  </div>
                  <span className={`text-xl text-accent shrink-0 mt-0.5 transition-transform duration-200 select-none ${isExpanded ? "rotate-45" : ""}`}>
                    +
                  </span>
                </button>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="px-6 md:px-8 pb-8 animate-in fade-in duration-200 border-t border-border">
                    <div className="flex flex-col gap-4 mt-6 mb-8">
                      {section.body.map((paragraph, i) => (
                        <p key={i} className="text-base text-text-secondary leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    <div className="pt-6 border-t border-border flex flex-col gap-3">
                      {section.citations.map((cite, i) => (
                        <p key={i} className="text-sm text-text-muted italic leading-relaxed">
                          {cite}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-10 border-t border-border">
          <p className="text-sm text-text-muted italic">
            This is a living document. Research in chronobiology and relationship
            science continues to evolve, and geoSync updates accordingly.
          </p>
        </div>

      </div>
    </div>
  );
}
