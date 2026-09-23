-- ============================================================
-- HomeServe — Secure project photo storage
-- Migration: 027_project_photos.sql
--
-- Problem: project_updates.photo_urls stores arbitrary plain-text URLs pasted
-- by the admin. These may be public URLs that allow unauthenticated access to
-- customer property photos. No file validation occurs.
--
-- Solution:
--   • New table: project_photos — stores storage_path (relative to the
--     project-media bucket) rather than a full URL. Signed URLs are generated
--     on demand by the API. The bucket is private (already configured in 005).
--   • project_updates.photo_urls is deprecated for new photos; existing rows are
--     preserved. New project updates use photo_ids instead.
--   • The project-media bucket policies from 005 are preserved; we tighten them
--     slightly below.
--
-- This migration does NOT delete existing photo_urls values — they may be
-- references to existing storage objects or external CDN URLs that need
-- investigation before deletion.
-- ============================================================

-- ── Project photos table ────────────────────────────────────────────────────

CREATE TABLE project_photos (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id           UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  update_id            UUID REFERENCES project_updates(id) ON DELETE SET NULL,
  storage_path         TEXT NOT NULL UNIQUE,          -- relative path in project-media bucket
  kind                 TEXT NOT NULL DEFAULT 'progress' CHECK (kind IN ('before', 'progress', 'milestone', 'after', 'completion')),
  caption              TEXT,
  visible_to_customer  BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by          UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_photos_booking  ON project_photos(booking_id);
CREATE INDEX idx_project_photos_update   ON project_photos(update_id);
CREATE INDEX idx_project_photos_uploader ON project_photos(uploaded_by);

ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;

-- Admin manages all photos
CREATE POLICY "project_photos: admin all" ON project_photos FOR ALL
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Homeowners can read only photos for their own bookings that are visible
CREATE POLICY "project_photos: homeowner read" ON project_photos FOR SELECT
  USING (
    visible_to_customer
    AND booking_id IN (
      SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid())
    )
  );

-- ── Tighten project-media bucket storage policies ───────────────────────────
-- The bucket is already created (private) in 005. Ensure no public read exists.
-- Add an explicit policy for project_photos path verification.

-- Drop the homeowner upload policy from 005 — uploads should go through the API.
-- We keep admin manage and the read policy.
DROP POLICY IF EXISTS "project-media: homeowner upload" ON storage.objects;

-- Replace the read policy with one that also checks the project_photos table.
-- This ensures a storage object with no corresponding project_photos row is
-- never served to customers (prevents an admin from accidentally uploading to
-- the bucket directly and having an orphaned file be accessible).
DROP POLICY IF EXISTS "project-media: read" ON storage.objects;
CREATE POLICY "project-media: read" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-media'
    AND (
      -- Admin can read everything
      (SELECT private.is_admin())
      OR
      -- Customer can read only if there is a matching project_photos row that is
      -- visible and the booking belongs to them.
      EXISTS (
        SELECT 1
        FROM public.project_photos pp
        JOIN public.bookings b ON b.id = pp.booking_id
        WHERE pp.storage_path = storage.objects.name
          AND pp.visible_to_customer
          AND b.homeowner_id = (SELECT auth.uid())
      )
    )
  );

-- ── Notes on manually entered photo_urls ────────────────────────────────────
-- Existing project_updates rows may have photo_urls values. The application code
-- now:
--   1. Ignores photo_urls in new project updates (uses project_photos instead).
--   2. Renders existing photo_urls with a warning banner in the admin UI.
--   3. Does NOT serve photo_urls to customers via signed URLs (they were always
--      direct URLs, so if they are public Supabase storage URLs they will continue
--      to work until the objects are deleted or the bucket is made private).
-- Action required by owner: audit existing photo_urls values. If they are Supabase
-- storage URLs for the project-media bucket, migrate them to project_photos rows
-- and generate proper signed URLs. If they are public internet URLs (stock photos),
-- they can be removed.
