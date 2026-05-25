import { TIER_META, type Tier } from "@/lib/incentives";

// Legacy v1 layout — no perks shown, just price + ATM limit.
// Rendered when `release-incentives-v2` is OFF; demonstrates the instant
// rollback story (compliance pulls the new screen, users see safe fallback).
export default function LegacyTierCard({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier];

  return (
    <article className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
      <h3 className="text-lg font-semibold text-zinc-50">{meta.name}</h3>
      <p className="mt-1 text-sm text-zinc-400">{meta.price}</p>
      <p className="mt-4 text-sm leading-6 text-zinc-300">{meta.tagline}</p>
      <dl className="mt-6 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between text-sm">
          <dt className="text-zinc-500">ATM withdrawal</dt>
          <dd className="font-medium text-zinc-200">{meta.atm}</dd>
        </div>
      </dl>
    </article>
  );
}
