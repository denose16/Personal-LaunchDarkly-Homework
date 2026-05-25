import type { LDContext } from "launchdarkly-react-client-sdk";
import type { MockUser } from "./mock-user";

// Build the LaunchDarkly evaluation context from a MockUser.
// Custom attributes (tier, region, ageBand, vulnerabilityFlags, etc.)
// are top-level fields per LD's single-kind context model — targeting
// rules in Phase 5 will reference them by name.
export function buildLDContext(user: MockUser): LDContext {
  return {
    kind: "user",
    key: user.key,
    name: user.name,
    email: user.email,
    country: user.country,
    region: user.region,
    ageBand: user.ageBand,
    tier: user.tier,
    accountAgeMonths: user.accountAgeMonths,
    kycLevel: user.kycLevel,
    vulnerabilityFlags: user.vulnerabilityFlags,
    consentMarketing: user.consentMarketing,
    earlyAccess: user.earlyAccess,
  };
}
