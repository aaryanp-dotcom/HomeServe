-- ============================================================
-- HomeServe — Renovation Project Booking Bridge
-- Migration: 003_renovation_booking_bridge.sql
-- Connects quotation acceptance → booking → milestones → payments
-- ============================================================

-- Allow bookings without a service catalogue entry
-- (renovation bookings come from quotations, not service picker)
ALTER TABLE bookings
  ALTER COLUMN service_id DROP NOT NULL;

-- Allow flexible milestone percentages (renovation projects may use 30/40/30 etc.)
ALTER TABLE milestones
  DROP CONSTRAINT IF EXISTS milestones_percentage_check;

ALTER TABLE milestones
  DROP CONSTRAINT IF EXISTS milestones_milestone_number_check;

-- Link booking back to the renovation request and quotation
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS request_id   UUID REFERENCES renovation_requests(id),
  ADD COLUMN IF NOT EXISTS quotation_id UUID REFERENCES quotations(id),
  ADD COLUMN IF NOT EXISTS project_title TEXT;

-- Add email to user_profiles for notifications
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Index for request lookups
CREATE INDEX IF NOT EXISTS idx_bookings_request_id   ON bookings(request_id);
CREATE INDEX IF NOT EXISTS idx_bookings_quotation_id ON bookings(quotation_id);
