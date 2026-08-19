CREATE TABLE `student_video_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_id` INTEGER NOT NULL,
    `resource_id` INTEGER NOT NULL,
    `current_position_seconds` INTEGER NOT NULL DEFAULT 0,
    `watched_percentage` INTEGER NOT NULL DEFAULT 0,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_video_progress_student_id_resource_id_unique`(`student_id`, `resource_id`),
    INDEX `student_video_progress_resource_id_idx`(`resource_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_video_progress`
  ADD CONSTRAINT `student_video_progress_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_video_progress`
  ADD CONSTRAINT `student_video_progress_resource_id_fkey`
  FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
