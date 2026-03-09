/**
 * Typed API client for geosync-next.
 *
 * All requests hit the Next.js App Router routes at /api/*.
 * No base URL needed — same origin in browser, absolute URL required in RSC
 * (pass NEXT_PUBLIC_APP_URL for that path; client components use relative).
 *
 * Usage (client component):
 *   import { profileApi } from "@/lib/api";
 *   const profile = await profileApi.get(token);
 */

// ─── Error class ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core request helper ──────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string | null;
};

async function request<T>(endpoint: string, opts: RequestOptions = {}): Promise<T> {
  const { body, token, ...rest } = opts;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`/api${endpoint}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({ error: res.statusText }));

  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error ?? "Request failed",
      res.status,
    );
  }

  return data as T;
}

// ─── Domain types (shapes returned by our routes) ────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface BioProfile {
  id: string;
  userId: string;
  dob: string;
  birthCity: string;
  birthState: string | null;
  birthCountry: string;
  birthLat: number;
  birthLng: number;
  season: string;
  lightProfile: string;
  latitudeTier: string;
  chronotype: string;
  stressBaseline: string;
  vulnerabilityStartMonth: number;
  vulnerabilityEndMonth: number;
  dopamine: string;
  serotonin: string;
  adjustedChronotype: string | null;
  adjustedStressBaseline: string | null;
  adjustedSocialSeason: string | null;
}

export interface CompatibilityReport {
  id: string;
  connectionId: string;
  scoreOverall: number;
  scoreChronotype: number;
  scoreStress: number;
  scoreSeasonal: number;
  tierChronotype: string;
  tierStress: string;
  tierSeasonal: string;
  archetype: string;
  dimensions: Record<string, unknown>;
  generatedAt: string;
}

export interface Connection {
  id: string;
  ownerId: string;
  type: string;
  connectedUserId: string | null;
  manualProfile: ManualProfileSnapshot | null;
  compatibilityReportId: string | null;
  compatibilityReport?: CompatibilityReport;
  connectedUser?: { id: string; name: string } | null;
  createdAt: string;
}

export interface ManualProfileSnapshot {
  name: string;
  dob: string;
  birthLocation: {
    city: string;
    state?: string;
    country: string;
    lat?: number;
    lng?: number;
  };
}

export interface SeasonalForecast {
  id: string;
  connectionId: string;
  month: number;
  year: number;
  userAEnergyLevel: string;
  userAInVulnerabilityWindow: boolean;
  userBEnergyLevel: string;
  userBInVulnerabilityWindow: boolean;
  mismatchRisk: string;
  recommendations: string[];
  scripts: string[];
}

export interface CoachingNudge {
  id: string;
  userId: string;
  connectionId: string | null;
  category: string;
  trigger: string;
  message: string;
  dismissed: boolean;
  createdAt: string;
  connection?: {
    type: string;
    manualProfile: ManualProfileSnapshot | null;
    connectedUser: { name: string } | null;
  } | null;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateProfileInput {
  dob: string;
  birthLocation: {
    city: string;
    state?: string;
    country: string;
  };
  survey: {
    stressResponse: string;
    openness: string;
    socialSeason: string;
    conflictStyle: string;
  };
}

export type UpdateProfileInput = CreateProfileInput;

export interface CalibrateProfileInput {
  action: "calibrate";
  userAdjustments: {
    chronotype?: string;
    stressBaseline?: string;
    socialSeason?: string;
  };
}

export interface AddConnectionInput {
  type: string;
  connectedUserId?: string;
  manualProfile?: ManualProfileSnapshot & { survey?: CreateProfileInput["survey"] };
}

// ─── API namespaces ───────────────────────────────────────────────────────────

export const authApi = {
  register: (body: RegisterInput) =>
    request<AuthResponse>("/auth/register", { method: "POST", body }),

  login: (body: LoginInput) =>
    request<AuthResponse>("/auth/login", { method: "POST", body }),
};

export const profileApi = {
  get: (token: string) =>
    request<BioProfile>("/profile", { token }),

  create: (body: CreateProfileInput, token: string) =>
    request<BioProfile>("/profile", { method: "POST", body, token }),

  update: (body: UpdateProfileInput, token: string) =>
    request<BioProfile>("/profile", { method: "PUT", body, token }),

  calibrate: (userAdjustments: CalibrateProfileInput["userAdjustments"], token: string) =>
    request<BioProfile>("/profile", {
      method: "PUT",
      body: { action: "calibrate", userAdjustments } satisfies CalibrateProfileInput,
      token,
    }),
};

export const connectionsApi = {
  list: (token: string) =>
    request<Connection[]>("/connections", { token }),

  get: (id: string, token: string) =>
    request<Connection>(`/connections/${id}`, { token }),

  add: (body: AddConnectionInput, token: string) =>
    request<{ connection: Connection; report: CompatibilityReport; matchedExistingUser: boolean }>(
      "/connections",
      { method: "POST", body, token },
    ),

  remove: (id: string, token: string) =>
    request<{ message: string }>(`/connections/${id}`, { method: "DELETE", token }),
};

export const compatibilityApi = {
  get: (connectionId: string, token: string) =>
    request<CompatibilityReport>(`/compatibility/${connectionId}`, { token }),

  regenerate: (connectionId: string, token: string) =>
    request<CompatibilityReport>(`/compatibility/${connectionId}`, { method: "POST", token }),
};

export const forecastApi = {
  get: (connectionId: string, token: string) =>
    request<SeasonalForecast[]>(`/forecast/${connectionId}`, { token }),
};

export const nudgesApi = {
  list: (token: string) =>
    request<CoachingNudge[]>("/nudges", { token }),

  dismiss: (id: string, token: string) =>
    request<CoachingNudge>(`/nudges/${id}`, { method: "PATCH", token }),
};
