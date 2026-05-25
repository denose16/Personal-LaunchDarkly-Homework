"use client";

import { useCallback, useEffect, useState } from "react";
import AllocationPane, { type Allocation } from "./allocation-pane";
import AvailablePerks from "./available-perks";

type GenerateOk = {
  ok: true;
  mode: "live" | "stub";
  variationName: string;
  modelName: string;
  providerName: string;
  proposal: Allocation;
  durationMs: number;
};

type GenerateFail = {
  ok: false;
  mode?: "live" | "stub";
  reason: string;
  details?: string;
  variationName?: string;
};

type GenerateResponse = GenerateOk | GenerateFail;

type HistoryEntry = {
  at: string;
  variationName: string;
  modelName: string;
  applied: boolean;
  mode: "live" | "stub";
};

const BASELINE: Allocation = {
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

const EMPTY: Allocation = { premium: [], pro: [], ultra: [] };

const APPLY_CUE_MS = 3500; // duration of the post-apply emerald pulse on the left pane

export default function StrategistConsole() {
  const [identity, setIdentity] = useState<"default" | "vulnerable">("default");
  const [current, setCurrent] = useState<Allocation>(BASELINE);
  const [proposal, setProposal] = useState<Allocation | null>(null);
  const [meta, setMeta] = useState<{
    variationName: string;
    modelName: string;
    providerName: string;
    durationMs: number;
    mode: "live" | "stub";
  } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Drives the post-apply visual cue on the Current pane (emerald glow +
  // "just applied" header badge). Cleared after APPLY_CUE_MS so it doesn't
  // become permanent noise.
  const [applyPulse, setApplyPulse] = useState<{
    variationName: string;
    at: string;
  } | null>(null);

  // Bulletproofing the mirror: refresh the current allocation from the server
  // on mount AND after every successful apply (rather than relying solely on
  // local state). This guards against the dev-server-restart-loses-in-memory
  // case and against any future race condition between the local state and
  // the persistent store.
  const refreshCurrentFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/perk-allocation/apply", { method: "GET" });
      const data = await res.json();
      if (data?.allocation) {
        setCurrent(data.allocation as Allocation);
      }
    } catch {
      // Keep whatever current is; server is unreachable.
    }
  }, []);

  useEffect(() => {
    // Async fetch-and-setState — not the cascading-render pattern the lint
    // rule targets (which is sync setState-in-effect causing re-renders).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshCurrentFromServer();
  }, [refreshCurrentFromServer]);

  // Auto-clear the apply pulse after APPLY_CUE_MS.
  useEffect(() => {
    if (!applyPulse) return;
    const t = setTimeout(() => setApplyPulse(null), APPLY_CUE_MS);
    return () => clearTimeout(t);
  }, [applyPulse]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    setProposal(null);
    setMeta(null);
    try {
      const res = await fetch("/api/perk-allocation/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identity }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!data.ok) {
        if (data.reason === "vulnerable-excluded") {
          setNotice(
            `Vulnerable segment is excluded from AI by design. ${data.details ?? ""}`
          );
        } else {
          setError(`${data.reason}: ${data.details ?? ""}`);
        }
        return;
      }
      setProposal(data.proposal);
      setMeta({
        variationName: data.variationName,
        modelName: data.modelName,
        providerName: data.providerName,
        durationMs: data.durationMs,
        mode: data.mode,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [identity]);

  const handleApply = useCallback(async () => {
    if (!proposal || !meta) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/perk-allocation/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          allocation: proposal,
          variationName: meta.variationName,
          modelName: meta.modelName,
        }),
      });
      const data = await res.json();
      if (!data?.ok) {
        setError(data?.details ?? "Apply failed");
        return;
      }
      // Optimistic local update — pane mirrors immediately.
      setCurrent(proposal);
      // Re-fetch from server so the local state is reconciled with the
      // persistent truth (covers the case where another tab applied or
      // an LD-flag write modified the value out-of-band).
      refreshCurrentFromServer();

      setApplyPulse({
        variationName: meta.variationName,
        at: new Date().toLocaleTimeString(),
      });
      setHistory((h) => [
        {
          at: new Date().toLocaleTimeString(),
          variationName: meta.variationName,
          modelName: meta.modelName,
          applied: true,
          mode: meta.mode,
        },
        ...h.slice(0, 9),
      ]);
      setProposal(null);
      setMeta(null);
      if (data.persistence === "in-memory") {
        setNotice(
          "Applied to in-memory store. Drop LAUNCHDARKLY_API_TOKEN into .env.local to also stream the new allocation to every connected client via the LD flag."
        );
      } else {
        setNotice(
          "Applied — LD flag updated. Customer surface streams the new allocation to every connected tab automatically."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplying(false);
    }
  }, [proposal, meta, refreshCurrentFromServer]);

  const handleDiscard = useCallback(() => {
    if (!meta) return;
    setHistory((h) => [
      {
        at: new Date().toLocaleTimeString(),
        variationName: meta.variationName,
        modelName: meta.modelName,
        applied: false,
        mode: meta.mode,
      },
      ...h.slice(0, 9),
    ]);
    setProposal(null);
    setMeta(null);
    setNotice("Proposal discarded — current allocation unchanged.");
  }, [meta]);

  return (
    <div className="space-y-6">
      {/* Segment + actions row */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-500">Generate for segment:</span>
          {(["default", "vulnerable"] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setIdentity(opt)}
              aria-pressed={identity === opt}
              className={
                identity === opt
                  ? "rounded-full bg-indigo-500/20 px-3 py-1 font-medium text-indigo-200"
                  : "rounded-full px-3 py-1 text-zinc-400 hover:text-zinc-200"
              }
            >
              {opt === "default" ? "Matt · default" : "Sam · vulnerable"}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate proposal"}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!proposal || applying}
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applying ? "Applying…" : "Apply this proposal"}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!proposal}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>
        </div>
      </div>

      {/* Inline status (error / notice / proposal-meta) */}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      {notice && !error && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {notice}
        </div>
      )}
      {meta && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 px-4 py-3 text-xs text-zinc-300">
          <span className="font-mono text-indigo-300">{meta.variationName}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span>{meta.providerName} / {meta.modelName}</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span>{meta.durationMs}ms</span>
          <span className="mx-2 text-zinc-600">·</span>
          <span className={meta.mode === "stub" ? "text-amber-300" : "text-emerald-300"}>
            {meta.mode === "stub" ? "STUB (no LLM call)" : "LIVE LLM"}
          </span>
        </div>
      )}

      {/* Split-pane */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className={
            applyPulse
              ? "rounded-2xl ring-2 ring-emerald-400/50 ring-offset-2 ring-offset-zinc-950 transition-all duration-500"
              : "transition-all duration-500"
          }
        >
          <AllocationPane
            title={
              applyPulse
                ? `Current applied allocation · just applied (${applyPulse.at})`
                : "Current applied allocation"
            }
            allocation={current}
            compareWith={proposal ?? undefined}
            side="current"
          />
        </div>
        <AllocationPane
          title="AI proposal"
          allocation={proposal ?? EMPTY}
          compareWith={proposal ? current : undefined}
          side="proposal"
          emptyHint="Click 'Generate proposal' to invoke the AI Config. The proposal will appear here with diff highlights against the current state."
        />
      </div>

      {/* Available perks library */}
      <AvailablePerks />

      {/* History */}
      {history.length > 0 && (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">
            Recent proposals
          </h3>
          <ul className="mt-3 space-y-1.5 text-xs">
            {history.map((h, idx) => (
              <li
                key={idx}
                className="flex items-baseline gap-3 font-mono text-zinc-400"
              >
                <span className="text-zinc-500">{h.at}</span>
                <span className="text-indigo-300">{h.variationName}</span>
                <span className="text-zinc-600">·</span>
                <span>{h.modelName}</span>
                <span className="ml-auto">
                  {h.applied ? (
                    <span className="text-emerald-300">applied</span>
                  ) : (
                    <span className="text-zinc-500">discarded</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
