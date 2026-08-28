import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PublishingOverlay from '@/components/owner/PublishingOverlay';
import { brandAgent } from '@/theme/tokens';

/**
 * PublishingOverlay lives under components/owner/, so its default accent must be
 * the owner teal (brandAgent.primary) — never the visitor coral brand. This
 * locks the fix so the "en cours de publication" modal can't regress to pink.
 *
 * MUI serialises the sx colours through emotion into <style> tags; the halo /
 * progress background go through bgAlpha(), which emits a deterministic
 * rgba(r,g,b,a) string we can assert against without resolving computed styles.
 */

function emittedStyles(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((s) => s.textContent ?? '')
    .join('');
}

afterEach(cleanup);

describe('PublishingOverlay', () => {
  it('defaults to the owner teal accent, not the visitor coral', () => {
    render(<PublishingOverlay open />);

    const styles = emittedStyles();
    // teal #0D9488 → rgba(13,148,136,…) halo + progress background
    expect(styles).toContain('rgba(13,148,136');
    // visitor coral #F6475F → rgba(246,71,95,…) must be gone
    expect(styles).not.toContain('rgba(246,71,95');
    expect(brandAgent.primary).toBe('#0D9488');
  });

  it('honours an explicit accent (e.g. red destructive overlay)', () => {
    // Note: emotion accumulates its <style> tags in document.head across
    // renders (cleanup clears the rendered DOM, not the emotion cache), so a
    // "not teal" check here would be fooled by the previous test's styles. We
    // only assert the explicit accent is emitted; the teal-vs-coral guarantee
    // is covered by the default-accent test above.
    render(<PublishingOverlay open accentColor="#d32f2f" />);

    // #d32f2f → rgba(211,47,47,…)
    expect(emittedStyles()).toContain('rgba(211,47,47');
  });

  it('exposes an assertive status region labelled by the title when open', () => {
    render(<PublishingOverlay open title="En cours de publication…" />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'assertive');
    expect(status).toHaveAttribute('aria-label', 'En cours de publication…');
  });

  it('renders nothing when closed', () => {
    render(<PublishingOverlay open={false} />);

    expect(screen.queryByRole('status')).toBeNull();
  });
});
