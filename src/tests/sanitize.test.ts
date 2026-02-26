import { describe, it, expect } from 'vitest';
import { escapeHtml } from '@/lib/sanitize';

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
});
