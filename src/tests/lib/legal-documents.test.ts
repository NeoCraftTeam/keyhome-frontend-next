import { describe, expect, it } from 'vitest';

import { LEGAL_DOCUMENTS_LAST_UPDATED_LABEL } from '@/lib/legal-documents';

describe('legal-documents', () => {
  it('exports a French date label for counsel review', () => {
    expect(LEGAL_DOCUMENTS_LAST_UPDATED_LABEL).toMatch(
      /^\d{1,2} [a-zéû]+ \d{4}$/i
    );
  });
});
