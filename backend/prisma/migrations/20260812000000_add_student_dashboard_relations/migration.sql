-- Alter Resource type enum to support dashboard-visible resource types.
ALTER TABLE `resources`
  MODIFY `type` ENUM('DOCUMENT', 'VIDEO', 'EXAM') NOT NULL;

-- CreateTable
CREATE TABLE `student_enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `session_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_enrollments_uuid_key`(`uuid`),
    UNIQUE INDEX `student_enrollments_user_id_session_id_unique`(`user_id`, `session_id`),
    INDEX `student_enrollments_organization_id_idx`(`organization_id`),
    INDEX `student_enrollments_session_id_idx`(`session_id`),
    INDEX `student_enrollments_status_is_active_idx`(`status`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_course_enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `enrollment_id` INTEGER NOT NULL,
    `session_course_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_course_enrollments_uuid_key`(`uuid`),
    UNIQUE INDEX `student_course_enrollment_unique`(`enrollment_id`, `session_course_id`),
    INDEX `student_course_enrollments_session_course_id_idx`(`session_course_id`),
    INDEX `student_course_enrollments_status_is_active_idx`(`status`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_instructors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_course_id` INTEGER NOT NULL,
    `instructor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `course_instructors_session_course_id_instructor_id_unique`(`session_course_id`, `instructor_id`),
    INDEX `course_instructors_instructor_id_idx`(`instructor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_course_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `session_course_id` INTEGER NOT NULL,
    `completion_percentage` INTEGER NOT NULL DEFAULT 0,
    `last_accessed_resource_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_course_progress_user_id_session_course_id_unique`(`user_id`, `session_course_id`),
    INDEX `student_course_progress_session_course_id_idx`(`session_course_id`),
    INDEX `student_course_progress_last_accessed_resource_id_idx`(`last_accessed_resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `type` ENUM('ASSIGNMENT', 'ANNOUNCEMENT', 'EVENT', 'EXAM', 'RESOURCE', 'SYSTEM') NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `description` TEXT NOT NULL,
    `related_entity` VARCHAR(80) NULL,
    `related_entity_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `expires_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_notifications_uuid_key`(`uuid`),
    INDEX `student_notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    INDEX `student_notifications_organization_id_type_idx`(`organization_id`, `type`),
    INDEX `student_notifications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_enrollments` ADD CONSTRAINT `student_course_enrollments_enrollment_id_fkey` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_enrollments` ADD CONSTRAINT `student_course_enrollments_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_instructors` ADD CONSTRAINT `course_instructors_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_instructors` ADD CONSTRAINT `course_instructors_instructor_id_fkey` FOREIGN KEY (`instructor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_progress` ADD CONSTRAINT `student_course_progress_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_progress` ADD CONSTRAINT `student_course_progress_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_course_progress` ADD CONSTRAINT `student_course_progress_last_accessed_resource_id_fkey` FOREIGN KEY (`last_accessed_resource_id`) REFERENCES `resources`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_notifications` ADD CONSTRAINT `student_notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_notifications` ADD CONSTRAINT `student_notifications_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
