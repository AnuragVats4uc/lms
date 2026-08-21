-- Store a destination-aware digest of the Word/Excel pair. The nullable
-- column preserves historical import jobs while making all new imports
-- idempotent, including concurrent submissions.
ALTER TABLE `exam_import_jobs`
    ADD COLUMN `import_fingerprint` VARCHAR(64) NULL,
    ADD UNIQUE INDEX `exam_import_jobs_import_fingerprint_key`(`import_fingerprint`);
