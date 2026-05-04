import { describe, expect, it } from 'vitest';
import {
  BIO_MAX_LENGTH,
  htmlToMarkdownLight,
  markdownLightToHtml,
} from '@/lib/markdown-light';

describe('markdownLightToHtml', () => {
  it('returns empty string for nullish/empty input', () => {
    expect(markdownLightToHtml('')).toBe('');
    expect(markdownLightToHtml(null)).toBe('');
    expect(markdownLightToHtml(undefined)).toBe('');
  });

  it('escapes HTML in plain text input', () => {
    const html = markdownLightToHtml('hello <script>alert(1)</script>');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders bold and italic emphasis', () => {
    const html = markdownLightToHtml('Bonjour **monde** *italique*');
    expect(html).toContain('<strong>monde</strong>');
    expect(html).toContain('<em>italique</em>');
  });

  it('renders headings', () => {
    expect(markdownLightToHtml('## Titre')).toContain('<h3>Titre</h3>');
    expect(markdownLightToHtml('### Sous-titre')).toContain(
      '<h3>Sous-titre</h3>'
    );
  });

  it('renders bullet lists', () => {
    const html = markdownLightToHtml('- premier\n- second\n- troisième');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>premier</li>');
    expect(html).toContain('<li>troisième</li>');
    expect(html).toContain('</ul>');
  });

  it('renders numbered lists', () => {
    const html = markdownLightToHtml('1. premier\n2. second');
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>premier</li>');
  });

  it('only allows http(s) and mailto links and forces noopener', () => {
    const html = markdownLightToHtml(
      '[KH](https://keyhome.app) [bad](javascript:alert(1)) [mail](mailto:hi@keyhome.app)'
    );
    expect(html).toContain(
      '<a href="https://keyhome.app" target="_blank" rel="noopener noreferrer nofollow">KH</a>'
    );
    expect(html).toContain(
      '<a href="mailto:hi@keyhome.app" target="_blank" rel="noopener noreferrer nofollow">mail</a>'
    );
    expect(html).not.toContain('javascript:');
  });

  it('truncates input to BIO_MAX_LENGTH', () => {
    const long = 'a'.repeat(BIO_MAX_LENGTH + 500);
    const html = markdownLightToHtml(long);
    // Output is wrapped in <p>…</p> — body must be exactly BIO_MAX_LENGTH chars
    const inner = html.replace(/^<p>/, '').replace(/<\/p>$/, '');
    expect(inner.length).toBe(BIO_MAX_LENGTH);
  });
});

describe('htmlToMarkdownLight (TipTap save path)', () => {
  it('converts strong/em back to ** and *', () => {
    const md = htmlToMarkdownLight(
      '<p>Bonjour <strong>monde</strong> <em>italique</em></p>'
    );
    expect(md).toContain('**monde**');
    expect(md).toContain('*italique*');
  });

  it('converts headings level 1-3 to ##', () => {
    expect(htmlToMarkdownLight('<h3>Titre</h3>')).toContain('## Titre');
  });

  it('converts ul/ol to - / 1.', () => {
    expect(
      htmlToMarkdownLight('<ul><li>premier</li><li>second</li></ul>')
    ).toContain('- premier');
    expect(
      htmlToMarkdownLight('<ol><li>premier</li><li>second</li></ol>')
    ).toContain('1. premier');
    expect(
      htmlToMarkdownLight('<ol><li>premier</li><li>second</li></ol>')
    ).toContain('2. second');
  });

  it('round-trips plain text without losing data', () => {
    const md = 'Hello **world**\n\n- premier\n- second';
    const html = markdownLightToHtml(md);
    const back = htmlToMarkdownLight(html);
    // Round-trip preserves the same shape (Bold + bullets), allowing for
    // minor whitespace normalization between blocks.
    expect(back).toContain('**world**');
    expect(back).toContain('- premier');
    expect(back).toContain('- second');
  });

  it('drops unsafe link protocols', () => {
    const md = htmlToMarkdownLight(
      '<p><a href="javascript:alert(1)">bad</a></p>'
    );
    expect(md).not.toContain('javascript:');
  });
});
