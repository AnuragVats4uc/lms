-- Create the system-managed question difficulty lookup table.
-- Existing question difficulty enum columns remain unchanged until application
-- support is migrated to use this lookup in a later release.
CREATE TABLE `question_difficulties` (
    `id` INTEGER NOT NULL,
    `code` VARCHAR(40) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `question_difficulties_code_key`(`code`),
    UNIQUE INDEX `question_difficulties_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `question_difficulties`
    (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
    (1, 'EASY', 'Easy', 'Questions intended to have a low difficulty level.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (2, 'MEDIUM', 'Medium', 'Questions intended to have a moderate difficulty level.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (3, 'HARD', 'Hard', 'Questions intended to have a high difficulty level.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

-- Stage the two new question types without exposing them to production users.
-- They will be activated after backend, admin, student, grading, and reporting
-- support is deployed.
INSERT INTO `question_types`
    (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
    (4, 'MULTIPLE_CHOICE', 'Multiple Answer', 'Options are provided and one or more options may be correct.', false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (5, 'SUBJECTIVE', 'Subjective Answer', 'A long-form text response is evaluated manually.', false, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
