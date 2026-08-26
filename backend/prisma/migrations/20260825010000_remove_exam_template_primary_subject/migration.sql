ALTER TABLE `exam_templates`
    DROP FOREIGN KEY `exam_templates_primary_subject_id_fkey`;

DROP INDEX `exam_templates_primary_subject_idx` ON `exam_templates`;

ALTER TABLE `exam_templates`
    DROP COLUMN `primary_subject_id`;
