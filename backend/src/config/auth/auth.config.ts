import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,

  jwtExpiresIn: process.env.JWT_EXPIRES_IN,

  refreshSecret: process.env.JWT_REFRESH_SECRET,

  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,

  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
}));