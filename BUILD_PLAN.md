# Build Plan
## LaunchDarkly SE Technical Homework — Deliverable 1

**Source of truth:** `GOAL.md`. This plan is checked against `GOAL.md` at the end of every phase.
**Drafted:** 2026-05-22

---

## TL;DR

A Next.js client-side React app for a fictional UK neobank, deployed to Vercel. Four LaunchDarkly artefacts — one release flag, one targeting+segment flag, one multivariate experiment, one AI Config — each mapped to a distinct beat in the playback story. Total scope ≈ 5 hours of focused build time.

---

## 1. Architecture

### Stack
- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind
- **LD SDKs**: `launchdarkly-react-client-sdk` (client), `@launchdarkly/server-sdk` + `@launchdarkly/server-sdk-ai` (server, AI Configs only)
- **LLM provider**: Anthropic (Claude Haiku 4.5) via the AI Config server route
- **State**: localStorage for mock user state; no DB
- **Hosting**: Vercel — **OLD account (`mattgroom-5641`)** per memory rule
- **VCS**: GitHub — **denose16** account (Matt's personal, same as Prism), repo: **`Personal-LaunchDarkly-Homework`**, **public from day 1**

### Why these choices
| Decision | Reasoning | Trade-off |
|---|---|---|
| Next.js App Router | Native support for client + server routes (needed for AI Configs LLM call without exposing keys); zero-config Vercel deploy | More framework than a pure CRA would need, but the server route is non-negotiable |
| React Web SDK | User-locked decision; standard pattern for client-side LD | Means SDK key is public; mitigated by using **client-side ID**, not server SDK key |
| Anthropic Haiku for AI Configs | Already-paid API key (per `reference_api_keys.md`); fast (sub-300ms); cheap; can be swapped via LD config in seconds — which is itself part of the demo | Locks us to one provider for v1; AI Configs design means trivially swappable |
| Mock data only | Scope discipline; keeps the line-by-line explainability bar achievable; database is not what LD is selling | Demo can't be hammered by real load, but that's not the point |
| Vercel OLD account | Memory rule: all demo builds + tools go OLD account; only Prism is on NEW | None — this is rule-following, not a trade-off |

### Trade-offs I am NOT making
- ❌ Will not pull in a UI library beyond Tailwind (shadcn is overkill here)
- ❌ Will not add Storybook, tests beyond a smoke test, or CI gating
- ❌ Will not stub auth — mock identity is honest

---

## 2. Customer + product framing

### The fictional neobank — **Helix** (locked)
Abstract, tech-forward, easy to design a logo for. Visual treatment: **dark mode**, modern neobank feel (Revolut/Wise dark), single accent colour (TBD during build — probably a saturated purple or electric blue).

### The user journey (anchors the entire playback)
1. User lands on `/` — Tern marketing surface, single CTA: *"Increase your monthly ATM withdrawal limit"*
2. User clicks → `/tiers`
3. Four-tier comparison: **Basic** (free) → **Premium** (£5/mo) → **Pro** (£12/mo) → **Ultra** (£25/mo). Each tier shows ATM limit + a bundle of incentives.
4. User clicks "Upgrade to Premium" → `/upgrade/premium` (mock confirmation)
5. User can later go to `/account` to see active tier + activated incentives.
6. Hidden `/admin` lets us drive the demo.

### Incentive catalogue — 21 perks, moveable between tiers (revised 2026-05-25)

**Shape**: each perk is a first-class entity with a stable key, brand, category, and short blurb. Default tier assignment is a *seed*, not a binding — the entire demo story is that an SE can reshuffle perks across tiers live, without redeploy, in response to bundle-performance data. The 21 entries are tier-agnostic; the "which perk sits in which tier" mapping lives in a flag variation, not in the catalogue.

| # | Key | Brand / item | Category | Default tier |
|---|---|---|---|---|
| 1 | `spotify-individual` | Spotify Premium (Individual) | Music | Premium |
| 2 | `deliveroo-plus-5` | Deliveroo Plus — £5/mo credit | Food | Premium |
| 3 | `headspace-annual` | Headspace — annual subscription | Wellness | Premium |
| 4 | `apple-music` | Apple Music — Individual | Music | Pro |
| 5 | `calm-annual` | Calm — annual subscription | Wellness | Pro |
| 6 | `classpass-20` | ClassPass — 20 credits/month | Wellness | Pro |
| 7 | `audible-monthly` | Audible — 1 credit/month | Music | Pro |
| 8 | `travel-insurance-basic` | Travel insurance — Basic (Europe, single-trip) | Travel | Pro |
| 9 | `tastecard` | Tastecard — 2-for-1 dining | Food | Pro |
| 10 | `spotify-family` | Spotify Premium (Family, 6 accounts) | Music | Ultra |
| 11 | `deliveroo-plus-25` | Deliveroo Plus — £25/mo credit | Food | Ultra |
| 12 | `disney-plus` | Disney+ — annual subscription | Entertainment | Ultra |
| 13 | `vue-cinema-4` | Vue Cinema — 4 tickets/month | Entertainment | Ultra |
| 14 | `sky-premium` | Sky Premium — annual subscription | Entertainment | Ultra |
| 15 | `travel-insurance-premium` | Travel insurance — Premium (worldwide + cancellation) | Travel | Ultra |
| 16 | `priority-pass` | Priority Pass — 10 lounge visits/year | Travel | Pro |
| 17 | `mobile-phone-insurance` | Mobile phone insurance — up to £1,500 device | Lifestyle | Ultra |
| 18 | `boots-advantage-3x` | Boots Advantage — 3× points multiplier | Lifestyle | Ultra |
| 19 | `fx-interbank` | FX at interbank rate — no markup, no cap | Financial | Pro |
| 20 | `isa-bonus-rate` | ISA bonus rate — +0.25% on Helix cash ISA | Financial | Ultra |
| 21 | `concierge-24-7` | 24/7 concierge service | Concierge | Ultra |

**Default counts**: Basic 0 · Premium 3 · Pro 8 · Ultra 10 (= 21 total)
*Revised 2026-05-25: `priority-pass` and `fx-interbank` moved Pro per user direction. Deliberate drift from the original 3/6/12 — lounge access and interbank FX read as mid-tier upgrade nudges, not top-tier exclusives, which matches real Revolut/Monzo product structure.*

### Tier surface (revised)
| Tier | Price | ATM limit | Perk count (default) |
|---|---|---|---|
| Basic | Free | £250/mo | 0 |
| Premium | £4.99/mo | £1,000/mo | 3 |
| Pro | £9.99/mo | £2,500/mo | 8 |
| Ultra | £24.99/mo | Unlimited | 10 |

The **Premium tier** is where the experiment runs (highest-volume upgrade decision; the 3-slot constraint forces real bundle-design choices — there is no room for filler).

---

## 3. LaunchDarkly artefacts (the four)

### 3.1 `release-incentives-v2` — Release flag (revised 2026-05-25)
- **Type**: Boolean
- **Default**: `false` (production)
- **Targeting**:
  - Segment `internal-staff` → `true`
  - Custom rule: `country == "GB"` AND user `key` in `early-access-cohort` → `true`
  - All others: rollout percentage starting at 10%
- **What it gates**: the entire perk surface. When OFF, tier cards render the **v1 legacy layout** — tier name, price, ATM limit, single one-line blurb. When ON, tier cards render the **v2 perk-list layout** with 0/3/6/12 named perks per tier. *Note: the original "Incentives v2 — now live" announcement banner has been killed (pushback D-third, 2026-05-25). The visible change IS the perk surface appearing — no separate banner needed.*
- **Demo moment**: instant rollback. Toggle OFF → all four cards revert to the no-perk legacy layout in under a second, across every connected client.
- **Playback beat**: "Compliance flagged something in the perk copy. We kill the new screen in 30 seconds, every user reverts to the safe fallback, audit trail captures who turned it off and when. No code, no redeploy."

### 3.2 `targeting-vulnerable-customer-mode` — Targeting + segment flag
- **Type**: Boolean
- **Segment**: `vulnerable-customers` — rules:
  - `vulnerabilityFlags contains "low-income"` OR
  - `vulnerabilityFlags contains "recently-bereaved"` OR
  - `vulnerabilityFlags contains "financial-hardship"`
- **Default**: `false` for all; `true` if context matches segment
- **Purpose in demo**: when ON, the tiers page:
  - Removes aggressive "Save XX%" upsell language
  - Shows a banner about responsible upgrade guidance
  - Hides the Ultra tier promotion (prevents push to unsuitable tier)
- **Playback beat**: "FCA Consumer Duty says we cannot push the same upsell to a vulnerable customer as to an affluent one. The targeting rule isn't marketing personalisation — it's a regulatory control with an audit trail."

### 3.3 `experiment-premium-bundle` — Multivariate experiment (revised 2026-05-25)
- **Type**: Multivariate (JSON variation — each variation is a `{ premium: [perkKey, ...] }` map drawn from the 21-perk catalogue in Section 2)
- **Variations** (Premium tier's 3 slots — Pro and Ultra hold defaults):
  - `control` — **default Premium bundle**: `spotify-individual`, `deliveroo-plus-5`, `headspace-annual` (everyday lifestyle)
  - `variation-a-audio-wellness` — `audible-monthly`, `calm-annual`, `tastecard` (heads-down audience: commuters, parents, gig-economy workers)
  - `variation-b-lifestyle-finance` — `deliveroo-plus-25`, `classpass-20`, `isa-bonus-rate` (high-spend, financially-engaged audience)
  - `variation-c-everyday-utility` — `apple-music`, `boots-advantage-3x`, `mobile-phone-insurance` (practical-perk audience: less aspirational, higher daily-use density)
- **Why real bundles, not synthetic abstractions**: each variation is a hypothesis about *which mass-market audience the Premium tier is best optimised for*. The experiment doesn't ask "control vs perk X" — it asks "which kind of customer is this tier built for?" Conversion data answers it directly.
- **Experiment metrics**:
  - **Primary (conversion)**: `tier-upgrade` — custom event fired on `/upgrade/premium` page load
  - **Secondary (stickiness)**: `incentive-activated` — fired when user clicks "Claim" on any perk card on `/account` (per-perk attribution)
- **Allocation**: 25/25/25/25 across all eligible Basic-tier users
- **Demo moment**: when the experiment is live, the demo user (Basic tier, eligible) sees one of the four variations. Reload the page → variation persists (sticky by `domain_userid`-equivalent context key). Toggle the experiment off in LD → default Premium bundle restores everywhere.
- **Playback beat**: "Three product managers, three opinions on which Premium bundle resonates. None of them know. We don't have to. Four real bundles, real conversion data, ship the winner — and if the winner reveals a new audience hypothesis, we ship a follow-up experiment without touching the codebase."

### 3.4 `perk-allocation-strategist` — AI Config (revised 2026-05-25)

**Sharpening note**: this Section originally specified `ai-config-offer-copy` — an AI Config governing marketing-copy variants. After Phase 6 verification, the user sharpened the demo's AI-Configs use case from "AI writes copy" to "AI proposes product structure" — i.e., AI decides which perks live in which tier. The new framing foregrounds LaunchDarkly's *governance* layer, not just its LLM access. This is the stronger SE story.

- **Type**: AI Config
- **Variations**:
  - `claude-haiku-revenue-optimiser` — Anthropic Claude Haiku 4.5, system-prompt optimises perk allocation for upgrade conversion (Basic→Premium first, then Premium→Pro). **50% allocation.**
  - `claude-haiku-retention-optimiser` — Anthropic Claude Haiku 4.5, system-prompt optimises for stickiness/repeat use. Premium gets evergreen utility; Pro/Ultra add lifestyle depth. **50% allocation.**
  - `gpt-4o-mini-balanced` — OpenAI GPT-4o-mini, balanced optimisation. **0% allocation** — the show-stopper raise-live moment in the playback.
- **Default**: `claude-haiku-revenue-optimiser` (compliance-aware default — conservative growth tilt with auditable rationale)

#### Input the AI receives (user message)
- Full 21-perk catalogue (keys + brand + blurb + category — from `lib/incentives.ts`)
- Tier definitions (name + price + ATM limit)
- Mocked engagement signal (e.g., "spotify-individual: 78% activation; headspace-annual: 34%; …") — makes the AI's reasoning concrete enough to be defensible in the playback

#### Output schema (the AI returns ONLY this)
```json
{
  "premium": ["perk-key", ...],
  "pro":     ["perk-key", ...],
  "ultra":   ["perk-key", ...]
}
```
- Duplication across tiers is **permitted** — user direction; reflects real neobank product design (e.g., Spotify Individual in Premium, Spotify Family in Ultra).
- All keys must be in the catalogue (validation layer).
- Min 1 perk per tier (after filtering invalids); fall back to baseline if empty.

#### Server route
`/api/perk-allocation/generate`
- Invokes the AI Config via `@launchdarkly/server-sdk-ai` with the user's context
- Parses model response as JSON
- Validates against schema + catalogue
- On validation failure: rejects + fires `ai-validation-failed` event (per locked Q3 decision — failed validations become a third experiment metric)
- Returns proposal to client (no LD writes yet)

`/api/perk-allocation/apply`
- Accepts a validated proposal from the admin
- Uses LD REST API (writer token) to update the JSON feature flag `applied-perk-allocation`
- LD streams new value to every connected client → tier surface re-renders

#### Feature flag — `applied-perk-allocation` (JSON, NEW)
- **Type**: JSON-variation feature flag (single variation containing the current applied allocation)
- **Default value**: the BUILD_PLAN baseline (per locked Q5: human baseline opens the demo with the AI as a clear delta)
  ```json
  {"premium": ["spotify-individual", "deliveroo-plus-5", "headspace-annual"],
   "pro": ["apple-music", "calm-annual", "classpass-20", "audible-monthly",
           "travel-insurance-basic", "tastecard", "priority-pass", "fx-interbank"],
   "ultra": ["spotify-family", "deliveroo-plus-25", "disney-plus", "vue-cinema-4",
             "sky-premium", "travel-insurance-premium", "mobile-phone-insurance",
             "boots-advantage-3x", "isa-bonus-rate", "concierge-24-7"]}
  ```
- **Audit trail**: every value update logged in LD with operator + timestamp — single source of truth for "what allocation is live right now"

#### Render hierarchy (tier-surface.tsx, revised twice — final form)
```
IF vulnerable customer (per existing rule)
  → render BUILD_PLAN baseline (the safe defaults)            ← Q4 locked: A
ELSE
  → render `applied-perk-allocation` JSON flag value across all 3 tiers
    (baseline OR last applied AI proposal)
```

**Note (2026-05-25, CHANGELOG Entry 24)**: the original design layered the experiment ON TOP of the applied allocation — Premium would render the experiment variation, Pro/Ultra would render applied. In practice this produced a confusing demo flow: when the operator clicked Apply, Pro and Ultra updated but Premium continued to render the experiment variation. The user's first cut at testing this hit the bug, and we re-architected: **applied-perk-allocation now wins across all 3 tiers**. The `experiment-premium-bundle` flag continues to evaluate in LD (live data flow, conversion-metric attribution per variation, audit trail) — it just doesn't visually override the operator-driven applied state. Story for the playback: "the experiment runs underneath as a data layer; its winning variation will inform the AI's next prompt baseline."

Vulnerable users ALWAYS bypass AI and see the in-code baseline. Four LD primitives cohabit on the surface: release flag → targeting flag → AI Config (drives applied state) → JSON applied-state flag (renders).

#### Admin surface — `/demo/strategist`
- **Layout**: split-pane (current applied allocation on left, AI proposal on right) — per locked Q6
- **Diff view**: highlights perks that moved between tiers in the proposal
- **Actions**: "Generate proposal" (calls AI live), "Apply this proposal" (writes flag value via REST API), "Reset to baseline" (restore the BUILD_PLAN defaults)
- **History**: last 5 proposals with model + timestamp + applied-Y/N

#### Validation failure metric
- **Metric key**: `ai-validation-failed`
- **Type**: count, success criteria HigherThanBaseline (more failures = worse — but inverted in analysis: we want to detect failure-rate spikes per variation)
- **Wired**: server route fires this event each time an AI variation returns invalid output. Tracked per variation in LD experiments. The DRAMATIC moment: "we shipped a new prompt that returned malformed JSON 12% of the time — see the metric spike, see us rollback in seconds."

#### Playback beats (the AI-specific moments)
1. *Standard live moment*: open `/demo/strategist`, click "Generate proposal." Audience watches a real LLM call. ~2s later: proposal renders in the right pane with diff highlights. "Helix's growth strategist just ran. This is what Claude proposed for next-week's allocation."
2. *Apply moment*: click "Apply." Customer-facing tier cards update in real time across every connected browser tab.
3. *Cross-provider raise*: in the LD Console, change `gpt-4o-mini-balanced` from 0% to 33%. Generate again. "We didn't change code. We're now evaluating GPT against Claude on the same task. Audit trail records who made the change and when."
4. *Validation-failure beat*: pre-rigged variation with a deliberately-broken system prompt that produces malformed JSON. Generate → reject → `ai-validation-failed` event spikes → rollback. "When AI breaks, we don't deploy. We detect, we measure, we revert. That's the governance LD AI Configs sells."

#### Out of scope for this Phase
- Datasets / Evaluations (LD's AI-eval harness) — flagged as Decision Log Q5 "what I'd build next"
- Multi-step agent graphs — not needed for single-shot allocation
- AI Tools / function-calling — possibly worth using to constrain output to the schema; tentatively in scope, will assess

#### Cost note
~90–120 min build + verify. Comparable to combined Phases 5 + 6. Dominant time cost: server route + validation + admin UI + LD REST API integration. Anthropic API key required from user.

---

## 4. Repo structure

```
/Personal/LaunchDarkly/
├── SE_Homework_V4_0.pdf
├── GOAL.md
├── CHANGELOG.md
├── BUILD_PLAN.md                  ← this doc
├── app/                            ← the Next.js app (Vercel deploy target)
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── README.md                   ← submission README
│   ├── .env.example
│   ├── app/
│   │   ├── layout.tsx              ← wraps with LDProvider
│   │   ├── page.tsx                ← landing
│   │   ├── tiers/page.tsx          ← tier comparison (main surface)
│   │   ├── upgrade/[tier]/page.tsx ← mock upgrade confirmation
│   │   ├── account/page.tsx        ← mock account view
│   │   ├── admin/page.tsx          ← hidden demo control panel
│   │   └── api/
│   │       └── copy/route.ts       ← AI Config server route
│   ├── components/
│   │   ├── TierCard.tsx
│   │   ├── IncentiveBadge.tsx
│   │   ├── VulnerableCustomerBanner.tsx
│   │   ├── LegacyTiersFallback.tsx
│   │   └── DemoControlPanel.tsx
│   ├── lib/
│   │   ├── ld-config.ts            ← bootstrapping, context shape
│   │   ├── mock-user.ts            ← seed personas
│   │   ├── incentives.ts           ← incentive catalogue
│   │   └── metrics.ts              ← typed event-tracking helpers
│   └── types/
├── decisions/
│   └── (drafts of decision log)
├── playback/
│   └── (deck, notes, scripts)
└── prompts/
    └── (full prompt-by-prompt log, mirrors CHANGELOG)
```

---

## 5. Context model

```ts
// lib/ld-config.ts
type LDUserContext = {
  kind: "user";
  key: string;                      // stable mock user id
  name: string;
  email: string;
  country: "GB";                    // hard-coded for UK-only demo
  tier: "basic" | "premium" | "pro" | "ultra";
  accountAgeMonths: number;
  kycLevel: "basic" | "enhanced" | "premier";
  vulnerabilityFlags: string[];     // ["low-income"], etc.
  consentMarketing: boolean;
  earlyAccess: boolean;
};
```

Single-kind context (user) for v1. Multi-context (user + device) is the obvious next iteration but the demo doesn't need it — and "what I'd build next" question in the decision log can pick it up.

---

## 6. Build phasing (run in order, gate each phase against `GOAL.md`)

| Phase | Scope | Time | Goal-doc checkbox satisfied |
|---|---|---|---|
| **0. Scaffold** | Next.js init, Tailwind, git, push to YellowRock-46 (private), Vercel link to OLD account | 15m | Repo exists |
| **1. LD basics** | Create LD project, dev + prod envs, get client-side ID, wire LDProvider, render one trivial flag in landing page to prove end-to-end works | 20m | LD project provisioned |
| **2. Mock app shell** | Incentive catalogue, tier card component, /tiers page, mock user, routing, light styling | 45m | None directly — foundation |
| **3. Release flag** | `release-incentives-v2`, legacy fallback component, internal-staff segment, rollout % rule, prove rollback works in <60s | 20m | "≥ 1 release flag with targeting + instant rollback" ✓ |
| **4. Targeting + segments** | `vulnerable-customers` segment, `targeting-vulnerable-customer-mode` flag, banner + suppression logic, vulnerable demo persona | 30m | "Vulnerable-customer exclusion via targeting" ✓ |
| **5. Experiment + metrics** | `experiment-premium-bundle` multivariate flag, `tier-upgrade` and `incentive-activated` custom metrics, event-firing helpers, experiment configured in LD UI, traffic seeded | 45m | "≥ 1 experiment with conversion + stickiness metrics" ✓ |
| **6. AI Config** *(revised 2026-05-25)* | `perk-allocation-strategist` AI Config + 3 variations (2× Claude Haiku revenue/retention, 1× GPT-4o-mini at 0%), `applied-perk-allocation` JSON flag, `/api/perk-allocation/generate` + `/apply` server routes, schema validation with `ai-validation-failed` metric event, `/demo/strategist` split-pane admin UI with diff view, history of last 5 proposals | 90-120m | "AI Configs governing AI-driven element" ✓ |
| **7. Demo control panel** | `/admin` page: switch persona, toggle vulnerability flag, fire events, see active variations, reset state | 20m | None directly — playback robustness |
| **8. README + screenshots** | Setup steps, env vars, screenshots of every flag/segment/experiment in LD UI, architecture diagram, line-by-line code walkthrough notes | 30m | "Public repo with clear README" ✓ |
| **9. Deploy + access** | Push public, Vercel prod deploy, smoke-test live URL, add hiring manager to LD project | 20m | "Deployed to public URL", "Hiring manager added" ✓ |
| **10. (Optional) LD setup script** | Script using LD REST API to recreate flags/segments/experiments — bonus for reproducibility | 20m | None — judgement bonus |

**Total: ~4h 30m focused, with ~30m slack for fixing things AI got wrong.**

---

## 7. AI use plan (deliberate, logged)

For every phase, I'll record in `CHANGELOG.md`:
- The prompt I used
- What the AI produced
- What I kept vs. overrode vs. rewrote from scratch
- LD SDK errors caught and corrected

**Known LD-SDK-gotcha watchlist** (areas where AI is most likely to be wrong):
1. **Contexts vs. users** — AI commonly suggests the deprecated user-based model. We use contexts (`kind: "user"`, single or multi-kind), full stop.
2. **AI Configs SDK shape** — `@launchdarkly/server-sdk-ai` is newer; AI is likely to confuse it with the base server SDK or invent methods. Verify against LD docs, not AI memory.
3. **React SDK hook semantics** — `useFlags()` returns *all* flags as an object; `useLDClient()` gives access to `track()`, `identify()`, etc. AI sometimes mixes these.
4. **Event metric API** — `track(metricKey, data?, metricValue?)` — argument order is wrong in older docs.
5. **Bootstrapping** — AI often skips the `bootstrap` option needed to avoid flicker on initial render. We'll bootstrap from the server.
6. **Client-side key naming** — it's the *client-side ID* (`clientSideID`), not the SDK key. AI sometimes hands you the wrong one and the SDK silently 401s.

Every gotcha caught becomes a decision-log candidate for Q2 ("AI suggestion you rejected").

---

## 8. Locked decisions

### Locked 2026-05-22 (initial)
| Decision | Locked value |
|---|---|
| Brand | **Helix** |
| LD account | User signs up via trial link; provides client-side ID, SDK key, API access token |
| LLM | **Anthropic Haiku (active) + OpenAI GPT-4o-mini (framework only, 0% allocation)** — multi-provider story, single-provider cost |
| Visual design | **Dark mode**, neobank-feel (Revolut/Wise dark), accent colour TBD during build |
| Setup script | **Yes** — Phase 10 is in scope |
| GitHub | **denose16** account (Matt's personal, same as Prism), repo **`Personal-LaunchDarkly-Homework`**, **public from day 1** |

### Locked 2026-05-25 (post-onboarding, three pushbacks from user)
| Decision | Locked value | Pushback origin |
|---|---|---|
| Incentive structure | **0 / 3 / 8 / 10 perks per tier with named UK-fintech brands** (Spotify, Deliveroo, Headspace, ClassPass, Priority Pass, etc.) — see Section 2 for full 21-perk catalogue. Initially 0/3/6/12; revised same day to lift `priority-pass` + `fx-interbank` into Pro per user direction. | User pushback #1 (CHANGELOG Entry 11), revised Entry 14 |
| LD context shape | **Real demo-user context** (not anonymous): `tier`, `country: "GB"`, `accountAgeMonths`, `kycLevel`, `vulnerabilityFlags`, `consentMarketing`, `earlyAccess` per Section 5. Pre-stages Phase 4 targeting + Phase 5 experiment, no retrofit | User pushback #2-B (CHANGELOG Entry 12) |
| `release-incentives-v2` gate scope | **Gates the whole perk surface** (v1 legacy ATM-only ↔ v2 perk-list layout). **Standalone "Incentives v2 — now live" banner is killed.** The visible change in the toggle moment IS the perk surface appearing / disappearing | User pushback #2-D-third (CHANGELOG Entry 12) |
| Experiment variations | **Real Premium-bundle swaps drawn from the 21-perk catalogue**, not synthetic `variation-a/b/c` placeholders — see revised Section 3.3 | Cascade from incentive structure lock |

### Locked 2026-05-25 (Phase 7 AI Configs sharpening — six design questions)
| Decision | Locked value | Rationale |
|---|---|---|
| Q1: Storage of applied allocation | **JSON feature flag in LD** (`applied-perk-allocation`) | Single source of truth; audit trail free; streams to all clients |
| Q2: AI invocation cadence | **Admin-triggered only** | Demo predictability > realism; production-cadence is "scheduled" story |
| Q3: Validation failure mode | **Reject + log `ai-validation-failed` as a metric** | Failures become a third metric the AI Config is graded on — strongest governance story |
| Q4: Vulnerable-customer behaviour | **Safe BUILD_PLAN baseline always; AI never reaches their session.** Log a Q4-B variant as "what I'd build next." | Simpler now; richer story available later |
| Q5: Default flag value | **Human BUILD_PLAN baseline** | Demo opens with familiar state; AI proposal is a clear visible delta |
| Q6: Admin layout | **Split-pane, current ↔ proposal, with diff highlights** at `/demo/strategist` | Visual comparison is the load-bearing demo moment |
| GOAL.md framing sharpening | AI Configs governs **product structure** (perk-tier allocation), not marketing copy | Strictly more impressive demo; foregrounds LD's governance layer rather than LLM access |
| Duplication of perks across tiers | **Permitted** | Real-world neobank product design (e.g., Spotify Individual in Premium AND Spotify Family in Ultra) |
| Render priority (applied vs experiment) | **Applied-perk-allocation wins across all 3 tiers**; experiment-premium-bundle runs in LD as background data (conversion-metric attribution preserved) but doesn't visually override the operator's applied state | Reverses Decision 3-B's layered-render plan. Caught when user tested Apply and Premium didn't change. CHANGELOG Entry 24. Decision-Log Q1 material: "I designed for sophistication; in practice the UX needed Apply to be visibly decisive. Demoted the layering for demo clarity." |

## What's required from the user before Phase 0

1. LaunchDarkly trial signup at https://launchdarkly.com/start-trial
2. Create project `Helix Bank` (or similar) with default Production + Test envs
3. Confirm AI Configs is available on the trial (or request enablement)
4. Provide back to Claude:
   - LD Client-side ID (Production)
   - LD SDK key (Production)
   - LD API access token (Writer scope)
   - Anthropic API key
   - OpenAI API key (optional — framework supports it, demo works without it)

---

## 9. Alignment check against `GOAL.md`

| GOAL.md success criterion | This plan satisfies it via |
|---|---|
| Working React app deployed to public URL | Phases 0 + 9, Vercel |
| Public GitHub repo with clear README | Phases 0 + 8, YellowRock-46 |
| Hiring manager added to LD project | Phase 9 |
| ≥ 1 release flag with targeting + instant rollback | Phase 3: `release-incentives-v2` |
| ≥ 1 experiment with conversion + stickiness | Phase 5: `experiment-premium-bundle` + 2 metrics |
| AI Configs governing AI-driven element | Phase 6: `ai-config-offer-copy` |
| Vulnerable-customer exclusion via targeting | Phase 4: `targeting-vulnerable-customer-mode` |
| Every line explainable | My responsibility throughout; no black-box paste |

Anti-patterns from GOAL.md:
- "Code I can't explain" → mitigated by Section 7 AI use plan + small surface area
- "AI-ghostwritten decision log" → decision log drafted in voice, post-build
- "No evidence of pushback on AI" → CHANGELOG.md logs every AI-override
- "Prompt-and-paste job" → mock data + 4 deliberately-chosen flags, not 12 generic ones

---

## 10. What this plan deliberately doesn't decide

- **Decision log content** — drafted after the build, based on what actually happened, not what we planned. AI-ghostwriting risk is highest here.
- **Playback narrative** — separate planning artefact, drafted closer to playback date.
- **Named personas** — locked in playback planning, not build planning.

---

## Next step

Confirm or override the open questions in Section 8. On your sign-off, Phase 0 begins.
