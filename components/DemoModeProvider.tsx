"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DemoContext = createContext({ isDemo: false });

export function useDemo() {
  return useContext(DemoContext);
}

export default function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const router = useRouter();
  useEffect(() => {
    try {
      const p = window.location?.pathname || '';
      setIsDemo(p.startsWith('/demo'));
    } catch (e) {
      setIsDemo(false);
    }
  }, []);

  useEffect(() => {
    if (!isDemo) return;
    // Intercept clicks on anchors and keep them under /demo prefix when appropriate
    function onClick(e: MouseEvent) {
      // only left-clicks without modifier
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== 'A') el = el.parentElement;
      if (!el) return;
      const a = el as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (!href) return;
      // ignore external links, anchors, mailto, javascript
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#') || href.startsWith('javascript:')) return;
      if (!href.startsWith('/')) return; // only absolute internal paths

      // prevent default and navigate to /demo prefixed path
      e.preventDefault();
      const target = `/demo${href}`;
      router.push(target);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [isDemo, router]);

  useEffect(() => {
    if (!isDemo) return;
    // Disable likely write buttons and add tooltip
    const texts = ['Export', 'Run', 'Create', 'Delete', 'Upload', 'Connect', 'Sync'];
    const els = Array.from(document.querySelectorAll('button, a')) as HTMLElement[];
    for (const el of els) {
      const txt = (el.textContent || '').trim();
      if (!txt) continue;
      if (texts.some(t => txt.includes(t))) {
        if (el instanceof HTMLAnchorElement) {
          el.addEventListener('click', (e) => { e.preventDefault(); alert('Available in real account'); });
          el.style.opacity = '0.6';
          el.setAttribute('title', 'Available in real account');
        } else {
          (el as HTMLButtonElement).disabled = true;
          el.setAttribute('title', 'Available in real account');
        }
      }
    }
  }, [isDemo]);

  return <DemoContext.Provider value={{ isDemo }}>{children}</DemoContext.Provider>;
}
