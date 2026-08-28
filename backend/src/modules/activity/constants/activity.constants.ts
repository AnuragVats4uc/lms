export const DEFAULT_ACTIVITY_POLICY = {
  activityRetentionDays: 730,
  failedLoginRetentionDays: 365,
  idleThresholdSeconds: 300,
  authHeartbeatSeconds: 60,
  resourceHeartbeatSeconds: 15,
  exportExpiryHours: 24,
} as const;

export const ACTIVITY_FINALIZER_INTERVAL_MS = 60_000;
export const ACTIVITY_FINALIZER_BATCH_SIZE = 250;

export const ACTIVITY_RETENTION_INITIAL_DELAY_MS = 60_000;
export const ACTIVITY_RETENTION_INTERVAL_MS = 24 * 60 * 60 * 1000;
export const ACTIVITY_RETENTION_BATCH_SIZE = 1_000;
export const ACTIVITY_RETENTION_MAX_BATCHES_PER_SCOPE = 100;
