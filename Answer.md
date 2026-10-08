# Groww for Gen Z: submission

Live code: [github.com/aviinashmishra/Groww-](https://github.com/aviinashmishra/Groww-) · run it with `npm install && npm run dev`, test it with `npm run evals`.

---

## 1. The one-pager

> **Write this section yourself.** The brief asks for a page that is not created by AI, so it isn't drafted here. What follows are working notes, facts and decisions pulled from the app, to write from in your own words (300–700 words). Delete this box and the notes when the page is done.

### Notes: a. My take on the problem

- 20–26, first account. Three different money lives: first salary, student on pocket money, irregular earner (freelance, gigs, stipends).
- The problem isn't access. Opening an account takes minutes. The problem is the **first year**: what they do before they understand risk.
- What goes wrong for this group: tips from Telegram/Instagram, F&O as a first product, panic-selling the first crash, no emergency buffer, salary gone before anything is saved.
- Gen Z wants it to feel like their apps (UPI, stories, stickers, Hinglish), but doesn't want to be gamed (streaks, confetti for trading, red/green dopamine).
- My framing: *don't make investing more exciting, make it safer to start and easier to keep doing.* Earn access to risk; don't unlock it on day one.

### Notes: b. In scope

- Onboarding by **how money reaches you** (salary / student / irregular), using your own income, spend and savings.
- **Runway**: savings ÷ monthly spend, as the home screen's main number (days for students, months for earners).
- Goal **pots** in three buckets: Soon, Later, Never touch.
- Habit features: Split salary, Invest What Lands (a share of every income credit at 6 pm, skippable), Chillar Jar round-ups, Worth it? (price in days of runway and hours of work).
- Guardrails: Learner's licence levels, the **Crash Simulator** (hold through March 2020 for the L-plate), Fun Pot capped at 10%, F&O behind a quiz, a 7-day cooling-off and a loss limit, a 24-hour pause on selling Never touch.
- Honesty tools: **Tip Check** (SEBI-registration check, park a tip for 90 days, Tip Graveyard), Lazy Twin, Jargon Buster.
- Social without amounts: Circles, Shagun (gift money as a link).
- A real investing layer on demo data: stocks, mutual funds, SIPs, IPOs, KYC, wallet, orders, portfolio.
- Privacy: hide amounts, PIN lock, local-only data, backup/restore.

### Notes: c. Out of scope

- Real money: no broker, exchange, BSE StAR MF, payments or KYC backend. All prices, companies, funds and IPOs are fictional and labelled as such.
- Account Aggregator for reading real bank credits (simulated instead).
- Real F&O trading, margin, intraday, crypto, US stocks.
- Advice and recommendations. The app shows facts and rules, never "buy this".
- Accounts, a server, sync across devices (data lives on the phone).
- Full Hindi/Marathi translation (partial), and accessibility audit beyond basics.
- Regulatory sign-off (SEBI, RBI), which a real launch would need.

### Notes: d. Solution and why

- **One idea: a licence, not a lock.** Like learning to drive: L-plate first, then more road. Level 0 → 1 (survive a fake crash) → 2 (6 months in, 2 months runway: Fun Pot) → 3 (F&O after quiz, cooling-off and loss limit).
- **Runway before returns.** For a first-time investor, months of freedom matter more than a return %. It's also a number they can move this week.
- **Automate the boring good thing.** Invest What Lands and Split salary make saving the default; skipping is one tap, and "a skip is a decision, not a streak you broke."
- **Make the bad thing slower, not impossible.** 24-hour pause, 48-hour wishlist, 90-day tip parking. Friction where regret lives.
- **Feel like Gen Z without gaming them.** Stickers for habits, never streaks. Up and down written as words, not colour. Hinglish by default. Habits are shared, amounts never are.
- Why it suits Groww: grows trust and retention in year one; users who survive the first crash stay for decades. Cheaper than acquiring them again.

### Assumptions to state

- The user has UPI and a smartphone; many are on mid-range Android, so there's a Lite mode with no blur.
- "Gen Z investor" = first account, small amounts (₹500–₹5,000 a month), learning on the go.
- The biggest losses in year one come from behaviour (tips, panic-selling, F&O), not product choice.
- Groww already has the rails (KYC, broking, MF); this is the experience layer on top.

---

## 2. The prompts I used to build it

Built with Claude Code (Opus) in VS Code, in four sessions on 6–7 October 2026. The design came first, on a claude.ai design canvas; the app was then built from that design. The prompts below are copied as typed, from the session logs, in order.

### Stage 0: the design canvas (claude.ai)

> *Paste the prompts you used on claude.ai to make the design canvas here. They were typed on claude.ai, so they aren't in the local session logs.*

### Stage 1: from design to a working app

| # | Prompt (as typed) | What it produced |
|---|---|---|
| 1 | `https://claude.ai/artifact/6UuzE9VvRtBVwnJP4w3a6H This is the Design of App and Make Out of the box FUlly Functional Make sure it should be fully functional and Out of the box use typescript and next js and so on ... make sure use Great Font style and best color combination` | Next.js 15 + TypeScript app with all nine flows from the canvas: Home, Crash Simulator, Invest What Lands, Lazy Twin, Tip Check, Fun Pot, Shagun, Circles, Profile. The canvas's design tokens were ported as the CSS system. |
| 2 | `Now Integrate light theme also along with this Make Everything End to end Fully Funcrtional anf Think Out of the box to make this Product make very much Engageing Ereative and Ultra amazing ang anf Out of the box User Experiance` | Light theme with a circular-reveal toggle, What if? planner, Future you, weekly story recap, stickers, celebrations, slide-to-confirm, Shagun as an image, PWA and offline mode. |
| 3 | `integrate this fornt <link … family=Urbanist …> Also make sure Integrate few more Out of the box Features anf Make Everything Fully Functional clean bright and Amazing look think Out of the box` | Urbanist typeface via `next/font`, a brighter light theme, Chillar Jar, Worth it?, money mood, Jargon Buster, quick actions. |
| 4 | `Do ready to deply on vercel and push the code on … make sure push from my account only aviinashmishra` | Vercel-ready config and README, first push to GitHub. |

### Stage 2: making it feel like yours

| # | Prompt (as typed) | What it produced |
|---|---|---|
| 5 | `Now make this Fully Functional End to End What ever You can from that User Can feel priorized and best feeling Forever` | Onboarding with your own numbers, a greeting and For you card, undo on every money move, PIN app lock, backup/restore/erase, offline banner, friendly error screens. |
| 6 | `Now Build Whole Groww App End to end Fully Functional` | The Invest tab: stocks, mutual funds, SIPs, IPOs, KYC, wallet, orders, portfolio and watchlist on a deterministic demo market with real NSE hours and real charges. |
| 7 | `Now make sure in the Ui he Whole UI Should Run under A phone` | The whole UI runs inside a phone frame on desktop and full-screen on real phones. |
| 8 | `… use this logo link On the place of L and name of profile is Avi` | Custom logo and the default profile name. |

### Stage 3: ship and document

| # | Prompt (as typed) | What it produced |
|---|---|---|
| 9 | `run the app` / `Run and build the app and push the code` | Production build (37 pages), route smoke test, push to `main`. |
| 10 | This brief, plus `think out of the box and make Answer.md File mention the answers of the question` | This file and the eval suite in `evals/run.mjs`. |

"Continue" prompts, which only resumed long builds, are left out.

**What I learned about prompting.** Short, ambitious prompts ("make it fully functional, out of the box") worked because the design canvas already fixed the product decisions. The AI filled in behaviour, not direction. Prompts that named one concrete thing (a font link, "run under a phone", a logo) produced the most predictable results.

---

## 3. The evals I used to test it

Three layers: automated evals of the app's own logic, build and route smoke tests, and scenario checks walked through by hand.

### 3.1 Automated evals: `npm run evals`

`evals/run.mjs` compiles the app's real logic (`src/lib`) with the project's TypeScript and checks it against the promises the product makes to a first-time investor. Nothing is mocked; these are the same functions the screens call.

**Result: 29 of 29 pass** (8 October 2026).

| ID | Area | What it checks |
|---|---|---|
| A1 | Money maths | Runway for a first-salary earner = savings ÷ monthly spend (₹72,400 ÷ ₹31,500 = 2.3 months) |
| A2 | Money maths | A student's runway is counted in days (11), not months |
| A3 | Money maths | Zero savings gives a runway of 0, never NaN or Infinity |
| A4 | Money maths | Indian grouping (₹1,25,000) and a readable minus |
| A5 | Money maths | Chillar Jar round-ups: ₹342 → ₹8, ₹340 → ₹0, 2× on ₹50 steps → ₹16 |
| A6 | Money maths | Worth it?: ₹1,050 = exactly 1 day of runway on ₹31,500 a month |
| A7 | Money maths | Brokerage capped at ₹20, floors at ₹5; sells pay no stamp duty |
| A8 | Money maths | SIP calculator: ₹1,000 × 10 years = ₹1,20,000 invested, grows at 12% |
| B1 | Guardrails | A new user has no licence; the crash alone gives only the L-plate |
| B2 | Guardrails | Level 2 needs the crash **and** 6 months **and** 2 months' runway |
| B3 | Guardrails | F&O stays locked until its gates are passed |
| B4 | Guardrails | Fun Pot is capped at 10% of everything you have |
| B5 | Guardrails | Invest What Lands ignores refunds and transfers from yourself |
| B6 | Guardrails | Landed money waits until 6 pm, then invests exactly its share (₹800 of ₹8,000 at 10%) |
| B7 | Guardrails | A skipped credit is never invested behind your back |
| B8 | Guardrails | Orders refuse fractional shares, limit prices 50% away, overselling, and money you don't have |
| B9 | Guardrails | IPO allotment is a fair lottery: about 1 in N at N× subscription, within 15% over 20,000 bids |
| C1 | Honesty | Up and down are written as words (Up 3.2%, Down 4%, Flat) |
| C2 | Honesty | Tip Check finds a company from its name or from a pasted "bhai buy zentra now 🚀🚀" |
| C3 | Honesty | A parked tip is scored only after 90 days; a halted stock shows as halted |
| C4 | Honesty | Prices are deterministic: same moment, same price, every phone |
| C5 | Honesty | Market hours: open Mon 10:00 IST, closed Mon 16:00 and on Sunday |
| C6 | Honesty | Scans every screen: no hype copy (jackpot, guaranteed, to the moon, 100x…); "streak" only appears to say there are none |
| D1 | Privacy | A Shagun link carries the gift itself and survives Hindi text and emoji |
| D2 | Privacy | A broken or tampered Shagun link fails safely |
| D3 | Privacy | With hide amounts on, the For you card shows no ₹ figures |
| E1 | Personalisation | Your own numbers load no sample history; savings go into Never touch |
| E2 | Personalisation | For you puts money that just landed ahead of everything else |
| E3 | Personalisation | Each persona gets its own runway goal: 6 months, 30 days, 3 months |

**Do the evals catch bugs?** To check the suite isn't passing by accident, I broke three rules in a copy of the code: Fun Pot ceiling 10% → 20%, refunds counted as income, and the runway gate removed. The suite dropped to 26/29, failing exactly B4, B5 and B2, each with a message naming the broken rule.

### 3.2 Build and smoke tests

| Check | Result (8 Oct 2026) |
|---|---|
| `npm run typecheck` (TypeScript strict) | No errors |
| `npm run build` | 37 of 37 pages built |
| Production server, 22 routes (`/`, `/welcome`, `/portfolio`, `/invest/search`, `/profile`, `/lands`, `/ipo`, `/jar`, `/kyc`, `/learn`, `/recap`, `/shagun`, `/split`, `/tips`, `/twin`, `/wallet`, `/worth`, `/sips`, `/orders`, `/notifications`, `/profile/settings`, manifest) | All 200, no server errors |

### 3.3 Scenario checks, by hand

Each is a short story about one of the three users, with what must be true at the end. Run on a phone-sized screen.

| # | Persona and story | Pass when |
|---|---|---|
| S1 | **Student** opens the app for the first time with ₹6,000 a month | Runway shows in days; no stock buying until the Crash Simulator is held |
| S2 | **First salary** gets paid and splits it | Split salary moves money into pots; "left to spend" is correct; Undo puts it back within 6 s |
| S3 | **Irregular earner** gets a ₹8,000 gig payment, then a ₹1,200 refund | Gig shows as pending until 6 pm and can be skipped; the refund is ignored |
| S4 | Someone pastes a WhatsApp tip | Plain facts and a SEBI check appear; parking the tip adds it to the Tip Graveyard |
| S5 | Panic: sell the Never touch pot | The 24-hour pause and "Lazy Twin would wait" appear before any sale |
| S6 | Try F&O on day one | Locked; the quiz, 7-day cooling-off and loss limit are shown as the way in |
| S7 | Show the app to a friend | With hide amounts on, every ₹ figure is masked on every screen |
| S8 | Lose the phone | The PIN locks the app; a JSON backup restores everything on another phone |
| S9 | Slow, older Android | Lite mode removes blur; works offline after the first visit |
