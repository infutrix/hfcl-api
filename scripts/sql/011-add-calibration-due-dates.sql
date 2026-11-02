-- Calibration due dates for OTDR devices and vernier calipers, and soft delete for verniers
-- (when TypeORM synchronize is disabled).
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/011-add-calibration-due-dates.sql

ALTER TABLE `otdr_devices`
  ADD COLUMN `calibration_due_date` date DEFAULT NULL;

ALTER TABLE `vernier_nos`
  ADD COLUMN `calibration_due_date` date DEFAULT NULL,
  ADD COLUMN `deleted` tinyint NOT NULL DEFAULT 0;
