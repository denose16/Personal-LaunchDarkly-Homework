"use client";

import { useLDClient } from "launchdarkly-react-client-sdk";
import { trackTierUpgrade } from "@/lib/tracking";
import type { Tier } from "@/lib/incentives";

type Props = {
  tier: Tier;
  /**
   * When true, replaces the active CTA with a softer "Learn more" link
   * (set by the parent when targeting-vulnerable-customer-mode is true).
   */
  soften?: boolean;
  /** Whether the user has already upgraded this tier (parent-owned state). */
  upgraded: boolean;
  /** Called after the tier-upgrade event has fired, before parent re-renders. */
  onUpgrade: () => void;
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
        ✓ Upgraded — activate your perks below
      </button>
    );
  }

  const handleClick = () => {
    trackTierUpgrade(ldClient ?? undefined, tier);
    onUpgrade();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
    >
      Upgrade to {label}
    </button>
  );
}
