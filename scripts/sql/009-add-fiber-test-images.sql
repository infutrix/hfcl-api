-- Fiber test photos + linking AI responses to their test (when TypeORM synchronize is disabled).
-- Image files live on disk under FIBER_TEST_IMAGE_DIR; image_path is relative to it.
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/009-add-fiber-test-images.sql

ALTER TABLE `fiber_test_events`
  ADD COLUMN `image_path` varchar(255) DEFAULT NULL,
  ADD COLUMN `image_mime_type` varchar(50) DEFAULT NULL;

ALTER TABLE `fiber_testing_ai_response`
  ADD COLUMN `fiber_test_event_id` int DEFAULT NULL AFTER `batch_fiber_testing_id`,
  ADD KEY `IDX_fiber_testing_ai_response_fiber_test_event_id` (`fiber_test_event_id`),
  ADD CONSTRAINT `FK_fiber_testing_ai_response_fiber_test_event` FOREIGN KEY (`fiber_test_event_id`) REFERENCES `fiber_test_events` (`id`) ON DELETE SET NULL;
