import { NextResponse } from "next/server";
import { validateAllocation } from "@/lib/server/allocation-validator";
import {
  getAppliedMeta,
  setAppliedAllocation,
} from "@/lib/server/applied-state";
import {
  readAppliedAllocationFromLD,
  writeAppliedAllocationToLD,
} from "@/lib/server/ld-rest";

export const runtime = "nodejs";

// GET — return the current applied allocation + metadata.
//
// When LAUNCHDARKLY_API_TOKEN is configured, the LD flag is the single
// source of truth: we read the live variation-0 value via the REST API.
// This ensures the strategist console's left pane and the customer-facing
// TierSurface always show the same value, even if the LD flag was modified
// out-of-band (Console edit, separate curl PATCH, etc.).
//
// When the token is absent, we fall back to the in-memory store updated
// by POST (the stub-mode path).
export async function GET() {
  const usingLD = Boolean(process.env.LAUNCHDARKLY_API_TOKEN);

  if (usingLD) {
    const ldValue = await readAppliedAllocationFromLD();
    if (ldValue) {
      return NextResponse.json({
        ok: true,
        allocation: ldValue,
        isBaseline: false, // LD value present — operator (or seed) applied something
        appliedAt: null,
        appliedBy: null,
        persistence: "ld-flag",
      });
    }
    // LD read failed for some reason — fall through to in-memory.
  }

  const meta = getAppliedMeta();
  return NextResponse.json({
    ok: true,
    ...meta,
    persistence: usingLD ? "ld-flag-unreachable-fallback" : "in-memory",
  });
}

// POST — apply a new allocation. Validates the payload, writes to the
// LD flag via REST PATCH (when LAUNCHDARKLY_API_TOKEN is configured) AND
// updates the in-memory store. The LD write streams the new value to every
// connected client; the in-memory store is the fast-path for the server's
// own /api/perk-allocation/apply GET.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", details: "body must be JSON" },
      { status: 400 }
    );
  }

  const { allocation, variationName, modelName } = body as {
    allocation?: unknown;
    variationName?: unknown;
    modelName?: unknown;
  };

  const validation = validateAllocation(allocation);
  if (!validation.valid) {
    return NextResponse.json(
      {
        ok: false,
        reason: "validation-failed",
        details: `${validation.reason}: ${validation.details ?? ""}`,
      },
      { status: 400 }
    );
  }

  if (typeof variationName !== "string" || typeof modelName !== "string") {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing-metadata",
        details: "variationName and modelName must be strings",
      },
      { status: 400 }
    );
  }

  // Persist to in-memory store (always — this is the fast-path for the
  // server's own GET endpoint).
  setAppliedAllocation(validation.allocation, { variationName, modelName });

  // Also write to LD flag if a writer token is configured. This is what
  // makes the customer-facing surface update via streaming push — without
  // it, the apply is only visible to this server process and the strategist
  // UI; with it, every connected client streams the new value.
  let ldWriteResult: Awaited<ReturnType<typeof writeAppliedAllocationToLD>> | null = null;
  if (process.env.LAUNCHDARKLY_API_TOKEN) {
    ldWriteResult = await writeAppliedAllocationToLD(validation.allocation);
    if (!ldWriteResult.ok) {
      // LD write failed — return success on the in-memory side but flag
      // the LD failure so the operator can act. We deliberately don't
      // bubble this as a 5xx because the in-memory store IS updated, and
      // a partial success is still useful in the demo.
      return NextResponse.json({
        ok: true,
        persistence: "in-memory-only",
        ldWrite: ldWriteResult,
        meta: getAppliedMeta(),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    persistence: process.env.LAUNCHDARKLY_API_TOKEN ? "ld-flag" : "in-memory",
    ldWrite: ldWriteResult,
    meta: getAppliedMeta(),
  });
}
