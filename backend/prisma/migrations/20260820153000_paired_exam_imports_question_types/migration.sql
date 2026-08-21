-- CreateTable
CREATE TABLE `question_types` (
    `id` INTEGER NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `question_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed the system-managed lookup values before backfilling foreign keys.
INSERT INTO `question_types` (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
    (1, 'SINGLE_CHOICE', 'Single Answer', 'Options are provided and exactly one option is correct.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (2, 'NUMERIC', 'Numeric Answer', 'A numeric response is evaluated with an optional tolerance.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (3, 'ONE_WORD', 'One Word Answer', 'A text response is matched against one or more accepted answers.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- CreateTable
CREATE TABLE `question_comprehensions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `code` VARCHAR(80) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `question_comprehensions_uuid_key`(`uuid`),
    INDEX `question_comprehensions_scope_idx`(`organization_id`, `is_active`),
    UNIQUE INDEX `question_comprehensions_organization_code_unique`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `question_versions`
    ADD COLUMN `question_type_id` INTEGER NULL,
    ADD COLUMN `comprehension_id` INTEGER NULL;

UPDATE `question_versions`
SET `question_type_id` = CASE `type`
    WHEN 'SINGLE_CHOICE' THEN 1
    WHEN 'NUMERIC' THEN 2
    WHEN 'ONE_WORD' THEN 3
END;

ALTER TABLE `question_versions`
    MODIFY `question_type_id` INTEGER NOT NULL,
    DROP INDEX `question_versions_type_idx`,
    DROP COLUMN `type`,
    ADD INDEX `question_versions_type_idx`(`question_type_id`),
    ADD INDEX `question_versions_comprehension_idx`(`comprehension_id`);

-- CreateTable
CREATE TABLE `exam_import_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exam_import_job_id` INTEGER NOT NULL,
    `kind` ENUM('CONTENT_DOCX', 'MAPPING_XLSX') NOT NULL,
    `original_file_name` VARCHAR(255) NOT NULL,
    `storage_path` VARCHAR(500) NOT NULL,
    `file_hash` VARCHAR(64) NOT NULL,
    `mime_type` VARCHAR(120) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exam_import_files_hash_idx`(`file_hash`),
    UNIQUE INDEX `exam_import_files_job_kind_unique`(`exam_import_job_id`, `kind`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve any legacy single-file import audit records.
INSERT INTO `exam_import_files` (`exam_import_job_id`, `kind`, `original_file_name`, `storage_path`, `file_hash`, `mime_type`, `size_bytes`, `created_at`)
SELECT
    `id`,
    IF(`format` = 'DOCX', 'CONTENT_DOCX', 'MAPPING_XLSX'),
    `original_file_name`,
    `storage_path`,
    `file_hash`,
    IF(`format` = 'DOCX', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
    0,
    `created_at`
FROM `exam_import_jobs`;

ALTER TABLE `exam_import_jobs`
    DROP INDEX `exam_import_jobs_file_hash_idx`,
    DROP COLUMN `format`,
    DROP COLUMN `original_file_name`,
    DROP COLUMN `storage_path`,
    DROP COLUMN `file_hash`;

-- AlterTable
ALTER TABLE `exam_import_rows`
    ADD COLUMN `question_type_id` INTEGER NULL,
    ADD COLUMN `raw_question_type_id` INTEGER NULL,
    ADD COLUMN `comprehension_code` VARCHAR(80) NULL,
    ADD COLUMN `comprehension_text` LONGTEXT NULL,
    ADD COLUMN `sort_order` INTEGER NULL,
    ADD COLUMN `is_mandatory` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `case_sensitive` BOOLEAN NOT NULL DEFAULT false;

UPDATE `exam_import_rows`
SET
    `question_type_id` = CASE `question_type`
        WHEN 'SINGLE_CHOICE' THEN 1
        WHEN 'NUMERIC' THEN 2
        WHEN 'ONE_WORD' THEN 3
    END,
    `raw_question_type_id` = CASE `question_type`
        WHEN 'SINGLE_CHOICE' THEN 1
        WHEN 'NUMERIC' THEN 2
        WHEN 'ONE_WORD' THEN 3
    END;

ALTER TABLE `exam_import_rows`
    DROP COLUMN `question_type`,
    ADD INDEX `exam_import_rows_question_type_idx`(`question_type_id`);

-- AddForeignKey
ALTER TABLE `question_versions` ADD CONSTRAINT `question_versions_question_type_id_fkey` FOREIGN KEY (`question_type_id`) REFERENCES `question_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_versions` ADD CONSTRAINT `question_versions_comprehension_id_fkey` FOREIGN KEY (`comprehension_id`) REFERENCES `question_comprehensions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_comprehensions` ADD CONSTRAINT `question_comprehensions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_files` ADD CONSTRAINT `exam_import_files_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_import_rows` ADD CONSTRAINT `exam_import_rows_question_type_id_fkey` FOREIGN KEY (`question_type_id`) REFERENCES `question_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
