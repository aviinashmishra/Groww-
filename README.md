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
- **Sheets** use the native `<dialog>`, which provides the focus trap, Esc to close and the backdrop.

## Demo data, honestly labelled

There's no backend. Tip Check companies, tipster handles, Fun Pot stocks and prices are **fictional**. The Crash Simulator path is **shaped like** Nifty 50 history with rounded values. "Market today" is a deterministic demo value. To go live, swap in Account Aggregator for credits, exchange data for prices and tips, SEBI's public register, and a payments and KYC backend for Shagun.
