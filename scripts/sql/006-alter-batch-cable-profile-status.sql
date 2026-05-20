-- batch_cable_profiles.status: boolean -> tinyint (0 pending, 1 in-progress, 2 completed)
-- mysql ... hfcl_db < scripts/sql/006-alter-batch-cable-profile-status.sql

ALTER TABLE `batch_cable_profiles`
  MODIFY COLUMN `status` tinyint NOT NULL DEFAULT 0 COMMENT '0=pending, 1=in-progress, 2=completed';

-- Existing boolean true (1) stays in-progress; false (0) stays pending
UPDATE `batch_cable_profiles`
SET `status` = 2
WHERE `status` NOT IN (0, 1, 2);
