export function stripMarkdownArtifacts(value: string): string {
  if (!value) return '';

  return value
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, '$1')
    .replace(/__([^_\n][\s\S]*?[^_\n])__/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
    .replace(/(^|[\s(])_([^_\n]+)_/g, '$1$2')
    .replace(/^\s*[*]\s+/gm, '- ')
    .replace(/\s+\*{2,}\s*$/gm, '')
    .trim();
}

export function cleanDisplayValue<T>(value: T): T {
  if (typeof value === 'string') {
    return stripMarkdownArtifacts(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => cleanDisplayValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        cleanDisplayValue(entry),
      ])
    ) as T;
  }

  return value;
}

export function reviewResultsToText(results: unknown): string {
  const cleanResults = cleanDisplayValue(results);

  if (typeof cleanResults === 'string') return cleanResults;
  return JSON.stringify(cleanResults, null, 2);
}
