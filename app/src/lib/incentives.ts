export type Tier = "basic" | "premium" | "pro" | "ultra";

export type IncentiveCategory =
  | "music"
  | "food"
  | "wellness"
  | "entertainment"
  | "travel"
  | "lifestyle"
  | "financial"
  | "concierge";

export type Incentive = {
  key: string;
  brand: string;
  blurb: string;
  category: IncentiveCategory;
};

export const INCENTIVE_CATALOGUE: Incentive[] = [
  { key: "spotify-individual", brand: "Spotify Premium", blurb: "Individual account, ad-free, offline play", category: "music" },
  { key: "deliveroo-plus-5", brand: "Deliveroo Plus", blurb: "£5/month off Plus partner deliveries", category: "food" },
  { key: "headspace-annual", brand: "Headspace", blurb: "Full year of guided meditation & sleep", category: "wellness" },
  { key: "apple-music", brand: "Apple Music", blurb: "Individual plan, lossless audio + spatial", category: "music" },
  { key: "calm-annual", brand: "Calm", blurb: "Annual subscription, full Calm library", category: "wellness" },
  { key: "classpass-20", brand: "ClassPass", blurb: "20 credits/month at 50,000+ studios", category: "wellness" },
  { key: "audible-monthly", brand: "Audible", blurb: "One Audible credit every month", category: "music" },
  { key: "travel-insurance-basic", brand: "Travel insurance — Basic", blurb: "Single-trip Europe cover", category: "travel" },
  { key: "tastecard", brand: "Tastecard", blurb: "2-for-1 mains at 6,500+ restaurants", category: "food" },
  { key: "priority-pass", brand: "Priority Pass", blurb: "10 airport lounge visits per year", category: "travel" },
  { key: "fx-interbank", brand: "FX at interbank", blurb: "Interbank rate, no markup, no cap", category: "financial" },
  { key: "spotify-family", brand: "Spotify Premium — Family", blurb: "Family plan, up to 6 accounts", category: "music" },
  { key: "deliveroo-plus-25", brand: "Deliveroo Plus", blurb: "£25/month off Plus partner deliveries", category: "food" },
  { key: "disney-plus", brand: "Disney+", blurb: "Annual Disney+ subscription", category: "entertainment" },
  { key: "vue-cinema-4", brand: "Vue Cinema", blurb: "4 Vue tickets every month", category: "entertainment" },
  { key: "sky-premium", brand: "Sky Premium", blurb: "Annual Sky Premium subscription", category: "entertainment" },
  { key: "travel-insurance-premium", brand: "Travel insurance — Premium", blurb: "Worldwide, with cancellation cover", category: "travel" },
  { key: "mobile-phone-insurance", brand: "Mobile phone insurance", blurb: "Up to £1,500 device cover", category: "lifestyle" },
  { key: "boots-advantage-3x", brand: "Boots Advantage", blurb: "3× Advantage Card points at Boots", category: "lifestyle" },
  { key: "isa-bonus-rate", brand: "ISA bonus rate", blurb: "+0.25% on Helix cash ISA", category: "financial" },
  { key: "concierge-24-7", brand: "24/7 concierge", blurb: "Restaurants, travel, tickets — anytime", category: "concierge" },
];

const INCENTIVE_BY_KEY = new Map(INCENTIVE_CATALOGUE.map((i) => [i.key, i]));

// Default tier → ordered perk keys (placement, not binding —
// experiment-premium-bundle and admin reshuffles override this at runtime).
// Counts: Basic 0 · Premium 3 · Pro 8 · Ultra 10 (revised 2026-05-25:
// priority-pass and fx-interbank moved Ultra → Pro per user direction).
export const DEFAULT_PERKS_BY_TIER: Record<Tier, string[]> = {
  basic: [],
  premium: ["spotify-individual", "deliveroo-plus-5", "headspace-annual"],
  pro: [
    "apple-music",
    "calm-annual",
    "classpass-20",
    "audible-monthly",
    "travel-insurance-basic",
    "tastecard",
    "priority-pass",
    "fx-interbank",
  ],
  ultra: [
    "spotify-family",
    "deliveroo-plus-25",
    "disney-plus",
    "vue-cinema-4",
    "sky-premium",
    "travel-insurance-premium",
    "mobile-phone-insurance",
    "boots-advantage-3x",
    "isa-bonus-rate",
    "concierge-24-7",
  ],
};

export function getIncentivesForTier(tier: Tier): Incentive[] {
  return getIncentivesByKeys(DEFAULT_PERKS_BY_TIER[tier]);
}

// Resolves an arbitrary perk-key list (e.g. an experiment variation override)
// to the typed Incentive entries, dropping any keys not in the catalogue.
export function getIncentivesByKeys(keys: string[]): Incentive[] {
  return keys
    .map((k) => INCENTIVE_BY_KEY.get(k))
    .filter((i): i is Incentive => Boolean(i));
}

export const TIER_META: Record<
  Tier,
  { name: string; price: string; atm: string; tagline: string }
> = {
  basic: {
    name: "Basic",
    price: "Free",
    atm: "£250 / month",
    tagline: "Everyday banking, fee-free.",
  },
  premium: {
    name: "Premium",
    price: "£4.99 / mo",
    atm: "£1,000 / month",
    tagline: "Higher limits, three curated perks.",
  },
  pro: {
    name: "Pro",
    price: "£9.99 / mo",
    atm: "£2,500 / month",
    tagline: "Travel, commute, work-life upgrades.",
  },
  ultra: {
    name: "Ultra",
    price: "£24.99 / mo",
    atm: "Unlimited",
    tagline: "Full premium stack and concierge.",
  },
};

export const TIERS_ORDERED: Tier[] = ["basic", "premium", "pro", "ultra"];
