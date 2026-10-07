'use client';

import { useEffect, useState } from 'react';

/** A calm heads-up when the connection drops. Everything keeps working offline. */
export function Offline() {
  const [offline, setOffline] = useState(false);
  const [back, setBack] = useState(false);
  useEffect(() => {
    setOffline(!navigator.onLine);
    let t: ReturnType<typeof setTimeout>;
    const down = () => { setOffline(true); setBack(false); };
    const up = () => { setOffline(false); setBack(true); t = setTimeout(() => setBack(false), 2500); };
    window.addEventListener('offline', down);
    window.addEventListener('online', up);
    return () => { window.removeEventListener('offline', down); window.removeEventListener('online', up); clearTimeout(t); };
  }, []);
  if (!offline && !back) return null;
  return (
    <div className="offline" role="status" aria-live="polite">
      <span style={{ width: 8, height: 8, borderRadius: 4, background: offline ? '#F5A524' : '#00D09C' }} />
      {offline ? 'Offline. Everything still works on this phone.' : 'Back online'}
    </div>
  );
}
