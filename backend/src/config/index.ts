import authConfig from './auth/auth.config';
export * from './env.validation';

export const configuration = () => ({
  auth: authConfig(),
});
