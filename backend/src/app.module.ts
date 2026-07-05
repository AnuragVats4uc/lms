import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration, envValidationSchema } from './config';
import { PrismaModule } from './prisma';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/logger/logger.config';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
    }),

    LoggerModule.forRoot(loggerConfig),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    AuthModule,
    StudentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
