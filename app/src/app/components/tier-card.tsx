"use client";

import { useState } from "react";
import {
  TIER_META,
  getIncentivesByKeys,
  getIncentivesForTier,
  type Tier,
} from "@/lib/incentives";
import UpgradeCta from "./upgrade-cta";
import PerkActivateButton from "./perk-activate-button";

type Props = {
  tier: Tier;
  /**
   * Optional perk-key override (e.g. from experiment-premium-bundle).
   * When omitted, the tier's default perks render.
   */
  overridePerkKeys?: string[];
  /** Show the "Most popular" recommendation pill above this card. */
  showRecommendation?: boolean;
  /** When true, soften the upgrade CTA per FCA Consumer Duty guidance. */
  softenUpsell?: boolean;
};

export default function TierCard({
  tier,
  overridePerkKeys,
  showRecommendation = false,
  softenUpsell = false,
}: Props) {
  const [upgraded, setUpgraded] = useState(false);

  const meta = TIER_META[tier];
  const perks = overridePerkKeys
    ? getIncentivesByKeys(overridePerkKeys)
    : getIncentivesForTier(tier);
  const isRecommended = showRecommendation && tier === "pro";

  return (
    <article
      className={
        isRecommended
          ? "relative flex flex-col rounded-2xl border border-indigo-500/40 bg-zinc-900/70 p-6 shadow-lg shadow-indigo-500/10 backdrop-blur"
          : "flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur"
      }
    >
      {isRecommended && (
        <span
          aria-label="Most popular tier recommendation"
          className="absolute -top-3 left-6 rounded-full bg-indigo-500/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          Most popular
        </span>
      )}

      <header>
        <h3 className="text-lg font-semibold text-zinc-50">{meta.name}</h3>
        <p className="mt-1 text-sm text-zinc-400">{meta.price}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{meta.tagline}</p>
      </header>

      <dl className="mt-4 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-zinc-500">ATM withdrawal</dt>
          <dd className="font-medium text-zinc-200">{meta.atm}</dd>
        </div>
      </dl>

      <div className="mt-4 flex-1 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-indigo-300">
          <span>Perks</span>
          <span className="text-zinc-500">
            {perks.length === 0 ? "Core banking" : `${perks.length} included`}
          </span>
        </div>
        {perks.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            No add-on perks. Everyday banking, fee-free.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {perks.map((p) => (
              <li
                key={p.key}
                className="flex items-start gap-2 text-sm leading-5"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"
                  aria-hidden
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{p.brand}</span>
                    {upgraded && <PerkActivateButton perkKey={p.key} />}
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-400">
                    {p.blurb}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {tier !== "basic" && (
        <UpgradeCta
          tier={tier}
          soften={softenUpsell}
          upgraded={upgraded}
          onUpgrade={() => setUpgraded(true)}
        />
      )}
    </article>
  );
}
