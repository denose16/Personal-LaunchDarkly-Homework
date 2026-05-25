"use client";

import { useDemoIdentity, type IdentityKey } from "../identity-provider";

const OPTIONS: { key: IdentityKey; label: string; sub: string }[] = [
  { key: "default", label: "Matt", sub: "Default" },
  { key: "vulnerable", label: "Sam", sub: "Low-income flag" },
];

export default function IdentitySwitcher() {
  const { identity, switchTo } = useDemoIdentity();

  return (
    <div className="flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-900/60 p-1 text-xs">
      <span className="px-2 text-zinc-500">Demo as</span>
      {OPTIONS.map((opt) => {
        const active = opt.key === identity;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => switchTo(opt.key)}
            aria-pressed={active}
            className={
              active
                ? "rounded-full bg-indigo-500/20 px-3 py-1 font-medium text-indigo-200 transition"
                : "rounded-full px-3 py-1 text-zinc-400 transition hover:text-zinc-200"
            }
          >
            <span>{opt.label}</span>
            <span className="ml-1 text-zinc-500">· {opt.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
