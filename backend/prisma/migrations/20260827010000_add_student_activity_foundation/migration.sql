-- Extend refresh-token records so token rotation and revocation can be tied
-- to one durable authentication session without changing existing tokens.
ALTER TABLE `refresh_tokens`
  ADD COLUMN `user_activity_session_id` INTEGER NULL,
  ADD COLUMN `revoked_at` DATETIME(3) NULL,
  ADD COLUMN `revocation_reason` ENUM(
    'ROTATED',
    'MANUAL_LOGOUT',
    'TOKEN_EXPIRED',
    'FORCED_LOGOUT',
    'ACCOUNT_DISABLED',
    'UNKNOWN'
  ) NULL;

CREATE TABLE `organization_activity_policies` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `organization_id` INTEGER NOT NULL,
  `activity_retention_days` INTEGER NOT NULL DEFAULT 730,
  `failed_login_retention_days` INTEGER NOT NULL DEFAULT 365,
  `idle_threshold_seconds` INTEGER NOT NULL DEFAULT 300,
  `auth_heartbeat_seconds` INTEGER NOT NULL DEFAULT 60,
  `resource_heartbeat_seconds` INTEGER NOT NULL DEFAULT 15,
  `export_expiry_hours` INTEGER NOT NULL DEFAULT 24,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `organization_activity_policies_organization_id_unique` (`organization_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `authentication_attempts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NULL,
  `user_id` INTEGER NULL,
  `student_id` INTEGER NULL,
  `attempted_email` VARCHAR(191) NOT NULL,
  `outcome` ENUM('SUCCESS', 'FAILED') NOT NULL,
  `failure_reason` ENUM(
    'USER_NOT_FOUND',
    'INVALID_PASSWORD',
    'USER_INACTIVE',
    'USER_BLOCKED',
    'RATE_LIMITED',
    'UNKNOWN'
  ) NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `device_type` ENUM('DESKTOP', 'MOBILE', 'TABLET', 'BOT', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `browser` VARCHAR(100) NULL,
  `operating_system` VARCHAR(100) NULL,
  `request_id` VARCHAR(100) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `authentication_attempts_uuid_key` (`uuid`),
  INDEX `authentication_attempts_organization_occurred_idx` (`organization_id`, `occurred_at`),
  INDEX `authentication_attempts_student_occurred_idx` (`student_id`, `occurred_at`),
  INDEX `authentication_attempts_email_occurred_idx` (`attempted_email`, `occurred_at`),
  INDEX `authentication_attempts_outcome_occurred_idx` (`outcome`, `occurred_at`),
  INDEX `authentication_attempts_request_id_idx` (`request_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_activity_sessions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NULL,
  `user_id` INTEGER NULL,
  `student_id` INTEGER NULL,
  `login_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_seen_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ended_at` DATETIME(3) NULL,
  `elapsed_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `active_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `idle_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `end_reason` ENUM(
    'MANUAL_LOGOUT',
    'IDLE_TIMEOUT',
    'TOKEN_EXPIRED',
    'FORCED_LOGOUT',
    'ACCOUNT_DISABLED',
    'DISCONNECTED',
    'UNKNOWN'
  ) NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `device_type` ENUM('DESKTOP', 'MOBILE', 'TABLET', 'BOT', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `browser` VARCHAR(100) NULL,
  `operating_system` VARCHAR(100) NULL,
  `source` ENUM('LIVE', 'LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `user_activity_sessions_uuid_key` (`uuid`),
  INDEX `user_activity_sessions_organization_login_idx` (`organization_id`, `login_at`),
  INDEX `user_activity_sessions_student_login_idx` (`student_id`, `login_at`),
  INDEX `user_activity_sessions_user_login_idx` (`user_id`, `login_at`),
  INDEX `user_activity_sessions_open_last_seen_idx` (`ended_at`, `last_seen_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_resource_activity_sessions` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `student_id` INTEGER NOT NULL,
  `user_activity_session_id` INTEGER NULL,
  `session_course_id` INTEGER NULL,
  `folder_id` INTEGER NULL,
  `resource_id` INTEGER NULL,
  `resource_title_snapshot` VARCHAR(200) NOT NULL,
  `resource_type_code_snapshot` VARCHAR(30) NOT NULL,
  `course_name_snapshot` VARCHAR(200) NULL,
  `folder_name_snapshot` VARCHAR(150) NULL,
  `started_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_heartbeat_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `ended_at` DATETIME(3) NULL,
  `active_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `idle_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `end_reason` ENUM(
    'CLOSED',
    'NAVIGATED_AWAY',
    'IDLE_TIMEOUT',
    'COMPLETED',
    'DISCONNECTED',
    'UNKNOWN'
  ) NULL,
  `start_position_seconds` INTEGER NULL,
  `final_position_seconds` INTEGER NULL,
  `max_position_seconds` INTEGER NULL,
  `last_document_page` INTEGER NULL,
  `completed` BOOLEAN NOT NULL DEFAULT false,
  `source` ENUM('LIVE', 'LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `student_resource_activity_sessions_uuid_key` (`uuid`),
  INDEX `student_resource_sessions_scope_student_started_idx` (`organization_id`, `student_id`, `started_at`),
  INDEX `student_resource_sessions_student_resource_started_idx` (`student_id`, `resource_id`, `started_at`),
  INDEX `student_resource_sessions_course_student_started_idx` (`session_course_id`, `student_id`, `started_at`),
  INDEX `student_resource_sessions_auth_started_idx` (`user_activity_session_id`, `started_at`),
  INDEX `student_resource_sessions_open_heartbeat_idx` (`ended_at`, `last_heartbeat_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_document_page_activities` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `resource_activity_session_id` INTEGER NOT NULL,
  `page_number` INTEGER NOT NULL,
  `visit_sequence` INTEGER NOT NULL,
  `entered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `last_heartbeat_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `exited_at` DATETIME(3) NULL,
  `active_duration_seconds` INTEGER NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  UNIQUE INDEX `student_document_page_activities_uuid_key` (`uuid`),
  UNIQUE INDEX `student_document_pages_session_visit_unique` (`resource_activity_session_id`, `visit_sequence`),
  INDEX `student_document_pages_session_page_idx` (`resource_activity_session_id`, `page_number`),
  INDEX `student_document_pages_open_heartbeat_idx` (`exited_at`, `last_heartbeat_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `student_activity_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `client_event_id` VARCHAR(100) NULL,
  `organization_id` INTEGER NOT NULL,
  `student_id` INTEGER NOT NULL,
  `user_activity_session_id` INTEGER NULL,
  `resource_activity_session_id` INTEGER NULL,
  `session_course_id` INTEGER NULL,
  `resource_id` INTEGER NULL,
  `exam_attempt_id` INTEGER NULL,
  `event_type` ENUM(
    'LOGIN_SUCCESS',
    'LOGOUT',
    'SESSION_TIMEOUT',
    'RESOURCE_OPEN',
    'RESOURCE_CLOSE',
    'RESOURCE_DOWNLOAD',
    'DOCUMENT_PAGE_ENTER',
    'DOCUMENT_PAGE_EXIT',
    'DOCUMENT_FULLSCREEN_ENTER',
    'DOCUMENT_FULLSCREEN_EXIT',
    'VIDEO_PLAY',
    'VIDEO_PAUSE',
    'VIDEO_SEEK',
    'VIDEO_COMPLETE',
    'EXAM_START',
    'EXAM_RESUME',
    'EXAM_SUBMIT',
    'EXAM_AUTO_SUBMIT',
    'EXAM_CANCEL',
    'REPORT_VIEW',
    'REPORT_EXPORT'
  ) NOT NULL,
  `occurred_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `active_duration_delta_seconds` INTEGER NOT NULL DEFAULT 0,
  `page_number` INTEGER NULL,
  `video_position_seconds` INTEGER NULL,
  `metadata` JSON NULL,
  `resource_title_snapshot` VARCHAR(200) NULL,
  `resource_type_code_snapshot` VARCHAR(30) NULL,
  `course_name_snapshot` VARCHAR(200) NULL,
  `source` ENUM('LIVE', 'LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  UNIQUE INDEX `student_activity_events_uuid_key` (`uuid`),
  UNIQUE INDEX `student_activity_events_client_event_id_unique` (`client_event_id`),
  INDEX `student_activity_events_scope_student_occurred_idx` (`organization_id`, `student_id`, `occurred_at`),
  INDEX `student_activity_events_student_type_occurred_idx` (`student_id`, `event_type`, `occurred_at`),
  INDEX `student_activity_events_resource_occurred_idx` (`resource_id`, `occurred_at`),
  INDEX `student_activity_events_course_student_occurred_idx` (`session_course_id`, `student_id`, `occurred_at`),
  INDEX `student_activity_events_auth_session_occurred_idx` (`user_activity_session_id`, `occurred_at`),
  INDEX `student_activity_events_resource_session_occurred_idx` (`resource_activity_session_id`, `occurred_at`),
  INDEX `student_activity_events_exam_attempt_occurred_idx` (`exam_attempt_id`, `occurred_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `refresh_tokens_activity_session_id_idx`
  ON `refresh_tokens` (`user_activity_session_id`);

-- Existing organizations receive the approved default policy. Future
-- organizations receive the same policy through the organization repository.
INSERT IGNORE INTO `organization_activity_policies` (
  `organization_id`,
  `updated_at`
)
SELECT
  `id`,
  CURRENT_TIMESTAMP(3)
FROM `organizations`;

ALTER TABLE `organization_activity_policies`
  ADD CONSTRAINT `org_activity_policies_org_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `authentication_attempts`
  ADD CONSTRAINT `authentication_attempts_org_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `authentication_attempts_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `authentication_attempts_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `user_activity_sessions`
  ADD CONSTRAINT `user_activity_sessions_org_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_activity_sessions_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_activity_sessions_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_resource_activity_sessions`
  ADD CONSTRAINT `student_resource_sessions_org_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `student_resource_sessions_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `student_resource_sessions_auth_id_fkey`
  FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_resource_sessions_course_id_fkey`
  FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_resource_sessions_folder_id_fkey`
  FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_resource_sessions_resource_id_fkey`
  FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `student_document_page_activities`
  ADD CONSTRAINT `student_document_pages_resource_session_id_fkey`
  FOREIGN KEY (`resource_activity_session_id`) REFERENCES `student_resource_activity_sessions` (`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_activity_events`
  ADD CONSTRAINT `student_activity_events_org_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_auth_id_fkey`
  FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_resource_session_id_fkey`
  FOREIGN KEY (`resource_activity_session_id`) REFERENCES `student_resource_activity_sessions` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_course_id_fkey`
  FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_resource_id_fkey`
  FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `student_activity_events_exam_attempt_id_fkey`
  FOREIGN KEY (`exam_attempt_id`) REFERENCES `student_exam_attempts` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_user_activity_session_id_fkey`
  FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
