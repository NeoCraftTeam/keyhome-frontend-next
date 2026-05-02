'use client';

import { useServerInsertedHTML } from 'next/navigation';

const THEME_SCRIPT = `(function(){try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.style.colorScheme=d?"dark":"light";if(d){document.documentElement.setAttribute("data-kh-theme","dark");document.documentElement.style.backgroundColor="#141419";document.documentElement.style.color="#F0EEF8";}else{document.documentElement.setAttribute("data-kh-theme","light");document.documentElement.style.backgroundColor="";document.documentElement.style.color="";}}catch(e){}})();`;

/**
 * Injects the anti-FOUC theme detection script via useServerInsertedHTML so
 * the <script> element is only in the SSR output — React never reconciles it
 * on the client, avoiding the React 19 "Encountered a script tag" warning.
 */
export function ThemeInitScript({ nonce }: { nonce?: string }) {
  useServerInsertedHTML(() => (
    <script
      id="kh-theme-init"
      suppressHydrationWarning
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
    />
  ));
  return null;
}
