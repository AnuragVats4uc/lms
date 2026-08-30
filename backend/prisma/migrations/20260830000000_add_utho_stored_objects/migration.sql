CREATE TABLE `stored_objects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NULL,
    `uploaded_by_id` INTEGER NULL,
    `provider` ENUM('LOCAL', 'UTHO_S3') NOT NULL,
    `bucket` VARCHAR(191) NOT NULL,
    `object_key` VARCHAR(500) NOT NULL,
    `original_file_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `size_bytes` BIGINT NOT NULL,
    `checksum_sha256` VARCHAR(64) NOT NULL,
    `etag` VARCHAR(191) NULL,
    `version_id` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'READY', 'FAILED', 'DELETE_PENDING', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `failure_message` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `stored_objects_uuid_key`(`uuid`),
    UNIQUE INDEX `stored_objects_provider_bucket_key_unique`(`provider`, `bucket`, `object_key`),
    INDEX `stored_objects_organization_status_idx`(`organization_id`, `status`),
    INDEX `stored_objects_uploaded_by_id_idx`(`uploaded_by_id`),
    INDEX `stored_objects_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `resources`
    ADD COLUMN `document_object_id` INTEGER NULL,
    ADD COLUMN `thumbnail_object_id` INTEGER NULL,
    ADD UNIQUE INDEX `resources_document_object_id_unique`(`document_object_id`),
    ADD UNIQUE INDEX `resources_thumbnail_object_id_unique`(`thumbnail_object_id`);

ALTER TABLE `exam_import_files`
    MODIFY `storage_path` VARCHAR(500) NULL,
    ADD COLUMN `stored_object_id` INTEGER NULL,
    ADD UNIQUE INDEX `exam_import_files_stored_object_id_unique`(`stored_object_id`);

ALTER TABLE `student_profiles`
    ADD COLUMN `avatar_object_id` INTEGER NULL,
    ADD UNIQUE INDEX `student_profiles_avatar_object_id_unique`(`avatar_object_id`);

ALTER TABLE `courses`
    ADD COLUMN `thumbnail_object_id` INTEGER NULL,
    ADD UNIQUE INDEX `courses_thumbnail_object_id_unique`(`thumbnail_object_id`);

ALTER TABLE `stored_objects`
    ADD CONSTRAINT `stored_objects_organization_id_fkey`
        FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT `stored_objects_uploaded_by_id_fkey`
        FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `resources`
    ADD CONSTRAINT `resources_document_object_id_fkey`
        FOREIGN KEY (`document_object_id`) REFERENCES `stored_objects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT `resources_thumbnail_object_id_fkey`
        FOREIGN KEY (`thumbnail_object_id`) REFERENCES `stored_objects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `exam_import_files`
    ADD CONSTRAINT `exam_import_files_stored_object_id_fkey`
        FOREIGN KEY (`stored_object_id`) REFERENCES `stored_objects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_profiles`
    ADD CONSTRAINT `student_profiles_avatar_object_id_fkey`
        FOREIGN KEY (`avatar_object_id`) REFERENCES `stored_objects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `courses`
    ADD CONSTRAINT `courses_thumbnail_object_id_fkey`
        FOREIGN KEY (`thumbnail_object_id`) REFERENCES `stored_objects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
