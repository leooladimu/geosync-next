"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { connectionsApi } from "@/lib/api";
import { SYMBOLS } from "@/lib/symbols";

const CONNECTION_TYPES = ["romantic", "family", "platonic", "professional"] as const;

const EMPTY = {
  type: "",
  name: "",
  dob: "",
  city: "",
  state: "",
  country: "",
};

interface AddConnectionModalProps {
  onAdded: () => void;
  onClose: () => void;
}

export default function AddConnectionModal({ onAdded, onClose }: AddConnectionModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function isValid() {
    return form.type && form.name && form.dob && form.city && form.country;
  }

  async function handleSubmit() {
    if (!isValid()) return setError("Please fill in all required fields.");
    if (!token) return setError("Not authenticated.");
    setLoading(true);
    setError(null);
    try {
      await connectionsApi.add(
        {
          type: form.type,
          manualProfile: {
            name: form.name,
            dob: form.dob,
            birthLocation: {
              city: form.city,
              state: form.state || undefined,
              country: form.country,
            },
          },
        },
        token,
      );
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 sm:p-6"
      onClick={onClose}
    >
      {/* Modal */}
      <div
        className="w-full max-w-lg bg-bg-card border border-border rounded-2xl p-8 md:p-10 flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-text-primary">
            {SYMBOLS.star} Add a Connection
          </h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary text-lg transition-colors leading-none"
          >
            ✕
          </button>
        </div>

        {/* Relationship type */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted uppercase tracking-wide">
            Relationship type <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {CONNECTION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                className={`py-3 px-4 rounded-lg border text-sm capitalize transition-colors ${
                  form.type === t
                    ? "border-accent bg-accent-dim/20 text-accent-light"
                    : "border-border bg-bg-elevated text-text-secondary hover:border-border-light"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted uppercase tracking-wide">
            Full name <span className="text-danger">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handle}
            placeholder="Their name"
            className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Date of birth */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted uppercase tracking-wide">
            Date of birth <span className="text-danger">*</span>
          </label>
          <input
            name="dob"
            type="date"
            value={form.dob}
            onChange={handle}
            className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {/* Birth location */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-muted uppercase tracking-wide">
            Birth location <span className="text-danger">*</span>
          </label>
          <input
            name="city"
            value={form.city}
            onChange={handle}
            placeholder="City *"
            className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              name="state"
              value={form.state}
              onChange={handle}
              placeholder="State / Province"
              className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
            <input
              name="country"
              value={form.country}
              onChange={handle}
              placeholder="Country *"
              className="bg-bg-elevated border border-border rounded-lg px-4 py-3 text-base text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !isValid()}
          className="w-full py-3 bg-accent text-text-primary rounded-lg text-base font-semibold hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Adding…" : "Add Connection"}
        </button>
      </div>
    </div>
  );
}
