'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

/**
 * On laptops and desktops the app runs inside a phone: a device bezel, rounded screen
 * and Dynamic Island, with the app scrolling inside the screen. On real phones the
 * wrappers are `display: contents`, so the app is simply full-screen.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const screen = useRef<HTMLDivElement>(null);
  const path = usePathname();

  // The screen scrolls on its own inside the frame, so reset it on every page change.
  useEffect(() => {
    screen.current?.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="device">
      <div className="phone">
        <div className="island" aria-hidden="true" />
        <div className="app" ref={screen}>
          {children}
        </div>
      </div>
    </div>
  );
}
