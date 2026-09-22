-- ============================================================
-- HomeServe — Property sizes
-- Migration: 008_property_sizes.sql
-- Sizes are stored canonically in square feet. `rooms_detail` keeps the customer's
-- (or surveyor's) room-by-room dimensions: [{name, length_ft, width_ft, area_sqft}].
-- ============================================================

-- Leads: what the customer told us
ALTER TABLE renovation_requests
  ADD COLUMN IF NOT EXISTS carpet_area_sqft NUMERIC(10,2)
    CHECK (carpet_area_sqft IS NULL OR (carpet_area_sqft > 0 AND carpet_area_sqft <= 100000)),
  ADD COLUMN IF NOT EXISTS size_input_mode TEXT
    CHECK (size_input_mode IS NULL OR size_input_mode IN ('bhk_preset', 'total_area', 'room_wise')),
  ADD COLUMN IF NOT EXISTS rooms_detail JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(rooms_detail) = 'array'),
  ADD COLUMN IF NOT EXISTS estimate_low  NUMERIC(12,2) CHECK (estimate_low  IS NULL OR estimate_low  >= 0),
  ADD COLUMN IF NOT EXISTS estimate_high NUMERIC(12,2) CHECK (estimate_high IS NULL OR estimate_high >= 0);

-- Site visits: what our surveyor measured
ALTER TABLE site_visits
  ADD COLUMN IF NOT EXISTS measured_area_sqft NUMERIC(10,2)
    CHECK (measured_area_sqft IS NULL OR (measured_area_sqft > 0 AND measured_area_sqft <= 100000)),
  ADD COLUMN IF NOT EXISTS measured_rooms JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(measured_rooms) = 'array');

-- Quotations + bookings: the area the price is based on
ALTER TABLE quotations
  ADD COLUMN IF NOT EXISTS project_area_sqft NUMERIC(10,2)
    CHECK (project_area_sqft IS NULL OR (project_area_sqft > 0 AND project_area_sqft <= 100000));

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(10,2)
    CHECK (area_sqft IS NULL OR (area_sqft > 0 AND area_sqft <= 100000));
