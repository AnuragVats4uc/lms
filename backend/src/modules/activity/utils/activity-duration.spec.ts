import {
  calculateHeartbeatDuration,
  secondsBetween,
} from './activity-duration';

describe('activity duration calculation', () => {
  const previousAt = new Date('2026-08-27T10:00:00.000Z');

  it('credits a normal active heartbeat', () => {
    expect(
      calculateHeartbeatDuration({
        previousAt,
        currentAt: new Date('2026-08-27T10:01:00.000Z'),
        active: true,
        heartbeatSeconds: 60,
        idleThresholdSeconds: 300,
      }),
    ).toEqual({ elapsedSeconds: 60, activeSeconds: 60, idleSeconds: 0 });
  });

  it('caps late active heartbeats and classifies the remainder as idle', () => {
    expect(
      calculateHeartbeatDuration({
        previousAt,
        currentAt: new Date('2026-08-27T10:05:00.000Z'),
        active: true,
        heartbeatSeconds: 60,
        idleThresholdSeconds: 300,
      }),
    ).toEqual({ elapsedSeconds: 300, activeSeconds: 120, idleSeconds: 180 });
  });

  it('classifies an inactive heartbeat window as idle', () => {
    expect(
      calculateHeartbeatDuration({
        previousAt,
        currentAt: new Date('2026-08-27T10:00:45.000Z'),
        active: false,
        heartbeatSeconds: 60,
        idleThresholdSeconds: 300,
      }),
    ).toEqual({ elapsedSeconds: 45, activeSeconds: 0, idleSeconds: 45 });
  });

  it('does not produce negative duration when clocks move backwards', () => {
    expect(
      secondsBetween(previousAt, new Date('2026-08-27T09:59:00.000Z')),
    ).toBe(0);
  });
});
