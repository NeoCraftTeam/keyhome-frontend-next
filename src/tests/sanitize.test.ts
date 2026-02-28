import { escapeHtml } from '@/lib/sanitize';
import { describe, expect, it } from 'vitest';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than and greater-than', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  it('handles null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  it('handles undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('leaves safe strings unchanged', () => {
    expect(escapeHtml('Yaoundé Bastos')).toBe('Yaoundé Bastos');
  });

  it('prevents XSS payload', () => {
    const xss = '<img src=x onerror="alert(1)">';
    expect(escapeHtml(xss)).not.toContain('<');
    expect(escapeHtml(xss)).not.toContain('>');
  });

  // BUG CATCH: A combined payload tests that escaping order doesn't
  // double-encode entities. If & is replaced after < → &lt;, the &
  // in &lt; gets re-escaped to &amp;lt; which renders as "&lt;".
  it('handles combined XSS payload without double-encoding', () => {
    const combined = '<script>alert("xss" & \'more\')</script>';
    const result = escapeHtml(combined);
    expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot; &amp; &#039;more&#039;)&lt;/script&gt;');
    // Verify no double encoding — &amp;lt; would be wrong
    expect(result).not.toContain('&amp;lt;');
    expect(result).not.toContain('&amp;gt;');
  });

  // BUG CATCH: Very long strings shouldn't cause performance issues
  // or stack overflows with repeated .replace() calls.
  it('handles very long strings efficiently', () => {
    const longString = '<script>'.repeat(1000);
    const result = escapeHtml(longString);
    expect(result).not.toContain('<');
    expect(result.length).toBeGreaterThan(longString.length);
  });

  // BUG CATCH: Unicode and emoji must pass through unmodified.
  // Only HTML-special chars should be escaped.
  it('preserves unicode and emoji characters', () => {
    expect(escapeHtml('Quartier résidentiel 🏠')).toBe('Quartier résidentiel 🏠');
  });

  // BUG CATCH: Whitespace-only strings should pass through as-is.
  it('preserves whitespace-only strings', () => {
    expect(escapeHtml('   ')).toBe('   ');
  });

  // BUG CATCH: Numbers coerced to string — verifying there's no type crash.
  it('handles numeric strings', () => {
    expect(escapeHtml('42')).toBe('42');
  });
});
