-- Add a dedicated student domain entity and profile table.
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `user_id` INTEGER NOT NULL,
    `organization_id` INTEGER NULL,
    `student_code` VARCHAR(50) NOT NULL,
    `admission_number` VARCHAR(50) NULL,
    `roll_number` VARCHAR(50) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ALUMNI', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `students_uuid_key`(`uuid`),
    UNIQUE INDEX `students_user_id_unique`(`user_id`),
    UNIQUE INDEX `students_student_code_unique`(`student_code`),
    UNIQUE INDEX `students_admission_number_unique`(`admission_number`),
    UNIQUE INDEX `students_organization_id_roll_number_unique`(`organization_id`, `roll_number`),
    INDEX `students_organization_id_idx`(`organization_id`),
    INDEX `students_status_is_active_idx`(`status`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NULL,
    `date_of_birth` DATETIME(3) NULL,
    `gender` VARCHAR(30) NULL,
    `phone` VARCHAR(30) NULL,
    `alternate_phone` VARCHAR(30) NULL,
    `address` TEXT NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(100) NULL,
    `postal_code` VARCHAR(20) NULL,
    `avatar` VARCHAR(191) NULL,
    `guardian_name` VARCHAR(150) NULL,
    `guardian_phone` VARCHAR(30) NULL,
    `emergency_contact_name` VARCHAR(150) NULL,
    `emergency_contact_phone` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_profiles_uuid_key`(`uuid`),
    UNIQUE INDEX `student_profiles_student_id_unique`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill students from any user that is already a student by role or by existing student-domain rows.
INSERT INTO `students` (
  `uuid`,
  `user_id`,
  `organization_id`,
  `student_code`,
  `status`,
  `is_active`,
  `created_at`,
  `updated_at`
)
SELECT
  UUID(),
  `users`.`id`,
  `users`.`organization_id`,
  CONCAT('STU-', `users`.`id`),
  CASE WHEN `users`.`status` = 'ACTIVE' THEN 'ACTIVE' ELSE 'INACTIVE' END,
  `users`.`is_active`,
  `users`.`created_at`,
  `users`.`updated_at`
FROM `users`
WHERE
  EXISTS (
    SELECT 1
    FROM `user_roles`
    INNER JOIN `roles` ON `roles`.`id` = `user_roles`.`role_id`
    WHERE
      `user_roles`.`user_id` = `users`.`id`
      AND `user_roles`.`is_active` = true
      AND `roles`.`code` = 'STUDENT'
  )
  OR EXISTS (
    SELECT 1 FROM `student_enrollments`
    WHERE `student_enrollments`.`user_id` = `users`.`id`
  )
  OR EXISTS (
    SELECT 1 FROM `student_course_progress`
    WHERE `student_course_progress`.`user_id` = `users`.`id`
  )
  OR EXISTS (
    SELECT 1 FROM `student_notifications`
    WHERE `student_notifications`.`user_id` = `users`.`id`
  );

INSERT INTO `student_profiles` (
  `uuid`,
  `student_id`,
  `first_name`,
  `last_name`,
  `phone`,
  `created_at`,
  `updated_at`
)
SELECT
  UUID(),
  `students`.`id`,
  `users`.`first_name`,
  `users`.`last_name`,
  `users`.`phone`,
  `users`.`created_at`,
  `users`.`updated_at`
FROM `students`
INNER JOIN `users` ON `users`.`id` = `students`.`user_id`;

-- Move existing student-domain foreign keys from users.id to students.id.
ALTER TABLE `student_enrollments` ADD COLUMN `student_id` INTEGER NULL;
UPDATE `student_enrollments`
INNER JOIN `students` ON `students`.`user_id` = `student_enrollments`.`user_id`
SET `student_enrollments`.`student_id` = `students`.`id`;
ALTER TABLE `student_enrollments` MODIFY `student_id` INTEGER NOT NULL;
ALTER TABLE `student_enrollments` DROP FOREIGN KEY `student_enrollments_user_id_fkey`;
DROP INDEX `student_enrollments_user_id_session_id_unique` ON `student_enrollments`;
ALTER TABLE `student_enrollments` DROP COLUMN `user_id`;
CREATE UNIQUE INDEX `student_enrollments_student_id_session_id_unique` ON `student_enrollments`(`student_id`, `session_id`);
CREATE INDEX `student_enrollments_student_id_idx` ON `student_enrollments`(`student_id`);

ALTER TABLE `student_course_progress` ADD COLUMN `student_id` INTEGER NULL;
UPDATE `student_course_progress`
INNER JOIN `students` ON `students`.`user_id` = `student_course_progress`.`user_id`
SET `student_course_progress`.`student_id` = `students`.`id`;
ALTER TABLE `student_course_progress` MODIFY `student_id` INTEGER NOT NULL;
ALTER TABLE `student_course_progress` DROP FOREIGN KEY `student_course_progress_user_id_fkey`;
DROP INDEX `student_course_progress_user_id_session_course_id_unique` ON `student_course_progress`;
ALTER TABLE `student_course_progress` DROP COLUMN `user_id`;
CREATE UNIQUE INDEX `student_course_progress_student_id_session_course_id_unique` ON `student_course_progress`(`student_id`, `session_course_id`);
CREATE INDEX `student_course_progress_student_id_idx` ON `student_course_progress`(`student_id`);

ALTER TABLE `student_notifications` ADD COLUMN `student_id` INTEGER NULL;
UPDATE `student_notifications`
INNER JOIN `students` ON `students`.`user_id` = `student_notifications`.`user_id`
SET `student_notifications`.`student_id` = `students`.`id`;
ALTER TABLE `student_notifications` MODIFY `student_id` INTEGER NOT NULL;
ALTER TABLE `student_notifications` DROP FOREIGN KEY `student_notifications_user_id_fkey`;
DROP INDEX `student_notifications_user_id_is_read_idx` ON `student_notifications`;
ALTER TABLE `student_notifications` DROP COLUMN `user_id`;
CREATE INDEX `student_notifications_student_id_is_read_idx` ON `student_notifications`(`student_id`, `is_read`);

ALTER TABLE `students` ADD CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `students` ADD CONSTRAINT `students_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `student_profiles` ADD CONSTRAINT `student_profiles_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_enrollments` ADD CONSTRAINT `student_enrollments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_course_progress` ADD CONSTRAINT `student_course_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `student_notifications` ADD CONSTRAINT `student_notifications_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
