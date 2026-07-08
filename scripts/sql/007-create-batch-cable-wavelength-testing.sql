-- batch_cable_wavelength_testing (when TypeORM synchronize is disabled).
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/007-create-batch-cable-wavelength-testing.sql

CREATE TABLE IF NOT EXISTS `batch_cable_wavelength_testing` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_cable_profile_id` int NOT NULL,
  `ior_value_in_nm` decimal(10,4) DEFAULT NULL,
  `fiber_value` decimal(10,4) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UQ_batch_cable_wavelength_testing_profile_ior` (`batch_cable_profile_id`, `ior_value_in_nm`),
  KEY `IDX_batch_cable_wavelength_testing_batch_cable_profile_id` (`batch_cable_profile_id`),
  CONSTRAINT `FK_batch_cable_wavelength_testing_batch_cable_profile` FOREIGN KEY (`batch_cable_profile_id`) REFERENCES `batch_cable_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
