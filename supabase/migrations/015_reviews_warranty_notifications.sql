-- ============================================================
-- HomeServe — Reviews, warranty/handover, notification plumbing
-- Migration: 015_reviews_warranty_notifications.sql
-- ============================================================

-- ── Reviews: HomeServe-centric, for a project OR a maintenance request ───────
-- Was: one review per booking, contractor_id required. Now the subject is HomeServe;
-- contractor_id stays (nullable) only so existing rows and the contractor portal keep working.

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_key;
ALTER TABLE reviews ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN contractor_id DROP NOT NULL;

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS subject_type TEXT NOT NULL DEFAULT 'project' CHECK (subject_type IN ('project', 'maintenance')),
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_subject_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_subject_check CHECK (
  (subject_type = 'project'     AND booking_id IS NOT NULL AND maintenance_request_id IS NULL) OR
  (subject_type = 'maintenance' AND maintenance_request_id IS NOT NULL AND booking_id IS NULL)
);

-- The API upserts ON CONFLICT (booking_id, homeowner_id); that needed a matching unique index.
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_booking_homeowner ON reviews(booking_id, homeowner_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_maintenance_homeowner ON reviews(maintenance_request_id, homeowner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_maintenance_request ON reviews(maintenance_request_id);

-- Only published reviews are readable by others; a customer always sees their own.
DROP POLICY IF EXISTS "reviews: public select" ON reviews;
CREATE POLICY "reviews: select" ON reviews FOR SELECT
  USING (published OR homeowner_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));

-- ── Handover + warranty facts on renovation projects (bookings) ───────────────
-- All nullable and admin-entered: there is no default warranty period. Until admin
-- records one, customers are told the terms are in their project agreement.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS handover_date   DATE,
  ADD COLUMN IF NOT EXISTS warranty_months INTEGER CHECK (warranty_months IS NULL OR warranty_months BETWEEN 1 AND 600),
  ADD COLUMN IF NOT EXISTS warranty_terms  TEXT;

-- ── Notification plumbing ────────────────────────────────────────────────────
ALTER TABLE notification_logs
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS reference_id   UUID;
CREATE INDEX IF NOT EXISTS idx_notification_logs_reference ON notification_logs(reference_type, reference_id);

ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'maintenance_request_received';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'maintenance_request_confirmed';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'maintenance_visit_scheduled';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'maintenance_completed';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'maintenance_payment_received';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'membership_purchased';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'membership_renewal_reminder';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'membership_expiry_notice';
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'warranty_update';
