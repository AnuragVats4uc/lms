import { NestFactory } from '@nestjs/core';

import { AppModule } from '../src/app.module';
import { ActivityRetentionService } from '../src/modules/activity/services/activity-retention.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const retentionService = app.get(ActivityRetentionService);
    const result = await retentionService.enforceRetention();
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

void main();
