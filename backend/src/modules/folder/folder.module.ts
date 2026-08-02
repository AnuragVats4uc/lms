import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma';
import { FolderController } from './controllers/folder.controller';
import { FolderRepository } from './repositories/folder.repository';
import { FolderService } from './services/folder.service';

@Module({
  imports: [PrismaModule],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderService, FolderRepository],
})
export class FolderModule {}
