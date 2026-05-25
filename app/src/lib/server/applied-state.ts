import type { AllocationProposal } from "./allocation-validator";
import { getBaselineAllocation } from "./perk-allocation-service";

// Module-level in-memory store. Used until LAUNCHDARKLY_API_TOKEN is
// configured — at which point /api/perk-allocation/apply writes the
// allocation to the LD JSON flag `applied-perk-allocation` instead, and
// TierSurface reads it from there via the client SDK.
//
// Persistence trade-offs of the stub:
//   - Survives across HTTP requests within a single Node process
//   - LOST on Vercel cold start (next request will see baseline again)
//   - NOT shared across other browser tabs (no streaming push)
//
// All of that goes away the moment the LD-writer-flag path lights up.
let _appliedAllocation: AllocationProposal | null = null;
let _appliedAt: string | null = null;
let _appliedBy: { variationName: string; modelName: string } | null = null;

export function getAppliedAllocation(): AllocationProposal {
  return _appliedAllocation ?? getBaselineAllocation();
}

export function getAppliedMeta() {
  return {
    allocation: getAppliedAllocation(),
    appliedAt: _appliedAt,
    appliedBy: _appliedBy,
    isBaseline: _appliedAllocation === null,
  };
}

export function setAppliedAllocation(
  allocation: AllocationProposal,
  meta: { variationName: string; modelName: string }
): void {
  _appliedAllocation = allocation;
  _appliedAt = new Date().toISOString();
  _appliedBy = meta;
}

export function resetAppliedAllocation(): void {
  _appliedAllocation = null;
  _appliedAt = null;
  _appliedBy = null;
}
