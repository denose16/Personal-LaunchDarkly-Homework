export const EXPERIMENT_FLAG_KEY = "experiment-premium-bundle";

// Camel-cased form used by the React SDK's useFlags() (LD's default).
export const EXPERIMENT_FLAG_CAMEL_KEY = "experimentPremiumBundle";

// JSON shape of each variation. Pre-validated before render to avoid
// crashing if LD returns an unexpected default.
export type PremiumBundleVariation = {
  premium: string[];
};

export function isPremiumBundleVariation(
  value: unknown
): value is PremiumBundleVariation {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.premium) && v.premium.every((p) => typeof p === "string")
  );
}
