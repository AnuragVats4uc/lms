-- Difficulty is versioned with question content so published exam history stays stable.
-- Existing questions and staged imports are conservatively classified as MEDIUM.
ALTER TABLE `question_versions`
  ADD COLUMN `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM';

ALTER TABLE `exam_import_rows`
  ADD COLUMN `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL DEFAULT 'MEDIUM';
