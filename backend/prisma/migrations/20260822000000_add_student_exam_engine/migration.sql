-- Extend published question behavior for controlled Student answer input.
ALTER TABLE `question_versions`
    ADD COLUMN `virtual_keyboard_mode` ENUM('NONE', 'NUMERIC', 'ALPHANUMERIC') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `allow_physical_keyboard` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `allow_paste` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `max_answer_length` INTEGER NULL;

-- Overall Exam time is always authoritative; these flags enable child timers.
ALTER TABLE `exam_template_versions`
    ADD COLUMN `enforce_slot_timers` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `enforce_section_timers` BOOLEAN NOT NULL DEFAULT false;

-- Operational policies belong to the scheduled Exam instance.
ALTER TABLE `exams`
    ADD COLUMN `allow_resume` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `result_release_mode` ENUM('IMMEDIATE', 'SCHEDULED', 'MANUAL') NOT NULL DEFAULT 'IMMEDIATE',
  ADD COLUMN `results_released_at` DATETIME(3) NULL,
    ADD COLUMN `show_score` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `show_correct_answers` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `show_explanations` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `show_question_review` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `student_exam_attempts`
    ADD COLUMN `last_saved_at` DATETIME(3) NULL,
    ADD COLUMN `evaluated_at` DATETIME(3) NULL,
    ADD COLUMN `configuration_snapshot` JSON NULL;

ALTER TABLE `student_exam_slot_attempts`
    ADD COLUMN `completion_reason` VARCHAR(40) NULL;

ALTER TABLE `student_exam_section_attempts`
    ADD COLUMN `completion_reason` VARCHAR(40) NULL;

-- Stable per-attempt question state preserves randomization, palette state,
-- review flags, and question-wise time across refresh and Resume.
CREATE TABLE `student_exam_attempt_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `student_exam_attempt_id` INTEGER NOT NULL,
    `student_exam_slot_attempt_id` INTEGER NOT NULL,
    `student_exam_section_attempt_id` INTEGER NOT NULL,
    `exam_template_question_id` INTEGER NOT NULL,
    `question_order` INTEGER NOT NULL,
    `option_order` JSON NULL,
    `visited_at` DATETIME(3) NULL,
    `last_viewed_at` DATETIME(3) NULL,
    `marked_for_review` BOOLEAN NOT NULL DEFAULT false,
    `time_spent_seconds` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `student_exam_attempt_questions_attempt_question_unique`(`student_exam_attempt_id`, `exam_template_question_id`),
    UNIQUE INDEX `student_exam_attempt_questions_attempt_order_unique`(`student_exam_attempt_id`, `question_order`),
    INDEX `student_exam_attempt_questions_section_order_idx`(`student_exam_section_attempt_id`, `question_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `student_exam_attempt_questions`
    ADD CONSTRAINT `student_exam_attempt_questions_attempt_id_fkey`
    FOREIGN KEY (`student_exam_attempt_id`) REFERENCES `student_exam_attempts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_exam_attempt_questions`
    ADD CONSTRAINT `student_exam_attempt_questions_slot_attempt_id_fkey`
    FOREIGN KEY (`student_exam_slot_attempt_id`) REFERENCES `student_exam_slot_attempts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_exam_attempt_questions`
    ADD CONSTRAINT `student_exam_attempt_questions_section_attempt_id_fkey`
    FOREIGN KEY (`student_exam_section_attempt_id`) REFERENCES `student_exam_section_attempts`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_exam_attempt_questions`
    ADD CONSTRAINT `student_exam_attempt_questions_template_question_id_fkey`
    FOREIGN KEY (`exam_template_question_id`) REFERENCES `exam_template_questions`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
