# Helix Bank · LaunchDarkly SE Technical Homework

**Live demo:** [helix-bank-ld-homework.vercel.app](https://helix-bank-ld-homework.vercel.app)
**Operator console:** [/demo/strategist](https://helix-bank-ld-homework.vercel.app/demo/strategist)
**Repo:** [github.com/denose16/Personal-LaunchDarkly-Homework](https://github.com/denose16/Personal-LaunchDarkly-Homework)

---

## Mission

Built as the technical homework for the **LaunchDarkly Senior Solutions Engineer** role. The goal: demonstrate — through a working build + decision log + playback — the four skills LaunchDarkly explicitly grades on (**Judgement, Discovery Instinct, Customer Translation, AI Fluency**).

I framed the demo around a fictional UK neobank, **Helix**, and **FCA Consumer Duty** — a regulation that maps obligation-for-obligation onto LaunchDarkly's primitives. The demo is deliberately not "growth-hacky marketing experimentation." It is the **compliance-supportive substrate for regulated subscription incentives**. Same primitives, completely different framing — and that framing pivot is the load-bearing move of the whole submission.

This README is structured business-first: customer scenario, LD capabilities and why each was chosen, demo flow, decision log. Setup and architecture sit at the bottom for engineers picking up the code.

---

## The customer scenario

Helix is a fictional UK neobank with four account tiers (Basic / Premium / Pro / Ultra) at £0 / £4.99 / £9.99 / £24.99 per month. Each paid tier earns its price by bundling perks — Spotify, Deliveroo credits, Headspace, Priority Pass, FX at interbank, concierge service, etc.

**The user's triggering need**: *"I want a higher monthly ATM withdrawal limit."* They land on the tier comparison screen, see what each tier unlocks (limit + perks), and choose. The product-team question Helix can't answer with engineering intuition: **which perks belong in which tier, to maximise upgrade conversion and retention without breaching Consumer Duty?**

That is the real product-team problem this demo is the answer to.

### Why FCA Consumer Duty is the load-bearing frame

Incentives marketing to UK financial-services customers is *regulated activity*. Specifically:

| FCA Consumer Duty obligation | What it means operationally |
|---|---|
| **Fair value** | Every offer must demonstrably benefit the customer at their tier — measured, not assumed |
| **Vulnerable-customer protection** | Customers in low-income, recently-bereaved, financial-hardship, or health-related circumstances must be **excluded** from aggressive upsell flows |
| **Audit trail** | Every variant shown to every user must be reconstructable on demand |
| **Instant remediation** | A non-compliant or mispriced offer must be killable in **seconds**, not after the next deploy |

Banks have been fined for failing on this. So Helix's compliance team is not losing sleep over feature velocity — they're losing sleep over Consumer Duty breaches. LaunchDarkly's primitives are the answer to *their* problem, not just to an engineering problem.

---

## LaunchDarkly capabilities chosen — and why

The build uses **seven** distinct LaunchDarkly capabilities, each picked for a specific reason rooted in the scenario.

| LD capability | Used here as | Why this primitive vs alternatives |
|---|---|---|
| **Boolean release flag** | `release-incentives-v2` gates the entire perk surface (v2 perk-list layout) vs the v1 ATM-only legacy fallback | Compliance teams need a literal off-switch for regulated content. Code-deploy rollback takes 10–30 minutes; LD takes ~200 milliseconds across every connected client. Audit-trail captures the operator + timestamp on every toggle. |
| **Targeting flag with attribute clauses** | `targeting-vulnerable-customer-mode` evaluates `vulnerabilityFlags ∋ [low-income, financial-hardship, recently-bereaved, health-related]` on each user context | The FCA's definition of "vulnerable" is centralised in LD as a rule, not duplicated across `if` statements in every code path. Compliance owns the rule. When the FG21/1 guidance updates, the rule updates in LD, not in code. |
| **Multivariate experiment** | `experiment-premium-bundle` (4 audience-hypothesis Premium bundles — control / audio-wellness / lifestyle-finance / everyday-utility) at 25/25/25/25 rollout | Each variation is a real hypothesis about *which audience Premium is best optimised for*. Multivariate (vs A/B) lets four hypotheses run simultaneously. Vulnerable-customer-exclusion rule baked into the flag so protected customers never enter experimental treatment. |
| **Custom conversion + stickiness metrics** | `tier-upgrade` (occurrence, HigherThanBaseline) + `incentive-activated` (count, HigherThanBaseline) attached to the experiment | "Conversion + stickiness" is the brief's exact wording for the Iterate pillar. The two metrics together attribute upgrade-rate AND post-upgrade engagement to each experimental bundle — answers both *which bundle gets people to upgrade* and *which bundle keeps them engaged after*. |
| **AI Config** | `perk-allocation-strategist` (3 variations — Claude Haiku Revenue Optimiser, Claude Haiku Retention Optimiser, GPT-4o-mini Balanced at 0%) governing the LLM that proposes perk-to-tier allocations | AI making **product-structural** decisions — *which perks belong in which tier* — rather than the obvious "AI writes marketing copy" use case. The governance layer (audit, rollback, allocation control, cross-provider switching) is what differentiates LD AI Configs from "we have an LLM gateway." Live raise of the GPT slot from 0% mid-playback is the killer cross-provider demo moment. |
| **JSON-valued state flag** | `applied-perk-allocation` — variation 0 = live applied state (PATCHed by the operator's Apply action); variation 1 = `minimum-safe` (1/2/3 perks — the regulatory-floor rollback target) | Operator-driven state changes get an audit trail by default. Storing applied state IN LD means every change is logged with operator + timestamp without writing dedicated audit code. Flag-off serves `minimum-safe` for instant compliance rollback. |
| **AI-validation metric** | `ai-validation-failed` (count, **Lower**ThanBaseline) attached to the AI Config | Track AI output quality as a first-class governance signal. Spike in failures = a variation's prompt regressed = roll back via allocation, not code. Production-grade AI demands a measurable "is this variation still good?" signal. |

Plus the LD REST API on the server side: the `/api/perk-allocation/apply` route PATCHes `applied-perk-allocation`'s variation 0 value via `app.launchdarkly.com/api/v2/flags/...`. Operators don't need direct LD Console access — the app brokers the write with its own writer-scope token, so the audit trail shows "service-token X applied this allocation at T" instead of "operator clicked-around-in-Console."

---

## What this demo proves — five moments

Five demo moments, one product surface (`/`), one operator console (`/demo/strategist`):

| # | Moment | What it demonstrates |
|---|---|---|
| 1 | Toggle `release-incentives-v2` OFF mid-session | Customer surface reverts from perk-list cards to legacy ATM-only cards instantly across every connected client. Audit trail captures who, when, why. **Release with instant rollback.** |
| 2 | Switch the persona to **Sam · low-income** in the customer-page header | Amber Consumer Duty banner appears, Ultra tier vanishes, "Most popular" pill suppressed, upgrade CTAs soften to "Learn more". AI never sees Sam's context. **Vulnerable-customer protection at three layers of defense in depth.** |
| 3 | Click Upgrade to Premium, then Activate on each of the Premium perks | `tier-upgrade` (conversion) + `incentive-activated` (stickiness, per-perk attribution) events fire to LD. **Two custom metrics, wired into the experiment for variation comparison.** |
| 4 | Open `/demo/strategist`, click **Generate proposal** | Real call to Anthropic's Claude Haiku 4.5 (~2.7s). AI proposes which of the 21 perks belong in which tier — informed by mock engagement data + cost-per-perk + projected conversion lift. Output validated against a strict JSON schema; rejection fires the `ai-validation-failed` metric. **AI Config governing AI-driven product decisions.** |
| 5 | Click **Apply this proposal**, switch tabs to `/` | Customer surface updates across all 3 tiers without a refresh. The applied allocation has been PATCHed to a JSON LD flag via REST; every client picks up the change. Hit the rollback variation any time → minimum-safe 1/2/3 perk allocation appears. **Operator-driven product surgery with built-in audit + instant rollback.** |

---

## Decision Log

The one-page Decision Log lives at `docs/DECISION_LOG.md` *(in-flight — answers the brief's five questions: three design decisions, one AI suggestion overridden, what I'd build differently for a startup vs. a regulated bank, the biggest production risk, what I'd build next with 4 more hours)*.

The **raw material** — the work-as-it-happened log with verbatim AI prompts, every override, every SDK gotcha caught — is in `CHANGELOG.md` at the repo root. That CHANGELOG is the prompt log the brief asks for; the Decision Log distils from it.

Three decisions that are most worth highlighting (see CHANGELOG for the full context):

- **AI Configs governs *product structure*, not copy.** The original BUILD_PLAN had the AI generating marketing copy variants — the obvious LLM use case. Mid-build I sharpened the framing to AI proposing the perk-to-tier allocation itself. Strictly more impressive demo because it foregrounds the governance layer (which is what LD differentiates on) over LLM access (which is commodity).
- **Applied allocation wins over the experiment on Premium.** Originally designed for "experiment overrides AI on Premium" — sophisticated but produced a confusing demo flow where Apply *appeared* to do nothing. Reversed the render priority for demo clarity. The experiment still evaluates in LD for metric attribution.
- **LDProvider does NOT auto-`identify()` on context prop changes.** Verified by reading the compiled SDK source. Required an explicit `<LDClientSync>` component inside the provider tree to drive the persona swap. Three-hour debugging trail captured in CHANGELOG Entry 15.

---

## What I'd build next (4 more hours)

1. **LD Evaluations + Datasets harness** for the AI Config. Author a golden-set of 20 historical "good" allocations. Run every new AI Config variation against the dataset before promoting > 0% rollout. Catches prompt regressions before they reach a real customer.
2. **Vulnerable-customer-specific AI variation.** Today vulnerable customers bypass AI entirely. A second AI Config variation with a "minimise harm, favour reassurance perks" prompt would propose allocations specifically appropriate for vulnerable circumstances — same primitives, more nuance.
3. **Lift the inline vulnerability clauses into a real LD segment.** Today the same clause is duplicated on two flags. A `vulnerable-customers` segment referenced by `segmentMatch` clauses would centralise the definition — compliance owns the segment, flag owners don't need to know the criteria.

---

# Technical reference

The sections below are for engineers picking up the codebase.

## Local setup

### Prerequisites
- Node 18+
- A LaunchDarkly account (trial is fine) with this project's keys (see env vars below)
- Anthropic API key (`sk-ant-...`)
- A LaunchDarkly API access token with **Writer** scope (Account settings → Authorization → Access tokens → Create)

### Install + run
```bash
npm install
cp ../.env.example app/.env.local   # then edit with real values
cd app && npm run dev
```

Visit `http://localhost:3000` (or whichever port Next picks).

### Environment variables

| Variable | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_LD_CLIENT_SIDE_ID` | Browser SDK identifier — safe to expose to the client bundle | LD Console → Account settings → Projects → `default` → Environments → `test` → click the key icon next to Client-side ID |
| `LD_SDK_KEY` | Server-side SDK key — keep secret | Same panel as above, SDK key |
| `ANTHROPIC_API_KEY` | Used by `/api/perk-allocation/generate` for live LLM calls. Without it, the route falls back to pre-canned stubs (still validated) | [console.anthropic.com](https://console.anthropic.com) |
| `LAUNCHDARKLY_API_TOKEN` | Used by `/api/perk-allocation/apply` to PATCH the `applied-perk-allocation` flag value via REST. Without it, applies persist in-memory only (lost on restart). Writer scope. | LD Console → Account settings → Authorization → Access tokens |

### One-time LD setup (fresh trial)

Recreate the 4 flags + AI Config + 3 metrics via the LD MCP server, or via the Console manually. The fastest path is the bundled MCP tool calls recorded in `CHANGELOG.md` entries 18–22 — they include the exact arguments and variation values.

---

## The 4 LD artefacts at a glance

| Key | Type | Purpose | Status |
|---|---|---|---|
| `release-incentives-v2` | Boolean release flag | Gates the v2 perk-list layout vs the v1 ATM-only legacy. Used for the "instant rollback" demo moment. | Live in `test` |
| `targeting-vulnerable-customer-mode` | Boolean targeting flag | Per-context: true when `vulnerabilityFlags ∋ {low-income, financial-hardship, recently-bereaved, health-related}`. FCA Consumer Duty exclusion. | Live in `test` |
| `experiment-premium-bundle` | Multivariate (JSON) experiment | 4 audience-hypothesis bundles for Premium. 25/25/25/25 rollout. Conversion + stickiness metrics attached. Vulnerable-customer exclusion rule baked in. *Runs as background data — see "Render priority" below.* | Live in `test`, evaluating |
| `applied-perk-allocation` | Multivariate JSON state flag | Holds the live perk-to-tier allocation. Variation 0 = current applied state (mutated by the apply route via REST PATCH). Variation 1 = `minimum-safe` (1/2/3 perks — instant compliance rollback target). | Live in `test` |
| `perk-allocation-strategist` | **AI Config** | Governs the LLM that proposes perk allocations. 3 variations: Claude Haiku Revenue Optimiser (50%), Claude Haiku Retention Optimiser (50%), GPT-4o-mini Balanced (0% — raise-live moment). Each variation has a distinct system prompt; same JSON output schema. | Live in `test` |

Plus 3 metrics: `tier-upgrade` (occurrence, HigherThanBaseline), `incentive-activated` (count, HigherThanBaseline), `ai-validation-failed` (count, **Lower**ThanBaseline — fewer failures = better).

---

## Render priority (the load-bearing UX decision)

```
IF the customer is vulnerable
  → render the in-code baseline (defense in depth — never trust the LD flag value for protected users)
ELSE
  → render whatever `applied-perk-allocation` holds for all 3 tiers
```

The `experiment-premium-bundle` flag continues to evaluate in LD for every user (conversion metric attribution still flows to whichever bundle they were bucketed into) but **does not visually override the operator's applied state on Premium**. This was a deliberate architectural reversal: the original BUILD_PLAN had the experiment overriding Premium, but in practice that made Apply look broken to the operator (Pro and Ultra would update but Premium wouldn't). The fix demoted the layering in favour of demo clarity. Decision-Log Q1 material.

---

## Architecture

```
app/src/
├── lib/
│   ├── incentives.ts            21-perk catalogue + tier metadata
│   ├── mock-user.ts             Demo personas (Matt — default; Sam — vulnerable)
│   ├── ld-context.ts            Client-side LDContext builder
│   ├── experiment.ts            Schema validator for experiment-premium-bundle JSON
│   ├── tracking.ts              Typed track() wrappers for the 2 conversion metrics
│   ├── engagement-mock.ts       Per-perk cost + activation + lift signals (fed to AI prompt + Available Perks UI)
│   └── server/
│       ├── ld-server.ts                Lazy-singleton @launchdarkly/node-server-sdk + server-sdk-ai
│       ├── server-context.ts           Server-side LDContext builder
│       ├── allocation-validator.ts     5-failure-reason schema validator for AI output
│       ├── perk-allocation-service.ts  Main: invoke AI Config → call Anthropic → validate → return
│       ├── ld-rest.ts                  REST API client for read/write of applied-perk-allocation flag
│       └── applied-state.ts            In-memory fallback when LD writer token not configured
├── app/
│   ├── layout.tsx                      Root layout — server component
│   ├── page.tsx                        Customer-facing tier comparison + header (ATM-limit-anchored hero)
│   ├── launchdarkly-provider.tsx       Wraps LDProvider with persona-context bridging via identify()
│   ├── identity-provider.tsx           React Context for the demo persona swap (Matt ↔ Sam)
│   ├── components/                     Tier cards, identity switcher, vulnerable banner, upgrade CTA, etc.
│   ├── api/
│   │   └── perk-allocation/
│   │       ├── generate/route.ts       POST — calls AI Config + Anthropic, validates, returns proposal
│   │       └── apply/route.ts          GET + POST — reads/writes the applied-perk-allocation flag
│   └── demo/
│       └── strategist/
│           ├── page.tsx                Operator console shell
│           ├── strategist-console.tsx  Generate / Apply / Discard + split-pane + history
│           ├── allocation-pane.tsx     Renders one allocation with per-perk diff badges
│           └── available-perks.tsx     The 21-perk library, grouped by cost band
```

### Server-side LLM invocation flow

```
Browser POST /api/perk-allocation/generate { identity }
  ↓
perk-allocation-service.generateProposal()
  ↓
IF identity is vulnerable → return early, AI never invoked (defense in depth)
  ↓
buildServerContext(user) → ldServerSDK.aiClient.completionConfig("perk-allocation-strategist", context)
  ↓ (LD's variation-assignment fires here — bucketing decides which strategy this user gets)
  ↓
Inject perk catalogue + tier defs + engagement data (cost, lift) into the user message
  ↓
anthropic.messages.create({ model, system, messages, temperature, max_tokens })
  ↓
extractJsonObject(response.content[0].text) — strict parse → markdown-strip fallback → brace-balance fallback
  ↓
validateAllocation(parsed) — 5 failure reasons checked, hard reject (no repair)
  ↓
IF invalid → ldClient.track("ai-validation-failed", context, {variationName, reason}) + tracker.trackError()
  ↓
IF valid   → tracker.trackTokens({...}) + tracker.trackSuccess() + return proposal
```

### Apply flow (operator-driven state change)

```
Browser POST /api/perk-allocation/apply { allocation, variationName, modelName }
  ↓
validateAllocation(allocation)   // same validator as generate — defense against tampered payloads
  ↓
Write to in-memory store (fast-path for the server's own GET endpoint)
  ↓
IF LAUNCHDARKLY_API_TOKEN configured →
   PATCH https://app.launchdarkly.com/api/v2/flags/default/applied-perk-allocation
   Body: [{op: "replace", path: "/variations/0/value", value: allocation}]
  ↓
LD streams the new variation value to every connected SDK within ~100ms
  ↓
Customer-facing TierSurface reads the new value via useFlags() (or focus-refetch as belt+suspenders)
  ↓
Tier cards re-render across every open tab
```

---

## Screenshots

Three Helix-side captures live in `docs/screenshots/` (captured via Playwright against the production URL). The five LD-Console captures need a logged-in LD session — they're listed here for the hiring panel to inspect directly via the LD project they've been invited to.

| File | What it shows | Status |
|---|---|---|
| `docs/screenshots/06-strategist-console.png` | `/demo/strategist` operator console with a live Claude-Haiku-4.5 proposal + diff highlights | ✅ |
| `docs/screenshots/07-customer-surface.png` | `/` customer-facing tier comparison (Matt persona, applied state) | ✅ |
| `docs/screenshots/08-vulnerable-mode.png` | `/` with persona = Sam · vulnerable — Ultra hidden, banner shown, CTAs softened | ✅ |
| `docs/screenshots/01-release-flag.png` | `release-incentives-v2` flag overview — targeting + rollout + audit log | inspect in LD project |
| `docs/screenshots/02-vulnerable-targeting.png` | `targeting-vulnerable-customer-mode` rule referencing the `vulnerable-customers` segment | inspect in LD project |
| `docs/screenshots/03-experiment-variations.png` | `experiment-premium-bundle` — 4 audience-hypothesis variations with allocation | inspect in LD project |
| `docs/screenshots/04-ai-config-variations.png` | `perk-allocation-strategist` AI Config — 3 variations (revenue, retention, GPT-balanced) | inspect in LD project |
| `docs/screenshots/05-applied-state-audit.png` | `applied-perk-allocation` flag audit log — every operator Apply with timestamp | inspect in LD project |

---

*Built as the technical homework for the LaunchDarkly Senior Solutions Engineer role.*
