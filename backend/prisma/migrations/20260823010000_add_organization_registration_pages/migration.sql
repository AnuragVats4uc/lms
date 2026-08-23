CREATE TABLE `organization_registration_pages` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `organization_id` INTEGER NOT NULL,
  `session_id` INTEGER NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `title` VARCHAR(180) NOT NULL DEFAULT 'Student Registration',
  `description` TEXT NULL,
  `logo_override` VARCHAR(255) NULL,
  `hero_image` VARCHAR(255) NULL,
  `primary_color` VARCHAR(20) NULL,
  `accent_color` VARCHAR(20) NULL,
  `support_email` VARCHAR(191) NULL,
  `support_phone` VARCHAR(30) NULL,
  `submit_button_text` VARCHAR(80) NOT NULL DEFAULT 'Submit Registration',
  `success_title` VARCHAR(120) NOT NULL DEFAULT 'Registration Successful',
  `success_message` TEXT NULL,
  `registration_enabled` BOOLEAN NOT NULL DEFAULT false,
  `require_email_verification` BOOLEAN NOT NULL DEFAULT false,
  `require_phone_verification` BOOLEAN NOT NULL DEFAULT false,
  `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_registration_fields` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `registration_page_id` INTEGER NOT NULL,
  `field_key` VARCHAR(80) NOT NULL,
  `label` VARCHAR(150) NOT NULL,
  `field_type` ENUM('TEXT', 'SELECT', 'RADIO', 'TEXTAREA') NOT NULL DEFAULT 'TEXT',
  `is_required` BOOLEAN NOT NULL DEFAULT false,
  `placeholder` VARCHAR(180) NULL,
  `help_text` VARCHAR(255) NULL,
  `maps_to` VARCHAR(80) NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_registration_field_options` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `field_id` INTEGER NOT NULL,
  `option_key` VARCHAR(80) NOT NULL,
  `label` VARCHAR(150) NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_registration_answers` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `registration_page_id` INTEGER NOT NULL,
  `field_id` INTEGER NULL,
  `student_id` INTEGER NOT NULL,
  `field_key` VARCHAR(80) NOT NULL,
  `value` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `organization_registration_pages_uuid_key` ON `organization_registration_pages`(`uuid`);
CREATE UNIQUE INDEX `organization_registration_pages_slug_unique` ON `organization_registration_pages`(`slug`);
CREATE INDEX `org_registration_pages_organization_id_idx` ON `organization_registration_pages`(`organization_id`);
CREATE INDEX `org_registration_pages_session_id_idx` ON `organization_registration_pages`(`session_id`);
CREATE INDEX `org_registration_pages_status_is_active_idx` ON `organization_registration_pages`(`status`, `is_active`);
CREATE INDEX `org_registration_pages_enabled_idx` ON `organization_registration_pages`(`registration_enabled`);

CREATE UNIQUE INDEX `organization_registration_fields_uuid_key` ON `organization_registration_fields`(`uuid`);
CREATE UNIQUE INDEX `org_registration_fields_page_key_unique` ON `organization_registration_fields`(`registration_page_id`, `field_key`);
CREATE INDEX `org_registration_fields_page_sort_idx` ON `organization_registration_fields`(`registration_page_id`, `sort_order`);

CREATE UNIQUE INDEX `organization_registration_field_options_uuid_key` ON `organization_registration_field_options`(`uuid`);
CREATE UNIQUE INDEX `org_registration_field_options_field_key_unique` ON `organization_registration_field_options`(`field_id`, `option_key`);
CREATE INDEX `org_registration_field_options_field_sort_idx` ON `organization_registration_field_options`(`field_id`, `sort_order`);

CREATE UNIQUE INDEX `organization_registration_answers_uuid_key` ON `organization_registration_answers`(`uuid`);
CREATE UNIQUE INDEX `org_registration_answers_page_student_key_unique` ON `organization_registration_answers`(`registration_page_id`, `student_id`, `field_key`);
CREATE INDEX `org_registration_answers_field_id_idx` ON `organization_registration_answers`(`field_id`);
CREATE INDEX `org_registration_answers_student_id_idx` ON `organization_registration_answers`(`student_id`);

ALTER TABLE `organization_registration_pages`
  ADD CONSTRAINT `organization_registration_pages_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_pages`
  ADD CONSTRAINT `organization_registration_pages_session_id_fkey`
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_fields`
  ADD CONSTRAINT `organization_registration_fields_registration_page_id_fkey`
  FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_field_options`
  ADD CONSTRAINT `organization_registration_field_options_field_id_fkey`
  FOREIGN KEY (`field_id`) REFERENCES `organization_registration_fields`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_answers`
  ADD CONSTRAINT `organization_registration_answers_registration_page_id_fkey`
  FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_answers`
  ADD CONSTRAINT `organization_registration_answers_field_id_fkey`
  FOREIGN KEY (`field_id`) REFERENCES `organization_registration_fields`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `organization_registration_answers`
  ADD CONSTRAINT `organization_registration_answers_student_id_fkey`
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
