export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '5000', 10),
    nodeEnv: process.env.NODE_ENV,
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,

    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  },
  activity: {
    retentionWorkerEnabled:
      process.env.ACTIVITY_RETENTION_WORKER_ENABLED !== 'false',
  },
  storage: {
    provider:
      process.env.STORAGE_PROVIDER ??
      (process.env.UTHO_S3_ENDPOINT ? 'utho_s3' : 'local'),
    endpoint: process.env.UTHO_S3_ENDPOINT,
    region: process.env.UTHO_S3_REGION,
    bucket: process.env.UTHO_S3_BUCKET,
    accessKey: process.env.UTHO_S3_ACCESS_KEY,
    secretKey: process.env.UTHO_S3_SECRET_KEY,
    forcePathStyle: process.env.UTHO_S3_FORCE_PATH_STYLE !== 'false',
    maxUploadBytes: Number(
      process.env.UTHO_S3_MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024,
    ),
  },
});
