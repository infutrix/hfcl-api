-- Add testing_counter to batch_fiber_testing (when TypeORM synchronize is disabled).
-- mysql ... hfcl_db < scripts/sql/004-add-testing-counter-to-batch-fiber-testing.sql

ALTER TABLE `batch_fiber_testing`
  ADD COLUMN `testing_counter` int DEFAULT 0 NULL AFTER `fiber_number`;
