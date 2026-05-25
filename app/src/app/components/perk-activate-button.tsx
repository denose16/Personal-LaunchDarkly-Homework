"use client";

import { useState } from "react";
import { useLDClient } from "launchdarkly-react-client-sdk";
import { trackIncentiveActivated } from "@/lib/tracking";

type Props = {
  perkKey: string;
};

// Appears on a perk row only after the user has upgraded to that tier.
// Modeling: in real Helix, an upgrade purchases the *capability* to use
// the perks. You still have to opt into each one (link Spotify account,
// generate a Deliveroo voucher, etc.). That per-perk opt-in is the
// stickiness signal — users who actively activate more perks find more
// value in the bundle. Fires LD's incentive-activated metric.
export default function PerkActivateButton({ perkKey }: Props) {
  const ldClient = useLDClient();
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <span className="inline-flex flex-shrink-0 items-center rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
        ✓ Active
      </span>
    );
  }

  const handleClick = () => {
    trackIncentiveActivated(ldClient ?? undefined, perkKey);
    setActive(true);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex flex-shrink-0 items-center rounded-full border border-indigo-400/50 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-200 transition hover:border-indigo-300 hover:bg-indigo-500/20"
    >
      Activate
    </button>
  );
}
