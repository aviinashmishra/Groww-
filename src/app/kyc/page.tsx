'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Screen, TopBar } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useStore } from '@/lib/store';
import { note } from '@/lib/logic';
import { buzz } from '@/lib/fx';

const PAN = /^[A-Z]{3}[PCHFATBLJG][A-Z]\d{4}[A-Z]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const BANKS: Record<string, string> = {
  SBIN: 'State Bank of India', HDFC: 'HDFC Bank', ICIC: 'ICICI Bank', UTIB: 'Axis Bank', KKBK: 'Kotak Mahindra Bank', PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda', CNRB: 'Canara Bank', UBIN: 'Union Bank of India', IDIB: 'Indian Bank', YESB: 'Yes Bank', IDFB: 'IDFC First Bank',
  INDB: 'IndusInd Bank', FDRL: 'Federal Bank', DECB: 'Deccan Bank',
};

function age(dob: string): number {
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return -1;
  const now = new Date();
  return now.getFullYear() - d.getFullYear() - (now < new Date(now.getFullYear(), d.getMonth(), d.getDate()) ? 1 : 0);
}

export default function Kyc() {
  const { state, update, celebrate } = useStore();
  const router = useRouter();
  const [next, setNext] = useState('/invest');
  const [step, setStep] = useState(0);
  const [name, setName] = useState(state.name);
  const [pan, setPan] = useState('');
  const [dob, setDob] = useState('');
  const [acct, setAcct] = useState('');
  const [acct2, setAcct2] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [decl, setDecl] = useState({ tax: false, pep: false, terms: false });
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get('next');
    if (n && n.startsWith('/') && !n.startsWith('//')) setNext(n);
  }, []);

  const verified = state.invest.kyc.status === 'verified';
  if (verified && step < 3) {
    const k = state.invest.kyc;
    return (
      <Screen orbs="c" nav={false}>
        <TopBar back={next} label="KYC" />
        <div className="ico" style={{ width: 56, height: 56, borderRadius: 18 }}><Icon name="check" /></div>
        <h1 className="h1">You’re verified.</h1>
        <section className="glass col" style={{ gap: 6 }}>
          {k.name && <div className="kv"><span>Name</span><span>{k.name}</span></div>}
          <div className="kv"><span>PAN</span><span>{k.pan}</span></div>
          {k.bank && <div className="kv"><span>Bank</span><span>{k.bank.name} ••{k.bank.last4}</span></div>}
        </section>
        <div className="foot nonav"><Link className="btn" href={next}>Continue</Link></div>
      </Screen>
    );
  }

  const P = pan.toUpperCase();
  const a = age(dob);
  const panErr = !PAN.test(P) ? 'PAN looks like ABCPE1234F: 5 letters, 4 digits, 1 letter.' : null;
  const dobErr = a < 0 ? 'Add your date of birth.' : a < 18 ? 'You need to be 18 to open an account yourself. A parent can open a minor account for you.' : a > 100 ? 'Check the year.' : null;
  const nameErr = name.trim().length < 2 ? 'Your name as it is on your PAN card.' : null;
  const I = ifsc.toUpperCase();
  const acctErr = !/^\d{9,18}$/.test(acct) ? 'Account numbers are 9 to 18 digits.' : acct !== acct2 ? 'The two numbers don’t match.' : null;
  const ifscErr = !IFSC.test(I) ? 'IFSC looks like ABCD0123456. It’s on your cheque book or passbook.' : null;
  const bankName = BANKS[I.slice(0, 4)] ?? `${I.slice(0, 4)} bank`;

  const finish = () => {
    setStep(3);
    setTimeout(() => {
      update((d) => {
        d.invest.kyc = { status: 'verified', name: name.trim(), pan: `•••••${P.slice(5)}`, bank: { name: bankName, last4: acct.slice(-4), ifsc: I }, at: new Date().toISOString() };
        note(d, 'KYC verified', 'You can now invest in stocks, mutual funds and IPOs.', '/invest');
      });
      buzz([10, 30, 20]);
      celebrate({ eyebrow: 'KYC done', title: 'You’re in.', body: 'Stocks, mutual funds and IPOs are open. Start small; an index fund SIP is a calm first step.', icon: 'shield', href: next, cta: 'Continue' });
      router.replace(next);
    }, 1800);
  };

  return (
    <Screen orbs="c" nav={false}>
      <TopBar back={step > 0 && step < 3 ? undefined : next} label={`KYC · step ${Math.min(step + 1, 3)} of 3`} close />
      <div className="steps" aria-hidden="true">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>

      {step === 0 && (
        <>
          <h1 className="h1">Who are you, officially?</h1>
          <p className="body">The details on your PAN card. We keep only its last five characters.</p>
          <section className="glass col" style={{ gap: 12 }}>
            <Field id="kyc-name" label="Full name, as on PAN" value={name} onChange={setName} err={touched ? nameErr : null} autoComplete="name" />
            <Field id="kyc-pan" label="PAN" value={P} onChange={(v) => setPan(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))} err={touched && pan ? panErr : null} placeholder="ABCPE1234F" mono />
            <Field id="kyc-dob" label="Date of birth" value={dob} onChange={setDob} err={touched ? dobErr : null} type="date" />
          </section>
          <div className="foot nonav">
            <button className="btn" onClick={() => { setTouched(true); if (!panErr && !dobErr && !nameErr) { setTouched(false); setStep(1); } }}>Continue</button>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="h1">Where should money go?</h1>
          <p className="body">A savings account in your name. Withdrawals and redemptions land here; SIP autopay comes from here.</p>
          <section className="glass col" style={{ gap: 12 }}>
            <Field id="kyc-acct" label="Account number" value={acct} onChange={(v) => setAcct(v.replace(/\D/g, '').slice(0, 18))} inputMode="numeric" mono />
            <Field id="kyc-acct2" label="Account number, again" value={acct2} onChange={(v) => setAcct2(v.replace(/\D/g, '').slice(0, 18))} inputMode="numeric" err={touched ? acctErr : null} mono />
            <Field id="kyc-ifsc" label="IFSC" value={I} onChange={(v) => setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))} err={touched && ifsc ? ifscErr : null} placeholder="SBIN0001234" mono />
            {!ifscErr && <div className="plate row"><div className="ico n"><Icon name="bank" /></div><span className="med">{bankName}</span></div>}
          </section>
          <div className="foot nonav">
            <button className="btn" onClick={() => { setTouched(true); if (!acctErr && !ifscErr) { setTouched(false); setStep(2); } }}>Continue</button>
            <button className="ghost" onClick={() => setStep(0)}>Back</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="h1">Three quick yeses.</h1>
          <section className="glass col" style={{ gap: 8 }}>
            {([
              ['tax', 'I’m an Indian resident for tax', 'Non-residents need an NRE/NRO account instead.'],
              ['pep', 'I’m not a politically exposed person', 'Not a senior government, judicial or party official, or their close family.'],
              ['terms', 'I agree to the account terms and to e-sign', 'Your Aadhaar OTP signs the account opening form.'],
            ] as const).map(([k, t, sub]) => (
              <button key={k} className={`plate row${decl[k] ? ' you' : ''}`} aria-pressed={decl[k]} onClick={() => setDecl((d) => ({ ...d, [k]: !d[k] }))}>
                <span className="col grow" style={{ gap: 2 }}><span className="med">{t}</span><span className="cap">{sub}</span></span>
                <span className={`ico${decl[k] ? '' : ' n'}`} style={{ width: 28, height: 28, borderRadius: 9 }}>{decl[k] && <Icon name="check" small />}</span>
              </button>
            ))}
          </section>
          <section className="glass col" style={{ gap: 4 }}>
            <div className="kv"><span>Name</span><span>{name.trim()}</span></div>
            <div className="kv"><span>PAN</span><span>•••••{P.slice(5)}</span></div>
            <div className="kv"><span>Bank</span><span>{bankName} ••{acct.slice(-4)}</span></div>
          </section>
          <div className="foot nonav">
            <button className="btn" disabled={!decl.tax || !decl.pep || !decl.terms} onClick={finish}>Verify and open my account</button>
            <button className="ghost" onClick={() => setStep(1)}>Back</button>
          </div>
        </>
      )}

      {step === 3 && (
        <div className="col" style={{ alignItems: 'center', gap: 14, marginTop: 60 }}>
          <div className="spin-ring" />
          <h1 className="h1" style={{ textAlign: 'center' }}>Checking your PAN and bank…</h1>
          <p className="body center">A ₹1 test deposit confirms the account is yours. Demo: everything stays on this phone.</p>
        </div>
      )}
    </Screen>
  );
}

function Field({ id, label, value, onChange, err, placeholder, type = 'text', inputMode, autoComplete, mono }: {
  id: string; label: string; value: string; onChange: (v: string) => void; err?: string | null; placeholder?: string; type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; autoComplete?: string; mono?: boolean;
}) {
  return (
    <div className="col" style={{ gap: 8 }}>
      <label htmlFor={id} className="eye" style={{ padding: '0 4px' }}>{label}</label>
      <div className="field">
        <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} autoComplete={autoComplete ?? 'off'} spellCheck={false}
          aria-invalid={!!err} aria-describedby={err ? `${id}-err` : undefined} style={mono ? { letterSpacing: '.08em', fontWeight: 600 } : undefined} />
      </div>
      {err && <p id={`${id}-err`} className="err" style={{ padding: '0 4px' }}>{err}</p>}
    </div>
  );
}
