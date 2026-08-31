export interface GenerateInternalCodeOptions {
  fallback: string;
  isTaken: (code: string) => boolean | Promise<boolean>;
  maxLength: number;
  separator?: '-' | '_';
  source: string;
}

export function normalizeInternalCode(
  source: string,
  fallback: string,
  maxLength: number,
  separator: '-' | '_' = '-',
) {
  const normalized = source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, separator)
    .replace(/^[-_]+|[-_]+$/g, '');
  const safeFallback = fallback
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, separator)
    .replace(/^[-_]+|[-_]+$/g, '');

  return (normalized || safeFallback || 'ITEM').slice(0, maxLength);
}

export async function generateInternalCode({
  fallback,
  isTaken,
  maxLength,
  separator = '-',
  source,
}: GenerateInternalCodeOptions) {
  const base = normalizeInternalCode(source, fallback, maxLength, separator);

  for (let index = 1; index <= 10_000; index += 1) {
    const suffix = index === 1 ? '' : `${separator}${index}`;
    const code = `${base.slice(0, Math.max(1, maxLength - suffix.length))}${suffix}`;

    if (!(await isTaken(code))) return code;
  }

  throw new Error(`Unable to generate a unique ${fallback.toLowerCase()} code`);
}
