"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SYMBOLS } from "@/lib/symbols";

export default function RegisterPage() {
  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg xl:max-w-xl bg-bg-card border border-border rounded-2xl p-8 md:p-12">
        {/* Back */}
        <Link
          href="/welcome"
          className="inline-flex items-center gap-2 text-text-muted text-sm mb-6 no-underline hover:text-accent transition-colors"
        >
          ← Back
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{SYMBOLS.earth}</div>
          <h1 className="font-display text-3xl font-semibold text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-base text-text-secondary">
            Start your compatibility journey with geoSync
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {[
            { label: "Name",             type: "text",     val: name,            set: setName,            ph: "Your name" },
            { label: "Email",            type: "email",    val: email,           set: setEmail,           ph: "your@email.com" },
            { label: "Password",         type: "password", val: password,        set: setPassword,        ph: "••••••••" },
            { label: "Confirm Password", type: "password", val: confirmPassword, set: setConfirmPassword, ph: "••••••••" },
          ].map(({ label, type, val, set, ph }) => (
            <div key={label} className="flex flex-col gap-2">
              <label className="text-sm text-text-secondary font-medium">{label}</label>
              <input
                type={type}
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                required
                minLength={type === "password" ? 6 : undefined}
                className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
              />
            </div>
          ))}

          {error && (
            <p className="text-danger text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-accent text-text-primary font-semibold text-base py-3 rounded-lg transition-colors hover:bg-accent-light disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-text-secondary text-center mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
