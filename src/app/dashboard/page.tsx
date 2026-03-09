"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useApi";
import { SYMBOLS } from "@/lib/symbols";
import ProfileSummary from "@/components/dashboard/ProfileSummary";
import ConnectionsList from "@/components/dashboard/ConnectionsList";
import NudgesFeed from "@/components/dashboard/NudgesFeed";
import AddConnectionModal from "@/components/dashboard/AddConnectionModal";

export default function DashboardPage() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { data: profile, loading: profileLoading, error: profileError, refetch } = useProfile();
  const [showAddModal, setShowAddModal] = useState(false);
  const [connectionsKey, setConnectionsKey] = useState(0);
  const router = useRouter();

  // Redirect to onboarding if profile is missing (404)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!profileLoading && !profile && profileError?.includes("No profile")) {
      router.push("/onboarding");
    }
  }, [profileLoading, profile, profileError, router]);

  const handleLogout = () => {
    logout();
    router.push("/welcome");
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center text-text-muted text-base">
        {SYMBOLS.earth} Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary">
      {/* Header */}
      <header className="bg-bg-card border-b border-border px-4 md:px-10 py-4 md:py-5 flex justify-between items-center flex-wrap gap-4">
        <Link href="/dashboard" className="font-display text-lg md:text-xl text-accent no-underline hover:text-accent-light">
          {SYMBOLS.earth} geoSync
        </Link>
        <nav className="flex items-center gap-3 md:gap-6">
          <span
            onClick={() => router.push("/science")}
            className="text-text-secondary text-xs md:text-sm cursor-pointer hover:text-accent transition-colors"
          >
            The Science
          </span>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="hidden sm:inline text-text-secondary text-xs md:text-sm">
              Welcome, {user?.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-2 py-1 md:px-3 md:py-2 border border-border text-text-muted text-xs md:text-sm rounded-lg transition-colors hover:border-danger hover:text-danger"
            >
              Sign Out
            </button>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="max-w-[1200px] mx-auto px-4 md:px-10 py-6 md:py-10 flex flex-col gap-6 md:gap-10">
        {/* Welcome */}
        <div className="text-center mb-2 md:mb-4">
          <h1 className="text-xl md:text-3xl text-text-primary mb-2 md:mb-3">
            Your Compatibility Dashboard
          </h1>
          <p className="text-sm md:text-lg text-text-secondary">
            Understand your patterns and navigate your relationships with biophysical insight
          </p>
        </div>

        {profile && (
          <ProfileSummary profile={profile} onProfileUpdated={refetch} />
        )}

        <NudgesFeed />

        {/* Connections */}
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-lg md:text-xl text-text-primary m-0">Connections</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 md:px-4 md:py-2 bg-accent text-text-primary text-xs md:text-sm font-semibold rounded-lg transition-colors hover:bg-accent-light"
            >
              {SYMBOLS.star} Add Connection
            </button>
          </div>
          <ConnectionsList key={connectionsKey} />
        </div>
      </main>

      {/* Add Connection Modal */}
      {showAddModal && (
        <AddConnectionModal
          onAdded={() => {
            setConnectionsKey((k) => k + 1);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
