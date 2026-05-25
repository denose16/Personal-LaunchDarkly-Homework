# Playback — 45 min

**Helix Bank · LaunchDarkly SE Technical Homework**
Rehearsal notes for the value playback. 15+15+15 structure per the brief.

Companion to the build at [helix-bank-ld-homework.vercel.app](https://helix-bank-ld-homework.vercel.app) and the Decision Log at `docs/DECISION_LOG.md`.

---

## Personas (named, with motivations)

### Champion — Priya Mehta, VP Product (Helix Bank)
- Owns the tier-incentives roadmap and the Premium-upgrade-rate target
- Knows the "21 perks × 3 tiers is too large for human exploration" problem viscerally — her team has A/B-tested two bundles in the last six months
- Got me in the room. Has done discovery already. Cares about: shipping faster, looking like a thoughtful PM to her CRCO, beating Revolut's perk stack
- **What she wants from the playback:** *"Tell me this won't get me fired by James, then tell me how it gets me my Q3 goals."*

### Economic Buyer — James Whitaker, Chief Risk & Compliance Officer (Helix Bank)
- Authorises spend; carries personal liability for FCA Consumer Duty breaches
- Came up through compliance, not engineering — wants to *see* the audit trail, not be told it exists
- Skeptical of "AI in production" by default; will not sign off on anything that puts customer protection at the mercy of a model
- **What he wants from the playback:** *"Show me the rollback works, show me vulnerable customers are protected at multiple layers, show me the audit trail. Then I'll believe the AI story."*

### End users — Matt (default) and Sam (vulnerable)
- **Matt**: 35-44, London, basic-tier customer, 14 months tenure, no vulnerability flags. The upsell target. Wants a higher monthly ATM limit, doesn't know which tier suits him.
- **Sam**: 25-34, Manchester, basic-tier, 4 months tenure, `low-income` vulnerability flag set during KYC. The protected population. The same product surface must not push Sam toward Ultra.

Both personas live in the running build (`/` header pill switcher). Both are demoed live in Block 2.

---

## Block 1 — Discovery recap (15 min)

Open by playing back what I heard in our previous discovery call. **Use Priya and James's words, not LD product language.**

### Pain — in the customer's words

- *Priya:* "Our product team has 21 perks across 4 tiers. We've shipped two A/B tests in six months. The space is too big for human exploration and our compliance review is the bottleneck."
- *Priya:* "Every rollback is a code release. Minimum 30 minutes. We've sat in war rooms watching the deploy timer."
- *James:* "We had a near-miss last quarter — a campaign promoting Ultra was nearly served to a customer with a recently-bereaved flag. Caught it in QA. If it had shipped, that's a Consumer Duty breach, and the regulator's range starts at five million."
- *James:* "Our experimentation programme is gated on manual compliance review. Five days per variant on average. We can't run more experiments than we can manually review — and we can't get faster, because the manual review is the only defence we have."

### Business initiative

- **Goal:** Grow Premium MAU 40% YoY without breaching FCA Consumer Duty
- **Constraint:** Compliance review can't be the throughput bottleneck on experimentation
- **Risk:** Consumer Duty penalties + reputational damage; regulator-flagged campaigns can take Helix off-air for the whole tier
- **Time horizon:** First measurable improvement within 90 days; embedded by H2 2026

### Success criteria *(I capture these on the call so they're in their words, not mine)*

- Compliance signs off on every variant in <24 hours (today: ~5 days manual review)
- Roll back a campaign in <2 minutes (today: 30+ min code release)
- Run >4 perk-bundle experiments per quarter (today: 2)
- Vulnerable customers are documentably never served aggressive upsell content (today: best-effort + manual QA)

### Discovery question to surface (if not already addressed)

> *"You mentioned AI on your roadmap for next year. Is there a specific use case lined up, or are you exploring?"*

If they say "marketing copy" → "Worth knowing. The use case we'll demo today is actually more interesting — AI making product-structural decisions, governed centrally. Let me show you what that looks like; if it lands, we can talk about the marketing-copy version as a follow-up."

If they say "we don't know yet" → "Then I want to plant a seed for you today. AI decisions in regulated industries need governance. We'll show you what that means in practice."

**Discovery closes with:** *"Let me play back the four success criteria back to you — I'll point to where each one is solved in what we built. If I miss anything you care about, stop me and I'll come back to it at the end."*

---

## Block 2 — Solution & value (15 min)

**Open the live demo at [helix-bank-ld-homework.vercel.app](https://helix-bank-ld-homework.vercel.app). Have two tabs open: customer surface and `/demo/strategist`.**

### Capability → outcome — the one slide if I'm asked for one

| Helix needs… | LD capability shown | Outcome demonstrated |
|---|---|---|
| Roll back a campaign in <2 minutes | Release flag (`release-incentives-v2`) | Toggle in LD Console → customer surface reverts live → 30-min code-release replaced with one click |
| Vulnerable customers never see aggressive upsell | Targeting flag + segment-shaped clauses (`targeting-vulnerable-customer-mode`) | Switch to Sam in the demo → banner, Ultra hidden, soft CTAs → three layers of defense in depth |
| >4 perk-bundle experiments per quarter | Multivariate experiment + 2 custom metrics (`experiment-premium-bundle` + `tier-upgrade` + `incentive-activated`) | Four audience-hypothesis bundles already running. Conversion + stickiness attributed per bundle. |
| Explore the 21×3 perk-allocation space at machine speed | AI Config (`perk-allocation-strategist`) + 3 LLM variations | Generate a proposal live (~2.7s, real Claude Haiku call). Apply. Customer surface updates across every connected tab. |
| Compliance signs off in hours, not days | JSON state flag (`applied-perk-allocation`) + LD audit trail | Every Apply is recorded with operator + timestamp in LD's flag-change log. Compliance reviews the audit, not each variant. |
| Detect AI regressions before customers do | Custom metric (`ai-validation-failed`, LowerThanBaseline) | Failed AI outputs are tracked as a first-class governance metric, not Sentry noise |

**Lead with the OUTCOME, not the capability.** *"Here's what changes for you Monday morning if this ships."*

### Five live demo moments in order — ~2 min each, 10 min total

| # | Action | Talking point |
|---|---|---|
| 1 | Open `/`, walk through the four tiers | *"This is what Matt sees today. £4.99 to £24.99. Four perks at Premium, ten at Ultra. Notice the ATM limit is the entry hook — that's the user's triggering need."* |
| 2 | Switch to Sam (vulnerable persona) | *"Same surface, different customer. Watch — banner appears, Ultra disappears, the 'Most popular' nudge is gone, the upgrade buttons soften to 'Learn more'. That's three layers of defense in depth. James, your team can audit per-context why this rendering happened."* |
| 3 | Switch back to Matt. Open `/demo/strategist` in a second tab. Click **Generate proposal** | *"This is the operator console for Priya's team. Right now I'm asking the AI Config to propose a new perk-tier allocation. Real call to Claude Haiku, two-and-a-half seconds, validated against a strict schema. Notice the diff highlights — these perks moved, these dropped, these are new."* |
| 4 | Click **Apply this proposal** | *"One click. The proposal is now PATCHed to a LaunchDarkly JSON flag. The audit trail in LD captures my service token, the timestamp, the old value, the new value."* |
| 5 | Switch back to the customer surface tab | *"All three tiers updated. No refresh. No deploy. Every connected customer just got the new allocation streamed to them within 100 milliseconds. James — that's your rollback story too. If this allocation is wrong, I flip one toggle and everyone reverts to the safe baseline. 60-second remediation, end-to-end."* |

**Optional 6th moment if time permits and James wants the AI governance story deeper:**

| 6 | In LD Console, change `gpt-4o-mini-balanced` variation allocation from 0% to 33% in the AI Config. Generate again. | *"You asked about model vendor risk. Today our AI Config has Claude Haiku at 100% live, but a GPT-4o-mini variation is wired in at 0% allocation. If procurement wants to evaluate OpenAI against Anthropic, or if your CISO wants a fallback in case Anthropic has a regional outage, you don't change code. You change allocation. Watch — same surface, different model. Audit trail captures who changed the allocation and when."* |

### Where to expand if asked

- **"Walk me through the prompt"** → Open `node_modules/@launchdarkly/server-sdk-ai/...` not needed — just open the AI Config in LD Console. The full system prompt is there. Show how each variation has a different optimisation goal.
- **"What's the audit trail look like exactly?"** → Open the LD Console → Flags → `applied-perk-allocation` → History tab. Show the timeline of variation-0 value changes.
- **"How do vulnerable customers actually get flagged?"** → Open `app/src/lib/mock-user.ts`. *"In our demo it's hand-set. In your production system this comes from KYC + ongoing monitoring + customer self-disclosure + third-party data — that's your compliance team's job. LD's job is the lever once they have the data."*

---

## Block 3 — Objections & close (15 min)

### Five pre-rehearsed curveballs

**1. "We tried feature flags three years ago and it didn't stick."**
*Probe before responding.* "What was the use case three years ago — release flags only, or something more?" Then: "Three years ago LD was a release-flag tool. The product today is closer to a runtime configuration + governance platform. Specifically, AI Configs didn't exist three years ago, and the audit-trail-by-default model is more recent. If your team rejected LD because of release-flag fatigue, that's a real signal — what was the specific complaint? I can speak to whether that's been addressed."

**2. "Buy vs build — couldn't our engineers put this logic in our own admin tool?"**
"They could. Three things they'd be building from scratch: (a) the audit-trail-with-replay — which variant did THIS user see at THIS time, queryable by compliance two months later. (b) sub-100ms global cache invalidation when an operator applies a change — that's the streaming infrastructure under the SDK. (c) AI Configs governance — model selection, prompt versioning, allocation, rollback. Each is a quarter of engineering work; together they're 2-3 quarters. Your compliance team won't wait that long, and your platform team doesn't want the on-call rotation for the in-house version. The build option exists; the buy option ships in a week."

**3. "This looks like a fancy way of doing what Optimizely already does."**
"Optimizely is strong at experimentation — full credit. Two places it's not a fit for what I've shown you. (a) The targeting + segments are designed for marketing optimisation, not regulatory exclusion. The audit trail Optimizely gives you is to prove the experiment ran, not to prove a specific user was never served a specific variant. James, the latter is what your regulator asks for. (b) AI Configs — Optimizely doesn't govern LLMs. You said AI is on your roadmap; if you choose Optimizely now, you'll need to add an LD-equivalent in 12 months. Cleaner to consolidate."

**4. "Commercial — this feels expensive for what we'd be replacing."**
*Don't defend on price; reframe on risk-cost.* "Compared to what? Three benchmarks I'd reach for: (a) FCA Consumer Duty fines historically range £5M–£50M. Our LD spend at your scale is a fraction of one fine. (b) You'd save approximately 20% of your compliance team's time on manual variant review — over a year that's real money, and James, your team is already capped. (c) Campaign-rollback MTTR drops from 30 minutes to 60 seconds — that compounds across every campaign you run. I can put concrete numbers in a TCO model with your AE if helpful — it'd be useful to know which of those three matters most to James for the framing."

**5. "Priority shift — we're focused on other things this quarter."**
*Don't argue. Make the smallest commitment possible.* "Two thoughts. (a) Consumer Duty is already in force — there isn't a 'next quarter' for that obligation. (b) A 30-day proof-of-concept scoped to one surface — the Premium upgrade flow we've shown you today — is a low-risk way to put audit trail in front of James and let him see the rollback work in your own environment. That's a small commitment, not a multi-quarter migration. We don't need to displace anything on your current roadmap to prove this."

### Close — mutual commitment

Three components:

**1. The specific next step.**
"If I prepare a 30-day POC scope by **[Friday next week]** — Premium upgrade flow only, your test environment, your data — can you commit to: Priya, you and one engineer paired with our team. James, one compliance reviewer paired with us to validate the audit trail end-to-end. And we agree on the four success criteria from earlier as the gate."

**2. Mutual exit ramp.**
"If at the end of the 30 days the POC has not measurably moved your needle on those four success criteria — compliance review time, rollback MTTR, experiment throughput, vulnerable-customer protection audit — we both walk away. No commercial expectation. I'd rather know in 30 days than 90 that we're not the right fit."

**3. The calendar move (do it on the call if possible).**
"What does your week look like Tuesday-Thursday for a 60-minute scoping session? I'd like to leave today with a calendar invite."

---

## Coaching notes — pace, voice, what to skip

**Voice.** I'm not pitching LD. I'm playing back what I heard, then showing how the build maps to it. The product sells itself if the customer's pain is articulated faithfully. **Lead with their words, not LD's product names.**

**Pace.** 15+15+15 — but Block 1 (Discovery) is the one most likely to overrun. If I'm at 13 minutes and haven't started Block 2, cut the optional success-criterion recap and start the demo. The demo is what they remember.

**If running short on time in Block 2.** Skip moment 6 (cross-provider raise) — it's the optional governance flourish. Keep moments 1-5; they cover all four success criteria.

**If running short on time in Block 3.** Lead with curveballs 1 and 4 (the most likely real objections in a banking context). Keep the close intact — losing the mutual-commitment ask is losing the meeting.

**When James asks the hard question.** Most likely it's some version of "what happens when the AI gets it wrong?" Don't deflect. Walk to the strategist console, point at the `ai-validation-failed` metric in the LD Console, then point at the rollback variation. *"The AI gets it wrong. We've designed for that. Validation rejects malformed output. The metric tracks the rate. If a variation's failure rate spikes, the allocation changes — and the worst case is the safe baseline. No customer ever sees a structurally invalid allocation; the worst they see is the previous good one."*

**When Priya asks the soft question.** Most likely "how fast can my team learn this?" *"Two days for the basic flag and targeting flows — your team is probably faster than that. The AI Configs piece is two weeks if your platform team is already doing one LLM integration; one week if they have one in production. We'd pair your engineer with our solutions team for the first sprint."*

**When the meeting ends.** Three follow-ups, sent by EOD:
1. Calendar invite for the scoping session (already booked on the call)
2. The POC scope doc (drafted within 24h)
3. The live demo URL (already shared) + the docs/DECISION_LOG.md (already shared via the repo link)

---

*Rehearsed, timed, ready to ship.*
