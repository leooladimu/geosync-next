"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SYMBOLS } from "@/lib/symbols";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const router    = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg xl:max-w-xl bg-bg-card border border-border rounded-2xl p-8 md:p-12">
        {/* Logo */}
        <Link
          href="/welcome"
          className="flex items-center gap-2 font-display text-xl text-accent no-underline mb-8"
        >
          <span>{SYMBOLS.earth}</span>
          <span>geoSync</span>
        </Link>

        <h1 className="font-display text-3xl font-semibold text-text-primary mb-2">
          Welcome back
        </h1>
        <p className="text-base text-text-secondary mb-10">
          Sign in to your account.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@gmail.com"
              required
              className="bg-[#e8f0fe] border-none rounded-lg px-4 py-3 text-base text-bg placeholder:text-[#666] focus:outline-2 focus:outline-accent"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-text-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-[#e8f0fe] border-none rounded-lg px-4 py-3 text-base text-bg placeholder:text-[#666] focus:outline-2 focus:outline-accent"
            />
          </div>

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-text-primary font-semibold text-base py-3 rounded-lg flex items-center justify-center gap-2 transition-colors hover:bg-accent-light disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : <>Sign In <span className="text-sm">{SYMBOLS.star}</span></>}
          </button>
        </form>

        <p className="text-sm text-text-muted text-center mt-10">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent no-underline hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
