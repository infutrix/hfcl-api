-- Fix global UNIQUE on `wavelength` (duplicate 0 across rows) → backfill nm → composite unique per profile.
-- Run only if you hit ER_DUP_ENTRY on ADD UNIQUE INDEX (`wavelength`).
-- mysql ... hfcl_db < scripts/sql/003-fix-cable-profile-wavelength-config-wavelength.sql

-- 1) Drop the old single-column unique index (name from your error; verify with SHOW INDEX FROM cable_profile_wavelength_configs;)
ALTER TABLE `cable_profile_wavelength_configs`
  DROP INDEX `IDX_5e1fd94b6d122d6bc1561efe8e`;

-- 2) Backfill denormalized nm from master table
UPDATE `cable_profile_wavelength_configs` cpwc
INNER JOIN `cable_wavelengths` cw ON cw.id = cpwc.cable_wavelength_id
SET cpwc.wavelength = cw.value
WHERE cpwc.wavelength = 0 OR cpwc.wavelength IS NULL;

-- 3) Optional: remove duplicate (cable_profile_id, wavelength) rows keeping smallest id before step 4
-- 4) Composite: one row per profile per wavelength (nm)
ALTER TABLE `cable_profile_wavelength_configs`
  ADD UNIQUE INDEX `UQ_cpwc_profile_wavelength` (`cable_profile_id`, `wavelength`);
