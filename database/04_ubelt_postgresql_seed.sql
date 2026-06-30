-- Student Services Map: U-Belt PostgreSQL upgrade + seed data
-- Scope: University Belt core, Manila
-- BBox used for initial public-map seed candidates:
-- south=14.596, west=120.984, north=14.612, east=120.997
--
-- Source: OpenStreetMap / Overpass API, queried 2026-06-30.
-- License note: OpenStreetMap data is ODbL. Keep attribution in the app.
-- Treat these records as seed candidates. Verify hours, phone numbers,
-- availability, and services manually before public launch.

BEGIN;

ALTER TABLE establishment
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS district VARCHAR(120) DEFAULT 'University Belt, Manila',
  ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'osm_candidate',
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source_name VARCHAR(80),
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_license VARCHAR(80),
  ADD COLUMN IF NOT EXISTS osm_type VARCHAR(20),
  ADD COLUMN IF NOT EXISTS osm_id BIGINT,
  ADD COLUMN IF NOT EXISTS data_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_establishment_type ON establishment(type);
CREATE INDEX IF NOT EXISTS idx_establishment_coordinates ON establishment(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_establishment_district ON establishment(district);
CREATE UNIQUE INDEX IF NOT EXISTS idx_establishment_osm_unique
  ON establishment(osm_type, osm_id)
  WHERE osm_type IS NOT NULL AND osm_id IS NOT NULL;

-- Optional helper table for frontend map bounds and backend bbox defaults.
CREATE TABLE IF NOT EXISTS service_area (
  area_id SERIAL PRIMARY KEY,
  slug VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  south NUMERIC(10, 7) NOT NULL,
  west NUMERIC(10, 7) NOT NULL,
  north NUMERIC(10, 7) NOT NULL,
  east NUMERIC(10, 7) NOT NULL,
  center_latitude NUMERIC(10, 7) NOT NULL,
  center_longitude NUMERIC(10, 7) NOT NULL,
  default_zoom INTEGER NOT NULL DEFAULT 16,
  notes TEXT
);

INSERT INTO service_area (
  slug, name, south, west, north, east, center_latitude, center_longitude, default_zoom, notes
)
VALUES (
  'ubelt-core',
  'University Belt Core, Manila',
  14.5960000,
  120.9840000,
  14.6120000,
  120.9970000,
  14.6039000,
  120.9888000,
  16,
  'Core area around Recto, Legarda, Morayta/Nicanor Reyes, Espana, P. Paredes, S.H. Loyola, and nearby campus streets.'
)
ON CONFLICT (slug) DO UPDATE SET
  south = EXCLUDED.south,
  west = EXCLUDED.west,
  north = EXCLUDED.north,
  east = EXCLUDED.east,
  center_latitude = EXCLUDED.center_latitude,
  center_longitude = EXCLUDED.center_longitude,
  default_zoom = EXCLUDED.default_zoom,
  notes = EXCLUDED.notes;

-- Insert U-Belt establishments. Existing rows with the same OSM object are skipped.
INSERT INTO establishment (
  name, type, address, contact_number, operating_hours, price_range, description,
  latitude, longitude, district, availability_status, verification_status, verified_at,
  source_name, source_url, source_license, osm_type, osm_id, data_notes
)
SELECT *
FROM (
  VALUES
    (
      'Nitz Printing Service Center',
      'Printing & Binding',
      'U-Belt area near Nicanor Reyes / P. Paredes, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Copy/printing service candidate from OpenStreetMap.',
      14.6049099,
      120.9869750,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598081678',
      'ODbL',
      'node',
      3598081678,
      'Verify exact address, services, pricing, contact number, and hours before public launch.'
    ),
    (
      'Nitz Quick Print and copy Systems',
      'Printing & Binding',
      'U-Belt area near Nicanor Reyes / P. Paredes, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Quick print/copy service candidate from OpenStreetMap.',
      14.6048185,
      120.9870631,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3600132441',
      'ODbL',
      'node',
      3600132441,
      'Verify exact address, services, pricing, contact number, and hours before public launch.'
    ),
    (
      'Piso Print',
      'Printing & Binding',
      'Dalupan Street area, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Printing service candidate from OpenStreetMap.',
      14.6028019,
      120.9905622,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3600640411',
      'ODbL',
      'node',
      3600640411,
      'Verify exact address, services, pricing, contact number, and hours before public launch.'
    ),
    (
      'C.J. Clemente Trading',
      'Printing & Binding',
      'Manila, Metro Manila',
      NULL,
      'To verify',
      'To verify',
      'Copyshop candidate from OpenStreetMap.',
      14.6024112,
      120.9858794,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/1974746065',
      'ODbL',
      'node',
      1974746065,
      'Verify whether this is still active and student-relevant before public launch.'
    ),
    (
      'Dragon Computer Shop',
      'Computer Shop',
      'Nicanor Reyes Street, Sampaloc, Manila',
      NULL,
      '24/7',
      'To verify',
      'Internet cafe/computer shop candidate from OpenStreetMap.',
      14.6036590,
      120.9876907,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598009999',
      'ODbL',
      'node',
      3598009999,
      'OSM lists opening_hours as 24/7. Verify before showing as live hours.'
    ),
    (
      'E-NET Gaming cafe',
      'Computer Shop',
      'U-Belt area, Sampaloc, Manila',
      NULL,
      '24/7',
      'To verify',
      'Internet cafe/gaming cafe candidate from OpenStreetMap.',
      14.6037945,
      120.9880386,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3308698608',
      'ODbL',
      'node',
      3308698608,
      'OSM lists opening_hours as 24/7. Verify before showing as live hours.'
    ),
    (
      'Green Alley Computer Shop',
      'Computer Shop',
      'U-Belt area, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Internet cafe/computer shop candidate from OpenStreetMap.',
      14.6047954,
      120.9896089,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598037610',
      'ODbL',
      'node',
      3598037610,
      'Verify exact services, units, pricing, contact number, and hours before public launch.'
    ),
    (
      'The Net.Com',
      'Computer Shop',
      'S. H. Loyola Street, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Internet cafe/computer shop candidate from OpenStreetMap.',
      14.6035135,
      120.9889575,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598038655',
      'ODbL',
      'node',
      3598038655,
      'Verify exact services, units, pricing, contact number, and hours before public launch.'
    ),
    (
      'Photoprints',
      'Computer Shop',
      'U-Belt area, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Internet cafe candidate from OpenStreetMap. Name suggests photo/print services; verify category.',
      14.6037177,
      120.9881068,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598038095',
      'ODbL',
      'node',
      3598038095,
      'Category is uncertain. Verify whether this belongs under Computer Shop or Printing & Binding.'
    ),
    (
      'Jhona Mae',
      'Computer Shop',
      'U-Belt area, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Internet cafe candidate from OpenStreetMap.',
      14.6032588,
      120.9887733,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3601536679',
      'ODbL',
      'node',
      3601536679,
      'Verify exact services, units, pricing, contact number, and hours before public launch.'
    ),
    (
      'Madbrews',
      'Study Hub',
      'P. Paredes Street, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Cafe candidate that may be useful as a student study place; verify if studying is allowed.',
      14.6050321,
      120.9880880,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3598009757',
      'ODbL',
      'node',
      3598009757,
      'Verify Wi-Fi, outlet availability, study policy, seating, and hours.'
    ),
    (
      'It''s Caffeine',
      'Study Hub',
      'Nicanor Reyes Street, Sampaloc, Manila',
      NULL,
      'Mo-Fr 08:00-24:00, Sa 08:30-24:00, Su 09:30-23:00',
      'To verify',
      'Cafe candidate that may be useful as a student study place; verify if studying is allowed.',
      14.6044866,
      120.9878943,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3601536646',
      'ODbL',
      'node',
      3601536646,
      'OSM lists opening_hours. Verify Wi-Fi, outlet availability, study policy, seating, and hours.'
    ),
    (
      'TAMbayan',
      'Study Hub',
      'U-Belt area, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Cafe candidate that may be useful as a student study place; verify if studying is allowed.',
      14.6037970,
      120.9882679,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3595628517',
      'ODbL',
      'node',
      3595628517,
      'Verify Wi-Fi, outlet availability, study policy, seating, and hours.'
    ),
    (
      'Frappeetea',
      'Study Hub',
      'Dalupan Street, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Cafe candidate that may be useful as a student study place; verify if studying is allowed.',
      14.6032770,
      120.9902573,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3600128380',
      'ODbL',
      'node',
      3600128380,
      'Verify Wi-Fi, outlet availability, study policy, seating, and hours.'
    ),
    (
      'Ladies Dorm',
      'Dormitory',
      'U-Belt area near Nicanor Reyes / P. Paredes, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Dorm/hostel candidate from OpenStreetMap.',
      14.6048600,
      120.9870087,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3600132439',
      'ODbL',
      'node',
      3600132439,
      'Verify exact name, student eligibility, vacancies, rates, contact number, and rules.'
    ),
    (
      'Ria''s Ladies Dorm',
      'Dormitory',
      'U-Belt area near Nicanor Reyes / P. Paredes, Sampaloc, Manila',
      NULL,
      'To verify',
      'To verify',
      'Dorm/hostel candidate from OpenStreetMap.',
      14.6047739,
      120.9862357,
      'University Belt, Manila',
      'Unknown',
      'osm_candidate',
      '2026-06-30 00:00:00+08',
      'OpenStreetMap',
      'https://www.openstreetmap.org/node/3600132442',
      'ODbL',
      'node',
      3600132442,
      'Verify exact name, student eligibility, vacancies, rates, contact number, and rules.'
    )
) AS seed (
  name, type, address, contact_number, operating_hours, price_range, description,
  latitude, longitude, district, availability_status, verification_status, verified_at,
  source_name, source_url, source_license, osm_type, osm_id, data_notes
)
WHERE NOT EXISTS (
  SELECT 1
  FROM establishment e
  WHERE e.osm_type = seed.osm_type
    AND e.osm_id = seed.osm_id
);

COMMIT;

-- Verification query:
-- SELECT store_id, name, type, latitude, longitude, verification_status, source_url
-- FROM establishment
-- WHERE district = 'University Belt, Manila'
-- ORDER BY type, name;
