"use client";

import Link from "next/link";
import { useConnections } from "@/hooks/useApi";
import { SYMBOLS } from "@/lib/symbols";

export default function ConnectionsList() {
  const { data: connections, loading, remove } = useConnections();

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this connection?")) return;
    await remove(id);
  }

  if (loading) return null;

  if (!connections || connections.length === 0) {
    return (
      <div className="text-center py-16 text-text-secondary">
        <div className="text-4xl mb-3 opacity-50">{SYMBOLS.earth}</div>
        <div className="text-base">No connections yet</div>
        <div className="text-sm text-text-muted mt-2">
          Add your first connection to see your compatibility analysis
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {connections.map((connection) => {
        const name =
          connection.connectedUser?.name ??
          (connection.manualProfile as { name?: string } | null)?.name ??
          "Unknown Connection";
        const isVerified = !!connection.connectedUser;

        return (
          <div
            key={connection.id}
            className="bg-bg-card border border-border rounded-xl p-5 md:p-6 transition-all hover:border-accent hover:-translate-y-0.5"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div className="flex-1">
                <h3 className="text-base md:text-lg text-text-primary mb-1">
                  {name}
                  {isVerified && (
                    <span
                      className="inline-flex items-center ml-2 text-accent text-xs align-middle cursor-help"
                      title="Matched to a geoSync user"
                    >
                      {SYMBOLS.earth}
                    </span>
                  )}
                </h3>
                <div className="text-sm text-text-muted capitalize">
                  {connection.type}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/report/${connection.id}`}
                className="px-5 py-2.5 text-center text-sm text-accent border border-accent rounded-lg hover:bg-accent-dim/20 transition-colors"
              >
                View Full Report
              </Link>
              <button
                onClick={() => handleDelete(connection.id)}
                className="px-5 py-2.5 text-sm text-danger border border-danger rounded-lg hover:bg-danger/10 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
