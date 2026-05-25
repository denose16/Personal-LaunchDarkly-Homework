import type { Tier } from "./incentives";

export type AgeBand = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export type KycLevel = "basic" | "enhanced" | "premier";
export type VulnerabilityFlag =
  | "low-income"
  | "recently-bereaved"
  | "financial-hardship"
  | "health-related";

export type MockUser = {
  key: string;
  name: string;
  email: string;
  country: "GB";
  region: string;
  ageBand: AgeBand;
  tier: Tier;
  accountAgeMonths: number;
  kycLevel: KycLevel;
  vulnerabilityFlags: VulnerabilityFlag[];
  consentMarketing: boolean;
  earlyAccess: boolean;
};

// Default demo user. Stable identity so a second browser tab gets the same
// context — useful when we add cross-tab identity stitching in later phases.
export const DEMO_USER_MATT: MockUser = {
  key: "demo-user-matt-001",
  name: "Matt Helix",
  email: "matt@helix.demo",
  country: "GB",
  region: "London",
  ageBand: "35-44",
  tier: "basic",
  accountAgeMonths: 14,
  kycLevel: "enhanced",
  vulnerabilityFlags: [],
  consentMarketing: true,
  earlyAccess: false,
};

// FCA Consumer Duty demo persona — same demographics as Matt, but with a
// resilience-driver vulnerability flag set. Used to demonstrate that the
// targeting-vulnerable-customer-mode flag rule fires and the UI adapts
// (Ultra hidden, recommendation pills suppressed, neutral guidance banner).
// In real Helix, vulnerabilityFlags would be sourced from KYC + monitoring,
// customer self-disclosure, or third-party signals — never agent-inferred.
export const DEMO_USER_VULNERABLE: MockUser = {
  key: "demo-user-vulnerable-001",
  name: "Sam Helix",
  email: "sam@helix.demo",
  country: "GB",
  region: "Manchester",
  ageBand: "25-34",
  tier: "basic",
  accountAgeMonths: 4,
  kycLevel: "basic",
  vulnerabilityFlags: ["low-income"],
  consentMarketing: true,
  earlyAccess: false,
};
