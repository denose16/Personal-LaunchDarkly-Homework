import StrategistConsole from "./strategist-console";

export const metadata = {
  title: "Strategist · Helix demo",
  description: "AI-driven perk allocation, governed by LaunchDarkly AI Configs.",
};

export default function StrategistPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-12">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">
          /demo/strategist · operator console
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-50 sm:text-4xl">
          Perk Allocation Strategist
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">
          The AI Config{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-zinc-300">
            perk-allocation-strategist
          </code>{" "}
          governs which LLM proposes the perk-to-tier allocation. Generate a
          proposal against a chosen persona, review the diff against the
          currently-applied state, then apply to the live customer surface.
          Vulnerable customers bypass AI entirely and always see the safe
          baseline — defense in depth.
        </p>
      </header>
      <StrategistConsole />
    </main>
  );
}
