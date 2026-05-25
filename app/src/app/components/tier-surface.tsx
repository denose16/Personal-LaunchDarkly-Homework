"use client";

import { useCallback, useEffect, useState } from "react";
import { useFlags } from "launchdarkly-react-client-sdk";
import TierCard from "./tier-card";
import LegacyTierCard from "./legacy-tier-card";
import VulnerableCustomerBanner from "./vulnerable-customer-banner";
import {
  DEFAULT_PERKS_BY_TIER,
  TIERS_ORDERED,
  type Tier,
} from "@/lib/incentives";
import {
  EXPERIMENT_FLAG_CAMEL_KEY,
  isPremiumBundleVariation,
} from "@/lib/experiment";

type Allocation = {
  premium: string[];
  pro: string[];
  ultra: string[];
};

type LDFlags = {
  releaseIncentivesV2?: boolean;
  targetingVulnerableCustomerMode?: boolean;
  [EXPERIMENT_FLAG_CAMEL_KEY]?: unknown;
  appliedPerkAllocation?: Allocation;
};

const IN_CODE_BASELINE: Allocation = {
  premium: [...DEFAULT_PERKS_BY_TIER.premium],
  pro: [...DEFAULT_PERKS_BY_TIER.pro],
  ultra: [...DEFAULT_PERKS_BY_TIER.ultra],
};

function isAllocation(value: unknown): value is Allocation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.premium) &&
    Array.isArray(v.pro) &&
    Array.isArray(v.ultra)
  );
}

function allocationsEqual(a: Allocation, b: Allocation): boolean {
  if (a.premium.length !== b.premium.length) return false;
  if (a.pro.length !== b.pro.length) return false;
  if (a.ultra.length !== b.ultra.length) return false;
  for (let i = 0; i < a.premium.length; i++) if (a.premium[i] !== b.premium[i]) return false;
  for (let i = 0; i < a.pro.length; i++) if (a.pro[i] !== b.pro[i]) return false;
  for (let i = 0; i < a.ultra.length; i++) if (a.ultra[i] !== b.ultra[i]) return false;
  return true;
}

// Render hierarchy:
//   IF vulnerable → in-code baseline (defense in depth)
//   ELSE         → applied-perk-allocation from LD (streamed via useFlags)
//                  + fetch-on-mount fallback + focus/visibility re-fetch
//                  → fast-laned streaming + reliable tab-return refresh
//      IF in experiment-premium-bundle → Premium overridden by experiment
export default function TierSurface() {
  const flags = useFlags<LDFlags>();
  const showV2 = flags.releaseIncentivesV2 === true;
  const vulnerableMode = flags.targetingVulnerableCustomerMode === true;

  const experimentVariation = flags[EXPERIMENT_FLAG_CAMEL_KEY];
  const premiumOverride = isPremiumBundleVariation(experimentVariation)
    ? experimentVariation.premium
    : undefined;

  const flagAllocation = isAllocation(flags.appliedPerkAllocation)
    ? flags.appliedPerkAllocation
    : null;

  const [fetchedAllocation, setFetchedAllocation] = useState<Allocation | null>(null);

  // Single fetch helper used by mount, focus, and visibility-change paths.
  const refetchApplied = useCallback(async () => {
    if (vulnerableMode) return;
    try {
      const res = await fetch("/api/perk-allocation/apply", {
        method: "GET",
        cache: "no-store",
      });
      const data = await res.json();
      if (isAllocation(data?.allocation)) {
        // Only setState if value actually changed — avoids spurious renders
        // and React DevTools noise during the playback.
        setFetchedAllocation((prev) =>
          prev && allocationsEqual(prev, data.allocation) ? prev : data.allocation
        );
      }
    } catch {
      /* keep prior state */
    }
  }, [vulnerableMode]);

  // Initial fetch on mount.
  useEffect(() => {
    // Async fetch + setState — not the cascading-render pattern the lint
    // rule targets. Suppression matches the same justification used in
    // identity-provider.tsx and strategist-console.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetchApplied();
  }, [refetchApplied]);

  // Focus / visibility listeners — when the user returns to this tab from
  // the strategist (or any other tab where they applied a new allocation),
  // we pull the latest from the LD-backed GET endpoint immediately. This is
  // the belt to the streaming-via-useFlags suspenders: if the SDK push lands
  // first, we use it; if not, the focus refetch catches it.
  useEffect(() => {
    const onFocus = () => refetchApplied();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetchApplied();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refetchApplied]);

  // Prefer the explicitly-fetched value: we control its refresh cadence
  // (mount + focus + visibilitychange), so it reflects the LD flag's REST
  // value at the most recent user-perceptible moment. Fall back to the
  // streaming-via-useFlags value only when no fetch has landed yet — this
  // guards against the SDK serving a stale cached value when streaming push
  // failed silently. Falls through to in-code baseline as a last resort.
  const sourceAllocation: Allocation = vulnerableMode
    ? IN_CODE_BASELINE
    : (fetchedAllocation ?? flagAllocation ?? IN_CODE_BASELINE);

  const visibleTiers: Tier[] = vulnerableMode
    ? TIERS_ORDERED.filter((t) => t !== "ultra")
    : TIERS_ORDERED;

  const gridClass = vulnerableMode
    ? "grid grid-cols-1 gap-4 sm:grid-cols-3"
    : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4";

  function perksForTier(tier: Tier): string[] | undefined {
    if (tier === "basic") return undefined;
    // Note: experiment-premium-bundle (`premiumOverride`) is intentionally
    // NOT used as a fallback here. Per user direction (2026-05-25), the
    // operator's applied AI allocation supersedes the experiment override
    // on Premium so the demo flow is consistent — applying in /demo/strategist
    // updates ALL tiers visibly, not just Pro/Ultra. The experiment flag
    // continues to evaluate in LD (live data, audit trail) but doesn't
    // visually conflict with the AI-driven applied state on the customer
    // surface. See CHANGELOG Entry 24.
    return sourceAllocation[tier];
  }

  // `premiumOverride` is intentionally unused — see comment in perksForTier.
  // Kept resolved-but-unused so the lint warning stays surfaced if anyone
  // re-introduces the experiment-as-override behaviour without re-reading
  // the rationale.
  void premiumOverride;

  return (
    <div className="space-y-4">
      <VulnerableCustomerBanner />
      <section aria-label="Account tiers" className={gridClass}>
        {visibleTiers.map((tier) =>
          showV2 ? (
            <TierCard
              key={tier}
              tier={tier}
              overridePerkKeys={perksForTier(tier)}
              showRecommendation={!vulnerableMode}
              softenUpsell={vulnerableMode}
            />
          ) : (
            <LegacyTierCard key={tier} tier={tier} />
          )
        )}
      </section>
    </div>
  );
}
