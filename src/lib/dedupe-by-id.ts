/**
 * Return a new array with duplicate-`id` entries removed (first occurrence wins).
 *
 * Defensive helper for lists rendered with `key={item.id}`. Sources like
 * cursor/offset-paginated infinite queries (overlapping pages) or merged
 * backend+local lists can legitimately contain the same id twice, which makes
 * React emit "Encountered two children with the same key" warnings and can
 * duplicate/drop rendered items. Deduping by id before mapping fixes both.
 */
export function dedupeById<T extends { id: string | number }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const id = String(item.id);
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    result.push(item);
  }

  return result;
}
