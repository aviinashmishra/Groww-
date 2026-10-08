// Evals for Groww for Gen Z. Run with: npm run evals
//
// Compiles the app's real logic (src/lib) with the project's own TypeScript, then checks
// it against the promises the product makes to a first-time investor: the money maths is
// right, the guardrails can't be skipped, the app tells the truth, and it adapts to you.

import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require(join(root, 'node_modules', 'typescript'));

/* ---------- Build src/lib into a temp folder ---------- */

const LIB = ['types', 'format', 'market', 'invest', 'data', 'logic', 'shagun', 'stickers', 'foryou', 'i18n'];
const out = mkdtempSync(join(tmpdir(), 'groww-evals-'));
writeFileSync(join(out, 'package.json'), '{"type":"commonjs"}');
for (const f of LIB) {
  const src = readFileSync(join(root, 'src', 'lib', `${f}.ts`), 'utf8');
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  writeFileSync(join(out, `${f}.js`), js);
}
const lib = (f) => require(join(out, `${f}.js`));
const { createState, findCompany } = lib('data');
const L = lib('logic');
const F = lib('format');
const M = lib('market');
const I = lib('invest');
const S = lib('shagun');
const { forYou } = lib('foryou');

/* ---------- A tiny harness ---------- */

const evals = [];
const ev = (id, area, name, fn) => evals.push({ id, area, name, fn });
const eq = (a, b, what = '') => { if (a !== b) throw new Error(`${what} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, what) => { if (!c) throw new Error(what); };
const own = (persona = 'salary', n = { income: 30000, spend: 20000, savings: 50000 }) => createState(persona, 'Riya', true, n);
const DAY = 86400000;

/* ---------- A. The money maths is right ---------- */

ev('A1', 'Money maths', 'Runway for a first-salary earner is savings ÷ monthly spend, in months', () => {
  const r = L.runway(createState('salary'));
  eq(r.display, '2.3', 'runway'); eq(r.unit, 'months', 'unit');
});
ev('A2', 'Money maths', 'A student’s runway is counted in days, not months', () => {
  const r = L.runway(createState('student'));
  eq(r.value, 11, 'days'); eq(r.unit, 'days', 'unit');
});
ev('A3', 'Money maths', 'Zero savings gives a runway of 0, never NaN or Infinity', () => {
  const s = own('salary', { income: 0, spend: 1, savings: 0 });
  eq(L.runway(s).value, 0, 'runway');
});
ev('A4', 'Money maths', 'Rupees use Indian grouping (₹1,25,000) and a readable minus', () => {
  eq(F.rupees(125000), '₹1,25,000'); eq(F.rupees(-500), '− ₹500');
});
ev('A5', 'Money maths', 'Chillar Jar rounds ₹342 up by ₹8, a round ₹340 by nothing, and 2× on ₹50 steps by ₹16', () => {
  eq(L.roundup(342, 10, 1), 8); eq(L.roundup(340, 10, 1), 0); eq(L.roundup(342, 50, 2), 16);
});
ev('A6', 'Money maths', '“Worth it?” prices a ₹1,050 buy at exactly 1 day of runway on ₹31,500 a month', () => {
  eq(Math.round(L.worth(createState('salary'), 1050).days * 100) / 100, 1);
});
ev('A7', 'Money maths', 'Brokerage is capped at ₹20, floors at ₹5, and sells pay no stamp duty', () => {
  eq(I.charges('buy', 1000000).brokerage, 20); eq(I.charges('buy', 100).brokerage, 5); eq(I.charges('sell', 50000).stamp, 0);
});
ev('A8', 'Money maths', 'SIP calculator: ₹1,000 a month for 10 years invests ₹1,20,000 and grows at 12%', () => {
  const r = M.sipFutureValue(1000, 10, 12);
  eq(r.invested, 120000); ok(r.value > 220000 && r.value < 240000, `value ${r.value}`);
});

/* ---------- B. Guardrails can’t be skipped ---------- */

ev('B1', 'Guardrails', 'A new user has no licence; holding through the crash gives the L-plate only', () => {
  const s = own();
  eq(L.licence(s).level, 0, 'before crash');
  s.crash.held = true;
  eq(L.licence(s).level, 1, 'after crash, day one');
});
ev('B2', 'Guardrails', 'Level 2 (Fun Pot) needs the crash, 6 months in and 2 months of runway, all three', () => {
  const s = createState('salary'); s.crash.held = true;
  eq(L.licence(s).level, 2, 'all three met');
  const thin = createState('salary'); thin.crash.held = true; thin.pots.forEach((p) => (p.balance = 1000));
  eq(L.licence(thin).level, 1, 'thin runway');
});
ev('B3', 'Guardrails', 'F&O (Level 3) stays locked until the quiz, cooling-off and loss limit unlock it', () => {
  const s = createState('salary'); s.crash.held = true;
  eq(L.licence(s).level, 2, 'not unlocked'); s.fun.foUnlocked = true; eq(L.licence(s).level, 3, 'unlocked');
});
ev('B4', 'Guardrails', 'Fun Pot play money is capped at 10% of everything you have', () => {
  const s = createState('salary'); const f = L.funValue(s);
  eq(f.ceiling, Math.round((L.potsTotal(s) + f.balance) * 0.1)); ok(f.room >= 0, 'room is never negative');
});
ev('B5', 'Guardrails', 'Invest What Lands ignores refunds and transfers from yourself', () => {
  const s = own(); s.lands.enabled = true;
  eq(L.landCredit(s, 'Amazon refund', 1200, 'refund').status, 'ignored', 'refund');
  eq(L.landCredit(s, 'My other account', 5000, 'self').status, 'ignored', 'self');
  eq(L.landCredit(s, 'Salary', 30000, 'income').status, 'pending', 'income');
});
ev('B6', 'Guardrails', 'Landed money waits until 6 pm, then invests its share into Never touch, not before', () => {
  const s = own(); s.lands.enabled = true; s.lands.share = 10;
  const c = L.landCredit(s, 'Freelance', 8000, 'income');
  const before = s.pots.find((p) => p.id === 'never').balance;
  eq(L.settle(s, new Date(Date.parse(c.cutoff) - 60000)), false, 'one minute before 6 pm');
  eq(L.settle(s, new Date(Date.parse(c.cutoff) + 1000)), true, 'after 6 pm');
  eq(s.pots.find((p) => p.id === 'never').balance - before, 800, 'amount invested');
});
ev('B7', 'Guardrails', 'A skipped credit is never invested behind your back', () => {
  const s = own(); s.lands.enabled = true;
  const c = L.landCredit(s, 'Stipend', 5000, 'income'); L.skipCredit(s, c.id);
  L.settle(s, new Date(Date.parse(c.cutoff) + DAY));
  eq(s.credits[0].status, 'skipped');
});
ev('B8', 'Guardrails', 'Orders refuse fractional shares, wild limit prices, overselling and money you don’t have', () => {
  const s = createState('salary'); const st = M.STOCKS.find((x) => x.kind === 'stock'); const p = M.price(st);
  ok(typeof I.placeOrder(s, { stockId: st.id, side: 'buy', type: 'market', qty: 1.5 }) === 'string', 'fractional qty accepted');
  ok(typeof I.placeOrder(s, { stockId: st.id, side: 'buy', type: 'limit', qty: 1, limit: p * 1.5 }) === 'string', 'limit 50% away accepted');
  ok(typeof I.placeOrder(s, { stockId: st.id, side: 'sell', type: 'market', qty: 99999 }) === 'string', 'oversell accepted');
  s.invest.balance = 0;
  ok(String(I.placeOrder(s, { stockId: st.id, side: 'buy', type: 'market', qty: 1 })).startsWith('You need'), 'buy with ₹0 accepted');
  eq(s.invest.balance, 0, 'balance after refusals');
});
ev('B9', 'Guardrails', 'IPO allotment is an honest lottery: about 1 in N when retail is N× subscribed', () => {
  const ipo = M.ipoForWeek(M.currentWeek()); const n = 20000;
  let won = 0; for (let i = 0; i < n; i++) if (M.allotted(`app-${i}`, ipo)) won++;
  const expect = Math.min(1, 1 / Math.max(1, ipo.retail));
  ok(Math.abs(won / n - expect) / expect < 0.15, `${ipo.name} at ${ipo.retail}×: got ${(won / n).toFixed(3)}, expected ${expect.toFixed(3)}`);
});

/* ---------- C. The app tells the truth ---------- */

ev('C1', 'Honesty', 'Ups and downs are written as words (Up 3.2%, Down 4%, Flat), not signalled by colour alone', () => {
  eq(F.changeWords(3.24), 'Up 3.2%'); eq(F.changeWords(-4), 'Down 4%'); eq(F.changeWords(0.01), 'Flat');
});
ev('C2', 'Honesty', 'Tip Check finds a company whether you type its name or paste a hype message', () => {
  eq(findCompany('Zentra Polymers Ltd')?.id, 'zentra'); eq(findCompany('bhai buy zentra now 🚀🚀')?.id, 'zentra');
  eq(findCompany(''), undefined);
});
ev('C3', 'Honesty', 'A parked tip is scored only after its 90 days, and a halted stock is shown as halted', () => {
  const at = (d) => new Date(Date.now() - d * DAY).toISOString();
  eq(L.tipOutcome({ companyId: 'zentra', checkedAt: at(89) }).resolved, false, 'day 89');
  const z = L.tipOutcome({ companyId: 'zentra', checkedAt: at(91) }); eq(z.resolved, true, 'day 91'); eq(z.after90, -36, 'result');
  eq(L.tipOutcome({ companyId: 'orbit', checkedAt: at(91) }).halted, true, 'halted');
});
ev('C4', 'Honesty', 'Prices are deterministic: the same moment gives the same price on every phone', () => {
  const st = M.STOCKS[0]; const t = Date.UTC(2026, 9, 5, 6, 0);
  eq(M.priceAt(st, t), M.priceAt(st, t));
});
ev('C5', 'Honesty', 'The market is open 9:15 am to 3:30 pm IST on weekdays and closed on Sunday', () => {
  eq(M.session(Date.UTC(2026, 9, 5, 4, 30)).open, true, 'Mon 10:00 IST');
  eq(M.session(Date.UTC(2026, 9, 5, 10, 30)).open, false, 'Mon 16:00 IST');
  eq(M.session(Date.UTC(2026, 9, 4, 4, 30)).open, false, 'Sun 10:00 IST');
});
ev('C6', 'Honesty', 'No hype copy anywhere in the app (jackpot, guaranteed, to the moon…), and “streak” only ever appears to say there are none', () => {
  const files = []; const walk = (d) => readdirSync(d).forEach((f) => { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(f) && files.push(p); });
  walk(join(root, 'src', 'app')); walk(join(root, 'src', 'components'));
  const bad = [];
  for (const f of files) readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/jackpot|guaranteed|to the moon|get rich|sure.?shot|100x|lambo/i.test(line)) bad.push(`${f}:${i + 1}`);
    if (/streak/i.test(line) && !/never|not a|broke|nothing/i.test(line)) bad.push(`${f}:${i + 1}`);
  });
  ok(bad.length === 0, `found in ${bad.join(', ')}`);
});

/* ---------- D. Privacy and safety ---------- */

ev('D1', 'Privacy', 'A Shagun link carries the gift itself and survives Hindi text and emoji', () => {
  const g = { id: 'x1', to: 'Chhotu', occasion: 'Diwali', amount: 501, message: 'शुभ दीपावली 🪔', from: 'Didi', claimBy: new Date().toISOString() };
  const back = S.decodeShagun(S.encodeShagun(g));
  eq(back?.message, g.message, 'message'); eq(back?.amount, 501, 'amount');
});
ev('D2', 'Privacy', 'A broken or tampered Shagun link fails safely instead of crashing', () => {
  eq(S.decodeShagun('not-a-real-gift!!'), null);
  eq(S.decodeShagun(Buffer.from(JSON.stringify({ t: 'x', a: 'lots' })).toString('base64')), null);
});
ev('D3', 'Privacy', 'With “hide amounts” on, the For you card shows no rupee figures', () => {
  const s = own(); s.lands.enabled = true; L.landCredit(s, 'Salary', 30000, 'income'); s.settings.hideAmounts = true;
  ok(!forYou(s).title.includes('₹'), forYou(s).title);
});

/* ---------- E. It adapts to you ---------- */

ev('E1', 'Personalisation', 'Starting with your own numbers loads no sample history, and your savings go to Never touch', () => {
  const s = own();
  eq(s.sample, false, 'sample'); eq(s.credits.length, 0, 'credits'); eq(s.tips.length, 0, 'tips'); eq(s.twin.moves.length, 0, 'twin moves');
  eq(s.pots.find((p) => p.bucket === 'never').balance, 50000, 'never pot');
});
ev('E2', 'Personalisation', 'For you puts money that just landed ahead of everything else', () => {
  const s = own(); eq(forYou(s).key, 'crash', 'new user');
  s.lands.enabled = true; L.landCredit(s, 'Salary', 30000, 'income'); eq(forYou(s).key, 'pending', 'after a credit');
});
ev('E3', 'Personalisation', 'Each persona starts on its own runway goal: 6 months, 30 days, 3 months', () => {
  eq(L.runway(createState('salary')).goal, 6); eq(L.runway(createState('student')).goal, 30); eq(L.runway(createState('irregular')).goal, 3);
});

/* ---------- Run ---------- */

let pass = 0;
const rows = [];
for (const e of evals) {
  try { e.fn(); pass++; rows.push(`✓ ${e.id}  ${e.name}`); }
  catch (err) { rows.push(`✗ ${e.id}  ${e.name}\n      ${err.message}`); }
}
let area = '';
evals.forEach((e, i) => { if (e.area !== area) { area = e.area; console.log(`\n${area}`); } console.log(`  ${rows[i]}`); });
console.log(`\n${pass}/${evals.length} evals passed`);
process.exit(pass === evals.length ? 0 : 1);
