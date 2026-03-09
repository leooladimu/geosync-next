"use client";

/**
 * Resource hooks — thin wrappers around the API client.
 *
 * Each hook follows the pattern:
 *   const { data, loading, error, refetch } = useXxx();
 *
 * Mutations are returned as plain async functions that re-fetch on success.
 * All hooks read the token from useAuth(), so they must be rendered inside
 * <AuthProvider>.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  profileApi,
  connectionsApi,
  compatibilityApi,
  forecastApi,
  nudgesApi,
  ApiError,
} from "@/lib/api";
import type {
  BioProfile,
  Connection,
  CompatibilityReport,
  SeasonalForecast,
  CoachingNudge,
  CreateProfileInput,
  UpdateProfileInput,
  CalibrateProfileInput,
  AddConnectionInput,
} from "@/lib/api";

// ─── Shared state shape ───────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function initialState<T>(): AsyncState<T> {
  return { data: null, loading: true, error: null };
}

// ─── useProfile ───────────────────────────────────────────────────────────────

interface UseProfileResult extends AsyncState<BioProfile> {
  refetch: () => void;
  create: (input: CreateProfileInput) => Promise<BioProfile>;
  update: (input: UpdateProfileInput) => Promise<BioProfile>;
  calibrate: (adjustments: CalibrateProfileInput["userAdjustments"]) => Promise<BioProfile>;
}

export function useProfile(): UseProfileResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<BioProfile>>(initialState());

  const load = useCallback(async () => {
    if (!token) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await profileApi.get(token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load profile";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const create = useCallback(async (input: CreateProfileInput) => {
    const profile = await profileApi.create(input, token!);
    setState({ data: profile, loading: false, error: null });
    return profile;
  }, [token]);

  const update = useCallback(async (input: UpdateProfileInput) => {
    const profile = await profileApi.update(input, token!);
    setState({ data: profile, loading: false, error: null });
    return profile;
  }, [token]);

  const calibrate = useCallback(
    async (adjustments: CalibrateProfileInput["userAdjustments"]) => {
      const profile = await profileApi.calibrate(adjustments, token!);
      setState({ data: profile, loading: false, error: null });
      return profile;
    },
    [token],
  );

  return { ...state, refetch: load, create, update, calibrate };
}

// ─── useConnections ───────────────────────────────────────────────────────────

interface UseConnectionsResult extends AsyncState<Connection[]> {
  refetch: () => void;
  add: (input: AddConnectionInput) => Promise<Connection>;
  remove: (id: string) => Promise<void>;
}

export function useConnections(): UseConnectionsResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<Connection[]>>(initialState());

  const load = useCallback(async () => {
    if (!token) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await connectionsApi.list(token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load connections";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const add = useCallback(async (input: AddConnectionInput) => {
    const result = await connectionsApi.add(input, token!);
    await load();
    return result.connection;
  }, [token, load]);

  const remove = useCallback(async (id: string) => {
    await connectionsApi.remove(id, token!);
    setState((s) => ({
      ...s,
      data: s.data?.filter((c) => c.id !== id) ?? null,
    }));
  }, [token]);

  return { ...state, refetch: load, add, remove };
}

// ─── useCompatibilityReport ───────────────────────────────────────────────────

interface UseCompatibilityReportResult extends AsyncState<CompatibilityReport> {
  refetch: () => void;
  regenerate: () => Promise<CompatibilityReport>;
}

export function useCompatibilityReport(connectionId: string): UseCompatibilityReportResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<CompatibilityReport>>(initialState());

  const load = useCallback(async () => {
    if (!token || !connectionId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await compatibilityApi.get(connectionId, token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load report";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token, connectionId]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const regenerate = useCallback(async () => {
    const report = await compatibilityApi.regenerate(connectionId, token!);
    setState({ data: report, loading: false, error: null });
    return report;
  }, [connectionId, token]);

  return { ...state, refetch: load, regenerate };
}

// ─── useForecast ──────────────────────────────────────────────────────────────

interface UseForecastResult extends AsyncState<SeasonalForecast[]> {
  refetch: () => void;
}

export function useForecast(connectionId: string): UseForecastResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<SeasonalForecast[]>>(initialState());

  const load = useCallback(async () => {
    if (!token || !connectionId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await forecastApi.get(connectionId, token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load forecast";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token, connectionId]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  return { ...state, refetch: load };
}

// ─── useNudges ────────────────────────────────────────────────────────────────

interface UseNudgesResult extends AsyncState<CoachingNudge[]> {
  refetch: () => void;
  dismiss: (id: string) => Promise<void>;
}

export function useNudges(): UseNudgesResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<CoachingNudge[]>>(initialState());

  const load = useCallback(async () => {
    if (!token) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await nudgesApi.list(token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load nudges";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  const dismiss = useCallback(async (id: string) => {
    await nudgesApi.dismiss(id, token!);
    setState((s) => ({
      ...s,
      data: s.data?.filter((n) => n.id !== id) ?? null,
    }));
  }, [token]);

  return { ...state, refetch: load, dismiss };
}

// ─── useConnection (single) ───────────────────────────────────────────────────

interface UseConnectionResult extends AsyncState<Connection> {
  refetch: () => void;
}

export function useConnection(id: string): UseConnectionResult {
  const { token, isAuthenticated } = useAuth();
  const [state, setState] = useState<AsyncState<Connection>>(initialState());

  const load = useCallback(async () => {
    if (!token || !id) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await connectionsApi.get(id, token);
      setState({ data, loading: false, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to load connection";
      setState({ data: null, loading: false, error: msg });
    }
  }, [token, id]);

  useEffect(() => {
    if (isAuthenticated) load();
  }, [isAuthenticated, load]);

  return { ...state, refetch: load };
}
