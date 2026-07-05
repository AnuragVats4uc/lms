import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { StringValue } from 'ms';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),

        signOptions: {
          expiresIn: config.get<StringValue>('auth.jwtExpiresIn'),
        },
      }),
    }),
    StudentsModule,
  ],

  controllers: [AuthController],

  providers: [AuthService],

  exports: [AuthService],
})
export class AuthModule {}
