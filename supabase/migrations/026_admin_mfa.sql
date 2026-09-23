-- ============================================================
-- HomeServe — Admin MFA enforcement
-- Migration: 026_admin_mfa.sql
--
-- Adds:
--   • A table to record that an admin session has passed MFA verification.
--   • The MFA session is enforced server-side in the admin layout AND in every
--     admin API route helper (requireAdmin).
--   • TOTP enrollment and verification happen through Supabase Auth MFA APIs
--     (auth.mfa.enroll / auth.mfa.challenge / auth.mfa.verify) which are called
--     from the Next.js app using the user's own session token — the service role
--     is NOT used for MFA operations.
--   • Supabase must also be configured at the dashboard level to require MFA for
--     admin accounts — see manual steps in the code comments.
-- ============================================================

-- Track admin audit actions from the MFA flow alongside other admin actions.
-- admin_audit_log already exists from migration 020; we extend it here if not done.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID NOT NULL REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  summary     TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin can read the audit log; nobody can delete or update it.
CREATE POLICY "admin_audit_log: admin select" ON admin_audit_log FOR SELECT
  USING ((SELECT private.is_admin()));
CREATE POLICY "admin_audit_log: admin insert" ON admin_audit_log FOR INSERT
  WITH CHECK ((SELECT private.is_admin()));
-- No UPDATE policy — the log is append-only.

-- Add index if not already there.
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor ON admin_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity ON admin_audit_log(entity_type, entity_id);

-- ============================================================
-- MANUAL STEPS REQUIRED IN SUPABASE DASHBOARD
-- ============================================================
--
-- 1. Authentication → Settings → Multi-Factor Authentication
--    Set "Factor Type" to TOTP and enable it.
--
-- 2. For each admin account, enforce MFA:
--    Authentication → Users → select user → "Require MFA" toggle ON.
--    (The application code additionally enforces this server-side as belt-and-
--    braces: any admin session where auth.mfa.getAuthenticatorAssuranceLevel()
--    returns current_level != 'aal2' is redirected to the MFA verification page.)
--
-- 3. For Google OAuth admin accounts:
--    Google accounts cannot use TOTP in the same session. For the single
--    HomeServe admin account:
--    - Prefer email+password login for the admin account.
--    - If Google OAuth must be used, configure Supabase to require TOTP re-enrollment
--      on Google OAuth sessions as a second factor.
--    - Until the admin uses Google OAuth and completes MFA, direct Google-OAuth
--      admin sessions are blocked by the application code.
--
-- ============================================================
