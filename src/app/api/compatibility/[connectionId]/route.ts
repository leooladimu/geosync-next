import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, serverError } from "@/lib/auth";
import { derive } from "@/lib/bioProfile.service";
import { generate } from "@/lib/compatibility.service";
import type { DerivedProfile, Survey } from "@/lib/types";
import type { BioProfile } from "@prisma/client";

type Params = { params: Promise<{ connectionId: string }> };

// ─── Shared helper ────────────────────────────────────────────────────────────

function profileToDerived(p: BioProfile, adjustments?: {
  chronotype?: string | null;
  stressBaseline?: string | null;
}): DerivedProfile {
  const chronotype = (adjustments?.chronotype ?? p.chronotype) as DerivedProfile["chronotype"];
  const rawStress  = adjustments?.stressBaseline ?? p.stressBaseline;
  const stressBaseline = (rawStress === "fight_flight" ? "fight-flight" : rawStress) as DerivedProfile["stressBaseline"];

  return {
    season:        p.season as DerivedProfile["season"],
    lightProfile:  p.lightProfile === "high_light" ? "high-light" : "low-light",
    latitudeTier:  p.latitudeTier as DerivedProfile["latitudeTier"],
    chronotype,
    stressBaseline,
    vulnerabilityWindow: {
      startMonth: p.vulnerabilityStartMonth,
      endMonth:   p.vulnerabilityEndMonth,
    },
    neurotransmitters: {
      dopamine:  p.dopamine  as DerivedProfile["neurotransmitters"]["dopamine"],
      serotonin: p.serotonin as DerivedProfile["neurotransmitters"]["serotonin"],
    },
  };
}

// ─── GET /api/compatibility/[connectionId] ─── fetch existing report ──────────

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { connectionId } = await params;
    const connection = await db.connection.findFirst({
      where: { id: connectionId, ownerId: user.id },
      include: { compatibilityReport: true },
    });
    if (!connection) return notFound("Connection not found");
    if (!connection.compatibilityReport) return notFound("Report not found");
    return NextResponse.json(connection.compatibilityReport);
  } catch (err) {
    return serverError(err);
  }
}

// ─── POST /api/compatibility/[connectionId] ─── force-regenerate report ───────

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { connectionId } = await params;
    const connection = await db.connection.findFirst({
      where: { id: connectionId, ownerId: user.id },
    });
    if (!connection) return notFound("Connection not found");

    const ownerRow = await db.bioProfile.findUnique({ where: { userId: user.id } });
    if (!ownerRow) return notFound("Owner profile missing");
    const ownerDerived = profileToDerived(ownerRow, {
      chronotype:    ownerRow.adjustedChronotype,
      stressBaseline: ownerRow.adjustedStressBaseline,
    });

    let partnerDerived: DerivedProfile;
    if (connection.connectedUserId) {
      const partnerRow = await db.bioProfile.findUnique({
        where: { userId: connection.connectedUserId },
      });
      if (!partnerRow) return notFound("Partner profile missing");
      partnerDerived = profileToDerived(partnerRow, {
        chronotype:    partnerRow.adjustedChronotype,
        stressBaseline: partnerRow.adjustedStressBaseline,
      });
    } else {
      // Manual profile — data lives in the JSON blob
      const mp = (connection.manualProfile as unknown) as {
        dob: string;
        birthLocation: { lat: number; lng: number };
        survey?: Survey;
      };
      partnerDerived = derive(
        mp.dob,
        mp.birthLocation.lat,
        mp.birthLocation.lng,
        mp.survey ?? { stressResponse: "expand", openness: "situational", socialSeason: "summer", conflictStyle: "process-first" },
      );
    }

    const report = generate(ownerDerived, partnerDerived);

    const updated = await db.compatibilityReport.update({
      where: { connectionId },
      data: {
        scoreOverall:    report.scores.overall,
        scoreChronotype: report.scores.chronotype,
        scoreStress:     report.scores.stress,
        scoreSeasonal:   report.scores.seasonal,
        tierChronotype:  report.tiers.chronotype,
        tierStress:      report.tiers.stress,
        tierSeasonal:    report.tiers.seasonal,
        archetype:       report.archetype,
        dimensions:      report.dimensions as object,
        generatedAt:     report.generatedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return serverError(err);
  }
}
