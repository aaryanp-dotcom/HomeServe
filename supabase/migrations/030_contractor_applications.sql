-- ============================================================
-- HomeServe — Contractor onboarding (applications, admin-reviewed)
-- Migration: 030_contractor_applications.sql
--
-- Public sign-up only ever creates homeowners (migration 018's guard trigger blocks any
-- other role from the browser, by design). There was previously no way for a prospective
-- technician to express interest at all — the only path to a contractor account was an
-- admin running scripts/set-role.mjs by hand from a terminal with the service-role key.
--
-- This adds a public "apply to join" form that creates a row here — never an auth account,
-- never a role — and an admin review step (approve/reject) that is the only thing that can
-- actually create the account and set role = 'contractor'. Applying is not registering;
-- nothing is assigned automatically.
-- ============================================================

CREATE TYPE contractor_application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE contractor_applications (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name         TEXT NOT NULL,
  -- Nullable: phone is the primary contact for a trade applicant, many of whom won't use email
  -- day to day. An email is still required to actually create a login account (Supabase Auth
  -- here is email+password), so the admin is asked for one at approval time if it's missing.
  email             TEXT,
  phone             TEXT NOT NULL,
  city              TEXT,
  experience_years  INTEGER NOT NULL DEFAULT 0,
  specializations   service_category[] NOT NULL DEFAULT '{}',
  message           TEXT,
  status            contractor_application_status NOT NULL DEFAULT 'pending',
  admin_notes       TEXT,
  rejection_reason  TEXT,
  reviewed_by       UUID REFERENCES auth.users(id),
  reviewed_at       TIMESTAMPTZ,
  -- Set once approved and the account exists — lets the admin UI link straight to the new
  -- contractor's profile without a second lookup, and makes "already approved" obvious.
  approved_user_id  UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractor_applications_status  ON contractor_applications(status);
CREATE INDEX idx_contractor_applications_email   ON contractor_applications(email);

ALTER TABLE contractor_applications ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies at all, on purpose — same pattern as renovation_requests
-- and support_tickets. The public application route writes with the service-role client
-- after its own Zod validation and rate limiting; nobody can read, insert, or update this
-- table through PostgREST directly.
CREATE POLICY "contractor_applications: admin all" ON contractor_applications FOR ALL
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
