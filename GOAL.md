# Project Goal Statement
## LaunchDarkly SE Technical Homework

**Source brief:** `SE_Homework_V4_0.pdf` (LaunchDarkly, V4.0)
**Locked:** 2026-05-22 · **AI Configs framing sharpened:** 2026-05-25 (see CHANGELOG Entry 17)

This document is the source of truth for the project. Every iteration and working step must be checked against it. If reality forces a change in direction, this document is updated deliberately and the change is recorded in `CHANGELOG.md`.

---

## Mission

Deliver a LaunchDarkly SE technical homework submission that earns Matt a senior SE offer, by demonstrating the four skills LaunchDarkly is explicitly grading on (Judgement, Discovery Instinct, Customer Translation, AI Fluency) through:

1. A working build
2. A decision log
3. A 45-minute value playback

…against a UK neobank scenario that interprets "regulated", "safer", and "more confident" in concrete, defensible terms.

---

## The Customer Scenario (locked)

| Dimension | Decision |
|---|---|
| Vertical | UK Neobank |
| Regulator anchor | FCA Consumer Duty (primary) + audit/op-resilience hooks |
| Sample app | Tiered subscription incentives screen (Basic → Premium → Pro → Ultra) |
| Triggering user journey | User wants a concrete capability (e.g. higher monthly ATM withdrawal limit) → lands on tier comparison → sees incentives at each tier → upgrades |
| SDK | Client-side (React Web SDK) |
| LD capability mix | Release (required) + Iterate (chosen — justified below) |
| Primary business metrics | (1) **Conversion** — upgrade rate at each tier transition (2) **Stickiness** — incentive activation / repeat use in days post-upgrade |
| Named personas | TBD (champion, economic buyer, end user) — locked before playback |

### Why Iterate over Observe
- **Story strength**: experimentation in a risk-averse regulated org is the harder sell, which is exactly the kind of conversation an SE has to win.
- **Metric fit**: conversion and stickiness are textbook experiment-driven metrics; Observe would be telemetry-driven and tell a different (weaker, for this scenario) story.
- **AI Configs hook**: Iterate gives us a natural home for AI Configs — governing AI-driven *perk-allocation strategies*. Rather than AI writing marketing copy (the obvious LLM use case), AI is making product-structural decisions: which perks live in which tier, optimised for revenue vs retention. Different strategies (revenue-optimiser, retention-optimiser, balanced) compete under the same conversion + stickiness metrics. Vulnerable-customer exclusion rules apply to AI-driven decisions, same as to any other targeting primitive. *(Framing sharpened 2026-05-25; original wording was "governing AI-generated incentive copy variants.")*

### Why this scenario meets the regulated brief
Incentives marketing to UK financial-services consumers IS regulated activity under FCA Consumer Duty. Specifically:
- **Fair value**: every offer must demonstrably benefit the customer at their tier.
- **Vulnerable customer protection**: certain segments must be excluded from upsell flows.
- **Audit trail**: every variant shown to every user must be reconstructable on demand.
- **Instant remediation**: a non-compliant or mispriced offer must be killable in seconds.

LaunchDarkly's Release + Iterate capabilities map directly to these obligations. The demo is not "growth-hacky marketing experimentation" — it is **the compliance-supportive substrate for regulated incentives**.

---

## Deliverable 1 — Build

### Success criteria (every box must be checked at submission)
- [ ] Working React app deployed to a public URL
- [ ] Public GitHub repo with clear README (setup, env assumptions, where SDK keys go)
- [ ] Hiring manager added as a member of the LD project
- [ ] **Release evidence**: ≥ 1 flag with targeting rules, demonstrable instant rollback, audit-log screenshot in README
- [ ] **Iterate evidence**: ≥ 1 experiment in LD with conversion + stickiness metrics wired up and emitting events from the app
- [ ] AI Configs governing ≥ 1 AI-driven element (Helix: AI-proposed perk-to-tier allocation, with schema validation and instant rollback)
- [ ] Vulnerable-customer exclusion segment demonstrated via targeting
- [ ] Every line of code explainable line-by-line (this is the LD anti-pattern bar)

### Explicit out-of-scope
- Real backend / database (mock state is fine)
- Real payment processing
- Real auth (cookie-based mock identity is acceptable)

---

## Deliverable 2 — Decision Log

### Required content (verbatim from brief)
1. Three design decisions + reasoning + trade-offs
2. One AI suggestion I rejected or overrode, and why my judgement was better
3. One thing I'd build differently for a 50-person startup vs. a regulated bank
4. Single biggest production risk if a real customer copied this implementation
5. What I'd build next with 4 more hours, and why that not something else

### Format
One page (preferred for searchability over Loom). Prompt log appended.

### Quality bar
- Reads in Matt's voice, not LD's tone, not AI ghostwriter prose.
- Specific. References actual code, actual flag names, actual LD UI choices.
- Honest about trade-offs — no glossing.

---

## Deliverable 3 — Value Playback (45 min)

### Structure (locked by brief)
- **15 min — Discovery recap**: pain, business initiative, success criteria
- **15 min — Solution & value**: build walked through as the answer; every capability → outcome
- **15 min — Objection & close**: handle a live curveball + close with clear next step + mutual commitment

### Success criteria
- [ ] Named champion, economic buyer, and end-user persona
- [ ] Pain articulated in the customer's words, not LD's product language
- [ ] No capability mentioned without a stated business outcome
- [ ] Pre-rehearsed responses for 3–5 likely curveballs (commercial pushback, security, "we tried this", "buy vs. build", priority shift)
- [ ] Clear next step + mutual commitment at close

---

## LaunchDarkly's Evaluation Rubric (we will be graded on these)

| Pillar | We pass when… |
|---|---|
| Judgement | Every choice has a stated reason; trade-offs are explicit, not glossed |
| Discovery instinct | Brief ambiguity is surfaced and resolved with a stated assumption, not hidden |
| Customer translation | No capability is mentioned without its business outcome |
| AI fluency | Prompt log shows pushback, override, catching of SDK errors |

---

## Explicit Anti-Patterns (from brief — we will not do these)

- ❌ Code that runs but I can't explain line by line
- ❌ Decision log that reads like AI ghostwrote it
- ❌ Generic answers when LD challenges in playback
- ❌ No evidence I pushed back on AI
- ❌ Submission that reads like prompt-and-paste

---

## Definition of Done

The project is submission-ready when:
1. Build is deployed to a public URL; repo is public; hiring manager has LD project access
2. Decision log is written, reviewed, and reads in Matt's voice
3. Playback deck/notes are rehearsed and timed to 45 minutes
4. Every checkbox in this goal doc is ticked
5. `/Personal/LaunchDarkly/` contains every artefact — nothing project-related lives elsewhere
6. `CHANGELOG.md` is up to date through final submission

---

## Project Governance

- **All files live under `/Personal/LaunchDarkly/`.** No exceptions. If we borrow from elsewhere, we duplicate it in.
- **CHANGELOG.md is updated at every meaningful step**, with verbatim prompts where AI was involved.
- **GOAL.md is consulted before every decision and after every output.** Drift is flagged immediately.
- **AI fluency is a deliberate artefact**, not a by-product. Prompts, overrides, and pushbacks are recorded as we go.
