CREATE TABLE `student_course_interests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(191) NOT NULL,
    `student_id` INTEGER NOT NULL,
    `session_course_id` INTEGER NOT NULL,
    `registration_page_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_course_interests_uuid_key`(`uuid`),
    UNIQUE INDEX `student_course_interests_student_course_unique`(`student_id`, `session_course_id`),
    INDEX `student_course_interests_session_course_id_idx`(`session_course_id`),
    INDEX `student_course_interests_registration_page_id_idx`(`registration_page_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_course_interests`
    ADD CONSTRAINT `student_course_interests_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `student_course_interests_session_course_id_fkey`
    FOREIGN KEY (`session_course_id`) REFERENCES `session_courses`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `student_course_interests_registration_page_id_fkey`
    FOREIGN KEY (`registration_page_id`) REFERENCES `organization_registration_pages`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
