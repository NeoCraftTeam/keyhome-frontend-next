/**
 * Minimal, dependency-free Markdown-to-HTML renderer for KeyHome public bios.
 *
 * Supports a small, deliberate subset:
 *   **bold**      → <strong>
 *   *italic*      → <em>
 *   ## heading    → <h3>
 *   - bullet      → <ul><li>
 *   1. numbered   → <ol><li>
 *   [text](url)   → <a href> (https/mailto only)
 *   blank lines   → paragraph break
 *
 * Other punctuation is HTML-escaped. Output is safe to inject via
 * `dangerouslySetInnerHTML` without an HTML sanitizer because we only emit
 * the whitelisted tags above and never reflect user-provided attributes.
 *
 * Counterparts on the server: `bio` is plain text (no HTML accepted) — this
 * function is purely for *rendering*. Storage stays as Markdown source.
 */

const MAX_LENGTH = 2000;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(href: string): string | null {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  return null;
}

function renderInline(line: string): string {
  let out = escapeHtml(line);
  // Links must be processed before bold/italic so `[text](url)` stays intact.
  out = out.replace(
    /\[([^\]]+?)\]\(([^)]+?)\)/g,
    (_, text: string, href: string) => {
      const safe = sanitizeUrl(href);
      if (!safe) return text;
      return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
    }
  );
  // Bold (**) before italic (*) so `**bold**` doesn't get split as italic*italic*.
  out = out.replace(
    /\*\*([^*]+?)\*\*/g,
    (_, inner: string) => `<strong>${inner}</strong>`
  );
  out = out.replace(
    /(?<![*\w])\*([^*]+?)\*(?!\w)/g,
    (_, inner: string) => `<em>${inner}</em>`
  );
  return out;
}

/**
 * Inverse of `markdownLightToHtml` for the TipTap editor save path.
 *
 * Walks a sanitized HTML document (produced by TipTap's StarterKit + Link
 * extensions, restricted to the same whitelist as our renderer) and emits
 * Markdown source compatible with `markdownLightToHtml` — round-trip safe.
 *
 * Only invoked client-side; the backend stores plain Markdown text.
 */
export function htmlToMarkdownLight(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }
  const doc = new DOMParser().parseFromString(
    `<root>${html}</root>`,
    'text/html'
  );
  const root = doc.body.querySelector('root');
  if (!root) return '';

  const walkInline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walkInline).join('');
    switch (el.tagName) {
      case 'STRONG':
      case 'B':
        return inner ? `**${inner}**` : '';
      case 'EM':
      case 'I':
        return inner ? `*${inner}*` : '';
      case 'A': {
        const href = el.getAttribute('href') ?? '';
        const safe =
          /^https?:\/\//i.test(href) || /^mailto:/i.test(href) ? href : '';
        return safe ? `[${inner}](${safe})` : inner;
      }
      case 'BR':
        return '\n';
      default:
        return inner;
    }
  };

  const out: string[] = [];
  for (const child of Array.from(root.children)) {
    const tag = child.tagName;
    if (tag === 'P') {
      const text = walkInline(child).trim();
      if (text) out.push(text);
      else out.push('');
    } else if (tag === 'H1' || tag === 'H2' || tag === 'H3' || tag === 'H4') {
      out.push(`## ${walkInline(child).trim()}`);
    } else if (tag === 'UL') {
      for (const li of Array.from(child.querySelectorAll(':scope > li'))) {
        out.push(`- ${walkInline(li).trim()}`);
      }
    } else if (tag === 'OL') {
      let i = 1;
      for (const li of Array.from(child.querySelectorAll(':scope > li'))) {
        out.push(`${i}. ${walkInline(li).trim()}`);
        i += 1;
      }
    } else {
      const text = walkInline(child).trim();
      if (text) out.push(text);
    }
    // Blank line between blocks for readability.
    out.push('');
  }
  return out
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function markdownLightToHtml(
  input: string | null | undefined,
  maxLength: number = MAX_LENGTH
): string {
  if (!input) return '';
  const truncated = input.slice(0, maxLength);
  const lines = truncated.split(/\r?\n/);
  const out: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  const closeList = (): void => {
    if (listType !== null) {
      out.push(`</${listType}>`);
      listType = null;
    }
  };
  let paragraphBuffer: string[] = [];
  const flushParagraph = (): void => {
    if (paragraphBuffer.length > 0) {
      const text = paragraphBuffer.map((l) => renderInline(l)).join('<br/>');
      out.push(`<p>${text}</p>`);
      paragraphBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }
    const heading = /^#{1,4}\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      closeList();
      out.push(`<h3>${renderInline(heading[1])}</h3>`);
      continue;
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        out.push('<ul>');
        listType = 'ul';
      }
      out.push(`<li>${renderInline(bullet[1])}</li>`);
      continue;
    }
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        out.push('<ol>');
        listType = 'ol';
      }
      out.push(`<li>${renderInline(numbered[1])}</li>`);
      continue;
    }
    closeList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  closeList();

  return out.join('');
}

export const BIO_MAX_LENGTH = MAX_LENGTH;
