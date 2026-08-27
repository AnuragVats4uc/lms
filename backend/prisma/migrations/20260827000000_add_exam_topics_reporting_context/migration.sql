-- Additive topic taxonomy. Existing question versions remain uncategorized.
CREATE TABLE `topics` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `subject_id` INTEGER NOT NULL,
  `code` VARCHAR(60) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `topics_uuid_key`(`uuid`),
  UNIQUE INDEX `topics_subject_id_code_unique`(`subject_id`, `code`),
  UNIQUE INDEX `topics_subject_id_name_unique`(`subject_id`, `name`),
  INDEX `topics_scope_subject_active_idx`(`organization_id`, `subject_id`, `is_active`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `question_versions`
  ADD COLUMN `topic_id` INTEGER NULL;

ALTER TABLE `exam_import_rows`
  ADD COLUMN `topic_id` INTEGER NULL,
  ADD COLUMN `topic_code` VARCHAR(60) NULL;

-- These nullable source fields make cohort-aware ranking and trend reporting possible
-- without changing the meaning of historical attempts.
ALTER TABLE `student_exam_attempts`
  ADD COLUMN `session_course_id` INTEGER NULL,
  ADD COLUMN `source_resource_id` INTEGER NULL,
  ADD COLUMN `calculation_version` INTEGER NOT NULL DEFAULT 1;

CREATE INDEX `question_versions_topic_idx` ON `question_versions`(`topic_id`);
CREATE INDEX `exam_import_rows_topic_idx` ON `exam_import_rows`(`topic_id`);
CREATE INDEX `student_exam_attempts_exam_course_rank_idx`
  ON `student_exam_attempts`(`exam_id`, `session_course_id`, `status`, `score`);
CREATE INDEX `student_exam_attempts_student_status_submitted_idx`
  ON `student_exam_attempts`(`student_id`, `status`, `submitted_at`);

ALTER TABLE `topics`
  ADD CONSTRAINT `topics_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `topics`
  ADD CONSTRAINT `topics_subject_id_fkey`
  FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `question_versions`
  ADD CONSTRAINT `question_versions_topic_id_fkey`
  FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `exam_import_rows`
  ADD CONSTRAINT `exam_import_rows_topic_id_fkey`
  FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_exam_attempts`
  ADD CONSTRAINT `student_exam_attempts_session_course_id_fkey`
  FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_exam_attempts`
  ADD CONSTRAINT `student_exam_attempts_source_resource_id_fkey`
  FOREIGN KEY (`source_resource_id`) REFERENCES `resources`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
