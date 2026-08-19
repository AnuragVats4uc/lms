-- Normalize legacy resource rows before removing deprecated enum values.
UPDATE `resources`
SET `type` = 'DOCUMENT'
WHERE `type` IN ('NOTES', 'ASSIGNMENT');

ALTER TABLE `resources`
  MODIFY `type` ENUM('DOCUMENT', 'VIDEO', 'EXAM') NOT NULL;
