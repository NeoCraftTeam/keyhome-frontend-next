'use client';

import { getMicrosoftClarityProjectId } from '@/lib/clarity';
import Script from 'next/script';
import type { ReactElement } from 'react';

interface MicrosoftClarityProps {
  /**
   * CSP nonce forwarded from the per-request proxy header (`x-nonce`).
   * Required when a nonce-based Content-Security-Policy is active —
   * inline scripts without the correct nonce are blocked in production.
   */
  nonce?: string;
}

/**
 * Injects the official Microsoft Clarity bootstrap snippet.
 *
 * Why inline instead of `src=`?
 * The Clarity tag works in two steps:
 *   1. An inline snippet initialises `window.clarity` as a queuing function
 *      and appends a `<script src="https://www.clarity.ms/tag/ID">` to the DOM.
 *   2. That external script drains the queue and replaces `window.clarity`
 *      with the real implementation.
 *
 * Loading only the external script (step 2) without step 1 causes
 * `TypeError: a[c] is not a function` because the script immediately tries
 * to call `window.clarity("run", ...)` but the queue shim doesn't exist yet.
 *
 * Using `dangerouslySetInnerHTML` with the official snippet replicates
 * exactly what Microsoft's embed code does. The nonce is forwarded so the
 * inline script passes the nonce-based CSP enforced by `src/proxy.ts`.
 *
 * Only renders when `NEXT_PUBLIC_MICROSOFT_CLARITY_PROJECT_ID` is set.
 */
export function MicrosoftClarity({
  nonce,
}: MicrosoftClarityProps): ReactElement | null {
  const projectId = getMicrosoftClarityProjectId();

  if (!projectId) {
    return null;
  }

  // Official Microsoft Clarity snippet (minified).
  // Source: https://clarity.microsoft.com → Settings → Setup → Get tracking code
  // The snippet initialises window.clarity as a buffering queue, then
  // injects the real tracker script from www.clarity.ms/tag/<id>.
  const snippet = `(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","${projectId}");`;

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: snippet }}
    />
  );
}
