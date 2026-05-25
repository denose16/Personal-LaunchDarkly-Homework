# Demo Framework — Helix Bank, 45-min Value Playback

**For the LaunchDarkly Senior SE evaluation panel** — a short read to set expectations on what you'll see in the 45-min session, in what order, and what to take away.

**Live demo:** [helix-bank-ld-homework.vercel.app](https://helix-bank-ld-homework.vercel.app) · **Operator console:** [/demo/strategist](https://helix-bank-ld-homework.vercel.app/demo/strategist) · **Repo:** [github.com/denose16/Personal-LaunchDarkly-Homework](https://github.com/denose16/Personal-LaunchDarkly-Homework)

---

## The scenario in one paragraph

Helix is a fictional UK neobank with four account tiers (Basic / Premium / Pro / Ultra) and a 21-perk library to allocate across them. Helix's product team can't A/B-test their way through 21 × 3 manually; their compliance team can't keep up with experimentation throughput either. **The build demonstrates LaunchDarkly as the compliance-supportive substrate for regulated subscription incentives** — same primitives an SE would normally pitch as "experimentation velocity," reframed as governance over regulated content. That framing pivot is the load-bearing strategic move.

---

## The three things to take away

If the panel remembers only three points from the 45 min, it should be these:

1. **AI Configs governs *product structure*, not marketing copy.** The headline AI use case in the demo is the LLM proposing which of 21 perks belong in which tier — a real product-team decision, not a copy-generation toy. The governance layer (audit, rollback, allocation, cross-provider switching) is foregrounded throughout. That's what differentiates LD from "we have an LLM gateway."
2. **Vulnerable-customer protection is codified at three independent layers.** The AI never sees vulnerable customers (server-route exclusion), the experiment never enrols them (rule-level exclusion), and even the customer-facing render path falls back to a hand-coded baseline (defense in depth against operator misconfiguration). The regulator's question — *"prove this user was never served that variant"* — is answerable end-to-end.
3. **One operator click triggers an end-to-end audit-trailed change.** Apply in the operator console → LD REST PATCH on a JSON flag → streamed update to every connected client in sub-100ms → audit trail captures operator + timestamp + old value + new value. No code release, no platform-team ticket, no compliance war room.

---

## Selling points the panel will see demonstrated live

- **Sub-second rollback** of a regulated content surface — the FCA's "instant remediation" obligation, made operational
- **Multi-layered vulnerable-customer exclusion** with full audit reconstructability
- **AI Configs in production** with schema validation, custom failure-rate metric, cross-provider readiness
- **Experiment infrastructure** for conversion + stickiness — wired to real custom events from the running app
- **LD as the single source of truth** for operator-driven state changes — every Apply lives in the flag audit log

---

## The 45-min arc

### Block 1 — Discovery recap (15 min)

The first quarter of the session is me playing back what I heard in our discovery call, in Priya's and James's own words. **No LD product names yet.** The point is to make sure I've captured the four success criteria correctly:

| Timing | Focus |
|---|---|
| 0:00–0:04 | Pain articulation — quotes from Priya (VP Product) and James (Chief Risk & Compliance Officer) |
| 0:04–0:09 | Business initiative — 40% Premium MAU YoY without Consumer Duty breaches |
| 0:09–0:13 | The four success criteria, in customer's words, not LD's: compliance review <24h · rollback <2min · >4 experiments/qtr · vulnerable-customer protection auditable |
| 0:13–0:15 | Confirmation moment: *"If I miss anything you care about, stop me — I'd rather know now."* |

### Block 2 — Solution & value (15 min)

Live walk-through of the running build. **Five locked demo moments**, in order:

| Timing | Moment | LD capability foregrounded | Customer outcome demonstrated |
|---|---|---|---|
| 0:15–0:17 | Open `/` as Matt (default persona). Walk the tier cards. | Boolean release flag (perk surface is gated by `release-incentives-v2`) | Helix can ship the v2 layout to one cohort, keep the v1 fallback live for the rest |
| 0:17–0:21 | Switch persona to Sam (vulnerable). Banner appears, Ultra hides, CTAs soften. | Targeting flag with `vulnerabilityFlags` clause; three-layer defense-in-depth | Helix can prove per-context why every vulnerable customer was never served Ultra |
| 0:21–0:25 | Open `/demo/strategist`. Click **Generate proposal**. Real Claude Haiku 4.5 call (~2.7s). | AI Config: 3 LLM variations governed centrally, structured-JSON output, schema-validated | Helix's product team explores the 21×3 allocation space at machine speed, with governance |
| 0:25–0:28 | Click **Apply**. Switch back to the customer surface. Cards update across all three tiers without refresh. | JSON state flag (`applied-perk-allocation`) + LD REST PATCH + streaming push to clients | Apply once, every connected customer reflects it in <100ms — no code release, full audit |
| 0:28–0:30 | In LD Console, toggle `release-incentives-v2` OFF. Cards revert to legacy ATM-only layout instantly. | Release flag rollback path | 60-second MTTR vs the current 30-minute code-release rollback |

**Optional sixth moment** if time permits and James engages on cross-provider governance: raise the GPT-4o-mini variation from 0% to 33% in the AI Config and re-generate. Same surface, different model. Audit-trailed cross-provider switching, no code change.

### Block 3 — Objection & close (15 min)

| Timing | Focus |
|---|---|
| 0:30–0:42 | Q&A. Five pre-rehearsed curveballs prepared (release-flag fatigue, buy-vs-build, Optimizely overlap, commercial pushback, priority shift) — I lead with whichever the room signals matters most |
| 0:42–0:45 | The close: 30-day POC scope ask, mutual exit ramp (walk-away clause if the four success criteria aren't moved), calendar move on the call |

---

## Decision points where I, the SE, demonstrate judgement in real-time

Three places I adapt live based on what I read from the room:

1. **End of Block 1** — If James signals "I get the framing, move to the demo," I cut the success-criteria recap short. If Priya signals "I'm not yet sold the scenario is real," I expand on the FCA Consumer Duty obligations.
2. **Block 2, moment 4** — If James leans in on "what stops the AI proposing something terrible," I detour to the `ai-validation-failed` metric in the LD Console before clicking Apply.
3. **Block 3** — Curveball ordering. If the first question is commercial, I lead with the TCO framing. If it's "we already use Optimizely," I lead with the governance-vs-experimentation distinction.

---

## How each LD evaluation pillar gets exercised

| Pillar | Where the panel sees it |
|---|---|
| **Judgement** | The framing pivot from "experimentation playground" to "compliance substrate" is itself a judgement decision. So is the architectural reversal where applied state wins over the experiment override on Premium (caught mid-build; demoted sophistication for demo clarity). Both documented in `docs/DECISION_LOG.md`. |
| **Discovery Instinct** | Block 1 leads with the customer's words, not LD's. Success criteria captured in their language. The Decision Log surfaces ambiguities I resolved with stated assumptions, not hidden defaults. |
| **Customer Translation** | Block 2's capability→outcome table — every LD primitive paired with a specific Helix success criterion. No capability mentioned without its business outcome. |
| **AI Fluency** | The whole `CHANGELOG.md` is the prompt log. 26 dated entries capturing verbatim user prompts, every override (e.g., the LDProvider componentDidUpdate misconception I caught by reading the SDK source), every SDK quirk diagnosed empirically (the array-clause red herring, the cross-provider model-key naming asymmetry). |

---

## What's running where you'll click

- **`/`** — Helix customer-facing tier comparison. Live persona switcher in the header. Real LD streaming push when the operator applies a new allocation in the other tab.
- **`/demo/strategist`** — Operator console. Real Anthropic API calls on Generate (~2.7s). Real LD REST PATCH on Apply. Diff highlights against the current applied state.
- **LD Console (`app.launchdarkly.com`)** — All 4 flags + 1 AI Config + 3 custom metrics. Audit logs on every change. Toggle the release flag mid-demo to demonstrate rollback.

---

*Companion docs in the repo: `docs/DECISION_LOG.md` (the brief's five questions answered), `docs/PLAYBACK.md` (the 15+15+15 rehearsal script), `CHANGELOG.md` (26-entry prompt log + AI-fluency evidence trail).*
