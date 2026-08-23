CREATE TABLE `organization_registration_page_courses` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `registration_page_id` INTEGER NOT NULL,
  `session_course_id` INTEGER NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_registration_page_education_options` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `registration_page_id` INTEGER NOT NULL,
  `education_option_id` INTEGER NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `organization_registration_page_digital_library_locations` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(191) NOT NULL,
  `registration_page_id` INTEGER NOT NULL,
  `digital_library_location_id` INTEGER NOT NULL,
  `sort_order` INTEGER NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `organization_registration_page_courses_uuid_key` ON `organization_registration_page_courses`(`uuid`);
CREATE UNIQUE INDEX `org_registration_page_courses_page_course_unique` ON `organization_registration_page_courses`(`registration_page_id`, `session_course_id`);
CREATE INDEX `org_registration_page_courses_page_sort_idx` ON `organization_registration_page_courses`(`registration_page_id`, `sort_order`);
CREATE INDEX `org_registration_page_courses_session_course_idx` ON `organization_registration_page_courses`(`session_course_id`);

CREATE UNIQUE INDEX `organization_registration_page_education_options_uuid_key` ON `organization_registration_page_education_options`(`uuid`);
CREATE UNIQUE INDEX `org_registration_page_education_page_option_unique` ON `organization_registration_page_education_options`(`registration_page_id`, `education_option_id`);
CREATE INDEX `org_registration_page_education_page_sort_idx` ON `organization_registration_page_education_options`(`registration_page_id`, `sort_order`);
CREATE INDEX `org_registration_page_education_option_idx` ON `organization_registration_page_education_options`(`education_option_id`);

CREATE UNIQUE INDEX `org_registration_page_library_uuid_key` ON `organization_registration_page_digital_library_locations`(`uuid`);
CREATE UNIQUE INDEX `org_registration_page_library_page_location_unique` ON `organization_registration_page_digital_library_locations`(`registration_page_id`, `digital_library_location_id`);
CREATE INDEX `org_registration_page_library_page_sort_idx` ON `organization_registration_page_digital_library_locations`(`registration_page_id`, `sort_order`);
CREATE INDEX `org_registration_page_library_location_idx` ON `organization_registration_page_digital_library_locations`(`digital_library_location_id`);

ALTER TABLE `organization_registration_page_courses`
  ADD CONSTRAINT `organization_registration_page_courses_registration_page_id_fkey`
  FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_page_courses`
  ADD CONSTRAINT `organization_registration_page_courses_session_course_id_fkey`
  FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_page_education_options`
  ADD CONSTRAINT `organization_registration_page_education_options_page_id_fkey`
  FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_page_education_options`
  ADD CONSTRAINT `organization_registration_page_education_options_option_id_fkey`
  FOREIGN KEY (`education_option_id`) REFERENCES `organization_education_options`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_page_digital_library_locations`
  ADD CONSTRAINT `org_registration_page_library_page_id_fkey`
  FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `organization_registration_page_digital_library_locations`
  ADD CONSTRAINT `org_registration_page_library_location_id_fkey`
  FOREIGN KEY (`digital_library_location_id`) REFERENCES `organization_digital_library_locations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
