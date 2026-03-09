import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthUser, unauthorized, notFound, serverError } from "@/lib/auth";
import { derive } from "@/lib/bioProfile.service";
import { generateForecast } from "@/lib/forecast.service";
import type { DerivedProfile, Survey } from "@/lib/types";
import type { BioProfile } from "@prisma/client";

type Params = { params: Promise<{ connectionId: string }> };

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

// ─── GET /api/forecast/[connectionId] ────────────────────────────────────────

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();

  try {
    const { connectionId } = await params;
    const connection = await db.connection.findFirst({
      where: { id: connectionId, ownerId: user.id },
    });
    if (!connection) return notFound("Connection not found");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear  = now.getFullYear();

    // Return cached forecasts if we have 3 current months
    const cached = await db.seasonalForecast.findMany({
      where: {
        connectionId,
        year:  { gte: currentYear },
        month: { gte: currentMonth },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
      take: 3,
    });

    if (cached.length >= 3) return NextResponse.json(cached);

    // Generate fresh forecasts
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

    const forecastData = generateForecast(ownerDerived, partnerDerived, currentMonth, currentYear);

    // Replace stale forecasts atomically
    const forecasts = await db.$transaction(async (tx) => {
      await tx.seasonalForecast.deleteMany({ where: { connectionId } });
      return tx.seasonalForecast.createManyAndReturn({
        data: forecastData.map((f) => ({
          connectionId,
          month:        f.month,
          year:         f.year,
          userAEnergyLevel:          f.userA.energyLevel,
          userAInVulnerabilityWindow: f.userA.inVulnerabilityWindow,
          userBEnergyLevel:          f.userB.energyLevel,
          userBInVulnerabilityWindow: f.userB.inVulnerabilityWindow,
          mismatchRisk:  f.mismatchRisk,
          recommendations: f.recommendations,
          scripts:         f.scripts,
        })),
      });
    });

    return NextResponse.json(forecasts);
  } catch (err) {
    return serverError(err);
  }
}
