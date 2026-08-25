ALTER TABLE `exam_templates`
    ADD COLUMN `primary_subject_id` INTEGER NULL;

ALTER TABLE `exam_template_versions`
    ADD COLUMN `default_attempt_limit` INTEGER NOT NULL DEFAULT 1;

CREATE INDEX `exam_templates_primary_subject_idx` ON `exam_templates`(`primary_subject_id`);

ALTER TABLE `exam_templates`
    ADD CONSTRAINT `exam_templates_primary_subject_id_fkey`
    FOREIGN KEY (`primary_subject_id`) REFERENCES `subjects`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
