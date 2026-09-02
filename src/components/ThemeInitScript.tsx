'use client';

import { ServerInsertedScripts } from '@/components/ServerInsertedScripts';

const THEME_SCRIPT = `(function(){try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.style.colorScheme=d?"dark":"light";if(d){document.documentElement.setAttribute("data-kh-theme","dark");document.documentElement.style.backgroundColor="#141419";document.documentElement.style.color="#F0EEF8";}else{document.documentElement.setAttribute("data-kh-theme","light");document.documentElement.style.backgroundColor="";document.documentElement.style.color="";}}catch(e){}})();`;

/**
 * Injects the anti-FOUC theme detection script into the SSR stream only, so
 * React never reconciles it on the client — see {@link ServerInsertedScripts}
 * for why every inline script in the head goes through that path.
 */
export function ThemeInitScript({
  nonce,
}: {
  nonce?: string;
}): React.JSX.Element {
  return (
    <ServerInsertedScripts
      nonce={nonce}
      scripts={[{ id: 'kh-theme-init', html: THEME_SCRIPT }]}
    />
  );
}
