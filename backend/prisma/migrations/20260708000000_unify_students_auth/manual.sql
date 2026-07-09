ALTER TABLE `students`
  ADD COLUMN `email` VARCHAR(255) NULL,
  ADD COLUMN `mobile` VARCHAR(255) NULL,
  ADD COLUMN `password` VARCHAR(255) NULL,
  ADD COLUMN `first_name` VARCHAR(255) NULL,
  ADD COLUMN `last_name` VARCHAR(255) NULL,
  ADD COLUMN `role` ENUM('STUDENT', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
  ADD COLUMN `auth_status` ENUM('ACTIVE', 'INACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN `last_login_at` DATETIME(3) NULL,
  ADD UNIQUE INDEX `students_email_unique` (`email`),
  ADD UNIQUE INDEX `students_mobile_unique` (`mobile`);

CREATE TABLE IF NOT EXISTS `StudentProfile` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` BIGINT UNSIGNED NOT NULL,
  `profileImage` VARCHAR(191) NULL,
  `dateOfBirth` DATETIME(3) NULL,
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
  `fatherName` VARCHAR(191) NULL,
  `motherName` VARCHAR(191) NULL,
  `alternateMobile` VARCHAR(191) NULL,
  `addressLine1` VARCHAR(191) NULL,
  `addressLine2` VARCHAR(191) NULL,
  `city` VARCHAR(191) NULL,
  `state` VARCHAR(191) NULL,
  `country` VARCHAR(191) NULL,
  `pincode` VARCHAR(191) NULL,
  `schoolName` VARCHAR(191) NULL,
  `remarks` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `StudentProfile_studentId_key` (`studentId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `StudentProfile_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RefreshToken` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `studentId` BIGINT UNSIGNED NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `RefreshToken_token_key` (`token`),
  INDEX `RefreshToken_studentId_idx` (`studentId`),
  PRIMARY KEY (`id`),
  CONSTRAINT `RefreshToken_studentId_fkey`
    FOREIGN KEY (`studentId`) REFERENCES `students`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
