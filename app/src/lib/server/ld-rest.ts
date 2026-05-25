import type { AllocationProposal } from "./allocation-validator";

const LD_REST_BASE = "https://app.launchdarkly.com/api/v2";
const PROJECT_KEY = "default";
const FLAG_KEY = "applied-perk-allocation";

export type LDWriteResult =
  | { ok: true; version: number }
  | { ok: false; status: number; details: string };

// Reads the live value of variation 0 of `applied-perk-allocation` from LD's
// REST API. Used by GET /api/perk-allocation/apply when LAUNCHDARKLY_API_TOKEN
// is configured, so the strategist console's left pane and the customer-
// facing TierSurface always reflect the same source of truth (the LD flag).
export async function readAppliedAllocationFromLD(): Promise<AllocationProposal | null> {
  const token = process.env.LAUNCHDARKLY_API_TOKEN;
  if (!token) return null;

  const url = `${LD_REST_BASE}/flags/${PROJECT_KEY}/${FLAG_KEY}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: token,
        "LD-API-Version": "20240415",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      variations?: Array<{ value?: unknown }>;
    };
    const value = data.variations?.[0]?.value;
    if (
      typeof value === "object" &&
      value !== null &&
      Array.isArray((value as { premium?: unknown }).premium) &&
      Array.isArray((value as { pro?: unknown }).pro) &&
      Array.isArray((value as { ultra?: unknown }).ultra)
    ) {
      return value as AllocationProposal;
    }
    return null;
  } catch {
    return null;
  }
}

// Writes the `applied-perk-allocation` flag's variation-0 value via LD's REST
// API. Uses JSON Patch (RFC 6902) — semantic patches are the alternative but
// don't expose a "replace variation value" instruction directly.
//
// When this succeeds, LD's streaming SDK pushes the new value to every
// connected client within ~100ms. TierSurface reads via useFlags() so the
// customer surface updates without a refresh, in every open tab.
export async function writeAppliedAllocationToLD(
  allocation: AllocationProposal
): Promise<LDWriteResult> {
  const token = process.env.LAUNCHDARKLY_API_TOKEN;
  if (!token) {
    return { ok: false, status: 0, details: "LAUNCHDARKLY_API_TOKEN missing" };
  }

  const url = `${LD_REST_BASE}/flags/${PROJECT_KEY}/${FLAG_KEY}`;
  const body = [
    {
      op: "replace",
      path: "/variations/0/value",
      value: allocation,
    },
  ];

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
        "LD-API-Version": "20240415",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return {
        ok: false,
        status: res.status,
        details: errorText.slice(0, 500),
      };
    }

    const data = (await res.json()) as { version?: number };
    return { ok: true, version: data.version ?? 0 };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      details: err instanceof Error ? err.message : String(err),
    };
  }
}
