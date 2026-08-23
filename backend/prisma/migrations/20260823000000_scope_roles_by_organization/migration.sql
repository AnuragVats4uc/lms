ALTER TABLE `roles`
  ADD COLUMN `organization_id` INT NULL,
  ADD COLUMN `scope` VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
  ADD COLUMN `is_system` BOOLEAN NOT NULL DEFAULT false;

UPDATE `roles`
SET `is_system` = true
WHERE `code` IN ('SUPER_ADMIN', 'ADMIN', 'STUDENT');

ALTER TABLE `roles`
  DROP INDEX `roles_name_unique`,
  DROP INDEX `roles_code_unique`;

ALTER TABLE `roles`
  ADD CONSTRAINT `roles_organization_id_fkey`
    FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX `roles_scope_name_unique` ON `roles`(`scope`, `name`);
CREATE UNIQUE INDEX `roles_scope_code_unique` ON `roles`(`scope`, `code`);
CREATE INDEX `roles_organization_id_idx` ON `roles`(`organization_id`);

INSERT INTO `permissions` (`module`, `action`, `key`, `description`, `created_at`, `updated_at`)
VALUES
  ('users', 'create', 'users.create', 'Allows create access for users', NOW(), NOW()),
  ('users', 'read', 'users.read', 'Allows read access for users', NOW(), NOW()),
  ('users', 'update', 'users.update', 'Allows update access for users', NOW(), NOW()),
  ('users', 'delete', 'users.delete', 'Allows delete access for users', NOW(), NOW())
ON DUPLICATE KEY UPDATE
  `description` = VALUES(`description`),
  `updated_at` = NOW();

INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`, `created_at`)
SELECT `roles`.`id`, `permissions`.`id`, NOW()
FROM `roles`
JOIN `permissions`
WHERE `roles`.`scope` = 'GLOBAL'
  AND `roles`.`code` = 'ADMIN'
  AND (
    `permissions`.`key` LIKE 'users.%'
    OR `permissions`.`key` LIKE 'roles.%'
    OR `permissions`.`key` = 'permissions.read'
  );
