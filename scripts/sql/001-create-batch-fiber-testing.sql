-- Run against hfcl_db (or your DB_NAME) when TypeORM synchronize is disabled (e.g. NODE_ENV=production).
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/001-create-batch-fiber-testing.sql

CREATE TABLE IF NOT EXISTS `batch_fiber_testing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_cable_profile_id` int DEFAULT NULL,
  `fiber_number` int DEFAULT NULL,
  `attribute1_name` varchar(255) DEFAULT NULL,
  `attribute1_value` varchar(255) DEFAULT NULL,
  `attribute2_name` varchar(255) DEFAULT NULL,
  `attribute2_value` varchar(255) DEFAULT NULL,
  `attribute3_name` varchar(255) DEFAULT NULL,
  `attribute3_value` varchar(255) DEFAULT NULL,
  `fiber_wavelengths` json DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_batch_fiber_testing_batch_cable_profile_id` (`batch_cable_profile_id`),
  CONSTRAINT `FK_batch_fiber_testing_batch_cable_profile` FOREIGN KEY (`batch_cable_profile_id`) REFERENCES `batch_cable_profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
