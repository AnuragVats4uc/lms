ALTER TABLE `student_dashboard_banners`
  ADD CONSTRAINT `student_dashboard_banners_organization_id_fkey`
  FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `student_dashboard_banner_sessions`
  ADD CONSTRAINT `student_dashboard_banner_sessions_banner_id_fkey`
  FOREIGN KEY (`banner_id`) REFERENCES `student_dashboard_banners`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `student_dashboard_banner_sessions_session_id_fkey`
  FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
