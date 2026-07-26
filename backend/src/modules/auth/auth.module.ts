import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { StringValue } from 'ms';
import { JwtStrategy } from './strategies/jwt.strategies';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesModule } from '../roles/roles.module';
import { AuthController } from './controllers/auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';

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
    RolesModule,
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
