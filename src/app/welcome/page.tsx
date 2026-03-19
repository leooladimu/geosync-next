import Link from "next/link";
import { SYMBOLS } from "@/lib/symbols";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl text-center">

        {/* Glyph */}
        <div className="text-6xl xl:text-8xl text-accent leading-none mb-6">
          {SYMBOLS.earth}
        </div>

        {/* Title */}
        <h1 className="font-display text-6xl xl:text-8xl font-bold text-text-primary tracking-tight leading-none mb-5">
          geoSync
        </h1>

        {/* Tagline */}
        <p className="text-lg xl:text-xl text-text-secondary leading-relaxed mb-10">
          Your relationships, read through the lens of<br className="hidden sm:block" /> when and where you began.
        </p>

        {/* Divider stars */}
        <div className="flex justify-center gap-3 text-accent text-sm mb-10">
          <span>{SYMBOLS.star}</span>
          <span>{SYMBOLS.star}</span>
          <span>{SYMBOLS.star}</span>
        </div>

        {/* Feature list */}
        <ul className="text-left flex flex-col gap-5 mb-16">
          <li className="flex items-start gap-4 text-text-secondary text-sm leading-relaxed">
            <span className="text-base shrink-0 text-accent mt-0.5">{SYMBOLS.star}</span>
            <span>
              <strong className="text-text-primary">No astrology.</strong> We use birth location,
              season, and biophysical patterns to generate your profile.
            </span>
          </li>
          <li className="flex items-start gap-4 text-text-secondary text-sm leading-relaxed">
            <span className="text-base shrink-0 text-accent mt-0.5">{SYMBOLS.moon}</span>
            <span>
              <strong className="text-text-primary">Three-dimensional compatibility.</strong>{" "}
              Chronotype sync, stress response patterns, and seasonal vulnerability windows.
            </span>
          </li>
          <li className="flex items-start gap-4 text-text-secondary text-sm leading-relaxed">
            <span className="text-base shrink-0 text-accent mt-0.5">{SYMBOLS.sun}</span>
            <span>
              <strong className="text-text-primary">Seasonal forecasting.</strong> Know when your
              relationship will thrive and when it needs extra support.
            </span>
          </li>
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-3 mb-10">
          <Link
            href="/register"
            className="block bg-accent text-text-primary font-semibold text-base py-4 px-8 rounded-xl text-center transition-colors hover:bg-accent-light"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="block border border-border text-text-secondary font-medium text-base py-4 px-8 rounded-xl text-center transition-colors hover:border-accent hover:text-accent"
          >
            Sign In
          </Link>
        </div>

        {/* Fine print */}
        <p className="text-xs text-text-muted italic leading-relaxed">
          Built on chronobiology, environmental epigenetics, and geomagnetic research — not astrology.
        </p>

      </div>
    </div>
  );
}
