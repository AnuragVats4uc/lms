import { generateInternalCode, normalizeInternalCode } from './internal-code';

describe('internal code utilities', () => {
  it('normalizes labels into uppercase internal codes', () => {
    expect(
      normalizeInternalCode('  Indian Economy (Unmerged)  ', 'COURSE', 30),
    ).toBe('INDIAN-ECONOMY-UNMERGED');
  });

  it('uses a fallback when the label has no usable characters', () => {
    expect(normalizeInternalCode('---', 'SESSION', 20)).toBe('SESSION');
  });

  it('adds a scoped numeric suffix when a code is already taken', async () => {
    const existing = new Set(['GEOGRAPHY', 'GEOGRAPHY-2']);
    await expect(
      generateInternalCode({
        fallback: 'COURSE',
        isTaken: (code) => existing.has(code),
        maxLength: 30,
        source: 'Geography',
      }),
    ).resolves.toBe('GEOGRAPHY-3');
  });

  it('supports underscore-separated role codes', async () => {
    await expect(
      generateInternalCode({
        fallback: 'ROLE',
        isTaken: () => false,
        maxLength: 50,
        separator: '_',
        source: 'Content Manager',
      }),
    ).resolves.toBe('CONTENT_MANAGER');
  });

  it('keeps suffixed codes within the database limit', async () => {
    await expect(
      generateInternalCode({
        fallback: 'ROLE',
        isTaken: (code) => code === 'A'.repeat(10),
        maxLength: 10,
        source: 'A'.repeat(20),
      }),
    ).resolves.toBe('AAAAAAAA-2');
  });
});
