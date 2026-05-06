/**
 * Blog-specific Markdown-to-HTML renderer.
 *
 * Reuses the same safe-by-design approach as `markdown-light.ts`:
 * all text is HTML-escaped FIRST, then only whitelisted structural
 * elements are emitted. Output is safe for `dangerouslySetInnerHTML`.
 *
 * Extended features (vs markdown-light):
 *   # / ## / ### → distinct heading levels
 *   ---          → <hr>
 *   - [ ] text   → unchecked checkbox
 *   No character limit (blog content is developer-authored)
 */

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
  // Links
  out = out.replace(
    /\[([^\]]+?)\]\(([^)]+?)\)/g,
    (_, text: string, href: string) => {
      const safe = sanitizeUrl(href);
      if (!safe) return text;
      return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener noreferrer nofollow">${text}</a>`;
    }
  );
  // Bold before italic
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

export function markdownBlogToHtml(input: string | null | undefined): string {
  if (!input) return '';
  const lines = input.split(/\r?\n/);
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
      out.push(`<p style="margin:16px 0">${text}</p>`);
      paragraphBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    // Blank line → flush
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line)) {
      flushParagraph();
      closeList();
      out.push(
        '<hr style="border:none;border-top:1px solid var(--kh-border-subtle, #e5e7eb);margin:32px 0">'
      );
      continue;
    }

    // Headings with distinct levels
    const h1 = /^# (.+)$/.exec(line);
    if (h1) {
      flushParagraph();
      closeList();
      out.push(
        `<h1 style="font-size:32px;font-weight:800;margin:0 0 24px">${renderInline(h1[1])}</h1>`
      );
      continue;
    }
    const h2 = /^## (.+)$/.exec(line);
    if (h2) {
      flushParagraph();
      closeList();
      out.push(
        `<h2 style="font-size:26px;font-weight:800;margin:40px 0 16px">${renderInline(h2[1])}</h2>`
      );
      continue;
    }
    const h3 = /^### (.+)$/.exec(line);
    if (h3) {
      flushParagraph();
      closeList();
      out.push(
        `<h3 style="font-size:20px;font-weight:700;margin:32px 0 12px">${renderInline(h3[1])}</h3>`
      );
      continue;
    }

    // Checkbox item (unchecked)
    const checkbox = /^- \[ \] (.+)$/.exec(line);
    if (checkbox) {
      flushParagraph();
      closeList();
      out.push(
        `<li style="list-style:none;margin:6px 0">&#9744; ${renderInline(checkbox[1])}</li>`
      );
      continue;
    }

    // Unordered list
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (listType !== 'ul') {
        closeList();
        out.push('<ul style="margin:12px 0;padding-left:20px">');
        listType = 'ul';
      }
      out.push(`<li style="margin:6px 0">${renderInline(bullet[1])}</li>`);
      continue;
    }

    // Ordered list
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (numbered) {
      flushParagraph();
      if (listType !== 'ol') {
        closeList();
        out.push('<ol style="margin:12px 0;padding-left:20px">');
        listType = 'ol';
      }
      out.push(`<li style="margin:6px 0">${renderInline(numbered[1])}</li>`);
      continue;
    }

    // Default: paragraph text
    closeList();
    paragraphBuffer.push(line);
  }

  flushParagraph();
  closeList();

  return out.join('');
}
