CREATE TABLE `student_landing_cards` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `organization_id` INTEGER NOT NULL,
    `type` ENUM('SYSTEM_LMS', 'CUSTOM') NOT NULL DEFAULT 'CUSTOM',
    `system_key` VARCHAR(30) NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` VARCHAR(500) NOT NULL,
    `cta_label` VARCHAR(80) NOT NULL,
    `destination_url` VARCHAR(1000) NOT NULL,
    `image_url` VARCHAR(1000) NULL,
    `image_alt` VARCHAR(200) NULL,
    `open_in_new_tab` BOOLEAN NOT NULL DEFAULT true,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `student_landing_cards_uuid_key`(`uuid`),
    UNIQUE INDEX `student_landing_cards_org_system_unique`(`organization_id`, `system_key`),
    INDEX `student_landing_cards_org_active_order_idx`(`organization_id`, `is_active`, `deleted_at`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_landing_cards`
  ADD CONSTRAINT `student_landing_cards_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_activity_events`
  MODIFY `event_type` ENUM(
    'LOGIN_SUCCESS','LOGOUT','SESSION_TIMEOUT','RESOURCE_OPEN','RESOURCE_CLOSE',
    'RESOURCE_DOWNLOAD','DOCUMENT_PAGE_ENTER','DOCUMENT_PAGE_EXIT',
    'DOCUMENT_FULLSCREEN_ENTER','DOCUMENT_FULLSCREEN_EXIT','VIDEO_PLAY',
    'VIDEO_PAUSE','VIDEO_SEEK','VIDEO_COMPLETE','EXAM_START','EXAM_RESUME',
    'EXAM_SUBMIT','EXAM_AUTO_SUBMIT','EXAM_CANCEL','REPORT_VIEW','REPORT_EXPORT',
    'LANDING_PAGE_VIEW','LANDING_CARD_CLICK'
  ) NOT NULL,
  ADD COLUMN `landing_card_id` INTEGER NULL,
  ADD COLUMN `landing_card_title_snapshot` VARCHAR(120) NULL,
  ADD COLUMN `landing_card_cta_snapshot` VARCHAR(80) NULL,
  ADD COLUMN `landing_card_url_snapshot` VARCHAR(1000) NULL,
  ADD INDEX `student_activity_events_landing_card_student_idx` (`landing_card_id`, `student_id`, `occurred_at`),
  ADD CONSTRAINT `student_activity_events_landing_card_id_fkey`
    FOREIGN KEY (`landing_card_id`) REFERENCES `student_landing_cards`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO `student_landing_cards` (
  `uuid`, `organization_id`, `type`, `system_key`, `title`, `description`,
  `cta_label`, `destination_url`, `image_alt`, `open_in_new_tab`,
  `display_order`, `is_active`, `created_at`, `updated_at`
)
SELECT UUID(), `id`, 'SYSTEM_LMS', 'LMS', 'LMS',
  'Access courses, exams, learning resources and your academic progress.',
  'Go to LMS', '/student/dashboard',
  'Illustration of academic dashboard resources and progress', false, 0, true,
  CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)
FROM `organizations`;

INSERT IGNORE INTO `permissions` (`uuid`, `module`, `action`, `key`, `description`, `created_at`, `updated_at`)
VALUES
  (UUID(), 'student-landing', 'create', 'student-landing.create', 'Allows create access for student-landing', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'student-landing', 'read', 'student-landing.read', 'Allows read access for student-landing', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'student-landing', 'update', 'student-landing.update', 'Allows update access for student-landing', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'student-landing', 'delete', 'student-landing.delete', 'Allows delete access for student-landing', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT role_row.`id`, permission_row.`id`, CURRENT_TIMESTAMP(3)
FROM `roles` role_row
JOIN `permissions` permission_row ON permission_row.`module` = 'student-landing'
WHERE role_row.`code` IN ('SUPER_ADMIN', 'ADMIN') AND role_row.`is_active` = true;
