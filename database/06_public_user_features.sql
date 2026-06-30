-- Public user features for Student Services Map.
-- Run this after the original table setup and U-Belt seed.

BEGIN;

ALTER TABLE establishment
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS district VARCHAR(120) DEFAULT 'University Belt, Manila',
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'needs_field_verification',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_establishment_type ON establishment(type);
CREATE INDEX IF NOT EXISTS idx_establishment_coordinates ON establishment(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_establishment_district ON establishment(district);

COMMIT;
