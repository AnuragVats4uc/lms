import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../prisma';
import { LocalObjectStorageDriver } from './local-object-storage.driver';
import { ManagedObjectService } from './managed-object.service';
import { ObjectKeyBuilder } from './object-key.builder';
import { StorageController } from './storage.controller';
import { StoredObjectRepository } from './stored-object.repository';
import { OBJECT_STORAGE_DRIVER } from './storage.types';
import { UthoObjectStorageDriver } from './utho-object-storage.driver';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [StorageController],
  providers: [
    ObjectKeyBuilder,
    StoredObjectRepository,
    ManagedObjectService,
    LocalObjectStorageDriver,
    {
      provide: OBJECT_STORAGE_DRIVER,
      inject: [ConfigService, LocalObjectStorageDriver],
      useFactory: (
        config: ConfigService,
        localStorage: LocalObjectStorageDriver,
      ) => {
        const provider = config.get<string>('storage.provider') ?? 'local';
        if (provider !== 'utho_s3') return localStorage;

        const endpoint = config.get<string>('storage.endpoint');
        const region = config.get<string>('storage.region');
        const accessKey = config.get<string>('storage.accessKey');
        const secretKey = config.get<string>('storage.secretKey');
        if (!endpoint || !region || !accessKey || !secretKey) {
          throw new Error('Utho object storage configuration is incomplete');
        }
        return new UthoObjectStorageDriver({
          endpoint,
          region,
          accessKey,
          secretKey,
          forcePathStyle: config.get<boolean>('storage.forcePathStyle') ?? true,
        });
      },
    },
  ],
  exports: [ManagedObjectService, ObjectKeyBuilder, StoredObjectRepository],
})
export class StorageModule {}
