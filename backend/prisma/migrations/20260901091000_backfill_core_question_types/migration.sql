-- Ensure the three core question types exist in databases where the lookup
-- table was created but its original seed rows were not preserved.
INSERT INTO `question_types`
    (`id`, `code`, `name`, `description`, `is_active`, `created_at`, `updated_at`)
VALUES
    (1, 'SINGLE_CHOICE', 'Single Answer', 'Options are provided and exactly one option is correct.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (2, 'NUMERIC', 'Numeric Answer', 'A numeric response is evaluated with an optional tolerance.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
    (3, 'ONE_WORD', 'One Word Answer', 'A text response is matched against one or more accepted answers.', true, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3))
ON DUPLICATE KEY UPDATE
    `name` = VALUES(`name`),
    `description` = VALUES(`description`),
    `is_active` = VALUES(`is_active`),
    `updated_at` = CURRENT_TIMESTAMP(3);
