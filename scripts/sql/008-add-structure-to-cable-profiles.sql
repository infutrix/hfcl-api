-- cable_profiles.structure: admin-defined fiber layout/colors (when TypeORM synchronize is disabled).
-- NULL keeps using the built-in template matching profile_key_value (cable-profile-colors.data.json).
-- mysql -h ... -u ... -p hfcl_db < scripts/sql/008-add-structure-to-cable-profiles.sql

ALTER TABLE `cable_profiles`
  ADD COLUMN `structure` json DEFAULT NULL AFTER `profile_key_value`;
