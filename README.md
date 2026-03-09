# ♁ geoSync

**Biophysical relationship compatibility — based on chronobiology, not astrology.**

geoSync analyzes relationship compatibility through three biological dimensions: chronotype synchrony (daily energy rhythms), stress response patterns (nervous system defaults under threat), and seasonal vulnerability (predictable energy cycles throughout the year).

**Live:** [geosync.oleo.dev](https://geosync.oleo.dev)

---

## The Idea

People who share a life operate inside each other's biology. When your circadian rhythms are out of phase, one person is winding down while the other is ramping up. When your stress responses collide — two freezers avoiding confrontation, or two fighters escalating — nobody covers the gap. When your vulnerability windows overlap, you hit your hardest months simultaneously.

A low compatibility score isn't a verdict — it's a user manual. The couples who struggle aren't the incompatible ones. They're the ones who don't know they're incompatible.

## How It Works

1. **Create a biological profile** — birth date, location, and four questions about your natural patterns
2. **Add connections** — partner, family, friends, colleagues — with their birth data
3. **Get a compatibility report** — scored across three dimensions with relationship strategies
4. **Seasonal forecasts** — 90-day predictions of mismatch risk with specific recommendations
5. **Coaching nudges** — context-aware tips based on the current season and your combined profiles
6. **Self-calibration** — override any derived trait with your lived experience

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Styling | Tailwind CSS v4 with custom `@theme` tokens |
| Database | PostgreSQL via Neon (serverless, pooled) |
| ORM | Prisma 6 with `prisma-client` generator |
| Auth | JWT (bcrypt + jose) |
| Hosting | Vercel |
| Geocoding | OpenStreetMap Nominatim (no API key) |

## Project Structure

```
src/
├── app/
│   ├── api/               # 9 API routes (auth, profile, connections, compatibility, forecast, nudges)
│   ├── welcome/            # Landing page
│   ├── login/              # Authentication
│   ├── register/           # Registration
│   ├── onboarding/         # 3-step biological profile builder
│   ├── dashboard/          # Main app — profile, connections, nudges
│   ├── report/[id]/        # Compatibility report with expandable dimensions
│   └── science/            # The research behind the model (6 expandable sections)
├── components/dashboard/   # ProfileSummary, ConnectionsList, NudgesFeed, AddConnectionModal
├── hooks/                  # useAuth, useApi (SWR-style data hooks)
└── lib/
    ├── api.ts              # Client-side API layer
    ├── auth.ts             # Server-side JWT helpers
    ├── db.ts               # Prisma client singleton
    ├── symbols.ts          # Unicode glyph constants
    └── *.service.ts        # Business logic (bioProfile, compatibility, forecast, geocode, nudge)

prisma/
└── schema.prisma           # 6 models: User, BioProfile, Connection, CompatibilityReport, SeasonalForecast, CoachingNudge
```

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Neon DATABASE_URL and a JWT_SECRET

# Run migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string |
| `JWT_SECRET` | Any long random string (`openssl rand -hex 32`) |

## The Science

The compatibility model draws on peer-reviewed research in:

- **Chronobiology** — circadian phase, social jetlag, photoperiodic imprinting
- **Polyvagal theory** — freeze/expand/fight-flight stress response patterns
- **Environmental epidemiology** — birth season effects on neurotransmitter baselines
- **Behavioral entrainment** — how sustained schedules rewire biological defaults

Full citations and explanations are available at [geosync.oleo.dev/science](https://geosync.oleo.dev/science).

## License

MIT
