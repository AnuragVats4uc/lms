CREATE TABLE `student_dashboard_banners` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) NULL,
  `cta_label` VARCHAR(80) NULL,
  `destination_url` VARCHAR(1000) NULL,
  `media_type` ENUM('IMAGE', 'VIDEO') NOT NULL,
  `media_url` VARCHAR(1000) NOT NULL,
  `media_alt` VARCHAR(200) NULL,
  `video_provider` ENUM('YOUTUBE', 'VIMEO', 'DIRECT', 'HLS', 'EXTERNAL') NULL,
  `poster_url` VARCHAR(1000) NULL,
  `open_in_new_tab` BOOLEAN NOT NULL DEFAULT false,
  `display_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `starts_at` DATETIME(3) NULL,
  `ends_at` DATETIME(3) NULL,
  `created_by_id` INTEGER NULL,
  `updated_by_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) NULL,
  UNIQUE INDEX `student_dashboard_banners_uuid_key`(`uuid`),
  INDEX `student_dashboard_banners_org_active_order_idx`(`organization_id`, `is_active`, `deleted_at`, `display_order`),
  INDEX `student_dashboard_banners_schedule_idx`(`starts_at`, `ends_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_dashboard_banner_sessions` (
  `banner_id` INTEGER NOT NULL,
  `session_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `student_dashboard_banner_sessions_session_idx`(`session_id`, `banner_id`),
  PRIMARY KEY (`banner_id`, `session_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_dashboard_banner_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `client_event_id` VARCHAR(100) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `student_id` INTEGER NOT NULL,
  `user_activity_session_id` INTEGER NULL,
  `banner_id` INTEGER NULL,
  `event_type` ENUM('IMPRESSION', 'CTA_CLICK', 'VIDEO_PLAY', 'VIDEO_PAUSE', 'VIDEO_COMPLETE') NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `video_position_seconds` INTEGER NULL,
  `title_snapshot` VARCHAR(120) NOT NULL,
  `destination_url_snapshot` VARCHAR(1000) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `student_dashboard_banner_events_uuid_key`(`uuid`),
  UNIQUE INDEX `student_dashboard_banner_events_client_unique`(`client_event_id`),
  INDEX `student_dashboard_banner_events_org_student_idx`(`organization_id`, `student_id`, `occurred_at`),
  INDEX `student_dashboard_banner_events_banner_type_idx`(`banner_id`, `event_type`, `occurred_at`),
  INDEX `student_dashboard_banner_events_student_id_idx`(`student_id`),
  INDEX `student_dashboard_banner_events_user_session_id_idx`(`user_activity_session_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `permissions` (`uuid`, `module`, `action`, `key`, `description`, `created_at`, `updated_at`)
VALUES
  (UUID(), 'dashboard-banners', 'create', 'dashboard-banners.create', 'Allows create access for dashboard banners', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'dashboard-banners', 'read', 'dashboard-banners.read', 'Allows read access for dashboard banners', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'dashboard-banners', 'update', 'dashboard-banners.update', 'Allows update access for dashboard banners', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
  (UUID(), 'dashboard-banners', 'delete', 'dashboard-banners.delete', 'Allows delete access for dashboard banners', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT role_row.`id`, permission_row.`id`, CURRENT_TIMESTAMP(3)
FROM `roles` role_row
JOIN `permissions` permission_row ON permission_row.`module` = 'dashboard-banners'
WHERE role_row.`code` IN ('SUPER_ADMIN', 'ADMIN') AND role_row.`is_active` = true;
