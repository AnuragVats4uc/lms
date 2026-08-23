CREATE TABLE `organization_education_options` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_digital_library_locations` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `organization_education_options_uuid_key` ON `organization_education_options`(`uuid`);
CREATE UNIQUE INDEX `organization_education_options_org_name_unique` ON `organization_education_options`(`organization_id`, `name`);
CREATE INDEX `organization_education_options_organization_id_idx` ON `organization_education_options`(`organization_id`);
CREATE INDEX `organization_education_options_org_active_sort_idx` ON `organization_education_options`(`organization_id`, `is_active`, `sort_order`);

CREATE UNIQUE INDEX `organization_digital_library_locations_uuid_key` ON `organization_digital_library_locations`(`uuid`);
CREATE UNIQUE INDEX `organization_library_locations_org_name_unique` ON `organization_digital_library_locations`(`organization_id`, `name`);
CREATE INDEX `organization_library_locations_organization_id_idx` ON `organization_digital_library_locations`(`organization_id`);
CREATE INDEX `organization_library_locations_org_active_sort_idx` ON `organization_digital_library_locations`(`organization_id`, `is_active`, `sort_order`);

ALTER TABLE `organization_education_options`
  ADD CONSTRAINT `organization_education_options_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_digital_library_locations`
  ADD CONSTRAINT `organization_digital_library_locations_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
