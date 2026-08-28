export type HeartbeatDurationInput = {
  previousAt: Date;
  currentAt: Date;
  active: boolean;
  heartbeatSeconds: number;
  idleThresholdSeconds: number;
};

export type HeartbeatDuration = {
  elapsedSeconds: number;
  activeSeconds: number;
  idleSeconds: number;
};

export function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

export function calculateHeartbeatDuration({
  previousAt,
  currentAt,
  active,
  heartbeatSeconds,
  idleThresholdSeconds,
}: HeartbeatDurationInput): HeartbeatDuration {
  const elapsedSeconds = secondsBetween(previousAt, currentAt);

  if (!active || elapsedSeconds === 0) {
    return {
      elapsedSeconds,
      activeSeconds: 0,
      idleSeconds: elapsedSeconds,
    };
  }

  const maximumActiveCredit = Math.max(
    0,
    Math.min(idleThresholdSeconds, heartbeatSeconds * 2),
  );
  const activeSeconds = Math.min(elapsedSeconds, maximumActiveCredit);

  return {
    elapsedSeconds,
    activeSeconds,
    idleSeconds: elapsedSeconds - activeSeconds,
  };
}
