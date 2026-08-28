import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scrollToFirstInvalidField } from '@/components/owner/ad-form/scrollToFirstInvalidField';

/**
 * scrollToFirstInvalidField — makes a blocked "Suivant" legible.
 *
 * When step validation fails, the wizard scrolls the first invalid field into
 * view so the refusal never looks like a dead button. jsdom does not implement
 * scrollIntoView, so we stub it and capture the element it was called on.
 */

const scrolledInto: HTMLElement[] = [];

beforeEach(() => {
  scrolledInto.length = 0;
  document.body.innerHTML = '';
  Element.prototype.scrollIntoView = vi.fn(function (this: HTMLElement) {
    scrolledInto.push(this);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('scrollToFirstInvalidField', () => {
  it('scrolls the first aria-invalid field into view and returns true', () => {
    document.body.innerHTML = `
      <div>
        <input id="ok" />
        <input id="bad" aria-invalid="true" />
        <input id="bad2" aria-invalid="true" />
      </div>
    `;

    const result = scrollToFirstInvalidField();

    expect(result).toBe(true);
    expect(scrolledInto).toHaveLength(1);
    expect(scrolledInto[0].id).toBe('bad');
  });

  it('falls back to a .Mui-error element when no input is aria-invalid', () => {
    document.body.innerHTML = `
      <div>
        <label id="err-label" class="Mui-error">Le quartier est obligatoire.</label>
      </div>
    `;

    const result = scrollToFirstInvalidField();

    expect(result).toBe(true);
    expect(scrolledInto[0].id).toBe('err-label');
  });

  it('returns false and does not scroll when nothing is invalid', () => {
    document.body.innerHTML = `<div><input id="ok" /></div>`;

    const result = scrollToFirstInvalidField();

    expect(result).toBe(false);
    expect(scrolledInto).toHaveLength(0);
  });

  it('scopes the search to the provided root', () => {
    document.body.innerHTML = `
      <section id="step-a"><input id="outside" aria-invalid="true" /></section>
      <section id="step-b"><input id="inside" /></section>
    `;
    const stepB = document.getElementById('step-b') as HTMLElement;

    const result = scrollToFirstInvalidField(stepB);

    expect(result).toBe(false);
    expect(scrolledInto).toHaveLength(0);
  });
});
