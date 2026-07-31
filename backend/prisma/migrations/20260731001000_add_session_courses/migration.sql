-- CreateTable
CREATE TABLE `session_courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `session_id` INTEGER NOT NULL,
    `course_id` INTEGER NOT NULL,
    `display_name` VARCHAR(150) NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `session_courses_uuid_key`(`uuid`),
    UNIQUE INDEX `session_courses_session_id_course_id_unique`(`session_id`, `course_id`),
    INDEX `session_courses_session_id_idx`(`session_id`),
    INDEX `session_courses_course_id_idx`(`course_id`),
    INDEX `session_courses_status_idx`(`status`),
    INDEX `session_courses_is_active_idx`(`is_active`),
    INDEX `session_courses_session_id_status_idx`(`session_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session_courses` ADD CONSTRAINT `session_courses_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_courses` ADD CONSTRAINT `session_courses_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
