-- CreateEnum
CREATE TYPE "ConnectionType" AS ENUM ('romantic', 'family', 'platonic', 'professional');

-- CreateEnum
CREATE TYPE "Openness" AS ENUM ('quick', 'gradual', 'situational');

-- CreateEnum
CREATE TYPE "StressResponse" AS ENUM ('freeze', 'expand', 'fight_flight');

-- CreateEnum
CREATE TYPE "SocialSeason" AS ENUM ('spring', 'summer', 'fall', 'winter');

-- CreateEnum
CREATE TYPE "ConflictStyle" AS ENUM ('resolve_now', 'process_first', 'avoid');

-- CreateEnum
CREATE TYPE "Season" AS ENUM ('spring', 'summer', 'fall', 'winter');

-- CreateEnum
CREATE TYPE "LightProfile" AS ENUM ('high_light', 'low_light');

-- CreateEnum
CREATE TYPE "LatitudeTier" AS ENUM ('high', 'mid', 'low');

-- CreateEnum
CREATE TYPE "Chronotype" AS ENUM ('lark', 'owl', 'neutral');

-- CreateEnum
CREATE TYPE "NeuroLevel" AS ENUM ('high', 'moderate', 'low');

-- CreateEnum
CREATE TYPE "CompatibilityTier" AS ENUM ('high', 'moderate', 'low');

-- CreateEnum
CREATE TYPE "SeasonalTier" AS ENUM ('protective', 'moderate', 'risky');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('rising', 'peak', 'dipping', 'low');

-- CreateEnum
CREATE TYPE "MismatchRisk" AS ENUM ('low', 'moderate', 'high');

-- CreateEnum
CREATE TYPE "NudgeCategory" AS ENUM ('withdrawal', 'over_commitment', 'intensity_seeking', 'scarcity_lock', 'optimism_bias');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BioProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "birthCity" TEXT NOT NULL,
    "birthState" TEXT,
    "birthCountry" TEXT NOT NULL,
    "birthLat" DOUBLE PRECISION NOT NULL,
    "birthLng" DOUBLE PRECISION NOT NULL,
    "openness" "Openness" NOT NULL,
    "stressResponse" "StressResponse" NOT NULL,
    "socialSeason" "SocialSeason" NOT NULL,
    "conflictStyle" "ConflictStyle" NOT NULL,
    "season" "Season" NOT NULL,
    "lightProfile" "LightProfile" NOT NULL,
    "latitudeTier" "LatitudeTier" NOT NULL,
    "chronotype" "Chronotype" NOT NULL,
    "stressBaseline" "StressResponse" NOT NULL,
    "vulnerabilityStartMonth" INTEGER NOT NULL,
    "vulnerabilityEndMonth" INTEGER NOT NULL,
    "dopamine" "NeuroLevel" NOT NULL,
    "serotonin" "NeuroLevel" NOT NULL,
    "adjustedChronotype" "Chronotype",
    "adjustedStressBaseline" "StressResponse",
    "adjustedSocialSeason" "SocialSeason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "ConnectionType" NOT NULL,
    "connectedUserId" TEXT,
    "manualProfile" JSONB,
    "compatibilityReportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Connection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompatibilityReport" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "scoreOverall" INTEGER NOT NULL,
    "scoreChronotype" INTEGER NOT NULL,
    "scoreStress" INTEGER NOT NULL,
    "scoreSeasonal" INTEGER NOT NULL,
    "tierChronotype" "CompatibilityTier" NOT NULL,
    "tierStress" "CompatibilityTier" NOT NULL,
    "tierSeasonal" "SeasonalTier" NOT NULL,
    "archetype" TEXT NOT NULL,
    "dimensions" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompatibilityReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonalForecast" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "userAEnergyLevel" "EnergyLevel" NOT NULL,
    "userAInVulnerabilityWindow" BOOLEAN NOT NULL,
    "userBEnergyLevel" "EnergyLevel" NOT NULL,
    "userBInVulnerabilityWindow" BOOLEAN NOT NULL,
    "mismatchRisk" "MismatchRisk" NOT NULL,
    "recommendations" TEXT[],
    "scripts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonalForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingNudge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "category" "NudgeCategory" NOT NULL,
    "trigger" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachingNudge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BioProfile_userId_key" ON "BioProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompatibilityReport_connectionId_key" ON "CompatibilityReport"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalForecast_connectionId_month_year_key" ON "SeasonalForecast"("connectionId", "month", "year");

-- AddForeignKey
ALTER TABLE "BioProfile" ADD CONSTRAINT "BioProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Connection" ADD CONSTRAINT "Connection_connectedUserId_fkey" FOREIGN KEY ("connectedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompatibilityReport" ADD CONSTRAINT "CompatibilityReport_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonalForecast" ADD CONSTRAINT "SeasonalForecast_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingNudge" ADD CONSTRAINT "CoachingNudge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingNudge" ADD CONSTRAINT "CoachingNudge_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
