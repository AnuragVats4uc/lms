const DURATION_MULTIPLIERS_SECONDS: Record<string, number> = {
  ms: 0.001,
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
  y: 365 * 24 * 60 * 60,
};

export function parseTokenDurationSeconds(
  value: string | undefined,
  fallback: string,
): number {
  const duration = value?.trim() || fallback;
  const match = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w|y)$/i.exec(duration);

  if (!match) {
    throw new Error(`Invalid JWT expiration: ${duration}`);
  }

  const amount = Number(match[1]);
  const multiplier = DURATION_MULTIPLIERS_SECONDS[match[2].toLowerCase()];
  const seconds = Math.floor(amount * multiplier);

  if (!Number.isFinite(seconds) || seconds < 1) {
    throw new Error(`Invalid JWT expiration: ${duration}`);
  }

  return seconds;
}
