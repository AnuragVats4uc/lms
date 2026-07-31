-- CreateTable
CREATE TABLE `courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` TEXT NULL,
    `thumbnail` VARCHAR(191) NULL,
    `duration_in_days` INTEGER NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `courses_uuid_key`(`uuid`),
    UNIQUE INDEX `courses_name_unique`(`name`),
    UNIQUE INDEX `courses_code_unique`(`code`),
    INDEX `courses_status_idx`(`status`),
    INDEX `courses_is_active_idx`(`is_active`),
    INDEX `courses_status_is_active_idx`(`status`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
