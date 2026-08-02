-- CreateTable
CREATE TABLE `folders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `session_course_id` INTEGER NOT NULL,
    `parent_folder_id` INTEGER NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `icon` VARCHAR(100) NULL,
    `color` VARCHAR(30) NULL,
    `status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `folders_uuid_key`(`uuid`),
    UNIQUE INDEX `folders_parent_folder_id_session_course_id_name_unique`(`parent_folder_id`, `session_course_id`, `name`),
    INDEX `folders_session_course_id_idx`(`session_course_id`),
    INDEX `folders_parent_folder_id_idx`(`parent_folder_id`),
    INDEX `folders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `folders` ADD CONSTRAINT `folders_parent_folder_id_fkey` FOREIGN KEY (`parent_folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
