-- U-Belt contact verification worksheet.
-- Run this after ubelt_postgresql_seed.sql.
--
-- Do not place guessed phone numbers here. Only use numbers from a source
-- you can defend: official shop signage, official social page, direct call,
-- or owner/staff confirmation.

BEGIN;

ALTER TABLE establishment
  ADD COLUMN IF NOT EXISTS contact_source VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by VARCHAR(120);

-- Mark U-Belt seed rows as needing field verification while contact numbers
-- are still missing.
UPDATE establishment
SET verification_status = 'needs_field_verification',
    data_notes = COALESCE(data_notes, '') || ' Contact number not yet publicly verified.'
WHERE district = 'University Belt, Manila'
  AND contact_number IS NULL;

-- Template: copy one block per establishment after you verify a real number.
-- UPDATE establishment
-- SET contact_number = '09XXXXXXXXX',
--     contact_source = 'Official Facebook page / storefront signage / direct call',
--     contact_verified_at = CURRENT_TIMESTAMP,
--     verified_by = 'Your name',
--     verification_status = 'manually_verified'
-- WHERE name = 'Exact establishment name'
--   AND district = 'University Belt, Manila';

COMMIT;

-- Review pending contacts:
-- SELECT store_id, name, type, address, contact_number, verification_status, contact_source
-- FROM establishment
-- WHERE district = 'University Belt, Manila'
-- ORDER BY type, name;
