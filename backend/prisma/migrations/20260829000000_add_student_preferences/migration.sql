CREATE TABLE `student_preferences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `timezone` VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    `language` VARCHAR(20) NOT NULL DEFAULT 'en',
    `in_app_notifications` BOOLEAN NOT NULL DEFAULT true,
    `email_notifications` BOOLEAN NOT NULL DEFAULT false,
    `exam_reminders` BOOLEAN NOT NULL DEFAULT true,
    `resource_updates` BOOLEAN NOT NULL DEFAULT true,
    `announcement_notifications` BOOLEAN NOT NULL DEFAULT true,
    `security_alerts` BOOLEAN NOT NULL DEFAULT true,
    `exam_reminder_offsets_minutes` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_preferences_uuid_key`(`uuid`),
    UNIQUE INDEX `student_preferences_student_id_unique`(`student_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `student_preferences` (
    `uuid`,
    `student_id`,
    `exam_reminder_offsets_minutes`,
    `updated_at`
)
SELECT
    UUID(),
    `students`.`id`,
    JSON_ARRAY(1440, 60),
    CURRENT_TIMESTAMP(3)
FROM `students`;

ALTER TABLE `student_preferences`
    ADD CONSTRAINT `student_preferences_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
