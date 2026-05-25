import { INCENTIVE_CATALOGUE } from "@/lib/incentives";

export type AllocationProposal = {
  premium: string[];
  pro: string[];
  ultra: string[];
};

export type ValidationResult =
  | { valid: true; allocation: AllocationProposal }
  | { valid: false; reason: ValidationFailureReason; details?: string };

export type ValidationFailureReason =
  | "not-an-object"
  | "missing-tier-arrays"
  | "non-string-values"
  | "unknown-perk-keys"
  | "empty-tier";

const CATALOGUE_KEYS = new Set(INCENTIVE_CATALOGUE.map((i) => i.key));
const TIERS = ["premium", "pro", "ultra"] as const;
type ValidTier = (typeof TIERS)[number];

// Validates a raw LLM response against the strict allocation schema.
// Per Q3 (locked 2026-05-25): hard reject on any failure + fire
// `ai-validation-failed` metric event (caller responsibility).
//
// We deliberately do NOT repair malformed output — that's the demo's
// governance moment. Reject visibly, track the failure as a metric,
// let the operator decide whether to retry or rollback the variation.
export function validateAllocation(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, reason: "not-an-object" };
  }
  const obj = raw as Record<string, unknown>;

  for (const tier of TIERS) {
    if (!Array.isArray(obj[tier])) {
      return {
        valid: false,
        reason: "missing-tier-arrays",
        details: `tier '${tier}' is not an array`,
      };
    }
  }

  for (const tier of TIERS) {
    const arr = obj[tier] as unknown[];
    if (arr.some((v) => typeof v !== "string")) {
      return {
        valid: false,
        reason: "non-string-values",
        details: `tier '${tier}' contains a non-string value`,
      };
    }
  }

  const allocation = obj as unknown as AllocationProposal;

  const invalidKeys: string[] = [];
  for (const tier of TIERS) {
    for (const key of allocation[tier]) {
      if (!CATALOGUE_KEYS.has(key)) {
        invalidKeys.push(`${tier}/${key}`);
      }
    }
  }
  if (invalidKeys.length > 0) {
    return {
      valid: false,
      reason: "unknown-perk-keys",
      details: invalidKeys.join(", "),
    };
  }

  for (const tier of TIERS) {
    if (allocation[tier].length === 0) {
      return {
        valid: false,
        reason: "empty-tier",
        details: `tier '${tier}' is empty`,
      };
    }
  }

  return { valid: true, allocation };
}

export type { ValidTier };
