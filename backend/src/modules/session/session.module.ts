import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { SessionController } from './controllers/session.controller';
import { SessionRepository } from './repositories/session.repository';
import { SessionService } from './services/session.service';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository],
  exports: [SessionService, SessionRepository],
})
export class SessionModule {}
