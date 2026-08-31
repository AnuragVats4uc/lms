
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `authentication_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `authentication_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `attempted_email` varchar(191) NOT NULL,
  `outcome` enum('SUCCESS','FAILED') NOT NULL,
  `failure_reason` enum('USER_NOT_FOUND','INVALID_PASSWORD','USER_INACTIVE','USER_BLOCKED','RATE_LIMITED','UNKNOWN') DEFAULT NULL,
  `occurred_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_type` enum('DESKTOP','MOBILE','TABLET','BOT','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `browser` varchar(100) DEFAULT NULL,
  `operating_system` varchar(100) DEFAULT NULL,
  `request_id` varchar(100) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `authentication_attempts_uuid_key` (`uuid`),
  KEY `authentication_attempts_organization_occurred_idx` (`organization_id`,`occurred_at`),
  KEY `authentication_attempts_student_occurred_idx` (`student_id`,`occurred_at`),
  KEY `authentication_attempts_email_occurred_idx` (`attempted_email`,`occurred_at`),
  KEY `authentication_attempts_outcome_occurred_idx` (`outcome`,`occurred_at`),
  KEY `authentication_attempts_request_id_idx` (`request_id`),
  KEY `authentication_attempts_user_id_fkey` (`user_id`),
  CONSTRAINT `authentication_attempts_org_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `authentication_attempts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `authentication_attempts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_instructors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `course_instructors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_course_id` int(11) NOT NULL,
  `instructor_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_instructors_session_course_id_instructor_id_unique` (`session_course_id`,`instructor_id`),
  KEY `course_instructors_instructor_id_idx` (`instructor_id`),
  CONSTRAINT `course_instructors_instructor_id_fkey` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `course_instructors_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(30) NOT NULL,
  `description` text DEFAULT NULL,
  `thumbnail` varchar(191) DEFAULT NULL,
  `duration_in_days` int(11) DEFAULT NULL,
  `status` enum('DRAFT','ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `discount` decimal(10,2) DEFAULT NULL,
  `type` varchar(80) DEFAULT NULL,
  `thumbnail_object_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `courses_uuid_key` (`uuid`),
  UNIQUE KEY `courses_name_unique` (`name`),
  UNIQUE KEY `courses_code_unique` (`code`),
  UNIQUE KEY `courses_thumbnail_object_id_unique` (`thumbnail_object_id`),
  KEY `courses_status_idx` (`status`),
  KEY `courses_is_active_idx` (`is_active`),
  KEY `courses_status_is_active_idx` (`status`,`is_active`),
  CONSTRAINT `courses_thumbnail_object_id_fkey` FOREIGN KEY (`thumbnail_object_id`) REFERENCES `stored_objects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_import_errors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_import_errors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_import_job_id` int(11) NOT NULL,
  `source_index` int(11) DEFAULT NULL,
  `field_name` varchar(80) DEFAULT NULL,
  `error_code` varchar(80) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `exam_import_errors_job_idx` (`exam_import_job_id`),
  CONSTRAINT `exam_import_errors_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_import_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_import_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_import_job_id` int(11) NOT NULL,
  `kind` enum('CONTENT_DOCX','MAPPING_XLSX') NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `storage_path` varchar(500) DEFAULT NULL,
  `file_hash` varchar(64) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `stored_object_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_import_files_job_kind_unique` (`exam_import_job_id`,`kind`),
  UNIQUE KEY `exam_import_files_stored_object_id_unique` (`stored_object_id`),
  KEY `exam_import_files_hash_idx` (`file_hash`),
  CONSTRAINT `exam_import_files_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_import_files_stored_object_id_fkey` FOREIGN KEY (`stored_object_id`) REFERENCES `stored_objects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_import_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_import_jobs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `exam_template_version_id` int(11) NOT NULL,
  `exam_template_slot_id` int(11) DEFAULT NULL,
  `exam_template_section_id` int(11) DEFAULT NULL,
  `subject_id` int(11) DEFAULT NULL,
  `uploaded_by_id` int(11) NOT NULL,
  `scope` enum('SINGLE_SECTION','FULL_EXAM') NOT NULL,
  `status` enum('UPLOADED','PARSING','VALIDATION_FAILED','READY_FOR_REVIEW','IMPORTING','IMPORTED','FAILED','CANCELLED') NOT NULL DEFAULT 'UPLOADED',
  `total_rows` int(11) NOT NULL DEFAULT 0,
  `valid_rows` int(11) NOT NULL DEFAULT 0,
  `warning_rows` int(11) NOT NULL DEFAULT 0,
  `error_rows` int(11) NOT NULL DEFAULT 0,
  `error_summary` text DEFAULT NULL,
  `imported_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `import_fingerprint` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_import_jobs_uuid_key` (`uuid`),
  UNIQUE KEY `exam_import_jobs_import_fingerprint_key` (`import_fingerprint`),
  KEY `exam_import_jobs_scope_status_idx` (`organization_id`,`status`),
  KEY `exam_import_jobs_version_idx` (`exam_template_version_id`),
  KEY `exam_import_jobs_exam_template_slot_id_fkey` (`exam_template_slot_id`),
  KEY `exam_import_jobs_exam_template_section_id_fkey` (`exam_template_section_id`),
  KEY `exam_import_jobs_subject_id_fkey` (`subject_id`),
  KEY `exam_import_jobs_uploaded_by_id_fkey` (`uploaded_by_id`),
  CONSTRAINT `exam_import_jobs_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `exam_import_jobs_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `exam_import_jobs_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_import_jobs_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_import_jobs_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `exam_import_jobs_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_import_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_import_rows` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_import_job_id` int(11) NOT NULL,
  `source_index` int(11) NOT NULL,
  `slot_code` varchar(60) DEFAULT NULL,
  `section_code` varchar(60) DEFAULT NULL,
  `subject_code` varchar(40) DEFAULT NULL,
  `question_code` varchar(80) DEFAULT NULL,
  `question_text` longtext DEFAULT NULL,
  `marks` decimal(8,2) DEFAULT NULL,
  `negative_marks` decimal(8,2) DEFAULT NULL,
  `correct_answer` text DEFAULT NULL,
  `numeric_tolerance` decimal(18,6) DEFAULT NULL,
  `explanation` longtext DEFAULT NULL,
  `options_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options_json`)),
  `accepted_answers_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`accepted_answers_json`)),
  `raw_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_data`)),
  `status` enum('VALID','WARNING','ERROR','IMPORTED','SKIPPED') NOT NULL DEFAULT 'VALID',
  `validation_message` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `question_type_id` int(11) DEFAULT NULL,
  `raw_question_type_id` int(11) DEFAULT NULL,
  `comprehension_code` varchar(80) DEFAULT NULL,
  `comprehension_text` longtext DEFAULT NULL,
  `sort_order` int(11) DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `case_sensitive` tinyint(1) NOT NULL DEFAULT 0,
  `topic_id` int(11) DEFAULT NULL,
  `topic_code` varchar(60) DEFAULT NULL,
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_import_rows_job_source_unique` (`exam_import_job_id`,`source_index`),
  KEY `exam_import_rows_job_status_idx` (`exam_import_job_id`,`status`),
  KEY `exam_import_rows_question_type_idx` (`question_type_id`),
  KEY `exam_import_rows_topic_idx` (`topic_id`),
  CONSTRAINT `exam_import_rows_exam_import_job_id_fkey` FOREIGN KEY (`exam_import_job_id`) REFERENCES `exam_import_jobs` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_import_rows_question_type_id_fkey` FOREIGN KEY (`question_type_id`) REFERENCES `question_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `exam_import_rows_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_selected_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_selected_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_id` int(11) NOT NULL,
  `exam_template_slot_id` int(11) NOT NULL,
  `duration_minutes_override` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_selected_slots_exam_slot_unique` (`exam_id`,`exam_template_slot_id`),
  KEY `exam_selected_slots_slot_idx` (`exam_template_slot_id`),
  CONSTRAINT `exam_selected_slots_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_selected_slots_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_session_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_session_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_id` int(11) NOT NULL,
  `session_course_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_session_courses_exam_course_unique` (`exam_id`,`session_course_id`),
  KEY `exam_session_courses_course_idx` (`session_course_id`),
  CONSTRAINT `exam_session_courses_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_session_courses_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_template_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_template_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_template_section_subject_id` int(11) NOT NULL,
  `question_version_id` int(11) NOT NULL,
  `marks` decimal(8,2) NOT NULL,
  `negative_marks` decimal(8,2) NOT NULL DEFAULT 0.00,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_template_questions_section_question_unique` (`exam_template_section_subject_id`,`question_version_id`),
  KEY `exam_template_questions_version_idx` (`question_version_id`),
  CONSTRAINT `exam_template_questions_exam_template_section_subject_id_fkey` FOREIGN KEY (`exam_template_section_subject_id`) REFERENCES `exam_template_section_subjects` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_template_questions_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=797 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_template_section_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_template_section_subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_template_section_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_section_subjects_section_subject_unique` (`exam_template_section_id`,`subject_id`),
  KEY `exam_section_subjects_subject_idx` (`subject_id`),
  CONSTRAINT `exam_template_section_subjects_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_template_section_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_template_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_template_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_template_slot_id` int(11) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(150) NOT NULL,
  `instructions` longtext DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL,
  `questions_to_attempt` int(11) DEFAULT NULL,
  `randomize_questions` tinyint(1) NOT NULL DEFAULT 0,
  `randomize_options` tinyint(1) NOT NULL DEFAULT 0,
  `navigation_mode` enum('FREE','SEQUENTIAL','LOCKED_AFTER_SUBMIT') NOT NULL DEFAULT 'FREE',
  `allow_review` tinyint(1) NOT NULL DEFAULT 1,
  `auto_submit_on_timeout` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_template_sections_slot_code_unique` (`exam_template_slot_id`,`code`),
  KEY `exam_template_sections_slot_order_idx` (`exam_template_slot_id`,`sort_order`),
  CONSTRAINT `exam_template_sections_exam_template_slot_id_fkey` FOREIGN KEY (`exam_template_slot_id`) REFERENCES `exam_template_slots` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_template_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_template_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_template_version_id` int(11) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `instructions` longtext DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL,
  `navigation_mode` enum('FREE','SEQUENTIAL','LOCKED_AFTER_SUBMIT') NOT NULL DEFAULT 'FREE',
  `auto_submit_on_timeout` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_template_slots_version_code_unique` (`exam_template_version_id`,`code`),
  KEY `exam_template_slots_version_order_idx` (`exam_template_version_id`,`sort_order`),
  CONSTRAINT `exam_template_slots_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_template_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_template_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `exam_template_id` int(11) NOT NULL,
  `version_number` int(11) NOT NULL,
  `instructions` longtext DEFAULT NULL,
  `default_duration_minutes` int(11) DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','RETIRED') NOT NULL DEFAULT 'DRAFT',
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `enforce_slot_timers` tinyint(1) NOT NULL DEFAULT 0,
  `enforce_section_timers` tinyint(1) NOT NULL DEFAULT 0,
  `default_attempt_limit` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_template_versions_template_version_unique` (`exam_template_id`,`version_number`),
  KEY `exam_template_versions_status_idx` (`status`),
  CONSTRAINT `exam_template_versions_exam_template_id_fkey` FOREIGN KEY (`exam_template_id`) REFERENCES `exam_templates` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exam_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exam_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(180) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_templates_uuid_key` (`uuid`),
  UNIQUE KEY `exam_templates_organization_id_code_unique` (`organization_id`,`code`),
  KEY `exam_templates_scope_status_idx` (`organization_id`,`status`,`is_active`),
  CONSTRAINT `exam_templates_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=87 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `exams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `exam_template_version_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `title` varchar(200) NOT NULL,
  `instructions` longtext DEFAULT NULL,
  `available_from` datetime(3) NOT NULL,
  `available_until` datetime(3) NOT NULL,
  `duration_minutes` int(11) NOT NULL,
  `attempt_limit` int(11) NOT NULL DEFAULT 1,
  `auto_submit_on_timeout` tinyint(1) NOT NULL DEFAULT 1,
  `result_publish_at` datetime(3) DEFAULT NULL,
  `status` enum('DRAFT','SCHEDULED','LIVE','CLOSED','CANCELLED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `allow_resume` tinyint(1) NOT NULL DEFAULT 1,
  `result_release_mode` enum('IMMEDIATE','SCHEDULED','MANUAL') NOT NULL DEFAULT 'IMMEDIATE',
  `results_released_at` datetime(3) DEFAULT NULL,
  `show_score` tinyint(1) NOT NULL DEFAULT 1,
  `show_correct_answers` tinyint(1) NOT NULL DEFAULT 0,
  `show_explanations` tinyint(1) NOT NULL DEFAULT 0,
  `show_question_review` tinyint(1) NOT NULL DEFAULT 0,
  `passing_percentage` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `exams_uuid_key` (`uuid`),
  UNIQUE KEY `exams_organization_id_code_unique` (`organization_id`,`code`),
  KEY `exams_session_id_status_idx` (`session_id`,`status`),
  KEY `exams_template_version_idx` (`exam_template_version_id`),
  CONSTRAINT `exams_exam_template_version_id_fkey` FOREIGN KEY (`exam_template_version_id`) REFERENCES `exam_template_versions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `exams_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exams_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `folders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `folders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `session_course_id` int(11) NOT NULL,
  `parent_folder_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `icon` varchar(100) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `status` enum('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `folders_uuid_key` (`uuid`),
  UNIQUE KEY `folders_parent_folder_id_session_course_id_name_unique` (`parent_folder_id`,`session_course_id`,`name`),
  KEY `folders_session_course_id_idx` (`session_course_id`),
  KEY `folders_parent_folder_id_idx` (`parent_folder_id`),
  KEY `folders_status_idx` (`status`),
  CONSTRAINT `folders_parent_folder_id_fkey` FOREIGN KEY (`parent_folder_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `folders_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_activity_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_activity_policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `organization_id` int(11) NOT NULL,
  `activity_retention_days` int(11) NOT NULL DEFAULT 730,
  `failed_login_retention_days` int(11) NOT NULL DEFAULT 365,
  `idle_threshold_seconds` int(11) NOT NULL DEFAULT 300,
  `auth_heartbeat_seconds` int(11) NOT NULL DEFAULT 60,
  `resource_heartbeat_seconds` int(11) NOT NULL DEFAULT 15,
  `export_expiry_hours` int(11) NOT NULL DEFAULT 24,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_activity_policies_organization_id_unique` (`organization_id`),
  CONSTRAINT `org_activity_policies_org_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_digital_library_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_digital_library_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_digital_library_locations_uuid_key` (`uuid`),
  UNIQUE KEY `organization_library_locations_org_name_unique` (`organization_id`,`name`),
  KEY `organization_library_locations_organization_id_idx` (`organization_id`),
  KEY `organization_library_locations_org_active_sort_idx` (`organization_id`,`is_active`,`sort_order`),
  CONSTRAINT `organization_digital_library_locations_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_education_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_education_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_education_options_uuid_key` (`uuid`),
  UNIQUE KEY `organization_education_options_org_name_unique` (`organization_id`,`name`),
  KEY `organization_education_options_organization_id_idx` (`organization_id`),
  KEY `organization_education_options_org_active_sort_idx` (`organization_id`,`is_active`,`sort_order`),
  CONSTRAINT `organization_education_options_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `registration_page_id` int(11) NOT NULL,
  `field_id` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL,
  `field_key` varchar(80) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_answers_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_answers_page_student_key_unique` (`registration_page_id`,`student_id`,`field_key`),
  KEY `org_registration_answers_field_id_idx` (`field_id`),
  KEY `org_registration_answers_student_id_idx` (`student_id`),
  CONSTRAINT `organization_registration_answers_field_id_fkey` FOREIGN KEY (`field_id`) REFERENCES `organization_registration_fields` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_answers_registration_page_id_fkey` FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_answers_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_field_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_field_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `field_id` int(11) NOT NULL,
  `option_key` varchar(80) NOT NULL,
  `label` varchar(150) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_field_options_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_field_options_field_key_unique` (`field_id`,`option_key`),
  KEY `org_registration_field_options_field_sort_idx` (`field_id`,`sort_order`),
  CONSTRAINT `organization_registration_field_options_field_id_fkey` FOREIGN KEY (`field_id`) REFERENCES `organization_registration_fields` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `registration_page_id` int(11) NOT NULL,
  `field_key` varchar(80) NOT NULL,
  `label` varchar(150) NOT NULL,
  `field_type` enum('TEXT','SELECT','RADIO','TEXTAREA') NOT NULL DEFAULT 'TEXT',
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `placeholder` varchar(180) DEFAULT NULL,
  `help_text` varchar(255) DEFAULT NULL,
  `maps_to` varchar(80) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_fields_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_fields_page_key_unique` (`registration_page_id`,`field_key`),
  KEY `org_registration_fields_page_sort_idx` (`registration_page_id`,`sort_order`),
  CONSTRAINT `organization_registration_fields_registration_page_id_fkey` FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_page_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_page_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `registration_page_id` int(11) NOT NULL,
  `session_course_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_page_courses_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_page_courses_page_course_unique` (`registration_page_id`,`session_course_id`),
  KEY `org_registration_page_courses_page_sort_idx` (`registration_page_id`,`sort_order`),
  KEY `org_registration_page_courses_session_course_idx` (`session_course_id`),
  CONSTRAINT `organization_registration_page_courses_registration_page_id_fkey` FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_page_courses_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_page_digital_library_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_page_digital_library_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `registration_page_id` int(11) NOT NULL,
  `digital_library_location_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `org_registration_page_library_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_page_library_page_location_unique` (`registration_page_id`,`digital_library_location_id`),
  KEY `org_registration_page_library_page_sort_idx` (`registration_page_id`,`sort_order`),
  KEY `org_registration_page_library_location_idx` (`digital_library_location_id`),
  CONSTRAINT `org_registration_page_library_location_id_fkey` FOREIGN KEY (`digital_library_location_id`) REFERENCES `organization_digital_library_locations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_page_library_locations_page_id_fkey` FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_page_education_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_page_education_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `registration_page_id` int(11) NOT NULL,
  `education_option_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_page_education_options_uuid_key` (`uuid`),
  UNIQUE KEY `org_registration_page_education_page_option_unique` (`registration_page_id`,`education_option_id`),
  KEY `org_registration_page_education_page_sort_idx` (`registration_page_id`,`sort_order`),
  KEY `org_registration_page_education_option_idx` (`education_option_id`),
  CONSTRAINT `organization_registration_page_education_options_option_id_fkey` FOREIGN KEY (`education_option_id`) REFERENCES `organization_education_options` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_page_education_options_page_id_fkey` FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organization_registration_pages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organization_registration_pages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `title` varchar(180) NOT NULL DEFAULT 'Student Registration',
  `description` text DEFAULT NULL,
  `logo_override` varchar(255) DEFAULT NULL,
  `hero_image` varchar(255) DEFAULT NULL,
  `primary_color` varchar(20) DEFAULT NULL,
  `accent_color` varchar(20) DEFAULT NULL,
  `support_email` varchar(191) DEFAULT NULL,
  `support_phone` varchar(30) DEFAULT NULL,
  `submit_button_text` varchar(80) NOT NULL DEFAULT 'Submit Registration',
  `success_title` varchar(120) NOT NULL DEFAULT 'Registration Successful',
  `success_message` text DEFAULT NULL,
  `registration_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `require_email_verification` tinyint(1) NOT NULL DEFAULT 0,
  `require_phone_verification` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organization_registration_pages_uuid_key` (`uuid`),
  UNIQUE KEY `organization_registration_pages_slug_unique` (`slug`),
  KEY `org_registration_pages_organization_id_idx` (`organization_id`),
  KEY `org_registration_pages_session_id_idx` (`session_id`),
  KEY `org_registration_pages_status_is_active_idx` (`status`,`is_active`),
  KEY `org_registration_pages_enabled_idx` (`registration_enabled`),
  CONSTRAINT `organization_registration_pages_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `organization_registration_pages_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `organizations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text DEFAULT NULL,
  `logo` varchar(191) DEFAULT NULL,
  `website` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `organizations_uuid_key` (`uuid`),
  UNIQUE KEY `organizations_name_unique` (`name`),
  UNIQUE KEY `organizations_code_unique` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `module` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `key` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_uuid_key` (`uuid`),
  UNIQUE KEY `permissions_key_unique` (`key`),
  UNIQUE KEY `permissions_module_action_unique` (`module`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_accepted_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_accepted_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_version_id` int(11) NOT NULL,
  `text_value` varchar(500) DEFAULT NULL,
  `normalized_text` varchar(500) DEFAULT NULL,
  `numeric_value` decimal(18,6) DEFAULT NULL,
  `numeric_tolerance` decimal(18,6) DEFAULT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `question_answers_version_idx` (`question_version_id`),
  CONSTRAINT `question_accepted_answers_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_comprehensions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_comprehensions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `content` longtext NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_comprehensions_uuid_key` (`uuid`),
  UNIQUE KEY `question_comprehensions_organization_code_unique` (`organization_id`,`code`),
  KEY `question_comprehensions_scope_idx` (`organization_id`,`is_active`),
  CONSTRAINT `question_comprehensions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_version_id` int(11) NOT NULL,
  `code` varchar(10) NOT NULL,
  `content` longtext NOT NULL,
  `is_correct` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_options_version_code_unique` (`question_version_id`,`code`),
  KEY `question_options_version_order_idx` (`question_version_id`,`sort_order`),
  CONSTRAINT `question_options_question_version_id_fkey` FOREIGN KEY (`question_version_id`) REFERENCES `question_versions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=525 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_types` (
  `id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_types_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `question_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `question_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `question_id` int(11) NOT NULL,
  `version_number` int(11) NOT NULL,
  `content` longtext NOT NULL,
  `explanation` longtext DEFAULT NULL,
  `default_marks` decimal(8,2) NOT NULL DEFAULT 1.00,
  `default_negative_marks` decimal(8,2) NOT NULL DEFAULT 0.00,
  `case_sensitive` tinyint(1) NOT NULL DEFAULT 0,
  `normalize_whitespace` tinyint(1) NOT NULL DEFAULT 1,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `question_type_id` int(11) NOT NULL,
  `comprehension_id` int(11) DEFAULT NULL,
  `virtual_keyboard_mode` enum('NONE','NUMERIC','ALPHANUMERIC') NOT NULL DEFAULT 'NONE',
  `allow_physical_keyboard` tinyint(1) NOT NULL DEFAULT 1,
  `allow_paste` tinyint(1) NOT NULL DEFAULT 1,
  `max_answer_length` int(11) DEFAULT NULL,
  `topic_id` int(11) DEFAULT NULL,
  `difficulty` enum('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'MEDIUM',
  PRIMARY KEY (`id`),
  UNIQUE KEY `question_versions_question_id_version_unique` (`question_id`,`version_number`),
  KEY `question_versions_type_idx` (`question_type_id`),
  KEY `question_versions_comprehension_idx` (`comprehension_id`),
  KEY `question_versions_topic_idx` (`topic_id`),
  CONSTRAINT `question_versions_comprehension_id_fkey` FOREIGN KEY (`comprehension_id`) REFERENCES `question_comprehensions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `question_versions_question_id_fkey` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `question_versions_question_type_id_fkey` FOREIGN KEY (`question_type_id`) REFERENCES `question_types` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `question_versions_topic_id_fkey` FOREIGN KEY (`topic_id`) REFERENCES `topics` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=75 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `code` varchar(80) NOT NULL,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `questions_uuid_key` (`uuid`),
  UNIQUE KEY `questions_organization_id_code_unique` (`organization_id`,`code`),
  KEY `questions_subject_id_idx` (`subject_id`),
  KEY `questions_scope_status_idx` (`organization_id`,`status`,`is_active`),
  CONSTRAINT `questions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `questions_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `status` enum('ACTIVE','REVOKED') NOT NULL DEFAULT 'ACTIVE',
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `user_activity_session_id` int(11) DEFAULT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `revocation_reason` enum('ROTATED','MANUAL_LOGOUT','TOKEN_EXPIRED','FORCED_LOGOUT','ACCOUNT_DISABLED','UNKNOWN') DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_uuid_key` (`uuid`),
  UNIQUE KEY `refresh_tokens_token_unique` (`token`),
  KEY `refresh_tokens_user_id_idx` (`user_id`),
  KEY `refresh_tokens_status_idx` (`status`),
  KEY `refresh_tokens_activity_session_id_idx` (`user_activity_session_id`),
  CONSTRAINT `refresh_tokens_user_activity_session_id_fkey` FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=392 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resource_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resource_types` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `resource_types_code_unique` (`code`),
  UNIQUE KEY `resource_types_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `folder_id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `document_url` varchar(191) DEFAULT NULL,
  `video_url` varchar(191) DEFAULT NULL,
  `exam_id` int(11) DEFAULT NULL,
  `thumbnail` varchar(191) DEFAULT NULL,
  `mime_type` varchar(150) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `duration_in_seconds` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `status` enum('DRAFT','PUBLISHED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `is_downloadable` tinyint(1) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `type` int(11) NOT NULL,
  `document_object_id` int(11) DEFAULT NULL,
  `thumbnail_object_id` int(11) DEFAULT NULL,
  `document_page_count` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resources_uuid_key` (`uuid`),
  UNIQUE KEY `resources_document_object_id_unique` (`document_object_id`),
  UNIQUE KEY `resources_thumbnail_object_id_unique` (`thumbnail_object_id`),
  KEY `resources_folder_id_idx` (`folder_id`),
  KEY `resources_status_idx` (`status`),
  KEY `resources_is_published_idx` (`is_published`),
  KEY `resources_type_idx` (`type`),
  KEY `resources_exam_id_idx` (`exam_id`),
  CONSTRAINT `resources_document_object_id_fkey` FOREIGN KEY (`document_object_id`) REFERENCES `stored_objects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `resources_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `resources_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `resources_thumbnail_object_id_fkey` FOREIGN KEY (`thumbnail_object_id`) REFERENCES `stored_objects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `resources_type_fkey` FOREIGN KEY (`type`) REFERENCES `resource_types` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_permissions_role_id_permission_id_unique` (`role_id`,`permission_id`),
  KEY `role_permissions_permission_id_idx` (`permission_id`),
  CONSTRAINT `role_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `role_permissions_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=664 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `scope` varchar(64) NOT NULL DEFAULT 'GLOBAL',
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_uuid_key` (`uuid`),
  UNIQUE KEY `roles_scope_name_unique` (`scope`,`name`),
  UNIQUE KEY `roles_scope_code_unique` (`scope`,`code`),
  KEY `roles_organization_id_idx` (`organization_id`),
  CONSTRAINT `roles_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `session_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `session_courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `session_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `display_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('DRAFT','ACTIVE','INACTIVE','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_courses_uuid_key` (`uuid`),
  UNIQUE KEY `session_courses_session_id_course_id_unique` (`session_id`,`course_id`),
  KEY `session_courses_session_id_idx` (`session_id`),
  KEY `session_courses_course_id_idx` (`course_id`),
  KEY `session_courses_status_idx` (`status`),
  KEY `session_courses_is_active_idx` (`is_active`),
  KEY `session_courses_session_id_status_idx` (`session_id`,`status`),
  CONSTRAINT `session_courses_course_id_fkey` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `session_courses_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `start_date` datetime(3) NOT NULL,
  `end_date` datetime(3) NOT NULL,
  `status` enum('UPCOMING','ACTIVE','COMPLETED','ARCHIVED') NOT NULL DEFAULT 'UPCOMING',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_uuid_key` (`uuid`),
  UNIQUE KEY `sessions_organization_id_name_unique` (`organization_id`,`name`),
  KEY `sessions_organization_id_idx` (`organization_id`),
  KEY `sessions_status_idx` (`status`),
  KEY `sessions_is_active_idx` (`is_active`),
  KEY `sessions_organization_id_status_idx` (`organization_id`,`status`),
  CONSTRAINT `sessions_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `stored_objects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stored_objects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `uploaded_by_id` int(11) DEFAULT NULL,
  `provider` enum('LOCAL','UTHO_S3') NOT NULL,
  `bucket` varchar(191) NOT NULL,
  `object_key` varchar(500) NOT NULL,
  `original_file_name` varchar(255) NOT NULL,
  `mime_type` varchar(150) NOT NULL,
  `size_bytes` bigint(20) NOT NULL,
  `checksum_sha256` varchar(64) NOT NULL,
  `etag` varchar(191) DEFAULT NULL,
  `version_id` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','READY','FAILED','DELETE_PENDING','DELETED') NOT NULL DEFAULT 'PENDING',
  `failure_message` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stored_objects_uuid_key` (`uuid`),
  UNIQUE KEY `stored_objects_provider_bucket_key_unique` (`provider`,`bucket`,`object_key`),
  KEY `stored_objects_organization_status_idx` (`organization_id`,`status`),
  KEY `stored_objects_uploaded_by_id_idx` (`uploaded_by_id`),
  KEY `stored_objects_status_created_at_idx` (`status`,`created_at`),
  CONSTRAINT `stored_objects_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `stored_objects_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_activity_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_activity_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `client_event_id` varchar(100) DEFAULT NULL,
  `organization_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `user_activity_session_id` int(11) DEFAULT NULL,
  `resource_activity_session_id` int(11) DEFAULT NULL,
  `session_course_id` int(11) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `exam_attempt_id` int(11) DEFAULT NULL,
  `event_type` enum('LOGIN_SUCCESS','LOGOUT','SESSION_TIMEOUT','RESOURCE_OPEN','RESOURCE_CLOSE','RESOURCE_DOWNLOAD','DOCUMENT_PAGE_ENTER','DOCUMENT_PAGE_EXIT','DOCUMENT_FULLSCREEN_ENTER','DOCUMENT_FULLSCREEN_EXIT','VIDEO_PLAY','VIDEO_PAUSE','VIDEO_SEEK','VIDEO_COMPLETE','EXAM_START','EXAM_RESUME','EXAM_SUBMIT','EXAM_AUTO_SUBMIT','EXAM_CANCEL','REPORT_VIEW','REPORT_EXPORT') NOT NULL,
  `occurred_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `active_duration_delta_seconds` int(11) NOT NULL DEFAULT 0,
  `page_number` int(11) DEFAULT NULL,
  `video_position_seconds` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `resource_title_snapshot` varchar(200) DEFAULT NULL,
  `resource_type_code_snapshot` varchar(30) DEFAULT NULL,
  `course_name_snapshot` varchar(200) DEFAULT NULL,
  `source` enum('LIVE','LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_activity_events_uuid_key` (`uuid`),
  UNIQUE KEY `student_activity_events_client_event_id_unique` (`client_event_id`),
  KEY `student_activity_events_scope_student_occurred_idx` (`organization_id`,`student_id`,`occurred_at`),
  KEY `student_activity_events_student_type_occurred_idx` (`student_id`,`event_type`,`occurred_at`),
  KEY `student_activity_events_resource_occurred_idx` (`resource_id`,`occurred_at`),
  KEY `student_activity_events_course_student_occurred_idx` (`session_course_id`,`student_id`,`occurred_at`),
  KEY `student_activity_events_auth_session_occurred_idx` (`user_activity_session_id`,`occurred_at`),
  KEY `student_activity_events_resource_session_occurred_idx` (`resource_activity_session_id`,`occurred_at`),
  KEY `student_activity_events_exam_attempt_occurred_idx` (`exam_attempt_id`,`occurred_at`),
  CONSTRAINT `student_activity_events_auth_id_fkey` FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_exam_attempt_id_fkey` FOREIGN KEY (`exam_attempt_id`) REFERENCES `student_exam_attempts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_org_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_resource_session_id_fkey` FOREIGN KEY (`resource_activity_session_id`) REFERENCES `student_resource_activity_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_activity_events_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=332 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_course_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_course_enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `enrollment_id` int(11) NOT NULL,
  `session_course_id` int(11) NOT NULL,
  `status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_course_enrollments_uuid_key` (`uuid`),
  UNIQUE KEY `student_course_enrollment_unique` (`enrollment_id`,`session_course_id`),
  KEY `student_course_enrollments_session_course_id_idx` (`session_course_id`),
  KEY `student_course_enrollments_status_is_active_idx` (`status`,`is_active`),
  CONSTRAINT `student_course_enrollments_enrollment_id_fkey` FOREIGN KEY (`enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_course_enrollments_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_course_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_course_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_course_id` int(11) NOT NULL,
  `completion_percentage` int(11) NOT NULL DEFAULT 0,
  `last_accessed_resource_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_course_progress_student_id_session_course_id_unique` (`student_id`,`session_course_id`),
  KEY `student_course_progress_session_course_id_idx` (`session_course_id`),
  KEY `student_course_progress_last_accessed_resource_id_idx` (`last_accessed_resource_id`),
  KEY `student_course_progress_student_id_idx` (`student_id`),
  CONSTRAINT `student_course_progress_last_accessed_resource_id_fkey` FOREIGN KEY (`last_accessed_resource_id`) REFERENCES `resources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_course_progress_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_course_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_document_page_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_document_page_activities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `resource_activity_session_id` int(11) NOT NULL,
  `page_number` int(11) NOT NULL,
  `visit_sequence` int(11) NOT NULL,
  `entered_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_heartbeat_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `exited_at` datetime(3) DEFAULT NULL,
  `active_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_document_page_activities_uuid_key` (`uuid`),
  UNIQUE KEY `student_document_pages_session_visit_unique` (`resource_activity_session_id`,`visit_sequence`),
  KEY `student_document_pages_session_page_idx` (`resource_activity_session_id`,`page_number`),
  KEY `student_document_pages_open_heartbeat_idx` (`exited_at`,`last_heartbeat_at`),
  CONSTRAINT `student_document_pages_resource_session_id_fkey` FOREIGN KEY (`resource_activity_session_id`) REFERENCES `student_resource_activity_sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `session_id` int(11) NOT NULL,
  `status` enum('ACTIVE','COMPLETED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_enrollments_uuid_key` (`uuid`),
  UNIQUE KEY `student_enrollments_student_id_session_id_unique` (`student_id`,`session_id`),
  KEY `student_enrollments_organization_id_idx` (`organization_id`),
  KEY `student_enrollments_session_id_idx` (`session_id`),
  KEY `student_enrollments_status_is_active_idx` (`status`,`is_active`),
  KEY `student_enrollments_student_id_idx` (`student_id`),
  CONSTRAINT `student_enrollments_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_enrollments_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_enrollments_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_answer_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_answer_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_exam_answer_id` int(11) NOT NULL,
  `question_option_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_answer_options_answer_option_unique` (`student_exam_answer_id`,`question_option_id`),
  KEY `student_exam_answer_options_question_option_id_fkey` (`question_option_id`),
  CONSTRAINT `student_exam_answer_options_question_option_id_fkey` FOREIGN KEY (`question_option_id`) REFERENCES `question_options` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_exam_answer_options_student_exam_answer_id_fkey` FOREIGN KEY (`student_exam_answer_id`) REFERENCES `student_exam_answers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_answers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_answers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_exam_attempt_id` int(11) NOT NULL,
  `exam_template_question_id` int(11) NOT NULL,
  `text_answer` text DEFAULT NULL,
  `numeric_answer` decimal(18,6) DEFAULT NULL,
  `is_correct` tinyint(1) DEFAULT NULL,
  `marks_awarded` decimal(8,2) DEFAULT NULL,
  `answered_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_answers_attempt_question_unique` (`student_exam_attempt_id`,`exam_template_question_id`),
  KEY `student_exam_answers_exam_template_question_id_fkey` (`exam_template_question_id`),
  CONSTRAINT `student_exam_answers_exam_template_question_id_fkey` FOREIGN KEY (`exam_template_question_id`) REFERENCES `exam_template_questions` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_exam_answers_student_exam_attempt_id_fkey` FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_attempt_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_attempt_questions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_exam_attempt_id` int(11) NOT NULL,
  `student_exam_slot_attempt_id` int(11) NOT NULL,
  `student_exam_section_attempt_id` int(11) NOT NULL,
  `exam_template_question_id` int(11) NOT NULL,
  `question_order` int(11) NOT NULL,
  `option_order` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`option_order`)),
  `visited_at` datetime(3) DEFAULT NULL,
  `last_viewed_at` datetime(3) DEFAULT NULL,
  `marked_for_review` tinyint(1) NOT NULL DEFAULT 0,
  `time_spent_seconds` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_attempt_questions_attempt_question_unique` (`student_exam_attempt_id`,`exam_template_question_id`),
  UNIQUE KEY `student_exam_attempt_questions_attempt_order_unique` (`student_exam_attempt_id`,`question_order`),
  KEY `student_exam_attempt_questions_section_order_idx` (`student_exam_section_attempt_id`,`question_order`),
  KEY `student_exam_attempt_questions_slot_attempt_id_fkey` (`student_exam_slot_attempt_id`),
  KEY `student_exam_attempt_questions_template_question_id_fkey` (`exam_template_question_id`),
  CONSTRAINT `student_exam_attempt_questions_attempt_id_fkey` FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempt_questions_section_attempt_id_fkey` FOREIGN KEY (`student_exam_section_attempt_id`) REFERENCES `student_exam_section_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempt_questions_slot_attempt_id_fkey` FOREIGN KEY (`student_exam_slot_attempt_id`) REFERENCES `student_exam_slot_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempt_questions_template_question_id_fkey` FOREIGN KEY (`exam_template_question_id`) REFERENCES `exam_template_questions` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=331 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `student_id` int(11) NOT NULL,
  `exam_id` int(11) NOT NULL,
  `attempt_number` int(11) NOT NULL,
  `status` enum('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','EVALUATED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expires_at` datetime(3) NOT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `duration_seconds` int(11) NOT NULL DEFAULT 0,
  `remaining_seconds_at_last_save` int(11) DEFAULT NULL,
  `submission_reason` enum('STUDENT_SUBMITTED','EXAM_TIMEOUT','SLOT_TIMEOUT','SECTION_TIMEOUT','ADMIN_SUBMITTED') DEFAULT NULL,
  `score` decimal(10,2) DEFAULT NULL,
  `maximum_score` decimal(10,2) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `last_saved_at` datetime(3) DEFAULT NULL,
  `evaluated_at` datetime(3) DEFAULT NULL,
  `configuration_snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`configuration_snapshot`)),
  `session_course_id` int(11) DEFAULT NULL,
  `source_resource_id` int(11) DEFAULT NULL,
  `calculation_version` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_attempts_uuid_key` (`uuid`),
  UNIQUE KEY `student_exam_attempts_student_exam_number_unique` (`student_id`,`exam_id`,`attempt_number`),
  KEY `student_exam_attempts_exam_status_idx` (`exam_id`,`status`),
  KEY `student_exam_attempts_exam_course_rank_idx` (`exam_id`,`session_course_id`,`status`,`score`),
  KEY `student_exam_attempts_student_status_submitted_idx` (`student_id`,`status`,`submitted_at`),
  KEY `student_exam_attempts_session_course_id_fkey` (`session_course_id`),
  KEY `student_exam_attempts_source_resource_id_fkey` (`source_resource_id`),
  CONSTRAINT `student_exam_attempts_exam_id_fkey` FOREIGN KEY (`exam_id`) REFERENCES `exams` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempts_session_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempts_source_resource_id_fkey` FOREIGN KEY (`source_resource_id`) REFERENCES `resources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_exam_attempts_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_section_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_section_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_exam_slot_attempt_id` int(11) NOT NULL,
  `exam_template_section_id` int(11) NOT NULL,
  `status` enum('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','EVALUATED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  `started_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `time_spent_seconds` int(11) NOT NULL DEFAULT 0,
  `completion_reason` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_section_attempts_slot_section_unique` (`student_exam_slot_attempt_id`,`exam_template_section_id`),
  KEY `student_exam_section_attempts_exam_template_section_id_fkey` (`exam_template_section_id`),
  CONSTRAINT `student_exam_section_attempts_exam_template_section_id_fkey` FOREIGN KEY (`exam_template_section_id`) REFERENCES `exam_template_sections` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_exam_section_attempts_student_exam_slot_attempt_id_fkey` FOREIGN KEY (`student_exam_slot_attempt_id`) REFERENCES `student_exam_slot_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_exam_slot_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_exam_slot_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_exam_attempt_id` int(11) NOT NULL,
  `exam_selected_slot_id` int(11) NOT NULL,
  `status` enum('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','EVALUATED','CANCELLED') NOT NULL DEFAULT 'IN_PROGRESS',
  `started_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `submitted_at` datetime(3) DEFAULT NULL,
  `time_spent_seconds` int(11) NOT NULL DEFAULT 0,
  `completion_reason` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_exam_slot_attempts_attempt_slot_unique` (`student_exam_attempt_id`,`exam_selected_slot_id`),
  KEY `student_exam_slot_attempts_exam_selected_slot_id_fkey` (`exam_selected_slot_id`),
  CONSTRAINT `student_exam_slot_attempts_exam_selected_slot_id_fkey` FOREIGN KEY (`exam_selected_slot_id`) REFERENCES `exam_selected_slots` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_exam_slot_attempts_student_exam_attempt_id_fkey` FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `type` enum('ASSIGNMENT','ANNOUNCEMENT','EVENT','EXAM','RESOURCE','SYSTEM') NOT NULL,
  `title` varchar(180) NOT NULL,
  `description` text NOT NULL,
  `related_entity` varchar(80) DEFAULT NULL,
  `related_entity_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `expires_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `student_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_notifications_uuid_key` (`uuid`),
  UNIQUE KEY `student_notifications_lifecycle_unique` (`student_id`,`related_entity`,`related_entity_id`),
  KEY `student_notifications_organization_id_type_idx` (`organization_id`,`type`),
  KEY `student_notifications_created_at_idx` (`created_at`),
  KEY `student_notifications_student_id_is_read_idx` (`student_id`,`is_read`),
  CONSTRAINT `student_notifications_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_notifications_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `student_id` int(11) NOT NULL,
  `timezone` varchar(64) NOT NULL DEFAULT 'Asia/Kolkata',
  `language` varchar(20) NOT NULL DEFAULT 'en',
  `in_app_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `email_notifications` tinyint(1) NOT NULL DEFAULT 0,
  `exam_reminders` tinyint(1) NOT NULL DEFAULT 1,
  `resource_updates` tinyint(1) NOT NULL DEFAULT 1,
  `announcement_notifications` tinyint(1) NOT NULL DEFAULT 1,
  `security_alerts` tinyint(1) NOT NULL DEFAULT 1,
  `exam_reminder_offsets_minutes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`exam_reminder_offsets_minutes`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_preferences_uuid_key` (`uuid`),
  UNIQUE KEY `student_preferences_student_id_unique` (`student_id`),
  CONSTRAINT `student_preferences_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `student_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `date_of_birth` datetime(3) DEFAULT NULL,
  `gender` varchar(30) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `alternate_phone` varchar(30) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `guardian_name` varchar(150) DEFAULT NULL,
  `guardian_phone` varchar(30) DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(30) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `avatar_object_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_profiles_uuid_key` (`uuid`),
  UNIQUE KEY `student_profiles_student_id_unique` (`student_id`),
  UNIQUE KEY `student_profiles_avatar_object_id_unique` (`avatar_object_id`),
  CONSTRAINT `student_profiles_avatar_object_id_fkey` FOREIGN KEY (`avatar_object_id`) REFERENCES `stored_objects` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_profiles_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_resource_activity_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_resource_activity_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `user_activity_session_id` int(11) DEFAULT NULL,
  `session_course_id` int(11) DEFAULT NULL,
  `folder_id` int(11) DEFAULT NULL,
  `resource_id` int(11) DEFAULT NULL,
  `resource_title_snapshot` varchar(200) NOT NULL,
  `resource_type_code_snapshot` varchar(30) NOT NULL,
  `course_name_snapshot` varchar(200) DEFAULT NULL,
  `folder_name_snapshot` varchar(150) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_heartbeat_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ended_at` datetime(3) DEFAULT NULL,
  `active_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `idle_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `end_reason` enum('CLOSED','NAVIGATED_AWAY','IDLE_TIMEOUT','COMPLETED','DISCONNECTED','UNKNOWN') DEFAULT NULL,
  `start_position_seconds` int(11) DEFAULT NULL,
  `final_position_seconds` int(11) DEFAULT NULL,
  `max_position_seconds` int(11) DEFAULT NULL,
  `last_document_page` int(11) DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `source` enum('LIVE','LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_resource_activity_sessions_uuid_key` (`uuid`),
  KEY `student_resource_sessions_scope_student_started_idx` (`organization_id`,`student_id`,`started_at`),
  KEY `student_resource_sessions_student_resource_started_idx` (`student_id`,`resource_id`,`started_at`),
  KEY `student_resource_sessions_course_student_started_idx` (`session_course_id`,`student_id`,`started_at`),
  KEY `student_resource_sessions_auth_started_idx` (`user_activity_session_id`,`started_at`),
  KEY `student_resource_sessions_open_heartbeat_idx` (`ended_at`,`last_heartbeat_at`),
  KEY `student_resource_sessions_folder_id_fkey` (`folder_id`),
  KEY `student_resource_sessions_resource_id_fkey` (`resource_id`),
  CONSTRAINT `student_resource_sessions_auth_id_fkey` FOREIGN KEY (`user_activity_session_id`) REFERENCES `user_activity_sessions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_resource_sessions_course_id_fkey` FOREIGN KEY (`session_course_id`) REFERENCES `session_courses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_resource_sessions_folder_id_fkey` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_resource_sessions_org_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `student_resource_sessions_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `student_resource_sessions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_video_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_video_progress` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `current_position_seconds` int(11) NOT NULL DEFAULT 0,
  `watched_percentage` int(11) NOT NULL DEFAULT 0,
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_video_progress_student_id_resource_id_unique` (`student_id`,`resource_id`),
  KEY `student_video_progress_resource_id_idx` (`resource_id`),
  CONSTRAINT `student_video_progress_resource_id_fkey` FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `student_video_progress_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `user_id` int(11) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `student_code` varchar(50) NOT NULL,
  `admission_number` varchar(50) DEFAULT NULL,
  `roll_number` varchar(50) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','ALUMNI','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_uuid_key` (`uuid`),
  UNIQUE KEY `students_user_id_unique` (`user_id`),
  UNIQUE KEY `students_student_code_unique` (`student_code`),
  UNIQUE KEY `students_admission_number_unique` (`admission_number`),
  UNIQUE KEY `students_organization_id_roll_number_unique` (`organization_id`,`roll_number`),
  KEY `students_organization_id_idx` (`organization_id`),
  KEY `students_status_is_active_idx` (`status`,`is_active`),
  CONSTRAINT `students_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `students_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `code` varchar(40) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subjects_uuid_key` (`uuid`),
  UNIQUE KEY `subjects_organization_id_code_unique` (`organization_id`,`code`),
  UNIQUE KEY `subjects_organization_id_name_unique` (`organization_id`,`name`),
  KEY `subjects_organization_id_is_active_idx` (`organization_id`,`is_active`),
  CONSTRAINT `subjects_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) NOT NULL,
  `subject_id` int(11) NOT NULL,
  `code` varchar(60) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `topics_uuid_key` (`uuid`),
  UNIQUE KEY `topics_subject_id_code_unique` (`subject_id`,`code`),
  UNIQUE KEY `topics_subject_id_name_unique` (`subject_id`,`name`),
  KEY `topics_scope_subject_active_idx` (`organization_id`,`subject_id`,`is_active`),
  CONSTRAINT `topics_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `topics_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_activity_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_activity_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `student_id` int(11) DEFAULT NULL,
  `login_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `last_seen_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ended_at` datetime(3) DEFAULT NULL,
  `elapsed_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `active_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `idle_duration_seconds` int(11) NOT NULL DEFAULT 0,
  `end_reason` enum('MANUAL_LOGOUT','IDLE_TIMEOUT','TOKEN_EXPIRED','FORCED_LOGOUT','ACCOUNT_DISABLED','DISCONNECTED','UNKNOWN') DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `device_type` enum('DESKTOP','MOBILE','TABLET','BOT','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
  `browser` varchar(100) DEFAULT NULL,
  `operating_system` varchar(100) DEFAULT NULL,
  `source` enum('LIVE','LEGACY_APPROXIMATE') NOT NULL DEFAULT 'LIVE',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_activity_sessions_uuid_key` (`uuid`),
  KEY `user_activity_sessions_organization_login_idx` (`organization_id`,`login_at`),
  KEY `user_activity_sessions_student_login_idx` (`student_id`,`login_at`),
  KEY `user_activity_sessions_user_login_idx` (`user_id`,`login_at`),
  KEY `user_activity_sessions_open_last_seen_idx` (`ended_at`,`last_seen_at`),
  CONSTRAINT `user_activity_sessions_org_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_activity_sessions_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `user_activity_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_roles_user_id_role_id_organization_id_unique` (`user_id`,`role_id`,`organization_id`),
  KEY `user_roles_user_id_idx` (`user_id`),
  KEY `user_roles_role_id_idx` (`role_id`),
  KEY `user_roles_organization_id_idx` (`organization_id`),
  CONSTRAINT `user_roles_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_roles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(191) NOT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_uuid_key` (`uuid`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_phone_unique` (`phone`),
  KEY `users_organization_id_idx` (`organization_id`),
  KEY `users_status_idx` (`status`),
  CONSTRAINT `users_organization_id_fkey` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
