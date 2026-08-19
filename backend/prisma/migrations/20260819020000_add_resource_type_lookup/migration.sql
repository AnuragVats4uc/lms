-- Create the canonical global resource-type lookup table.
CREATE TABLE `resource_types` (
    `id` INTEGER NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `resource_types_code_unique`(`code`),
    UNIQUE INDEX `resource_types_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `resource_types`
    (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
    (1, 'DOCUMENT', 'Document', 'Downloadable or viewable document learning material.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (2, 'VIDEO', 'Video', 'Streamed or externally hosted video lesson.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (3, 'EXAM', 'Exam', 'Assessment or examination resource.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Use a temporary numeric column so existing enum values are mapped explicitly.
ALTER TABLE `resources` ADD COLUMN `resource_type_id` INTEGER NULL;

UPDATE `resources`
SET `resource_type_id` = CASE `type`
    WHEN 'DOCUMENT' THEN 1
    WHEN 'VIDEO' THEN 2
    WHEN 'EXAM' THEN 3
    ELSE NULL
END;

-- The previous migration guarantees that only the three canonical values exist.
ALTER TABLE `resources` DROP INDEX `resources_type_idx`;
ALTER TABLE `resources` DROP COLUMN `type`;
ALTER TABLE `resources` CHANGE COLUMN `resource_type_id` `type` INTEGER NOT NULL;
CREATE INDEX `resources_type_idx` ON `resources`(`type`);

ALTER TABLE `resources`
    ADD CONSTRAINT `resources_type_fkey`
    FOREIGN KEY (`type`) REFERENCES `resource_types`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
