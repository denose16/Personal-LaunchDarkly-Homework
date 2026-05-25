"use client";

import { INCENTIVE_CATALOGUE } from "@/lib/incentives";
import {
  COST_TIER_LABEL,
  COST_TIER_RANGE,
  PERK_ENGAGEMENT_MOCK,
  costTierFor,
  type CostTier,
} from "@/lib/engagement-mock";

const TIERS_DISPLAY_ORDER: CostTier[] = ["low", "medium", "high"];

// Joins the catalogue (brand/blurb/category) with the engagement mock
// (cost/lift) into one row per perk, then groups by cost tier.
function buildPerkRows() {
  const rows = INCENTIVE_CATALOGUE.map((incentive) => {
    const eng = PERK_ENGAGEMENT_MOCK[incentive.key];
    return {
      key: incentive.key,
      brand: incentive.brand,
      blurb: incentive.blurb,
      category: incentive.category,
      costPerMonthGBP: eng?.costPerMonthGBP ?? 0,
      conversionLiftPct: eng?.conversionLiftPct ?? 0,
      tier: eng ? costTierFor(eng.costPerMonthGBP) : ("low" as CostTier),
    };
  });

  // Sort each tier by lift descending so the highest-impact perks
  // surface first within their cost band.
  const byTier: Record<CostTier, typeof rows> = {
    low: [],
    medium: [],
    high: [],
  };
  for (const row of rows) {
    byTier[row.tier].push(row);
  }
  for (const tier of TIERS_DISPLAY_ORDER) {
    byTier[tier].sort((a, b) => b.conversionLiftPct - a.conversionLiftPct);
  }
  return byTier;
}

function CostChip({ cost }: { cost: number }) {
  return (
    <span className="inline-flex flex-shrink-0 items-center rounded-full border border-zinc-700 bg-zinc-900/50 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
      £{cost}/mo
    </span>
  );
}

function LiftChip({ lift }: { lift: number }) {
  // Calibrate colour intensity to the lift magnitude — high-lift perks
  // pop more visually, which matches how an operator scans for impact.
  const tone =
    lift >= 30
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
      : lift >= 20
        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
        : lift >= 12
          ? "border-amber-500/30 bg-amber-500/5 text-amber-200"
          : "border-zinc-700 bg-zinc-900/40 text-zinc-400";
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] ${tone}`}
    >
      +{lift}% conv
    </span>
  );
}

function PerkRow({
  brand,
  blurb,
  costPerMonthGBP,
  conversionLiftPct,
}: {
  brand: string;
  blurb: string;
  costPerMonthGBP: number;
  conversionLiftPct: number;
}) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-zinc-800/60 bg-zinc-950/40 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-100">{brand}</p>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{blurb}</p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <CostChip cost={costPerMonthGBP} />
        <LiftChip lift={conversionLiftPct} />
      </div>
    </li>
  );
}

function CostBlock({
  tier,
  rows,
}: {
  tier: CostTier;
  rows: ReturnType<typeof buildPerkRows>[CostTier];
}) {
  const totalLiftAtTier = rows.reduce((sum, r) => sum + r.conversionLiftPct, 0);
  const avgLift = rows.length > 0 ? Math.round(totalLiftAtTier / rows.length) : 0;
  const totalCost = rows.reduce((sum, r) => sum + r.costPerMonthGBP, 0);

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
      <header>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
            {COST_TIER_LABEL[tier]}
          </h3>
          <span className="text-[10px] text-zinc-500">{COST_TIER_RANGE[tier]}</span>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {rows.length} perks · avg lift +{avgLift}% · total cost £{totalCost}/mo
        </p>
      </header>
      <ul className="space-y-2">
        {rows.map((row) => (
          <PerkRow
            key={row.key}
            brand={row.brand}
            blurb={row.blurb}
            costPerMonthGBP={row.costPerMonthGBP}
            conversionLiftPct={row.conversionLiftPct}
          />
        ))}
      </ul>
    </section>
  );
}

export default function AvailablePerks() {
  const byTier = buildPerkRows();
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
      <header className="mb-4 border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
          Available perks to offer
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          The library the AI strategist pulls from. 21 perks across three cost
          bands; per-perk projections fed to the LLM at proposal time. Sorted
          by conversion lift within each band.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TIERS_DISPLAY_ORDER.map((tier) => (
          <CostBlock key={tier} tier={tier} rows={byTier[tier]} />
        ))}
      </div>
    </section>
  );
}
