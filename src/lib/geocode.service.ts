/**
 * geocode.service.ts
 *
 * Resolves a city/country pair to lat/lng using the Nominatim API.
 * Uses native fetch (available in Node 18+ and Next.js) — no axios needed.
 *
 * IMPORTANT: This must only be called server-side (API routes / Server Actions).
 * Nominatim's usage policy forbids client-side calls from browsers.
 */

interface GeocodeInput {
  city: string;
  state?: string;
  country: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
}

export async function geocodeBirthLocation({
  city,
  state,
  country,
}: GeocodeInput): Promise<GeocodeResult> {
  const query = [city, state, country].filter(Boolean).join(", ");

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: {
      // Nominatim requires a descriptive User-Agent — update with your contact
      "User-Agent": "geoSync/2.0 (contact@geosync.app)",
    },
    // Next.js: don't cache geocode responses — locations change rarely but
    // this call is already infrequent (only during onboarding).
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Nominatim request failed: ${res.status} ${res.statusText}`);
  }

  const data: NominatimResult[] = await res.json();

  if (!data.length) {
    throw new Error(`Could not geocode location: "${query}"`);
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}
