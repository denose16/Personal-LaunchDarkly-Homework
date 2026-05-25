import Anthropic from "@anthropic-ai/sdk";
import { getAIClient, getLDClient } from "./ld-server";
import {
  validateAllocation,
  type AllocationProposal,
  type ValidationResult,
} from "./allocation-validator";
import {
  formatCatalogueForPrompt,
  formatEngagementForPrompt,
} from "@/lib/engagement-mock";
import { DEFAULT_PERKS_BY_TIER } from "@/lib/incentives";
import {
  DEMO_USER_MATT,
  DEMO_USER_VULNERABLE,
  type MockUser,
} from "@/lib/mock-user";
import { buildServerContext } from "./server-context";
import type { LDAICompletionConfig } from "@launchdarkly/server-sdk-ai";

const AI_CONFIG_KEY = "perk-allocation-strategist";
const METRIC_VALIDATION_FAILED = "ai-validation-failed";

export type GenerateRequest = {
  identity: "default" | "vulnerable";
};

export type GenerateResponse =
  | {
      ok: true;
      mode: "live" | "stub";
      variationName: string;
      modelName: string;
      providerName: string;
      proposal: AllocationProposal;
      durationMs: number;
    }
  | {
      ok: false;
      mode: "live" | "stub";
      reason: "vulnerable-excluded" | "validation-failed" | "ai-call-failed";
      details?: string;
      variationName?: string;
    };

function resolveUser(identity: "default" | "vulnerable"): MockUser {
  return identity === "vulnerable" ? DEMO_USER_VULNERABLE : DEMO_USER_MATT;
}

// The baseline allocation is what vulnerable customers always see and is
// also the default value of the applied-perk-allocation flag (per Q5).
export function getBaselineAllocation(): AllocationProposal {
  return {
    premium: [...DEFAULT_PERKS_BY_TIER.premium],
    pro: [...DEFAULT_PERKS_BY_TIER.pro],
    ultra: [...DEFAULT_PERKS_BY_TIER.ultra],
  };
}

export type Strategy = "revenue" | "retention" | "balanced";

// LD's AI Configs SDK exposes the resolved config (model + messages + tracker)
// but NOT the variation key. We need to know which strategy was assigned so
// we can label the UI (and choose the right stub allocation when in stub mode).
// Each variation's system prompt has a distinctive keyword that we fingerprint.
// Fragile if you rewrite prompts — keep the keywords in sync with the LD
// variation prompts in this file's STRATEGY_KEYWORDS map.
const STRATEGY_KEYWORDS: Record<Strategy, string> = {
  revenue: "MAXIMISE UPGRADE CONVERSION",
  retention: "MAXIMISE STICKINESS",
  balanced: "BALANCE conversion",
};

function detectStrategy(systemPrompt: string | undefined): Strategy {
  if (!systemPrompt) return "revenue";
  for (const [strategy, keyword] of Object.entries(STRATEGY_KEYWORDS)) {
    if (systemPrompt.includes(keyword)) return strategy as Strategy;
  }
  return "revenue";
}

const STRATEGY_LABELS: Record<Strategy, string> = {
  revenue: "Claude Haiku — Revenue Optimiser",
  retention: "Claude Haiku — Retention Optimiser",
  balanced: "GPT-4o-mini — Balanced",
};

// Pre-canned proposals per strategy. Used when ANTHROPIC_API_KEY is absent
// OR when the AI Config assigns a provider we don't have keys for (e.g.,
// the OpenAI variation lands at 0% allocation but might briefly be assigned
// during a live raise before code lands).
const STUB_PROPOSALS: Record<Strategy, AllocationProposal> = {
  revenue: {
    premium: ["spotify-individual", "deliveroo-plus-5", "headspace-annual"],
    pro: [
      "apple-music",
      "audible-monthly",
      "classpass-20",
      "travel-insurance-basic",
      "fx-interbank",
      "priority-pass",
    ],
    ultra: [
      "spotify-family",
      "deliveroo-plus-25",
      "disney-plus",
      "sky-premium",
      "travel-insurance-premium",
      "concierge-24-7",
      "isa-bonus-rate",
      "mobile-phone-insurance",
    ],
  },
  retention: {
    premium: ["spotify-individual", "deliveroo-plus-5", "isa-bonus-rate"],
    pro: [
      "spotify-individual",
      "deliveroo-plus-5",
      "fx-interbank",
      "boots-advantage-3x",
      "headspace-annual",
      "apple-music",
    ],
    ultra: [
      "spotify-family",
      "deliveroo-plus-25",
      "fx-interbank",
      "boots-advantage-3x",
      "isa-bonus-rate",
      "travel-insurance-premium",
      "concierge-24-7",
    ],
  },
  balanced: {
    premium: ["spotify-individual", "deliveroo-plus-5", "headspace-annual"],
    pro: [
      "apple-music",
      "classpass-20",
      "audible-monthly",
      "travel-insurance-basic",
      "tastecard",
      "priority-pass",
    ],
    ultra: [
      "spotify-family",
      "deliveroo-plus-25",
      "fx-interbank",
      "isa-bonus-rate",
      "disney-plus",
      "travel-insurance-premium",
      "mobile-phone-insurance",
      "concierge-24-7",
    ],
  },
};

// Composes the user-message payload that gets appended to the variation's
// base prompt. Includes catalogue + tier definitions + engagement signal.
export function buildUserPrompt(): string {
  return [
    "=== PERK CATALOGUE ===",
    formatCatalogueForPrompt(),
    "",
    "=== TIER PRICE POINTS (Helix's revenue per user) ===",
    "premium: £4.99/month",
    "pro:     £9.99/month",
    "ultra:   £24.99/month",
    "",
    "=== LAST 30 DAYS PERK SIGNAL ===",
    "Columns:",
    "  act        — activation rate (% of eligible users who opted into the perk)",
    "  uses/mo    — average claims/sessions per month per active user",
    "  cost       — Helix's per-user-per-month cost in £ (rough B2B rate)",
    "  conv-lift  — synthetic projection: percentage-point lift in upgrade probability",
    "               if this perk sits in the tier the customer is considering",
    "",
    formatEngagementForPrompt(),
    "",
    "When allocating, weigh conversion lift against cost (a £4 perk with +18% lift",
    "is better than a £35 perk with +21% lift if Premium gross margin matters).",
    "Premium tier especially: every perk should justify its cost against the £4.99",
    "subscription. Pro and Ultra have more cost headroom.",
    "",
    "Propose an allocation now. Return ONLY the JSON object, no preamble or markdown.",
  ].join("\n");
}

// Anthropic occasionally wraps JSON in markdown fences or appends commentary.
// This salvages the JSON object from such outputs — but only as a fallback,
// because robust parsing is itself a governance signal: if the LLM keeps
// requiring salvage, we want the ai-validation-failed metric to spike.
function extractJsonObject(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    // Fall through to markdown-strip + first-object-extract
  }

  // Strip markdown fences
  const fenceStripped = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  try {
    return JSON.parse(fenceStripped);
  } catch {
    // Fall through to brace-balance extraction
  }

  // Extract the first top-level { ... } object from the text
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

type LiveCallOutcome =
  | { ok: true; rawText: string; inputTokens: number; outputTokens: number }
  | { ok: false; error: string };

async function callAnthropic(
  config: LDAICompletionConfig
): Promise<LiveCallOutcome> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt =
    config.messages?.find((m) => m.role === "system")?.content ?? "";

  // The variation's user message is a placeholder — we append the real
  // catalogue + tier defs + engagement data here.
  const placeholderUser =
    config.messages?.find((m) => m.role === "user")?.content ?? "";
  const userMessage = `${placeholderUser}\n\n${buildUserPrompt()}`;

  // Bridge LD's parameters into Anthropic's call shape.
  const params = config.model?.parameters ?? {};
  const maxTokens =
    typeof params.max_tokens === "number" ? params.max_tokens : 1500;
  const temperature =
    typeof params.temperature === "number" ? params.temperature : 0.3;

  try {
    const response = await anthropic.messages.create({
      model: config.model?.name ?? "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";
    return {
      ok: true,
      rawText,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function generateLive(
  context: ReturnType<typeof buildServerContext>
): Promise<GenerateResponse> {
  const startedAt = Date.now();
  const aiClient = await getAIClient();
  const config = await aiClient.completionConfig(AI_CONFIG_KEY, context, {
    enabled: false,
    model: { name: "stub" },
    provider: { name: "stub" },
  });

  if (!config.enabled) {
    return {
      ok: false,
      mode: "live",
      reason: "ai-call-failed",
      details: "AI Config evaluated to disabled.",
    };
  }

  const systemPrompt = config.messages?.find((m) => m.role === "system")?.content;
  const strategy = detectStrategy(systemPrompt);
  const variationName = STRATEGY_LABELS[strategy];
  const providerName = config.provider?.name ?? "unknown";
  const modelName = config.model?.name ?? "unknown";

  // We currently only have Anthropic credentials. If the AI Config assigned
  // the OpenAI variation, fall back to the stub (it's at 0% allocation; only
  // a live raise during the playback would route here). The story stays
  // intact: "we'd wire OpenAI the moment we want to actually evaluate it."
  if (providerName.toLowerCase() !== "anthropic") {
    return generateStubFromAssignedVariation(context, strategy, startedAt);
  }

  const tracker = config.createTracker();
  const llmResult = await callAnthropic(config);

  if (!llmResult.ok) {
    tracker.trackError();
    return {
      ok: false,
      mode: "live",
      reason: "ai-call-failed",
      details: llmResult.error,
      variationName,
    };
  }

  const parsed = extractJsonObject(llmResult.rawText);
  const validation = validateAllocation(parsed);
  if (!validation.valid) {
    await trackValidationFailed(context, variationName, validation);
    tracker.trackError();
    return {
      ok: false,
      mode: "live",
      reason: "validation-failed",
      details: `${validation.reason}: ${validation.details ?? ""}`,
      variationName,
    };
  }

  tracker.trackTokens({
    total: llmResult.inputTokens + llmResult.outputTokens,
    input: llmResult.inputTokens,
    output: llmResult.outputTokens,
  });
  tracker.trackSuccess();

  return {
    ok: true,
    mode: "live",
    variationName,
    modelName,
    providerName,
    proposal: validation.allocation,
    durationMs: Date.now() - startedAt,
  };
}

// Used when ANTHROPIC_API_KEY is absent (or the assigned variation's provider
// we don't have keys for). The AI Config evaluation still happens so the
// strategy assignment IS exercised — only the LLM call is substituted.
async function generateStub(
  context: ReturnType<typeof buildServerContext>
): Promise<GenerateResponse> {
  const startedAt = Date.now();
  const aiClient = await getAIClient();
  const config = await aiClient.completionConfig(AI_CONFIG_KEY, context, {
    enabled: false,
    model: { name: "stub" },
    provider: { name: "stub" },
  });

  if (!config.enabled) {
    return {
      ok: false,
      mode: "stub",
      reason: "ai-call-failed",
      details: "AI Config evaluated to disabled (default fallback served).",
    };
  }

  const systemPrompt = config.messages?.find((m) => m.role === "system")?.content;
  const strategy = detectStrategy(systemPrompt);
  return generateStubFromAssignedVariation(context, strategy, startedAt);
}

async function generateStubFromAssignedVariation(
  context: ReturnType<typeof buildServerContext>,
  strategy: Strategy,
  startedAt: number
): Promise<GenerateResponse> {
  const variationName = STRATEGY_LABELS[strategy];
  const proposal = STUB_PROPOSALS[strategy];

  const validation = validateAllocation(proposal);
  if (!validation.valid) {
    await trackValidationFailed(context, variationName, validation);
    return {
      ok: false,
      mode: "stub",
      reason: "validation-failed",
      details: `${validation.reason}: ${validation.details ?? ""}`,
      variationName,
    };
  }

  return {
    ok: true,
    mode: "stub",
    variationName,
    modelName: "(stub)",
    providerName: "(stub)",
    proposal: validation.allocation,
    durationMs: Date.now() - startedAt,
  };
}

async function trackValidationFailed(
  context: ReturnType<typeof buildServerContext>,
  variationName: string,
  validation: Extract<ValidationResult, { valid: false }>
): Promise<void> {
  const ldClient = await getLDClient();
  ldClient.track(METRIC_VALIDATION_FAILED, context, {
    variationName,
    reason: validation.reason,
    details: validation.details ?? null,
  });
}

// Main entry point. Returns either a validated proposal or a structured
// failure (which the route handler turns into the appropriate HTTP shape).
export async function generateProposal(
  req: GenerateRequest
): Promise<GenerateResponse> {
  const user = resolveUser(req.identity);

  // Q4 lock: vulnerable customers never hit the AI. Return early so we
  // don't waste a call AND so the audit trail shows no AI invocation
  // for protected users.
  if (user.vulnerabilityFlags.length > 0) {
    return {
      ok: false,
      mode: "live",
      reason: "vulnerable-excluded",
      details:
        "Context matches FCA Consumer Duty exclusion — AI never reaches this session. Safe baseline allocation is what they see.",
    };
  }

  const context = buildServerContext(user);
  const liveMode = Boolean(process.env.ANTHROPIC_API_KEY);

  return liveMode ? generateLive(context) : generateStub(context);
}
