import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtStrategy } from './strategies/jwt.strategies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesModule } from '../roles/roles.module';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { ActivityModule } from '../activity/activity.module';
import { parseTokenDurationSeconds } from './utils/token-duration';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.accessSecret'),
          signOptions: {
            expiresIn: parseTokenDurationSeconds(
              configService.get<string>('jwt.accessExpiresIn'),
              '15m',
            ),
          },
        };
      },
    }),
    RolesModule,
    ActivityModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthRepository,
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    PasswordService,
  ],

  exports: [JwtAuthGuard, PasswordService],
})
export class AuthModule {}
