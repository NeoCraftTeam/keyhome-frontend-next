import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The lease service imports the axios instance at module load; stub it so the
// test exercises only the raw `fetch` path used by the public preview.
vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

import { ownerLeaseService } from '@/services/owner/owner-lease.service';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ownerLeaseService.getPublicSignatureContractPreviewHtml', () => {
  // BUG CATCH: the signer's contract reader renders this text via `srcDoc`.
  // If the service parsed it as JSON (like the other public calls) the iframe
  // would be empty and the signer could never read what they sign.
  it('returns the raw contract HTML and asks for text/html', async () => {
    const html = '<article class="lease-contract">CONTRAT DE BAIL</article>';
    fetchMock.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(html),
    });

    const result =
      await ownerLeaseService.getPublicSignatureContractPreviewHtml('tok-123');

    expect(result).toBe(html);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('/signatures/tok-123/preview');
    expect((init as RequestInit).headers).toMatchObject({
      Accept: 'text/html',
    });
  });

  it('throws when the preview request fails', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve(''),
    });

    await expect(
      ownerLeaseService.getPublicSignatureContractPreviewHtml('missing')
    ).rejects.toThrow('404');
  });
});
