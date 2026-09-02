'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useRef } from 'react';

export type ServerInsertedScript = {
  /** Optional DOM id — purely for devtools readability. */
  id?: string;
  /** MIME type; omit for classic JavaScript. */
  type?: string;
  /** Already-serialised script body. */
  html: string;
};

/**
 * Emits inline `<script>` tags into the SSR stream only, never into the tree
 * React reconciles on the client.
 *
 * Why this exists: React hydrates inline `<script>` children of `<head>`
 * *positionally* (unlike `<link>`/`<meta>`, which are hoistable and matched by
 * attributes). Any node a browser extension — or a third-party tag such as the
 * GTM bootstrap — inserts into `<head>` before hydration shifts that alignment,
 * so React compares our JSON-LD against the wrong DOM node and reports
 * "Hydration failed" / "attributes didn't match". Once hydration fails, React
 * re-renders the tree on the client and additionally logs the React 19
 * "Encountered a script tag while rendering React component" warning.
 *
 * `useServerInsertedHTML` sidesteps both: the markup is flushed into `<head>`
 * of the streamed HTML and is never part of the hydrated tree, so no amount of
 * third-party `<head>` injection can misalign it.
 *
 * Same mechanism as {@link ThemeInitScript}, generalised for several scripts.
 */
export function ServerInsertedScripts({
  scripts,
  nonce,
}: {
  scripts: readonly ServerInsertedScript[];
  nonce?: string;
}): null {
  // Next invokes every `useServerInsertedHTML` callback again at each flush
  // boundary of the streamed response, so an unguarded callback emits its
  // scripts once per flush (measured: 5× on the landing page). Emit on the
  // first flush only.
  const hasEmitted = useRef(false);

  useServerInsertedHTML(() => {
    if (hasEmitted.current) {
      return null;
    }
    hasEmitted.current = true;

    return (
      <>
        {scripts.map((script, index) => (
          <script
            key={script.id ?? index}
            id={script.id}
            type={script.type}
            nonce={nonce}
            suppressHydrationWarning
            dangerouslySetInnerHTML={{ __html: script.html }}
          />
        ))}
      </>
    );
  });

  return null;
}
