"use client";

import {
  INCENTIVE_CATALOGUE,
  TIER_META,
  TIERS_ORDERED,
  type Tier,
} from "@/lib/incentives";

export type Allocation = {
  premium: string[];
  pro: string[];
  ultra: string[];
};

type PerkChangeKind = "unchanged" | "added" | "removed";

type Props = {
  title: string;
  allocation: Allocation;
  /** The other side's allocation; used to compute per-perk diff status. */
  compareWith?: Allocation;
  /**
   * Whether this pane shows the "current" or the "proposal" side. Determines
   * which direction the diff badges face — additions are highlighted on the
   * proposal side, removals on the current side.
   */
  side: "current" | "proposal";
  emptyHint?: string;
};

const INCENTIVE_LOOKUP = new Map(INCENTIVE_CATALOGUE.map((i) => [i.key, i]));

function diffFor(
  perkKey: string,
  thisSide: string[],
  otherSide: string[] | undefined,
  side: "current" | "proposal"
): PerkChangeKind {
  if (!otherSide) return "unchanged";
  if (otherSide.includes(perkKey)) return "unchanged";
  // perkKey is in thisSide but not in otherSide
  return side === "proposal" ? "added" : "removed";
}

function PerkRow({
  perkKey,
  change,
}: {
  perkKey: string;
  change: PerkChangeKind;
}) {
  const incentive = INCENTIVE_LOOKUP.get(perkKey);
  const brand = incentive?.brand ?? perkKey;
  const blurb = incentive?.blurb ?? "(unknown perk)";

  const badge =
    change === "added" ? (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-300">
        + new
      </span>
    ) : change === "removed" ? (
      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-rose-300">
        − dropped
      </span>
    ) : null;

  return (
    <li
      className={
        change === "removed"
          ? "flex items-start gap-2 text-sm leading-5 opacity-60"
          : "flex items-start gap-2 text-sm leading-5"
      }
    >
      <span
        className={
          change === "added"
            ? "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400"
            : change === "removed"
              ? "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400"
              : "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400"
        }
        aria-hidden
      />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              change === "removed"
                ? "font-medium text-zinc-400 line-through"
                : "font-medium text-zinc-100"
            }
          >
            {brand}
          </span>
          {badge}
        </div>
        <p className="mt-0.5 text-xs leading-5 text-zinc-500">{blurb}</p>
      </div>
    </li>
  );
}

function TierBlock({
  tier,
  perkKeys,
  compareKeys,
  side,
}: {
  tier: Tier;
  perkKeys: string[];
  compareKeys: string[] | undefined;
  side: "current" | "proposal";
}) {
  if (tier === "basic") return null;
  const meta = TIER_META[tier];

  // Union of this side + removals from the other side, so removed perks
  // still show up on the "current" pane during a diff comparison.
  const displayedKeys =
    compareKeys && side === "current"
      ? [...perkKeys, ...compareKeys.filter((k) => !perkKeys.includes(k))]
      : perkKeys;

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
      <header className="flex items-baseline justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{meta.name}</h3>
          <p className="text-xs text-zinc-500">{meta.price}</p>
        </div>
        <span className="text-xs text-zinc-500">
          {perkKeys.length} perks
        </span>
      </header>
      <ul className="mt-3 space-y-2.5">
        {displayedKeys.map((key) => {
          const inThis = perkKeys.includes(key);
          const change = inThis
            ? diffFor(key, perkKeys, compareKeys, side)
            : "removed";
          return <PerkRow key={key} perkKey={key} change={change} />;
        })}
      </ul>
    </section>
  );
}

export default function AllocationPane({
  title,
  allocation,
  compareWith,
  side,
  emptyHint,
}: Props) {
  const isEmpty =
    !allocation.premium.length &&
    !allocation.pro.length &&
    !allocation.ultra.length;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5">
      <header className="mb-4 flex items-baseline justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">
          {title}
        </h2>
        <span className="text-xs text-zinc-500">
          {side === "current" ? "Live on customer surface" : "Pending operator apply"}
        </span>
      </header>

      {isEmpty && emptyHint ? (
        <p className="flex flex-1 items-center justify-center text-center text-sm text-zinc-500">
          {emptyHint}
        </p>
      ) : (
        <div className="flex-1 space-y-4">
          {TIERS_ORDERED.filter((t) => t !== "basic").map((tier) => (
            <TierBlock
              key={tier}
              tier={tier}
              perkKeys={allocation[tier as Exclude<Tier, "basic">]}
              compareKeys={
                compareWith?.[tier as Exclude<Tier, "basic">]
              }
              side={side}
            />
          ))}
        </div>
      )}
    </div>
  );
}
