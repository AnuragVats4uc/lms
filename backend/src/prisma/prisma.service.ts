import {
  Injectable,
  INestApplication,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to MySQL Database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Prisma disconnected');
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      void app.close();
    });
  }
}
