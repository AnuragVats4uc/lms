import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StringValue } from 'ms';
import { StudentsModule } from '../students/students.module';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { JwtStrategy } from './strategies/jwt.strategies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminImpersonationModule } from '../admin-impersonation/admin-impersonation.module';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get<string>('jwt.accessSecret'),
          signOptions: {
            expiresIn: configService.get<StringValue>('jwt.accessExpiresIn'),
          },
        };
      },
    }),
    AdminImpersonationModule,
    StudentsModule,
  ],

  controllers: [AuthController],

  providers: [AuthService, RefreshTokenRepository, JwtStrategy, JwtAuthGuard],

  exports: [AuthService],
})
export class AuthModule {}
