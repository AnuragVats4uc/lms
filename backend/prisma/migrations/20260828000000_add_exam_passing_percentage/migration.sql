-- Nullable so existing exams are reported as having no configured pass rule.
ALTER TABLE `exams`
  ADD COLUMN `passing_percentage` DECIMAL(5, 2) NULL;
