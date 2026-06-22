"use client";

import { useState, type CSSProperties } from "react";
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
  overridePerkKeys?: string[];
  showRecommendation?: boolean;
  softenUpsell?: boolean;
};

// Per-tier visual treatment. Each design is contained within the card border
// and uses background-image patterns/gradients that don't bleed outside.
// Text contrast (white headlines, zinc-300 blurbs) is preserved on every
// treatment.
//   Basic   — subtle dot grid (graph-paper / foundational)
//   Premium — sunset gradient + scattered glow (warm, first-step-up)
//   Pro     — diagonal lines over slate (blueprint, professional momentum)
//   Ultra   — conic gold fan over deep ink (art-deco luxury)
type TierTheme = {
  wrapperClass: string;
  wrapperStyle: CSSProperties;
  bulletClass: string;
  perksLabelClass: string;
  priceClass: string;
  countLabelClass: string;
};

const TIER_THEMES: Record<Tier, TierTheme> = {
  basic: {
    wrapperClass:
      "flex flex-col overflow-hidden rounded-2xl border border-zinc-800 backdrop-blur",
    wrapperStyle: {
      backgroundColor: "rgba(24, 24, 27, 0.55)",
      backgroundImage:
        "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)",
      backgroundSize: "11px 11px",
    },
    bulletClass: "bg-zinc-400",
    perksLabelClass: "text-zinc-400",
    priceClass: "text-zinc-400",
    countLabelClass: "text-zinc-500",
  },
  premium: {
    wrapperClass:
      "flex flex-col overflow-hidden rounded-2xl border border-rose-500/40 backdrop-blur shadow-lg shadow-rose-500/10",
    wrapperStyle: {
      backgroundColor: "rgba(31, 12, 22, 0.85)",
      backgroundImage: [
        "radial-gradient(circle at 18% 22%, rgba(251, 191, 36, 0.14) 0px, transparent 36px)",
        "radial-gradient(circle at 78% 58%, rgba(244, 114, 182, 0.12) 0px, transparent 44px)",
        "radial-gradient(circle at 48% 92%, rgba(251, 146, 60, 0.10) 0px, transparent 30px)",
        "linear-gradient(135deg, rgba(225, 29, 72, 0.18), rgba(251, 146, 60, 0.10) 60%, rgba(251, 191, 36, 0.05))",
      ].join(", "),
    },
    bulletClass: "bg-rose-400",
    perksLabelClass: "text-rose-300",
    priceClass: "text-rose-200/80",
    countLabelClass: "text-rose-200/60",
  },
  pro: {
    wrapperClass:
      "flex flex-col overflow-hidden rounded-2xl border border-cyan-500/40 backdrop-blur shadow-lg shadow-cyan-500/10",
    wrapperStyle: {
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      backgroundImage: [
        "repeating-linear-gradient(45deg, rgba(34, 211, 238, 0.05) 0px, rgba(34, 211, 238, 0.05) 1px, transparent 1px, transparent 14px)",
        "linear-gradient(180deg, rgba(15, 23, 42, 0.4), rgba(2, 6, 23, 0.6))",
      ].join(", "),
    },
    bulletClass: "bg-cyan-400",
    perksLabelClass: "text-cyan-300",
    priceClass: "text-cyan-200/80",
    countLabelClass: "text-cyan-200/60",
  },
  ultra: {
    wrapperClass:
      "flex flex-col overflow-hidden rounded-2xl border border-amber-500/50 backdrop-blur shadow-lg shadow-amber-500/10",
    wrapperStyle: {
      backgroundColor: "rgba(12, 10, 9, 0.92)",
      backgroundImage: [
        "conic-gradient(from 180deg at 50% -10%, transparent 0deg, rgba(251, 191, 36, 0.10) 18deg, transparent 36deg, transparent 72deg, rgba(251, 191, 36, 0.10) 90deg, transparent 108deg, transparent 144deg, rgba(251, 191, 36, 0.10) 162deg, transparent 180deg)",
        "linear-gradient(180deg, rgba(28, 25, 23, 0.65), rgba(12, 10, 9, 0.95))",
      ].join(", "),
    },
    bulletClass: "bg-amber-400",
    perksLabelClass: "text-amber-300",
    priceClass: "text-amber-200/80",
    countLabelClass: "text-amber-200/60",
  },
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
  const theme = TIER_THEMES[tier];

  return (
    <article
      className={`relative p-5 @3xl:p-6 ${theme.wrapperClass}`}
      style={theme.wrapperStyle}
    >
      {isRecommended && (
        <span
          aria-label="Most popular tier recommendation"
          className="absolute -top-3 left-6 rounded-full bg-cyan-500/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white shadow"
        >
          Most popular
        </span>
      )}

      <header>
        <h3 className="text-lg font-semibold text-zinc-50">{meta.name}</h3>
        <p className={`mt-1 text-sm ${theme.priceClass}`}>{meta.price}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{meta.tagline}</p>
      </header>

      <dl className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between text-sm">
          <dt className={theme.countLabelClass}>ATM withdrawal</dt>
          <dd className="font-medium text-zinc-100">{meta.atm}</dd>
        </div>
      </dl>

      <div className="mt-4 flex-1 border-t border-white/10 pt-4">
        <div
          className={`flex items-center justify-between text-xs uppercase tracking-[0.18em] ${theme.perksLabelClass}`}
        >
          <span>Perks</span>
          <span className={theme.countLabelClass}>
            {perks.length === 0 ? "Core banking" : `${perks.length} included`}
          </span>
        </div>
        {perks.length === 0 ? (
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            No add-on perks. Everyday banking, fee-free.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {perks.map((p) => (
              <li
                key={p.key}
                className="flex items-start gap-2 text-sm leading-5"
              >
                <span
                  className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${theme.bulletClass}`}
                  aria-hidden
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-100">{p.brand}</span>
                    {upgraded && <PerkActivateButton perkKey={p.key} />}
                  </div>
                  <p className="mt-0.5 text-xs leading-5 text-zinc-300">
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
