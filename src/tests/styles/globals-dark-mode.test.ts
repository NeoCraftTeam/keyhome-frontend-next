import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The app's dark mode is an explicit user choice (light / dark / system) applied
 * as `html[data-kh-theme='dark']` by ThemeProvider. Styling dark surfaces off
 * the raw OS `@media (prefers-color-scheme: dark)` silently ignores that choice
 * (user picks dark, OS is light → the element stays light). This guard keeps
 * every dark-mode rule in globals.css keyed to the in-app theme attribute.
 */
describe('globals.css dark-mode wiring', () => {
  const css = readFileSync(
    resolve(process.cwd(), 'src/app/globals.css'),
    'utf8'
  );

  it('never keys dark styling off the OS colour scheme', () => {
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('defines dark-mode overrides via the in-app theme attribute', () => {
    expect(css).toContain("html[data-kh-theme='dark']");
  });
});
