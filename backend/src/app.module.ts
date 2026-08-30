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
import { APP_GUARD } from '@nestjs/core';
import { GlobalJwtAuthGuard } from './modules/auth/guards/global-jwt.guard';
import { OrganizationModule } from './modules/organization/organization.module';
import { PermissionsGuard } from './modules/auth/permissions/permissions.guard';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { RolesGuard } from './modules/auth/roles/roles.guard';
import { SessionModule } from './modules/session/session.module';
import { StudentsModule } from './modules/students/students.module';
import { UsersModule } from './modules/users/users.module';
import { CourseModule } from './modules/course/course.module';
import { SessionCourseModule } from './modules/session-course/session-course.module';
import { FolderModule } from './modules/folder/folder.module';
import { ResourceModule } from './modules/resource/resource.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExamModule } from './modules/exam/exam.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { TeacherModule } from './modules/teacher/teacher.module';
import { ActivityModule } from './modules/activity/activity.module';
import { StorageModule } from './modules/storage/storage.module';

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
    StorageModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    OrganizationModule,
    SessionModule,
    CourseModule,
    SessionCourseModule,
    FolderModule,
    ResourceModule,
    DashboardModule,
    TeacherModule,
    StudentsModule,
    UsersModule,
    ExamModule,
    RegistrationModule,
    ActivityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalJwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
