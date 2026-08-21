-- AlterTable
ALTER TABLE `resource_types` ALTER COLUMN `updated_at` DROP DEFAULT;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `subjects_uuid_key`(`uuid`),
    INDEX `subjects_organization_id_is_active_idx`(`organization_id`, `is_active`),
    UNIQUE INDEX `subjects_organization_id_code_unique`(`organization_id`, `code`),
    UNIQUE INDEX `subjects_organization_id_name_unique`(`organization_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `questions_uuid_key`(`uuid`),
    INDEX `questions_subject_id_idx`(`subject_id`),
    INDEX `questions_scope_status_idx`(`organization_id`, `status`, `is_active`),
    UNIQUE INDEX `questions_organization_id_code_unique`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_id` INTEGER NOT NULL,
    `version_number` INTEGER NOT NULL,
    `type` ENUM('SINGLE_CHOICE', 'NUMERIC', 'ONE_WORD') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `explanation` LONGTEXT NULL,
    `default_marks` DECIMAL(8, 2) NOT NULL DEFAULT 1,
    `default_negative_marks` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `case_sensitive` BOOLEAN NOT NULL DEFAULT false,
    `normalize_whitespace` BOOLEAN NOT NULL DEFAULT true,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `question_versions_type_idx`(`type`),
    UNIQUE INDEX `question_versions_question_id_version_unique`(`question_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_version_id` INTEGER NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_correct` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `question_options_version_order_idx`(`question_version_id`, `sort_order`),
    UNIQUE INDEX `question_options_version_code_unique`(`question_version_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_accepted_answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_version_id` INTEGER NOT NULL,
    `text_value` VARCHAR(500) NULL,
    `normalized_text` VARCHAR(500) NULL,
    `numeric_value` DECIMAL(18, 6) NULL,
    `numeric_tolerance` DECIMAL(18, 6) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `question_answers_version_idx`(`question_version_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `code` VARCHAR(60) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_templates_uuid_key`(`uuid`),
    INDEX `exam_templates_scope_status_idx`(`organization_id`, `status`, `is_active`),
    UNIQUE INDEX `exam_templates_organization_id_code_unique`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_template_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_template_id` INTEGER NOT NULL,
    `version_number` INTEGER NOT NULL,
    `instructions` LONGTEXT NULL,
    `default_duration_minutes` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'RETIRED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exam_template_versions_status_idx`(`status`),
    UNIQUE INDEX `exam_template_versions_template_version_unique`(`exam_template_id`, `version_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_template_slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_template_version_id` INTEGER NOT NULL,
    `code` VARCHAR(60) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `instructions` LONGTEXT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `navigation_mode` ENUM('FREE', 'SEQUENTIAL', 'LOCKED_AFTER_SUBMIT') NOT NULL DEFAULT 'FREE',
    `auto_submit_on_timeout` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `exam_template_slots_version_order_idx`(`exam_template_version_id`, `sort_order`),
    UNIQUE INDEX `exam_template_slots_version_code_unique`(`exam_template_version_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_template_sections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_template_slot_id` INTEGER NOT NULL,
    `code` VARCHAR(60) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `instructions` LONGTEXT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `questions_to_attempt` INTEGER NULL,
    `randomize_questions` BOOLEAN NOT NULL DEFAULT false,
    `randomize_options` BOOLEAN NOT NULL DEFAULT false,
    `navigation_mode` ENUM('FREE', 'SEQUENTIAL', 'LOCKED_AFTER_SUBMIT') NOT NULL DEFAULT 'FREE',
    `allow_review` BOOLEAN NOT NULL DEFAULT true,
    `auto_submit_on_timeout` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `exam_template_sections_slot_order_idx`(`exam_template_slot_id`, `sort_order`),
    UNIQUE INDEX `exam_template_sections_slot_code_unique`(`exam_template_slot_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_template_section_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_template_section_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `exam_section_subjects_subject_idx`(`subject_id`),
    UNIQUE INDEX `exam_section_subjects_section_subject_unique`(`exam_template_section_id`, `subject_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_template_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_template_section_subject_id` INTEGER NOT NULL,
    `question_version_id` INTEGER NOT NULL,
    `marks` DECIMAL(8, 2) NOT NULL,
    `negative_marks` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `exam_template_questions_version_idx`(`question_version_id`),
    UNIQUE INDEX `exam_template_questions_section_question_unique`(`exam_template_section_subject_id`, `question_version_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `session_id` INTEGER NOT NULL,
    `exam_template_version_id` INTEGER NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `instructions` LONGTEXT NULL,
    `available_from` DATETIME(3) NOT NULL,
    `available_until` DATETIME(3) NOT NULL,
    `duration_minutes` INTEGER NOT NULL,
    `attempt_limit` INTEGER NOT NULL DEFAULT 1,
    `auto_submit_on_timeout` BOOLEAN NOT NULL DEFAULT true,
    `result_publish_at` DATETIME(3) NULL,
    `status` ENUM('DRAFT', 'SCHEDULED', 'LIVE', 'CLOSED', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exams_uuid_key`(`uuid`),
    INDEX `exams_session_id_status_idx`(`session_id`, `status`),
    INDEX `exams_template_version_idx`(`exam_template_version_id`),
    UNIQUE INDEX `exams_organization_id_code_unique`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_selected_slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NOT NULL,
    `exam_template_slot_id` INTEGER NOT NULL,
    `duration_minutes_override` INTEGER NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `exam_selected_slots_slot_idx`(`exam_template_slot_id`),
    UNIQUE INDEX `exam_selected_slots_exam_slot_unique`(`exam_id`, `exam_template_slot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_session_courses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_id` INTEGER NOT NULL,
    `session_course_id` INTEGER NOT NULL,

    INDEX `exam_session_courses_course_idx`(`session_course_id`),
    UNIQUE INDEX `exam_session_courses_exam_course_unique`(`exam_id`, `session_course_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_import_jobs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `exam_template_version_id` INTEGER NOT NULL,
    `exam_template_slot_id` INTEGER NULL,
    `exam_template_section_id` INTEGER NULL,
    `subject_id` INTEGER NULL,
    `uploaded_by_id` INTEGER NOT NULL,
    `format` ENUM('DOCX', 'XLSX') NOT NULL,
    `scope` ENUM('SINGLE_SECTION', 'FULL_EXAM') NOT NULL,
    `original_file_name` VARCHAR(255) NOT NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,
    `status` ENUM('UPLOADED', 'PARSING', 'VALIDATION_FAILED', 'READY_FOR_REVIEW', 'IMPORTING', 'IMPORTED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'UPLOADED',
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `warning_rows` INTEGER NOT NULL DEFAULT 0,
    `error_rows` INTEGER NOT NULL DEFAULT 0,
    `error_summary` TEXT NULL,
    `imported_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_import_jobs_uuid_key`(`uuid`),
    INDEX `exam_import_jobs_scope_status_idx`(`organization_id`, `status`),
    INDEX `exam_import_jobs_version_idx`(`exam_template_version_id`),
    INDEX `exam_import_jobs_file_hash_idx`(`file_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_import_rows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_import_job_id` INTEGER NOT NULL,
    `source_index` INTEGER NOT NULL,
    `slot_code` VARCHAR(60) NULL,
    `section_code` VARCHAR(60) NULL,
    `subject_code` VARCHAR(40) NULL,
    `question_code` VARCHAR(80) NULL,
    `question_type` VARCHAR(40) NULL,
    `question_text` LONGTEXT NULL,
    `marks` DECIMAL(8, 2) NULL,
    `negative_marks` DECIMAL(8, 2) NULL,
    `correct_answer` TEXT NULL,
    `numeric_tolerance` DECIMAL(18, 6) NULL,
    `explanation` LONGTEXT NULL,
    `options_json` JSON NULL,
    `accepted_answers_json` JSON NULL,
    `raw_data` JSON NULL,
    `status` ENUM('VALID', 'WARNING', 'ERROR', 'IMPORTED', 'SKIPPED') NOT NULL DEFAULT 'VALID',
    `validation_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `exam_import_rows_job_status_idx`(`exam_import_job_id`, `status`),
    UNIQUE INDEX `exam_import_rows_job_source_unique`(`exam_import_job_id`, `source_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_import_errors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_import_job_id` INTEGER NOT NULL,
    `source_index` INTEGER NULL,
    `field_name` VARCHAR(80) NULL,
    `error_code` VARCHAR(80) NOT NULL,
    `message` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_import_errors_job_idx`(`exam_import_job_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `exam_id` INTEGER NOT NULL,
    `attempt_number` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NOT NULL,
    `submitted_at` DATETIME(3) NULL,
    `duration_seconds` INTEGER NOT NULL DEFAULT 0,
    `remaining_seconds_at_last_save` INTEGER NULL,
    `submission_reason` ENUM('STUDENT_SUBMITTED', 'EXAM_TIMEOUT', 'SLOT_TIMEOUT', 'SECTION_TIMEOUT', 'ADMIN_SUBMITTED') NULL,
    `score` DECIMAL(10, 2) NULL,
    `maximum_score` DECIMAL(10, 2) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_exam_attempts_uuid_key`(`uuid`),
    INDEX `student_exam_attempts_exam_status_idx`(`exam_id`, `status`),
    UNIQUE INDEX `student_exam_attempts_student_exam_number_unique`(`student_id`, `exam_id`, `attempt_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_slot_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_exam_attempt_id` INTEGER NOT NULL,
    `exam_selected_slot_id` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `student_exam_slot_attempts_attempt_slot_unique`(`student_exam_attempt_id`, `exam_selected_slot_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_section_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_exam_slot_attempt_id` INTEGER NOT NULL,
    `exam_template_section_id` INTEGER NOT NULL,
    `status` ENUM('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
    `started_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `submitted_at` DATETIME(3) NULL,
    `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `student_exam_section_attempts_slot_section_unique`(`student_exam_slot_attempt_id`, `exam_template_section_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_answers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_exam_attempt_id` INTEGER NOT NULL,
    `exam_template_question_id` INTEGER NOT NULL,
    `text_answer` TEXT NULL,
    `numeric_answer` DECIMAL(18, 6) NULL,
    `is_correct` BOOLEAN NULL,
    `marks_awarded` DECIMAL(8, 2) NULL,
    `answered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_exam_answers_attempt_question_unique`(`student_exam_attempt_id`, `exam_template_question_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `student_exam_answer_options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_exam_answer_id` INTEGER NOT NULL,
    `question_option_id` INTEGER NOT NULL,

    UNIQUE INDEX `student_exam_answer_options_answer_option_unique`(`student_exam_answer_id`, `question_option_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `resources_exam_id_idx` ON `resources`(`exam_id`);

-- Historical resource seeds used placeholder exam identifiers before an exams
-- table existed. They cannot be valid foreign keys, so retire only those legacy
-- exam rows before adding the constraint. Document and video data are untouched.
UPDATE `resources`
SET `exam_id` = NULL,
    `status` = 'ARCHIVED',
    `is_published` = false,
    `is_active` = false
WHERE `type` = 3 AND `exam_id` IS NOT NULL;

-- AddForeignKey
ALTER TABLE `subjects` ADD CONSTRAINT `subjects_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `questions` ADD CONSTRAINT `questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_versions` ADD CONSTRAINT `question_versions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_options` ADD CONSTRAINT `question_options_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_accepted_answers` ADD CONSTRAINT `question_accepted_answers_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_templates` ADD CONSTRAINT `exam_templates_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_versions` ADD CONSTRAINT `exam_template_versions_exam_template_id_fkey` FOREIGN KEY (`exam_template_id`) REFERENCES `exam_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_slots` ADD CONSTRAINT `exam_template_slots_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_sections` ADD CONSTRAINT `exam_template_sections_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_section_subjects` ADD CONSTRAINT `exam_template_section_subjects_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_section_subjects` ADD CONSTRAINT `exam_template_section_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_questions` ADD CONSTRAINT `exam_template_questions_exam_template_section_subject_id_fkey` FOREIGN KEY (`exam_template_section_subject_id`) REFERENCES `exam_template_section_subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_template_questions` ADD CONSTRAINT `exam_template_questions_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_selected_slots` ADD CONSTRAINT `exam_selected_slots_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_selected_slots` ADD CONSTRAINT `exam_selected_slots_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_session_courses` ADD CONSTRAINT `exam_session_courses_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_session_courses` ADD CONSTRAINT `exam_session_courses_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_jobs` ADD CONSTRAINT `exam_import_jobs_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_rows` ADD CONSTRAINT `exam_import_rows_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_errors` ADD CONSTRAINT `exam_import_errors_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_attempts` ADD CONSTRAINT `student_exam_attempts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_attempts` ADD CONSTRAINT `student_exam_attempts_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_slot_attempts` ADD CONSTRAINT `student_exam_slot_attempts_student_exam_attempt_id_fkey` FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_slot_attempts` ADD CONSTRAINT `student_exam_slot_attempts_exam_selected_slot_id_fkey` FOREIGN KEY (`exam_selected_slot_id`) REFERENCES `exam_selected_slots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_section_attempts` ADD CONSTRAINT `student_exam_section_attempts_student_exam_slot_attempt_id_fkey` FOREIGN KEY (`student_exam_slot_attempt_id`) REFERENCES `student_exam_slot_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_section_attempts` ADD CONSTRAINT `student_exam_section_attempts_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_answers` ADD CONSTRAINT `student_exam_answers_student_exam_attempt_id_fkey` FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_answers` ADD CONSTRAINT `student_exam_answers_exam_template_question_id_fkey` FOREIGN KEY (`exam_template_question_id`) REFERENCES `exam_template_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_answer_options` ADD CONSTRAINT `student_exam_answer_options_student_exam_answer_id_fkey` FOREIGN KEY (`student_exam_answer_id`) REFERENCES `student_exam_answers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `student_exam_answer_options` ADD CONSTRAINT `student_exam_answer_options_question_option_id_fkey` FOREIGN KEY (`question_option_id`) REFERENCES `question_options`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
