-- Batch session verification by an admin / plant supervisor (when TypeORM synchronize is disabled).
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/010-add-verification-to-batch-cable-profiles.sql

ALTER TABLE `batch_cable_profiles`
  ADD COLUMN `verified_by_id` int DEFAULT NULL,
  ADD COLUMN `verified_at` datetime DEFAULT NULL,
  ADD KEY `IDX_28aa59c52efec9fc8c888ef50d` (`verified_by_id`),
  ADD CONSTRAINT `FK_28aa59c52efec9fc8c888ef50d3` FOREIGN KEY (`verified_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
