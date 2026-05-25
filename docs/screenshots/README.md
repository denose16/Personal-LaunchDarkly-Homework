# Screenshots

Capture each of these from the live demo + LD Console, then drop them in this folder. The main `README.md` already references these exact paths.

| File | What to capture | Where |
|---|---|---|
| `01-release-flag.png` | `release-incentives-v2` flag overview — targeting rules + rollout history + audit log of the live toggle test | LD Console → Flags → `release-incentives-v2` → with the **History** tab visible at bottom |
| `02-vulnerable-targeting.png` | `targeting-vulnerable-customer-mode` rule — the `vulnerabilityFlags ∋ {...}` clause | LD Console → Flags → `targeting-vulnerable-customer-mode` → Targeting tab |
| `03-experiment-variations.png` | `experiment-premium-bundle` — 4 audience-hypothesis variations with allocation | LD Console → Flags → `experiment-premium-bundle` → Targeting tab |
| `04-ai-config-variations.png` | `perk-allocation-strategist` AI Config — 3 variations (revenue, retention, GPT-balanced) with prompts visible | LD Console → AI Configs → `perk-allocation-strategist` → variations expanded |
| `05-applied-state-audit.png` | `applied-perk-allocation` flag audit log — operator Apply history with timestamps | LD Console → Flags → `applied-perk-allocation` → History tab |
| `06-strategist-console.png` | `/demo/strategist` admin page with a live AI proposal AND diff highlights visible | `https://helix-bank-ld-homework.vercel.app/demo/strategist` mid-Generate |
| `07-customer-surface.png` | `/` customer-facing tier comparison showing the applied state | `https://helix-bank-ld-homework.vercel.app/` |
| `08-vulnerable-mode.png` | `/` with persona = Sam · vulnerable — Ultra hidden, banner shown, CTAs softened to "Learn more" | `https://helix-bank-ld-homework.vercel.app/` after clicking "Sam · Low-income flag" |

Suggested capture order: 6, 7, 8 first (the live demo, easiest), then 1–5 from the LD Console.
