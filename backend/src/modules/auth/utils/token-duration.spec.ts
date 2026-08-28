import { parseTokenDurationSeconds } from './token-duration';

describe('JWT duration parsing', () => {
  it.each([
    ['60s', 60],
    ['15m', 900],
    ['12h', 43_200],
    ['7d', 604_800],
    ['2w', 1_209_600],
  ])('parses %s as seconds', (value, expected) => {
    expect(parseTokenDurationSeconds(value, '1h')).toBe(expected);
  });

  it('uses the fallback when the configured value is absent', () => {
    expect(parseTokenDurationSeconds(undefined, '1h')).toBe(3600);
  });

  it('rejects malformed or sub-second expirations', () => {
    expect(() => parseTokenDurationSeconds('forever', '1h')).toThrow();
    expect(() => parseTokenDurationSeconds('1ms', '1h')).toThrow();
  });
});
