"use client";

import { useLDClient } from "launchdarkly-react-client-sdk";
import { trackTierUpgrade } from "@/lib/tracking";
import type { Tier } from "@/lib/incentives";

type Props = {
  tier: Tier;
  soften?: boolean;
  upgraded: boolean;
  onUpgrade: () => void;
};

// Per-tier button colour matches the tier's design theme (see tier-card.tsx
// TIER_THEMES). Rose for Premium, cyan for Pro, amber for Ultra.
const UPGRADE_BUTTON_CLASS: Record<Exclude<Tier, "basic">, string> = {
  premium:
    "bg-rose-500 hover:bg-rose-400 focus-visible:outline-rose-300 text-white",
  pro: "bg-cyan-500 hover:bg-cyan-400 focus-visible:outline-cyan-300 text-white",
  ultra:
    "bg-amber-500 hover:bg-amber-400 focus-visible:outline-amber-300 text-zinc-950",
};

export default function UpgradeCta({
  tier,
  soften = false,
  upgraded,
  onUpgrade,
}: Props) {
  const ldClient = useLDClient();
  const label = tier.charAt(0).toUpperCase() + tier.slice(1);

  if (soften) {
    return (
      <a
        href="#learn-more"
        className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
      >
        Learn more about {label}
      </a>
    );
  }

  if (upgraded) {
    return (
      <button
        type="button"
        disabled
        className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200"
      >
        ✓ Upgraded to {label} — perks active
      </button>
    );
  }

  const handleClick = () => {
    trackTierUpgrade(ldClient ?? undefined, tier);
    onUpgrade();
  };

  const colourClass =
    tier === "basic" ? "" : UPGRADE_BUTTON_CLASS[tier];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition ${colourClass}`}
    >
      Upgrade to {label}
    </button>
  );
}
