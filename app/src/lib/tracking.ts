import type { LDClient } from "launchdarkly-js-client-sdk";

// Typed wrappers around ldClient.track(). The argument order
// `track(metricKey, data?, metricValue?)` has tripped older LD docs;
// these helpers pin the right shape and centralise the metric keys.
//
// Both metric keys MUST match the metric definitions in LaunchDarkly
// exactly (created via MCP under project `default`).

export const METRIC_TIER_UPGRADE = "tier-upgrade";
export const METRIC_INCENTIVE_ACTIVATED = "incentive-activated";

export function trackTierUpgrade(
  client: LDClient | undefined,
  tier: string
): void {
  if (!client) return;
  client.track(METRIC_TIER_UPGRADE, { tier });
}

export function trackIncentiveActivated(
  client: LDClient | undefined,
  perkKey: string
): void {
  if (!client) return;
  client.track(METRIC_INCENTIVE_ACTIVATED, { perkKey });
}
