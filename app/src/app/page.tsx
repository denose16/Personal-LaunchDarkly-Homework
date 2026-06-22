import TierSurface from "./components/tier-surface";
import IdentitySwitcher from "./components/identity-switcher";

export default function Home() {
  return (
    <main className="@container flex-1 mx-auto w-full max-w-5xl px-4 py-8 @3xl:px-6 @3xl:py-16 @4xl:py-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-500" />
          <span className="text-lg font-semibold tracking-tight text-zinc-100">
            Helix
          </span>
        </div>
        <IdentitySwitcher />
      </header>

      <section className="mt-8 @3xl:mt-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-indigo-300">
          Raise your monthly ATM withdrawal limit
        </p>
        <h1 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight text-zinc-50 @3xl:text-4xl @4xl:text-5xl">
          From £250/month to unlimited. Pick the tier that fits your spend.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400 @3xl:mt-4 @3xl:text-base @3xl:leading-7">
          Every Helix tier above Basic adds perks worth more than the
          subscription — Spotify, travel cover, partner credits, interbank FX
          and more. No lock-in, change tiers any time.
        </p>
      </section>

      <section className="mt-8 @3xl:mt-12">
        <TierSurface />
      </section>

      <footer className="mt-12 border-t border-zinc-900 pt-6 text-xs text-zinc-600 @3xl:mt-24">
        © Helix Bank (demo) · Built for the LaunchDarkly SE Technical Homework.
      </footer>
    </main>
  );
}
