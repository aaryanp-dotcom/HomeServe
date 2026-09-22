-- ============================================================
-- HomeServe — Project Updates & Communication
-- Migration: 004_project_updates.sql
-- ============================================================

-- ── Project Updates (progress photos / notes from HomeServe) ─────────────────

CREATE TYPE update_category AS ENUM (
  'before', 'progress', 'milestone', 'completion', 'general'
);

CREATE TABLE project_updates (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  -- Content
  category     update_category NOT NULL DEFAULT 'progress',
  title        TEXT,
  description  TEXT,
  photo_urls   TEXT[] NOT NULL DEFAULT '{}',
  -- Posted by admin/HomeServe
  created_by   UUID REFERENCES auth.users(id),
  is_public    BOOLEAN NOT NULL DEFAULT TRUE,   -- TRUE = customer can see it
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER project_updates_updated_at
  BEFORE UPDATE ON project_updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_project_updates_booking  ON project_updates(booking_id);
CREATE INDEX idx_project_updates_created  ON project_updates(created_at DESC);

-- ── Project Messages (homeowner ↔ HomeServe) ──────────────────────────────────

CREATE TYPE message_sender AS ENUM ('homeowner', 'homeserve');

CREATE TABLE project_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender       message_sender NOT NULL,
  sender_id    UUID NOT NULL REFERENCES auth.users(id),
  body         TEXT,                             -- nullable if attachment only
  attachment_urls TEXT[] NOT NULL DEFAULT '{}',
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_messages_booking  ON project_messages(booking_id);
CREATE INDEX idx_project_messages_created  ON project_messages(created_at ASC);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE project_updates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- project_updates: admin manages; homeowner sees public updates for own bookings
CREATE POLICY "project_updates: admin all"
  ON project_updates FOR ALL
  USING (current_user_role() = 'admin');

CREATE POLICY "project_updates: homeowner read public"
  ON project_updates FOR SELECT
  USING (
    is_public = TRUE
    AND booking_id IN (
      SELECT id FROM bookings WHERE homeowner_id = auth.uid()
    )
  );

-- project_messages: homeowner accesses own booking messages; admin sees all
CREATE POLICY "project_messages: homeowner own"
  ON project_messages FOR ALL
  USING (
    booking_id IN (SELECT id FROM bookings WHERE homeowner_id = auth.uid())
  );

CREATE POLICY "project_messages: admin all"
  ON project_messages FOR ALL
  USING (current_user_role() = 'admin');
