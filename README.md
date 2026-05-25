# Helix Bank · LaunchDarkly SE Technical Homework

**Live demo:** [helix-bank-ld-homework.vercel.app](https://helix-bank-ld-homework.vercel.app)
**Operator console:** [/demo/strategist](https://helix-bank-ld-homework.vercel.app/demo/strategist)
**Repo:** [github.com/denose16/Personal-LaunchDarkly-Homework](https://github.com/denose16/Personal-LaunchDarkly-Homework)
**LD project:** `default` on the LaunchDarkly trial environment
**Scenario:** Helix, a fictional UK neobank, runs LaunchDarkly's Release + Iterate capabilities as **the compliance-supportive substrate for regulated subscription incentives**.

The demo is deliberately not "growth-hacky marketing experimentation." Every primitive — release flag, vulnerable-customer targeting, multivariate experiment, AI Config — is framed around **FCA Consumer Duty** obligations: fair value, vulnerable-customer protection, audit trail, instant remediation.

---

## What this demo proves

Five demo moments, one product surface (`/`), one operator console (`/demo/strategist`):

| # | Moment | What it demonstrates | LD primitive |
|---|---|---|---|
| 1 | Toggle `release-incentives-v2` OFF mid-session | Customer surface reverts from perk-list cards to legacy ATM-only cards instantly across every connected client. Audit trail captures who, when, why. | **Release flag with rollback** |
| 2 | Switch persona to **Sam · low-income** | Banner appears, Ultra tier vanishes, "Most popular" pill suppressed, upgrade CTAs soften to "Learn more". AI never sees Sam's context — defense in depth at three layers. | **Vulnerable-customer targeting** (FCA Consumer Duty) |
| 3 | Click Upgrade to Premium, then Activate on each perk | `tier-upgrade` (conversion) + `incentive-activated` (stickiness) events fire to LD with per-perk attribution. Wired into an experiment for variation comparison. | **Multivariate experiment + 2 custom metrics** |
| 4 | Open `/demo/strategist`, click **Generate proposal** | Real call to Anthropic's Claude Haiku 4.5 (~2.7s). AI proposes which 21 perks belong in which tier — informed by mock engagement data + cost-per-perk + projected conversion lift. Returns structured JSON, validated against a hard schema. | **AI Config governing AI-driven element** (perk-tier allocation, not marketing copy) |
| 5 | Click **Apply this proposal**, switch tabs to `/` | Customer surface updates across all 3 tiers without a refresh. The applied allocation is written to a JSON LD flag via REST API; every client streams the change. Hit the rollback variation any time → minimum-safe 1/2/3 perk allocation appears. | **JSON state flag + REST PATCH from server** |

If a deliberately-broken prompt ever returns malformed JSON, the schema validator rejects it, fires the `ai-validation-failed` metric, and the operator can flip the AI Config's allocation to a known-good variation without a code release.

---

## The 4 LD artefacts at a glance

| Key | Type | Purpose | Status |
|---|---|---|---|
| `release-incentives-v2` | Boolean release flag | Gates the v2 perk-list layout vs the v1 ATM-only legacy. Used for the "instant rollback" demo moment. | Live in `test` |
| `targeting-vulnerable-customer-mode` | Boolean targeting flag | Per-context: true when `vulnerabilityFlags ∋ {low-income, financial-hardship, recently-bereaved, health-related}`. FCA Consumer Duty exclusion. | Live in `test` |
| `experiment-premium-bundle` | Multivariate (JSON) experiment | 4 audience-hypothesis bundles for Premium (control / audio-wellness / lifestyle-finance / everyday-utility). 25/25/25/25 rollout. Conversion + stickiness metrics attached. Vulnerable-customer exclusion rule baked in. *Currently runs as background data — see "Render priority" below.* | Live in `test`, evaluating |
| `applied-perk-allocation` | Multivariate JSON state flag | Holds the live perk-to-tier allocation. Variation 0 = current applied state (mutated by the apply route via REST PATCH). Variation 1 = `minimum-safe` (1/2/3 perks — instant compliance-rollback target). | Live in `test` |
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

## Local setup

### Prerequisites
- Node 18+
- A LaunchDarkly account (trial is fine) with this project's keys (see env vars below)
- Anthropic API key (`sk-ant-...`)
- A LaunchDarkly API access token with **Writer** scope (Account settings → Authorization → Access tokens → Create)

### Install + run
```bash
npm install
cp .env.example .env.local
# edit .env.local with the real values, see below
npm run dev
```

Visit `http://localhost:3000` (or whichever port Next picks).

### Environment variables

| Variable | Purpose | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_LD_CLIENT_SIDE_ID` | Browser SDK identifier — safe to expose to the client bundle | LD Console → Account settings → Projects → `default` → Environments → `test` → click the key icon next to Client-side ID |
| `LD_SDK_KEY` | Server-side SDK key — keep secret | Same panel as above, SDK key |
| `ANTHROPIC_API_KEY` | Used by `/api/perk-allocation/generate` for live LLM calls. Without it, the route falls back to pre-canned stubs (still validated) | [console.anthropic.com](https://console.anthropic.com) |
| `LAUNCHDARKLY_API_TOKEN` | Used by `/api/perk-allocation/apply` to PATCH the `applied-perk-allocation` flag value via REST. Without it, applies persist in-memory only (lost on restart). Writer scope. | LD Console → Account settings → Authorization → Access tokens |

### One-time LD setup (if running against a fresh trial)

Recreate the 4 flags + AI Config + 3 metrics via the LD MCP server, or via the Console manually. The fastest path is the bundled MCP commands recorded in `CHANGELOG.md` entries 18–22 — they include the exact tool calls and variation values.

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
validateAllocation(allocation)  // same validator as generate — defense against tampered payloads
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

The LD Console screenshots below evidence the four primitives in action. *(Capture and drop into `docs/screenshots/` — the paths below are pre-wired.)*

| File | What it shows |
|---|---|
| `docs/screenshots/01-release-flag.png` | `release-incentives-v2` flag overview — targeting rules + rollout + audit log of the live toggle test |
| `docs/screenshots/02-vulnerable-targeting.png` | `targeting-vulnerable-customer-mode` rule — `vulnerabilityFlags ∋ {low-income, ...}` clause |
| `docs/screenshots/03-experiment-variations.png` | `experiment-premium-bundle` — 4 audience-hypothesis variations with allocation |
| `docs/screenshots/04-ai-config-variations.png` | `perk-allocation-strategist` AI Config — 3 variations (revenue, retention, GPT-balanced) with prompts |
| `docs/screenshots/05-applied-state-audit.png` | `applied-perk-allocation` flag audit log — every operator Apply with timestamp + user |
| `docs/screenshots/06-strategist-console.png` | `/demo/strategist` admin page with a live AI proposal and diff highlights |
| `docs/screenshots/07-customer-surface.png` | `/` customer-facing tier comparison showing applied state |
| `docs/screenshots/08-vulnerable-mode.png` | `/` with persona = Sam · vulnerable — Ultra hidden, banner shown, CTAs softened |

---

## Decision Log

The one-page Decision Log lives at `docs/DECISION_LOG.md` *(written separately — refer to that file for the brief's 5 questions answered)*.

Raw material — the full work-as-it-happened log — is in `../CHANGELOG.md` at the project root. Every meaningful step is captured, including verbatim AI prompts and the moments AI got things wrong (LDProvider's componentDidUpdate, the array-clause red-herring, Claim-buttons-without-upgrade, applied-vs-experiment-override). That CHANGELOG is the prompt log the brief asks for.

---

## What I'd build next (4 more hours)

1. **LD Evaluations + Datasets harness** for the AI Config. Author a golden-set of 20 historical "good" allocations. Run every new AI Config variation against it before promoting > 0% rollout. Catches prompt regressions before they reach a real customer.
2. **Vulnerable-customer-specific AI variation.** Today vulnerable customers bypass AI entirely (in-code baseline). A second AI Config variation with a "minimise harm, favour reassurance perks" prompt would propose allocations specifically appropriate for vulnerable circumstances — same primitives, more nuance.
3. **Lift the inline vulnerability clauses into a real LD segment.** Today the same clause is duplicated on 2 flags. A `vulnerable-customers` segment referenced by `segmentMatch` clauses would centralise the definition — compliance owns the segment, flag owners don't need to know the criteria.

---

## Why this scenario specifically

UK neobanks operating under FCA Consumer Duty face four obligations that map directly onto LaunchDarkly's primitives:

| FCA obligation | LD primitive |
|---|---|
| **Fair value** — every offer must demonstrably benefit the customer at their tier | AI Config governs the allocation; conversion + stickiness metrics measure delivered value per variation |
| **Vulnerable-customer protection** — certain segments must be excluded from upsell flows | Targeting flag + segment-shaped rule + three layers of defense in depth |
| **Audit trail** — every variant shown to every user must be reconstructable on demand | LD's built-in audit log captures every flag toggle, rule edit, variation value change, and AI prompt change with operator + timestamp |
| **Instant remediation** — a non-compliant offer must be killable in seconds | Release flag rollback + `applied-perk-allocation` flag-off → `minimum-safe` variation, no code release needed |

This is not "growth-hacky marketing experimentation." It's the compliance-supportive substrate for regulated incentives — the framing pivot that distinguishes "we have an LLM gateway" from "we govern AI in production."

---

*Built as the technical homework for the LaunchDarkly Senior Solutions Engineer role.*
