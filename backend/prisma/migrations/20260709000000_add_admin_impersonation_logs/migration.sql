ALTER TABLE `students`
  MODIFY COLUMN `role` ENUM('STUDENT', 'ADMIN', 'SUPER_ADMIN', 'SUPPORT') NOT NULL DEFAULT 'STUDENT';

CREATE TABLE IF NOT EXISTS `admin_impersonation_logs` (
  `id` VARCHAR(191) NOT NULL,
  `admin_user_id` BIGINT UNSIGNED NOT NULL,
  `student_id` BIGINT UNSIGNED NOT NULL,
  `token_id` VARCHAR(191) NULL,
  `reason` VARCHAR(500) NULL,
  `ip_address` VARCHAR(255) NULL,
  `user_agent` TEXT NULL,
  `started_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `ended_at` TIMESTAMP(0) NULL,
  `expires_at` TIMESTAMP(0) NOT NULL,
  `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

  PRIMARY KEY (`id`),
  INDEX `admin_impersonation_logs_admin_user_id_idx` (`admin_user_id`),
  INDEX `admin_impersonation_logs_student_id_idx` (`student_id`),
  INDEX `admin_impersonation_logs_token_id_idx` (`token_id`),
  CONSTRAINT `admin_impersonation_logs_admin_user_id_fkey`
    FOREIGN KEY (`admin_user_id`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `admin_impersonation_logs_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
