ALTER TABLE `student_notifications`
    ADD UNIQUE INDEX `student_notifications_lifecycle_unique`(
        `student_id`,
        `related_entity`,
        `related_entity_id`
    );
