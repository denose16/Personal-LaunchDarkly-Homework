import { NextResponse } from "next/server";
import {
  generateProposal,
  type GenerateRequest,
} from "@/lib/server/perk-allocation-service";

// Force Node.js runtime (the LD server SDK uses Node-specific networking).
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid-request", details: "body must be JSON" },
      { status: 400 }
    );
  }

  if (body.identity !== "default" && body.identity !== "vulnerable") {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid-identity",
        details: "identity must be 'default' or 'vulnerable'",
      },
      { status: 400 }
    );
  }

  if (
    body.forceStrategy !== undefined &&
    body.forceStrategy !== "revenue" &&
    body.forceStrategy !== "retention" &&
    body.forceStrategy !== "balanced"
  ) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid-force-strategy",
        details: "forceStrategy must be 'revenue', 'retention', or 'balanced'",
      },
      { status: 400 }
    );
  }

  try {
    const result = await generateProposal(body);
    if (!result.ok) {
      // Validation failure (or vulnerable exclusion) — we return 200 with
      // ok: false so the client can surface the structured reason. Reserve
      // non-2xx codes for genuine server faults (next catch block).
      return NextResponse.json(result);
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[perk-allocation/generate] unexpected error:", err);
    return NextResponse.json(
      {
        ok: false,
        reason: "internal-error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
