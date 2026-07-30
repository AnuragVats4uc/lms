-- CreateTable
CREATE TABLE `sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(20) NULL,
    `description` TEXT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `status` ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'UPCOMING',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `sessions_uuid_key`(`uuid`),
    UNIQUE INDEX `sessions_organization_id_name_unique`(`organization_id`, `name`),
    INDEX `sessions_organization_id_idx`(`organization_id`),
    INDEX `sessions_status_idx`(`status`),
    INDEX `sessions_is_active_idx`(`is_active`),
    INDEX `sessions_organization_id_status_idx`(`organization_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
