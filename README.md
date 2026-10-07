# Groww for Gen Z

A working Next.js + TypeScript build of the **Groww for Gen Z** design canvas: all nine flows, light, dark and Lite themes, and the same tokens, type and components as the design.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Production:

```bash
npm run build
npm start
```

Needs Node 18.18 or newer. The fonts (Urbanist, Poppins) come from Google Fonts through `next/font` at build time.

## Deploy on Vercel

It needs no extra configuration: no environment variables, no database and no `vercel.json`.

1. Go to [vercel.com/new](https://vercel.com/new) and import `aviinashmishra/Groww-` from GitHub.
2. Keep the defaults (Framework: **Next.js**, Build: `next build`, Output: `.next`) and click **Deploy**.
3. Every push to `main` deploys again automatically, and pull requests get preview URLs.

Or from the terminal: `npx vercel` for a preview, then `npx vercel --prod`.

## What works

| Flow | Route | What you can do |
|---|---|---|
| Onboarding | `/welcome` | Name yourself and pick how money reaches you: first salary, student or irregular earner. Each starts with sample data. |
| Home | `/` | Runway ring (savings ÷ monthly spend, tap to change spend), goal pots, a new-pot sheet, the notification bell, and a primary action for each persona |
| Pots | `/pots/[id]` | Add, withdraw or sell, edit, delete. Selling from a Never touch pot with the 24-hour pause on opens the "Lazy Twin would wait" sheet. |
| Split salary | `/split` | Allocate the month's salary across pots with ± steppers and see what's left to spend |
| Crash Simulator | `/crash` | A 90-second replay of 2015–2025 (with a 4× speed option), one Hold-or-Sell decision in March 2020, and the result. Holding earns the L-plate. |
| Invest What Lands | `/lands`, `/lands/setup`, `/lands/skipped` | Share slider from 0 to 50%. Credits land as pending and invest themselves at 6 pm. You can skip, undo a skip until the cutoff, or invest now. Refunds and transfers from yourself are ignored. |
| Lazy Twin | `/twin`, `/twin/gap` | Two lines and the moves that made the gap, plus a toggle for the 24-hour pause before selling |
| Tip Check | `/tips`, `/tips/[id]` | Type or paste a name or link (with clipboard read) to get plain facts and a SEBI-registration check, then park the tip for 90 days. The Tip Graveyard keeps score. |
| Fun Pot | `/fun`, `/fun/odds`, `/fun/unlock` | Locked until Level 2. Play money is capped at 10%, and you can buy or sell picks. F&O sits behind three gates: a 5-question quiz, a 7-day cooling-off and a loss-limit stepper. |
| Shagun | `/shagun`, `/shagun/[id]`, `/shagun/claim` | Make a card and share it through the native share sheet or by copying the link. The claim link carries the gift itself, so it opens on any phone. |
| Circles | `/circles`, `/circles/goal`, `/circles/privacy` | Consistency dots with no amounts, a nudge limited to once a day, a shared goal with "Add my share", and the privacy card |
| Profile | `/profile`, `/profile/settings` | Licence levels worked out from what you've actually done. Settings for hiding amounts (every ₹ figure masks), theme (Auto, Light or Dark), Lite mode with no blur, language, and switching or resetting the demo profile. |

## Look and feel

- **Typeface: Urbanist** (variable, weights 100–900 with italics), loaded through `next/font/google`. It's the same Google Font as the `fonts.googleapis.com` link, but the files are served from the app itself, so there's no extra request to Google and no visible swap when the page loads. Poppins stays as the fallback for ₹ and for Hindi/Marathi text.
- **A brighter light theme**: a near-white ground (`#F4F8F7`), white cards, softer two-layer shadows, and a fourth warm orb in the background. Display text is bolder (700) with tighter letter-spacing.

## More features

- **Chillar Jar** (`/jar`): every UPI spend rounds up to the nearest ₹10, ₹50 or ₹100, optionally doubled or tripled, and the spare change drops into an animated jar. Shake the jar for a vibration; "Sweep" moves the change into your Never touch pot. It also shows a spend-by-category bar and lets you log a spend or simulate UPI payments.
- **Worth it?** (`/worth`): type in something you want to buy and see its real cost in days of runway, hours of work, and what the money could become in 10 years. Save for it (this creates a pot), sleep on it for 48 hours, or buy it from your Soon pot with slide-to-confirm. A running total shows money you didn't spend on things you stopped wanting.
- **Money mood** (Home): a 10-second daily check-in with five hand-drawn faces, a 14-day bar chart and an honest one-line insight. It also feeds the weekly recap.
- **Jargon Buster** (`/learn`): 20 money terms in plain language, a word of the day and search. Tip Check links to it for words like pledged shares, pump and dump, and small cap.
- **Quick actions** on Home: a row of colourful tiles you scroll sideways. The Chillar Jar tile shows the jar's current balance.
- The **weekly recap** gains slides for the Chillar Jar and your money mood, and there are two new stickers: Chillar champ and Slept on it.

## Made for you, kept forever

- **Your own numbers from day one.** Onboarding has two steps: your name and how money reaches you, then your income, monthly spend and savings, with a live runway preview. Sample data is a single tap away if you just want to explore.
- **Greeting and For you.** Home greets you by name for the time of day. A For you card picks the single most useful thing to do now: an incoming credit to keep or skip, a wish whose 48 hours are up, a sell you slept on, your L-plate, this month's split, the Chillar Jar, a nearly full pot, or exactly how much a month reaches your runway goal.
- **Undo on money moves.** Adding, withdrawing, selling, sweeping, splitting, buying or dropping a wish, and deleting a pot all show a toast with an **Undo** button for 6 seconds.
- **App lock.** A 4-digit PIN with a full-screen keypad. It asks on open and again after a minute in the background. Only a salted SHA-256 hash is stored, never the PIN. If you forget it, you can erase the data and restore a backup.
- **Your data, forever.** Settings → *Your data*: save a JSON backup, restore it on any phone, start over (with your own numbers or sample data), or erase everything. The app also asks the browser not to evict its storage.
- **Edit yourself.** Change your name, avatar colour, income and monthly spend at any time, and everything recalculates.
- **Vibration on or off**, an **offline banner** ("Everything still works on this phone"), and friendly **error screens** that never lose your data and offer a rescue download.

## Invest: stocks, mutual funds, SIPs and IPOs

The new **Invest** tab (second in the nav) is a full investing app on a demo market. Prices move in real time during NSE hours (9:15 am to 3:30 pm IST, Monday to Friday) and freeze at the close outside them.

| Flow | Route | What you can do |
|---|---|---|
| Hub | `/invest` | Market open or closed, four indices, your portfolio value and today's move, plus tools for orders, SIPs, IPOs and your balance. Tabs for stocks (top gainers and losers, most bought, all stocks), mutual funds (collections such as index, tax saving, low risk and high return) and your watchlist. |
| Search | `/invest/search` | Searches stocks, indices, funds and open IPOs by name, symbol, sector or fund type. |
| Stock | `/stocks/[id]` | Live price and a scrubbable chart (1D, 1W, 1M, 1Y, 5Y), today's range, the 52-week range, fundamentals, your holding, open orders and a watchlist star. Buy or sell at market or at a limit price, with an itemised charges breakdown (brokerage, STT, exchange, SEBI, stamp duty, GST) and slide to confirm. When the market is closed, an order goes in as an after-market order and fills at 9:15 am. Limit orders wait for your price and lapse at 3:30 pm. A buy holds back money from your balance until it fills. If you're short, the sheet offers to add exactly the difference. |
| Mutual fund | `/mf/[id]` | NAV chart (1M to 5Y), 1Y, 3Y and 5Y returns, the riskometer, expense ratio, exit load, lock-in and top holdings. A SIP calculator. Invest one-time from your balance or by UPI, or start a SIP on the date you choose. Redeem with exit load and ELSS lock-in respected. Units are allotted at the day's NAV (3 pm cut-off) in under a minute. |
| Portfolio | `/portfolio` | Current value, overall and daily returns, a stocks, funds and balance allocation bar, and holdings you can sort. |
| Orders | `/orders` | Stock orders (open and history, with charges and cancel), mutual fund orders and IPO applications. |
| SIPs | `/sips` | Monthly total, next debit, and pause, resume, change the amount or date, or stop. Missed instalments catch up the next time you open the app. |
| Balance | `/wallet` | Add money (UPI or net banking, simulated), withdraw to your linked bank, and a ledger of every rupee in and out, including holds and releases. |
| IPOs | `/ipo`, `/ipo/[id]` | A rolling weekly calendar. Bid by lots at the cut-off price or your own, through a UPI mandate. Retail subscription builds live, and allotment is an honest lottery (about 1 in N when retail bids N times the shares). Bidding runs Tuesday to Thursday, allotment comes the next Monday evening, and allotted shares list that Wednesday, then trade like any other stock. |
| KYC | `/kyc` | PAN, date of birth (18+), bank account and IFSC (resolves the bank name), then three declarations. Only a masked PAN and the account's last 4 digits are kept. |

**Guardrails, in the app's spirit.** Mutual funds are open to everyone after KYC. Buying single stocks needs the L-plate (hold through the 90-second Crash Simulator), and the first stock order shows "Three honest things" once. Ups and downs are written as words, never as red or green. Licence Level 2 now unlocks the **Fun Pot**, and the Fun Pot trades on the same live tape as the Invest tab.

**Sample profiles** come with KYC done, a balance, holdings, SIPs with a year of history, and a watchlist. A profile made from your own numbers starts empty and unverified.

The engine is `src/lib/market.ts` (sessions, prices, charts, funds, IPO calendar) and `src/lib/invest.ts` (wallet, orders, allotment, SIPs, settling). Everything is pure functions of time and state, settled every 5 seconds and on load.

## The extras

- **Light and dark, one tap apart.** The sun or moon button on Home flips the theme with a circular reveal that spreads from the button. Settings has Light, Dark and Auto (follow the phone). Light is the default, and the theme is applied before the first paint, so it never flashes.
- **What if?** Tap the runway ring on Home. Drag two sliders, "spend less" and "put into pots", and watch your runway and goal date change live. "Make it real" saves the new monthly spend.
- **Future you.** On a Later or Never touch pot, drag the years and the monthly amount to see what the pot could grow to. The rate it assumes is written on screen in plain words.
- **Your week.** A full-screen story recap you tap through: runway, landings, tips you didn't chase, Lazy Twin, your circle and stickers. "Share my week" sends habits only, never amounts.
- **Stickers, never streaks.** 10 habit stickers; earning one triggers confetti and a haptic tick. Nothing is ever taken away.
- **Celebrations** when a pot hits its target, when you split a salary, and when you hold through the crash.
- **Slide to confirm** on deliberate moves: selling a Never touch pot, unlocking F&O, splitting a salary. Keyboard users press Enter.
- **Shagun as an image.** Save the card as a 1080×1350 PNG for WhatsApp status, or share it directly where the phone supports it.
- **Installable (PWA).** It has a manifest, icons and shortcuts, and a service worker that keeps it working offline after the first visit (production build only).
- **Haptics and count-up numbers** throughout. Animations are turned off when the phone's reduced-motion setting is on.

## How it's built

- **Next.js 15 App Router, React 19, TypeScript (strict).** No UI library: `src/app/globals.css` is the design's `gz.css` token system, ported as is.
- **State** lives in `src/lib/store.tsx`: one typed `State` object, saved to `localStorage` and updated through `update(draft => …)`.
- **Logic** (runway, licence, the Fun Pot ceiling, twin gap and the 6 pm auto-invest) is in `src/lib/logic.ts`. Seeds and demo datasets are in `src/lib/data.ts`.
- **Market and investing**: `src/lib/market.ts` is a deterministic tape (the same prices on every device) and `src/lib/invest.ts` is the order book, wallet, SIP and IPO logic, saved in `state.invest`.
- **Sheets** use the native `<dialog>`, which provides the focus trap, Esc to close and the backdrop.

## Demo data, honestly labelled

There's no backend. Tip Check companies, tipster handles, Fun Pot and Invest stocks, mutual funds, fund houses, IPOs and prices are **fictional**; index values are demo values. The Crash Simulator path is **shaped like** Nifty 50 history with rounded values. "Market today" is a deterministic demo value. To go live, swap in Account Aggregator for credits, exchange data and a broker or BSE StAR MF integration for prices, orders and tips, SEBI's public register, and a payments and KYC backend for Shagun.
