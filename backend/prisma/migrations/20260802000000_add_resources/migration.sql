-- CreateTable
CREATE TABLE `resources` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `folder_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('DOCUMENT', 'VIDEO', 'EXAM') NOT NULL,
    `document_url` VARCHAR(191) NULL,
    `video_url` VARCHAR(191) NULL,
    `exam_id` INTEGER NULL,
    `thumbnail` VARCHAR(191) NULL,
    `mime_type` VARCHAR(150) NULL,
    `file_size` BIGINT NULL,
    `duration_in_seconds` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `is_downloadable` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `resources_uuid_key`(`uuid`),
    INDEX `resources_folder_id_idx`(`folder_id`),
    INDEX `resources_type_idx`(`type`),
    INDEX `resources_status_idx`(`status`),
    INDEX `resources_is_published_idx`(`is_published`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
