import { INCENTIVE_CATALOGUE } from "./incentives";

// Per-perk signal feeding (a) the strategist UI's "Available Perks" library
// and (b) the AI prompt's data block. In production these come from the
// engagement-events pipeline + finance/procurement (cost) + experiment
// attribution (lift). Hand-curated here for demo defensibility.
//
//   activationRate           — % of eligible users who opted into the perk
//   monthlyUsesPerActiveUser — sessions/claims per month per active user
//   costPerMonthGBP          — Helix's per-user-per-month cost in £ (rough
//                              market rate for a B2B partner deal, not the
//                              consumer retail price)
//   conversionLiftPct        — synthetic projection: if this perk is in a
//                              tier the customer is considering, percentage-
//                              point lift in upgrade probability vs no-perk
//                              baseline. Numbers calibrated against the
//                              other two signals (high-activation +
//                              high-repeat-use ≈ high lift)

export type CostTier = "low" | "medium" | "high";

export type PerkEngagement = {
  activationRate: number; // 0–1
  monthlyUsesPerActiveUser: number;
  costPerMonthGBP: number;
  conversionLiftPct: number;
};

export const PERK_ENGAGEMENT_MOCK: Record<string, PerkEngagement> = {
  // — Music & audio (4)
  "spotify-individual":   { activationRate: 0.78, monthlyUsesPerActiveUser: 22,   costPerMonthGBP: 9,  conversionLiftPct: 28 },
  "spotify-family":       { activationRate: 0.52, monthlyUsesPerActiveUser: 28,   costPerMonthGBP: 17, conversionLiftPct: 39 },
  "apple-music":          { activationRate: 0.31, monthlyUsesPerActiveUser: 19,   costPerMonthGBP: 9,  conversionLiftPct: 14 },
  "audible-monthly":      { activationRate: 0.38, monthlyUsesPerActiveUser: 6,    costPerMonthGBP: 7,  conversionLiftPct: 15 },

  // — Food & drink (3)
  "deliveroo-plus-5":     { activationRate: 0.67, monthlyUsesPerActiveUser: 8,    costPerMonthGBP: 7,  conversionLiftPct: 22 },
  "deliveroo-plus-25":    { activationRate: 0.71, monthlyUsesPerActiveUser: 11,   costPerMonthGBP: 27, conversionLiftPct: 33 },
  "tastecard":            { activationRate: 0.19, monthlyUsesPerActiveUser: 2,    costPerMonthGBP: 2,  conversionLiftPct: 7 },

  // — Wellness & lifestyle (4)
  "headspace-annual":     { activationRate: 0.41, monthlyUsesPerActiveUser: 14,   costPerMonthGBP: 4,  conversionLiftPct: 16 },
  "calm-annual":          { activationRate: 0.28, monthlyUsesPerActiveUser: 9,    costPerMonthGBP: 3,  conversionLiftPct: 11 },
  "classpass-20":         { activationRate: 0.24, monthlyUsesPerActiveUser: 5,    costPerMonthGBP: 35, conversionLiftPct: 21 },
  "boots-advantage-3x":   { activationRate: 0.33, monthlyUsesPerActiveUser: 4,    costPerMonthGBP: 4,  conversionLiftPct: 9 },

  // — Entertainment (3)
  "disney-plus":          { activationRate: 0.44, monthlyUsesPerActiveUser: 9,    costPerMonthGBP: 5,  conversionLiftPct: 19 },
  "vue-cinema-4":         { activationRate: 0.36, monthlyUsesPerActiveUser: 1.5,  costPerMonthGBP: 25, conversionLiftPct: 13 },
  "sky-premium":          { activationRate: 0.22, monthlyUsesPerActiveUser: 14,   costPerMonthGBP: 17, conversionLiftPct: 14 },

  // — Travel (3)
  "travel-insurance-basic":   { activationRate: 0.47, monthlyUsesPerActiveUser: 0.3,  costPerMonthGBP: 4,  conversionLiftPct: 18 },
  "travel-insurance-premium": { activationRate: 0.51, monthlyUsesPerActiveUser: 0.5,  costPerMonthGBP: 12, conversionLiftPct: 23 },
  "priority-pass":            { activationRate: 0.29, monthlyUsesPerActiveUser: 0.4,  costPerMonthGBP: 18, conversionLiftPct: 31 },

  // — Financial (3)
  "fx-interbank":         { activationRate: 0.41, monthlyUsesPerActiveUser: 3.2,  costPerMonthGBP: 3,  conversionLiftPct: 24 },
  "isa-bonus-rate":       { activationRate: 0.58, monthlyUsesPerActiveUser: 1,    costPerMonthGBP: 2,  conversionLiftPct: 26 },
  "mobile-phone-insurance": { activationRate: 0.39, monthlyUsesPerActiveUser: 0.1, costPerMonthGBP: 7,  conversionLiftPct: 16 },

  // — Concierge (1)
  "concierge-24-7":       { activationRate: 0.17, monthlyUsesPerActiveUser: 1.2,  costPerMonthGBP: 40, conversionLiftPct: 34 },
};

// Cost-tier band thresholds (in £/mo). Used by the strategist UI to group
// the perk library and by the AI prompt formatter (so the LLM sees the
// banding explicitly, not just the raw numbers).
export const COST_TIER_THRESHOLDS = {
  lowMax: 8,    // <£8/mo = low
  mediumMax: 20, // £8–£20/mo = medium; >£20/mo = high
};

export function costTierFor(costPerMonthGBP: number): CostTier {
  if (costPerMonthGBP < COST_TIER_THRESHOLDS.lowMax) return "low";
  if (costPerMonthGBP < COST_TIER_THRESHOLDS.mediumMax) return "medium";
  return "high";
}

export const COST_TIER_LABEL: Record<CostTier, string> = {
  low: "Low cost",
  medium: "Medium cost",
  high: "High cost",
};

export const COST_TIER_RANGE: Record<CostTier, string> = {
  low: `< £${COST_TIER_THRESHOLDS.lowMax}/mo`,
  medium: `£${COST_TIER_THRESHOLDS.lowMax}–£${COST_TIER_THRESHOLDS.mediumMax - 1}/mo`,
  high: `≥ £${COST_TIER_THRESHOLDS.mediumMax}/mo`,
};

// Compile-time check: every perk in the catalogue has engagement data.
const missingKeys = INCENTIVE_CATALOGUE.filter(
  (i) => !(i.key in PERK_ENGAGEMENT_MOCK)
).map((i) => i.key);
if (missingKeys.length > 0 && typeof process !== "undefined") {
  console.error("[Helix] engagement-mock is missing keys:", missingKeys);
}

// Renders the engagement data as a tab-aligned block for the AI prompt.
// LLMs parse tab-aligned text reliably; we keep it compact to stay inside
// the 1500-token output budget on the variation's max_tokens parameter.
export function formatEngagementForPrompt(): string {
  const lines = INCENTIVE_CATALOGUE.map((incentive) => {
    const e = PERK_ENGAGEMENT_MOCK[incentive.key];
    if (!e) return `${incentive.key.padEnd(28)} | (no data)`;
    const act = `${Math.round(e.activationRate * 100)}%`.padStart(4);
    const uses = e.monthlyUsesPerActiveUser.toString().padStart(5);
    const cost = `£${e.costPerMonthGBP}/mo`.padStart(8);
    const lift = `+${e.conversionLiftPct}%`.padStart(5);
    return `${incentive.key.padEnd(28)} | act ${act} | ${uses} uses/mo | cost ${cost} | conv-lift ${lift}`;
  });
  return lines.join("\n");
}

// Renders the perk catalogue itself for the AI prompt.
export function formatCatalogueForPrompt(): string {
  return INCENTIVE_CATALOGUE.map(
    (i) => `${i.key.padEnd(28)} (${i.category}) — ${i.brand}: ${i.blurb}`
  ).join("\n");
}
