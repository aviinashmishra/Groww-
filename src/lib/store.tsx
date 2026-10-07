'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PersonaId, State, ThemePref } from './types';
import { createState } from './data';
import { needsSettle, note, potsTotal, settle } from './logic';
import { DICT, LANG_ATTR } from './i18n';
import { STICKERS, earnedIds } from './stickers';
import { buzz, revealTheme } from './fx';
import { localDay, uid } from './format';
import { Celebration, type Cheer } from '@/components/Celebration';

const KEY = 'gz-state-v1';

interface Ctx {
  state: State;
  update: (recipe: (draft: State) => void) => void;
  reset: (persona: PersonaId, name?: string, onboarded?: boolean) => void;
  toast: (msg: string) => void;
  celebrate: (c: Omit<Cheer, 'id'>) => void;
  setTheme: (theme: ThemePref, origin?: { x: number; y: number }) => void;
  t: (typeof DICT)['en'];
}

const StoreCtx = createContext<Ctx | null>(null);

/** Routes reachable before onboarding: the welcome flow and a shared shagun link. */
const OPEN_ROUTES = ['/welcome', '/crash', '/shagun/claim'];

const today = () => localDay();

function resolveTheme(t: ThemePref): 'light' | 'dark' {
  if (t !== 'auto') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Fill keys added after a device first saved its state; earned stickers are recorded silently. */
function prepare(s: State): State {
  const base = createState(s.persona ?? 'salary');
  const out: State = { ...base, ...s, settings: { ...base.settings, ...s.settings } };
  if (!Array.isArray(s.stickers)) out.stickers = earnedIds(out);
  if (!Array.isArray(s.snapshots)) out.snapshots = [];
  if (needsSettle(out)) settle(out);
  snapshot(out);
  return out;
}

function snapshot(d: State) {
  const day = today();
  const saved = potsTotal(d);
  const last = d.snapshots[d.snapshots.length - 1];
  if (last && last.day === day) last.saved = saved;
  else d.snapshots.push({ day, saved });
  d.snapshots = d.snapshots.slice(-60);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cheered = useRef(new Set<string>());
  const router = useRouter();
  const pathname = usePathname();

  // Load once from this device.
  useEffect(() => {
    let loaded: State | null = null;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        if (parsed && parsed.v === 1) loaded = parsed;
      }
    } catch {
      /* storage blocked: start fresh */
    }
    setState(prepare(structuredClone(loaded ?? createState('salary'))));
  }, []);

  // Persist.
  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Pending credits invest themselves at 6 pm.
  useEffect(() => {
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev || !needsSettle(prev)) return prev;
        const d = structuredClone(prev);
        settle(d);
        snapshot(d);
        return d;
      });
    }, 20000);
    return () => clearInterval(id);
  }, []);

  // New stickers: record them, note them, and celebrate each once.
  useEffect(() => {
    if (!state || !state.onboarded) return;
    const fresh = earnedIds(state).filter((id) => !state.stickers.includes(id) && !cheered.current.has(id));
    if (!fresh.length) return;
    fresh.forEach((id) => cheered.current.add(id));
    setState((prev) => {
      if (!prev) return prev;
      const d = structuredClone(prev);
      for (const id of fresh) {
        if (d.stickers.includes(id)) continue;
        const st = STICKERS.find((x) => x.id === id)!;
        d.stickers.push(id);
        note(d, `New sticker: ${st.name}`, st.blurb, '/profile');
      }
      return d;
    });
    setCheers((q) => [
      ...q,
      ...fresh.map((id) => {
        const st = STICKERS.find((x) => x.id === id)!;
        return { id: uid(), title: st.name, body: st.blurb, icon: st.icon, href: '/profile#stickers', cta: 'See my stickers' };
      }),
    ]);
  }, [state]);

  // Theme, lite mode and language on <html>.
  const theme = state?.settings.theme;
  const lite = state?.settings.lite;
  const lang = state?.settings.language;
  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      root.dataset.theme = resolveTheme(theme);
      root.dataset.lite = String(!!lite);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])') ?? Object.assign(document.head.appendChild(document.createElement('meta')), { name: 'theme-color' });
      meta.setAttribute('content', root.dataset.theme === 'dark' ? '#0A1012' : '#ECF0F0');
      try {
        localStorage.setItem('gz-theme', JSON.stringify({ theme, lite: !!lite }));
      } catch {
        /* ignore */
      }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme, lite]);
  useEffect(() => {
    if (lang) document.documentElement.lang = LANG_ATTR[lang];
  }, [lang]);

  // Onboarding guard.
  useEffect(() => {
    if (state && !state.onboarded && !OPEN_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace('/welcome');
    }
  }, [state, pathname, router]);

  const update = useCallback((recipe: (draft: State) => void) => {
    setState((prev) => {
      if (!prev) return prev;
      const d = structuredClone(prev);
      recipe(d);
      snapshot(d);
      return d;
    });
  }, []);

  const reset = useCallback((persona: PersonaId, name?: string, onboarded = true) => {
    setState((prev) => {
      const next = createState(persona, name, onboarded);
      if (prev) next.settings = { ...prev.settings };
      next.stickers = earnedIds(next);
      snapshot(next);
      return next;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    buzz(8);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  const celebrate = useCallback((c: Omit<Cheer, 'id'>) => setCheers((q) => [...q, { ...c, id: uid() }]), []);

  const setTheme = useCallback((next: ThemePref, origin?: { x: number; y: number }) => {
    revealTheme(() => {
      document.documentElement.dataset.theme = resolveTheme(next);
      setState((prev) => {
        if (!prev) return prev;
        const d = structuredClone(prev);
        d.settings.theme = next;
        return d;
      });
    }, origin);
    buzz(10);
  }, []);

  const value = useMemo<Ctx | null>(
    () => (state ? { state, update, reset, toast, celebrate, setTheme, t: DICT[state.settings.language] } : null),
    [state, update, reset, toast, celebrate, setTheme],
  );

  if (!value) {
    return (
      <div className="splash" aria-busy="true" aria-label="Loading">
        <div className="lp">L</div>
      </div>
    );
  }

  const blocked = !value.state.onboarded && !OPEN_ROUTES.some((r) => pathname.startsWith(r));
  const cheer = cheers[0];

  return (
    <StoreCtx.Provider value={value}>
      {blocked ? (
        <div className="splash" aria-busy="true">
          <div className="lp">L</div>
        </div>
      ) : (
        children
      )}
      {toastMsg && (
        <div className="toast" role="status" aria-live="polite">
          {toastMsg}
        </div>
      )}
      {cheer && (
        <Celebration
          key={cheer.id}
          cheer={cheer}
          onDone={() => setCheers((q) => q.slice(1))}
          onGo={(href) => router.push(href)}
        />
      )}
    </StoreCtx.Provider>
  );
}

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}
