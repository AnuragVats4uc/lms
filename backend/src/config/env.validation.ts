import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  PORT: Joi.number().port().default(5000),

  DATABASE_URL: Joi.string()
    .uri({ scheme: ['mysql'] })
    .required(),

  JWT_ACCESS_SECRET: Joi.string().required(),

  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),

  JWT_REFRESH_SECRET: Joi.string().required(),

  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  BCRYPT_SALT_ROUNDS: Joi.number().required(),

  ACTIVITY_RETENTION_WORKER_ENABLED: Joi.boolean().default(true),

  STORAGE_PROVIDER: Joi.string().valid('local', 'utho_s3').optional(),

  UTHO_S3_ENDPOINT: Joi.string()
    .uri({ scheme: ['https'] })
    .when('STORAGE_PROVIDER', {
      is: 'utho_s3',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  UTHO_S3_REGION: Joi.string().trim().min(1).when('STORAGE_PROVIDER', {
    is: 'utho_s3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  UTHO_S3_BUCKET: Joi.string()
    .pattern(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)
    .when('STORAGE_PROVIDER', {
      is: 'utho_s3',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),

  UTHO_S3_ACCESS_KEY: Joi.string().trim().min(1).when('STORAGE_PROVIDER', {
    is: 'utho_s3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  UTHO_S3_SECRET_KEY: Joi.string().trim().min(1).when('STORAGE_PROVIDER', {
    is: 'utho_s3',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),

  UTHO_S3_FORCE_PATH_STYLE: Joi.boolean().default(true),
  UTHO_S3_MAX_UPLOAD_BYTES: Joi.number()
    .integer()
    .min(1)
    .default(25 * 1024 * 1024),

  FRONTEND_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.string().default('http://localhost:3000'),
  }),

  PUBLIC_API_URL: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.string().default('http://localhost:5000'),
    }),
});
