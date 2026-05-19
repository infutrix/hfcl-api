-- fiber_testing_ai_response (when TypeORM synchronize is disabled).
-- mysql ... hfcl_db < scripts/sql/005-create-fiber-testing-ai-response.sql

CREATE TABLE IF NOT EXISTS `fiber_testing_ai_response` (
  `id` int NOT NULL AUTO_INCREMENT,
  `batch_cable_profile_id` int DEFAULT NULL,
  `batch_fiber_testing_id` int DEFAULT NULL,
  `ai_response` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `IDX_fiber_testing_ai_response_batch_cable_profile_id` (`batch_cable_profile_id`),
  KEY `IDX_fiber_testing_ai_response_batch_fiber_testing_id` (`batch_fiber_testing_id`),
  CONSTRAINT `FK_fiber_testing_ai_response_batch_cable_profile` FOREIGN KEY (`batch_cable_profile_id`) REFERENCES `batch_cable_profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `FK_fiber_testing_ai_response_batch_fiber_testing` FOREIGN KEY (`batch_fiber_testing_id`) REFERENCES `batch_fiber_testing` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
