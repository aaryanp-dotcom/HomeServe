-- ============================================================
-- HomeServe — Data Retention Infrastructure
-- Migration: 029_data_retention.sql
--
-- This migration does NOT implement automatic deletion.
-- It adds the INFRASTRUCTURE needed to enforce retention once
-- the owner has made the required business and legal decisions.
--
-- Retention Policy (to be confirmed by business/legal):
--
-- CATEGORY                         | TABLE(S)                              | PURPOSE              | RETENTION DECISION
-- ---------------------------------|---------------------------------------|----------------------|------------------
-- User profile (name/phone/city)   | user_profiles                        | Account operation    | Business decision required
-- Auth credentials                 | auth.users (Supabase managed)        | Authentication       | Delete on erasure (DPDP)
-- Renovation leads / contact info  | renovation_requests                  | Sales record         | Business decision required
-- Renovation project bookings      | bookings                             | Contract record      | Legal review required (min 7yr accounting)
-- Quotations                       | quotations                           | Contract record      | Legal review required
-- Site visits                      | site_visits                          | Operational record   | Business decision required
-- Payments (renovation)            | payments                             | Accounting           | Legal review required (min 7yr)
-- Milestones                       | milestones                           | Contract record      | Legal review required
-- Reviews                          | reviews                              | Public content       | Business decision required
-- Notifications log                | notification_logs                    | Operational audit    | Business decision required
-- Project updates                  | project_updates                      | Project record       | Business decision required
-- Project messages                 | project_messages                     | Communications       | Business decision required
-- Project photos                   | project_photos + project-media bucket| Customer property    | Business decision required (DPDP: delete on request)
-- Warranty requests                | warranty_requests                    | Service record       | Business decision required
-- Maintenance requests             | maintenance_requests                 | Service record       | Business decision required
-- Maintenance visits               | maintenance_visits                   | Operational record   | Business decision required
-- Maintenance events               | maintenance_request_events           | Audit trail          | Business decision required
-- Maintenance media                | maintenance_request_media + bucket   | Customer photos      | Business decision required (DPDP: delete on request)
-- Maintenance payments             | maintenance_payments                 | Accounting           | Legal review required (min 7yr)
-- Maintenance subscriptions        | maintenance_subscriptions            | Contract record      | Business decision required
-- Subscription usage               | subscription_usage                   | Billing ledger       | Business decision required
-- Customer properties              | customer_properties                  | Operational record   | Delete on erasure
-- Support tickets                  | support_tickets + messages           | Customer service     | Business decision required
-- Admin audit log                  | admin_audit_log                      | Security record      | Legal review required (retain for investigation)
-- Erasure requests                 | erasure_requests + audit_log         | DPDP compliance      | Retain indefinitely (anonymised)
-- Theme saves                      | theme_saves                          | Preferences          | Delete on erasure
--
-- STATUS KEY:
--   "Business decision required"  — No legal minimum known; HomeServe must decide
--   "Legal review required"       — Likely a minimum period exists; get legal advice
--   "Already technically enforced"— Application already implements deletion
--   "Not technically enforced"    — No automatic deletion exists today
--
-- CURRENTLY TECHNICALLY ENFORCED:
--   • maintenance_request_media: CASCADE DELETE from maintenance_requests
--   • milestones: CASCADE DELETE from bookings
--   • project_photos: CASCADE DELETE from bookings
--   • maintenance_request_events: CASCADE DELETE from maintenance_requests
--   • subscription_usage: CASCADE DELETE from maintenance_subscriptions
--
-- ============================================================

-- ── Retention metadata columns ──────────────────────────────────────────────
-- Adding nullable `anonymise_at` and `delete_at` columns to key tables allows
-- future scheduled jobs to enforce retention without schema changes.

ALTER TABLE user_profiles      ADD COLUMN IF NOT EXISTS retain_until DATE;
ALTER TABLE renovation_requests ADD COLUMN IF NOT EXISTS retain_until DATE;
ALTER TABLE bookings           ADD COLUMN IF NOT EXISTS retain_until DATE;
ALTER TABLE support_tickets    ADD COLUMN IF NOT EXISTS retain_until DATE;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS retain_until DATE;

-- ── Scheduled retention function (placeholder — NOT yet scheduled) ───────────
-- When retention periods are confirmed, this function can be scheduled via
-- Supabase pg_cron to run nightly.
--
-- DO NOT enable pg_cron scheduling until retention periods are confirmed by
-- business/legal review. The function below is safe — it does nothing until
-- retain_until values are populated by the admin workflow.

CREATE OR REPLACE FUNCTION public.enforce_retention_schedule()
RETURNS TABLE(table_name TEXT, rows_processed INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Only process rows where retain_until has been explicitly set and has passed.
  -- Rows with retain_until = NULL are never processed.

  -- Anonymise expired user profiles (only if account has been deleted)
  UPDATE user_profiles
  SET full_name = 'Retained Record', phone = NULL, city = NULL, state = NULL, avatar_url = NULL
  WHERE retain_until IS NOT NULL AND retain_until < CURRENT_DATE
    AND user_id NOT IN (SELECT id FROM auth.users);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'user_profiles'::TEXT, v_count;

  -- Anonymise expired renovation requests
  UPDATE renovation_requests
  SET full_name = 'Retained Record', mobile = 'REDACTED', email = NULL, notes = NULL
  WHERE retain_until IS NOT NULL AND retain_until < CURRENT_DATE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT 'renovation_requests'::TEXT, v_count;

  -- Future: add booking / payment anonymisation here once legal periods confirmed.
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_retention_schedule() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_retention_schedule() TO service_role;

-- ============================================================
-- MANUAL ACTIONS REQUIRED
-- ============================================================
-- 1. Review the retention table above with your legal/accounting team.
-- 2. Confirm periods for bookings/payments (likely 7 years under GST/income tax).
-- 3. Confirm periods for all other categories.
-- 4. Once confirmed:
--    a. Update this migration with the confirmed periods.
--    b. Populate retain_until values on existing rows.
--    c. Schedule enforce_retention_schedule() via Supabase pg_cron:
--       SELECT cron.schedule('retention_cleanup', '0 2 * * *', 'SELECT enforce_retention_schedule()');
-- ============================================================
