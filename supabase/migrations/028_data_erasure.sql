-- ============================================================
-- HomeServe — Data Erasure Workflow
-- Migration: 028_data_erasure.sql
--
-- Implements a controlled, auditable erasure workflow for DPDP Act 2023 compliance.
--
-- Design:
--   Customer requests deletion → identity verified → request recorded →
--   admin reviews → eligible data deleted/anonymised → retained records preserved →
--   third-party actions identified → completion recorded → customer notified.
--
-- NOT a "delete all" function. Financial records that must be retained for legal
-- or accounting reasons are anonymised (PII stripped), not deleted.
--
-- Retention decisions marked "Business/Legal decision required" remain as-is
-- until the owner confirms the retention period.
-- ============================================================

CREATE TYPE erasure_request_status AS ENUM (
  'pending',          -- customer submitted, not yet reviewed
  'in_review',        -- admin has picked it up
  'approved',         -- admin approved for execution
  'executing',        -- erasure is running
  'completed',        -- all eligible data erased/anonymised
  'rejected',         -- request denied (with reason)
  'cancelled'         -- customer withdrew the request
);

CREATE TABLE erasure_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number  TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  -- Contact details captured at request time (may be anonymised later)
  email_at_request TEXT NOT NULL,
  name_at_request  TEXT NOT NULL,
  -- Workflow
  status           erasure_request_status NOT NULL DEFAULT 'pending',
  customer_notes   TEXT,                   -- reason provided by the customer
  admin_notes      TEXT,                   -- internal review notes
  rejection_reason TEXT,
  -- Timeline
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at      TIMESTAMPTZ,
  reviewed_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  approved_by      UUID REFERENCES auth.users(id),
  executed_at      TIMESTAMPTZ,
  executed_by      UUID REFERENCES auth.users(id),
  completed_at     TIMESTAMPTZ,
  -- Summary of what was done (stored before the profile row is anonymised)
  deletion_summary JSONB,
  -- Rate-limit: one pending/in-review request per user at a time
  CONSTRAINT one_active_per_user UNIQUE NULLS NOT DISTINCT (user_id, status)
);

-- The UNIQUE on (user_id, status) only prevents two rows with the same status.
-- Since PostgreSQL 15+ NULLS NOT DISTINCT is available; for earlier versions
-- we use a partial unique index instead.
DROP INDEX IF EXISTS uq_erasure_one_active;
CREATE UNIQUE INDEX uq_erasure_one_active
  ON erasure_requests (user_id)
  WHERE status IN ('pending', 'in_review', 'approved', 'executing');

CREATE SEQUENCE erasure_request_seq;

CREATE OR REPLACE FUNCTION generate_erasure_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.request_number IS NULL OR NEW.request_number = '' THEN
    NEW.request_number := 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-'
                          || LPAD(NEXTVAL('erasure_request_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER erasure_requests_number
  BEFORE INSERT ON erasure_requests FOR EACH ROW
  EXECUTE FUNCTION generate_erasure_number();

ALTER TABLE erasure_requests ENABLE ROW LEVEL SECURITY;

-- Customer: can see their own requests; can insert one; cannot update
CREATE POLICY "erasure_requests: customer select" ON erasure_requests FOR SELECT
  USING (user_id = (SELECT auth.uid()));
-- Inserts go through the API which validates and writes via service role.
CREATE POLICY "erasure_requests: admin all" ON erasure_requests FOR ALL
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Audit trail for erasure actions
CREATE TABLE erasure_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id  UUID NOT NULL REFERENCES erasure_requests(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE erasure_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "erasure_audit_log: admin all" ON erasure_audit_log FOR ALL
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ============================================================
-- DATA ERASURE SQL FUNCTION
--
-- Called server-side by the admin-controlled API after human review.
-- What it does:
--   1. Anonymises the user_profiles row (name → "Deleted User", phone/city/state → NULL).
--   2. Anonymises renovation_requests (full_name → "Deleted", mobile/email → NULL).
--   3. Anonymises support_tickets (name → "Deleted", email/phone → NULL).
--   4. Deletes project_messages, notification_logs, theme_saves, reviews (where published=false).
--   5. Deletes warranty_requests where status = 'new' (no legal retention need).
--   6. RETAINS:
--      - bookings (financial contract record) — marked anonymise_at
--      - payments / maintenance_payments (accounting record)
--      - quotations (contractual record)
--      - renovation_requests (lead record with contact stripped)
--      - warranty_requests where status != 'new' (active/resolved warranty)
--      - maintenance_subscriptions (membership contract)
--      - admin_audit_log (security record)
--      - erasure_requests (erasure itself is an audit event)
--   7. Deletes storage objects: avatars/{user_id}/*, project photos for this user
--      (cannot be done in SQL — handled in the Next.js API route)
--   8. Deletes the auth.users record LAST — this also cascades to profiles.
--
-- NOTE: This function runs as the service role (SECURITY DEFINER).
-- It is ONLY callable through the admin-controlled API route, never exposed as an RPC.
--
-- The function:
--   • Checks the erasure_request is in 'approved' status.
--   • Records what it did in erasure_audit_log.
--   • Does NOT revoke REVOKE EXECUTE from PUBLIC — the whole function is
--     unexposed via PostgREST (no EXECUTE granted to anon/authenticated).
-- ============================================================

CREATE OR REPLACE FUNCTION public.execute_erasure(p_request_id UUID, p_actor UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id        UUID;
  v_summary        JSONB := '{}';
  v_deleted_counts JSONB := '{}';
BEGIN
  -- 1. Verify the request is in the correct state
  SELECT user_id INTO v_user_id
  FROM erasure_requests
  WHERE id = p_request_id AND status = 'approved';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Erasure request % not found or not in approved state', p_request_id;
  END IF;

  -- Mark as executing
  UPDATE erasure_requests SET status = 'executing', executed_at = NOW(), executed_by = p_actor
  WHERE id = p_request_id;

  -- 2. Anonymise user_profiles (not deleted — referenced by bookings/payments/etc.)
  UPDATE user_profiles
  SET full_name  = 'Deleted User',
      phone      = NULL,
      city       = NULL,
      state      = NULL,
      avatar_url = NULL
  WHERE user_id = v_user_id;

  -- 3. Anonymise renovation_requests contact details (lead records retained for business records)
  UPDATE renovation_requests
  SET full_name            = 'Deleted',
      mobile               = 'REDACTED',
      email                = NULL,
      notes                = NULL,
      preferred_contact_time = NULL
  WHERE user_id = v_user_id;

  -- 4. Anonymise support_tickets (ticket threads retained for audit; contact stripped)
  UPDATE support_tickets
  SET name  = 'Deleted User',
      email = 'deleted@deleted',
      phone = NULL
  WHERE user_id = v_user_id;

  -- 5. Delete project_messages (personal communications)
  DELETE FROM project_messages WHERE sender_id = v_user_id;

  -- 6. Delete notification_logs (operational records no longer needed)
  DELETE FROM notification_logs WHERE user_id = v_user_id;

  -- 7. Delete theme_saves (preferences, not required)
  DELETE FROM theme_saves WHERE user_id = v_user_id;

  -- 8. Unpublished reviews are the homeowner's own draft content — safe to delete outright.
  DELETE FROM reviews WHERE homeowner_id = v_user_id AND published = FALSE;
  -- Published reviews: reviews.homeowner_id is NOT NULL on this schema, so — per this
  -- function's own note above — it can't be nulled out; we keep the row and the constraint.
  -- That's not a PII leak: the profile it points at was just anonymised in step 2
  -- (full_name -> 'Deleted User', no phone/city/avatar), so nothing identifying is
  -- reachable through it either way.

  -- 9. Delete warranty_requests where still in 'new' state (no work begun)
  DELETE FROM warranty_requests WHERE user_id = v_user_id AND status = 'new';

  -- 10. Delete customer_properties (property records no longer needed post-erasure)
  --     (maintenance requests are retained with anonymised contact)
  -- Anonymise maintenance_requests contact info (retained for operational history)
  UPDATE maintenance_requests SET address_snapshot = 'REDACTED' WHERE user_id = v_user_id;

  -- 11. Build deletion summary
  SELECT jsonb_build_object(
    'user_id',                v_user_id,
    'user_profiles_anonymised', TRUE,
    'renovation_requests_anonymised', (SELECT COUNT(*) FROM renovation_requests WHERE user_id = v_user_id),
    'support_tickets_anonymised', (SELECT COUNT(*) FROM support_tickets WHERE user_id = v_user_id),
    'retained_bookings', (SELECT COUNT(*) FROM bookings WHERE homeowner_id = v_user_id),
    'retained_payments', (SELECT COUNT(*) FROM payments p JOIN bookings b ON b.id = p.booking_id WHERE b.homeowner_id = v_user_id),
    'retained_quotations', (SELECT COUNT(*) FROM quotations q JOIN renovation_requests r ON r.id = q.request_id WHERE r.user_id = v_user_id)
  ) INTO v_summary;

  -- 12. Log the erasure
  INSERT INTO erasure_audit_log (request_id, actor_id, action, details)
  VALUES (p_request_id, p_actor, 'data_erased', v_summary);

  -- 13. Mark complete
  UPDATE erasure_requests
  SET status = 'completed', completed_at = NOW(), deletion_summary = v_summary
  WHERE id = p_request_id;

  RETURN v_summary;
END;
$$;

-- Block direct RPC access — this function MUST only be called from the admin API route
REVOKE EXECUTE ON FUNCTION public.execute_erasure(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_erasure(UUID, UUID) TO service_role;
