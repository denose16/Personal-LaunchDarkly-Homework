import type { LDContext } from "@launchdarkly/node-server-sdk";
import type { MockUser } from "@/lib/mock-user";

// Server-side context builder. Mirrors lib/ld-context.ts but emits a type
// from the server SDK package (the client + server SDKs use separately-declared
// LDContext types that are structurally identical but nominally distinct).
export function buildServerContext(user: MockUser): LDContext {
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
