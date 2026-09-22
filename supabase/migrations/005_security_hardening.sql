-- ============================================================
-- HomeServe — Security hardening, RLS rewrite, storage, indexes
-- Migration: 005_security_hardening.sql
--
-- Fixes found in review of 001–004:
--   * users could promote themselves to admin (signup metadata + own-row UPDATE)
--   * contractors could self-verify / edit rating
--   * customers could edit quotation totals; warranty/message rows were self-editable
--   * booking / milestone / review writes were open to end users (the app writes
--     them with the service-role client, so RLS can be read-only for end users)
--   * auto_create_milestones collided with quotation-driven milestones
--   * RLS helper lived in the exposed public schema and policies re-evaluated
--     auth.uid() per row
-- ============================================================

-- ── Private helpers (not exposed through PostgREST) ─────────────────────────

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM public.user_profiles WHERE user_id = (SELECT auth.uid()) $$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE(private.current_user_role() = 'admin', false) $$;

-- TRUE for the service role, postgres / dashboard sessions and triggers running
-- as the table owner. PostgREST sets the DB role per request, so current_user is
-- 'anon' or 'authenticated' for end-user traffic. Deliberately SECURITY INVOKER.
CREATE OR REPLACE FUNCTION private.is_service_context()
RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT current_user NOT IN ('anon', 'authenticated') $$;

CREATE OR REPLACE FUNCTION private.is_privileged()
RETURNS boolean
LANGUAGE sql STABLE
AS $$ SELECT private.is_service_context() OR private.is_admin() $$;

REVOKE ALL ON FUNCTION private.current_user_role(), private.is_admin(),
                       private.is_service_context(), private.is_privileged() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_user_role(), private.is_admin(),
                          private.is_service_context(), private.is_privileged()
  TO anon, authenticated, service_role;

-- ── Drop every policy from 001–004, then recreate cleanly ───────────────────

DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.current_user_role();

-- ── Signup: never trust client-supplied role beyond homeowner / contractor ──

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role := CASE WHEN NEW.raw_user_meta_data->>'role' = 'contractor'
                 THEN 'contractor'::public.user_role
                 ELSE 'homeowner'::public.user_role END;

  INSERT INTO public.user_profiles (user_id, role, full_name, phone, email)
  VALUES (
    NEW.id,
    v_role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), NEW.email, 'User'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF v_role = 'contractor' THEN
    INSERT INTO public.contractor_profiles (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ── Guard triggers: column-level protection RLS cannot express ──────────────

CREATE OR REPLACE FUNCTION public.guard_user_profiles()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF private.is_privileged() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role NOT IN ('homeowner', 'contractor') THEN
      RAISE EXCEPTION 'role % cannot be self-assigned', NEW.role USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.role IS DISTINCT FROM OLD.role OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'role and user_id are read-only' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_user_profiles
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_user_profiles();

CREATE OR REPLACE FUNCTION public.guard_contractor_profiles()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF private.is_privileged() THEN RETURN NEW; END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := FALSE;
    NEW.rating := 0;
    NEW.total_jobs := 0;
    NEW.contractor_type := 'marketplace';
  ELSE
    NEW.is_verified := OLD.is_verified;
    NEW.rating := OLD.rating;
    NEW.total_jobs := OLD.total_jobs;
    NEW.contractor_type := OLD.contractor_type;
    NEW.user_id := OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_contractor_profiles
  BEFORE INSERT OR UPDATE ON contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_contractor_profiles();

-- Customers may only respond to a quotation (status + response timestamps);
-- every commercial field is frozen. Acceptance goes through the accept API.
CREATE OR REPLACE FUNCTION public.guard_quotations()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
  mutable_cols CONSTANT text[] := ARRAY['status','viewed_at','rejected_at','rejection_reason','updated_at'];
BEGIN
  IF private.is_privileged() THEN RETURN NEW; END IF;

  IF (to_jsonb(NEW) - mutable_cols) IS DISTINCT FROM (to_jsonb(OLD) - mutable_cols) THEN
    RAISE EXCEPTION 'only the quotation response can be changed' USING ERRCODE = '42501';
  END IF;
  IF NEW.status NOT IN ('viewed', 'rejected', 'revision_requested') THEN
    RAISE EXCEPTION 'status % cannot be set by the customer', NEW.status USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_quotations
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION public.guard_quotations();

-- ── Project milestones: only for catalogue project bookings ─────────────────
-- Quotation-driven bookings get milestones from the quotation payment schedule.

CREATE OR REPLACE FUNCTION public.create_project_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.booking_type = 'project' AND NEW.quotation_id IS NULL THEN
    INSERT INTO public.milestones (booking_id, milestone_number, title, percentage, amount) VALUES
      (NEW.id, 1, 'Project Start / Mobilisation',  20, ROUND(NEW.total_amount * 0.20, 2)),
      (NEW.id, 2, 'Work in Progress / Mid Review', 40, ROUND(NEW.total_amount * 0.40, 2)),
      (NEW.id, 3, 'Completion & Handover',         40, ROUND(NEW.total_amount - ROUND(NEW.total_amount * 0.20, 2) - ROUND(NEW.total_amount * 0.40, 2), 2));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_contractor_stats()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  avg_rating NUMERIC;
  job_count  INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, job_count
  FROM public.reviews WHERE contractor_id = NEW.contractor_id;

  UPDATE public.contractor_profiles
  SET rating = ROUND(COALESCE(avg_rating, 0), 2), total_jobs = job_count
  WHERE user_id = NEW.contractor_id;
  RETURN NEW;
END;
$$;

-- Trigger functions must not be callable as RPC endpoints
REVOKE EXECUTE ON FUNCTION
  public.handle_new_user(), public.guard_user_profiles(), public.guard_contractor_profiles(),
  public.guard_quotations(), public.create_project_milestones(), public.update_contractor_stats(),
  public.generate_booking_number(), public.generate_request_number(),
  public.generate_quotation_number(), public.update_updated_at()
FROM PUBLIC, anon, authenticated;

-- ── Notifications: read state ───────────────────────────────────────────────

ALTER TABLE notification_logs ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_notification_logs_unread
  ON notification_logs(user_id) WHERE read_at IS NULL;

-- ── Money sanity checks ─────────────────────────────────────────────────────

ALTER TABLE bookings   ADD CONSTRAINT bookings_amounts_nonneg   CHECK (total_amount >= 0 AND paid_amount >= 0);
ALTER TABLE milestones ADD CONSTRAINT milestones_amount_nonneg  CHECK (amount >= 0);
ALTER TABLE payments   ADD CONSTRAINT payments_amount_positive  CHECK (amount > 0);

-- ── Row Level Security (rewritten) ──────────────────────────────────────────
-- End users get read access + a few narrowly-scoped writes. All other writes are
-- made server-side with the service-role key, which bypasses RLS.

-- user_profiles
CREATE POLICY "user_profiles: select" ON user_profiles FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin())
         OR (role = 'contractor' AND (SELECT auth.uid()) IS NOT NULL));
CREATE POLICY "user_profiles: insert own" ON user_profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) AND role IN ('homeowner', 'contractor'));
CREATE POLICY "user_profiles: update" ON user_profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "user_profiles: admin delete" ON user_profiles FOR DELETE
  USING ((SELECT private.is_admin()));

-- contractor_profiles
CREATE POLICY "contractor_profiles: select" ON contractor_profiles FOR SELECT
  USING (is_verified OR user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "contractor_profiles: insert" ON contractor_profiles FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "contractor_profiles: update" ON contractor_profiles FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "contractor_profiles: admin delete" ON contractor_profiles FOR DELETE
  USING ((SELECT private.is_admin()));

-- services
CREATE POLICY "services: select" ON services FOR SELECT
  USING (is_active OR (SELECT private.is_admin()));
CREATE POLICY "services: admin insert" ON services FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "services: admin update" ON services FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "services: admin delete" ON services FOR DELETE USING ((SELECT private.is_admin()));

-- bookings (read-only for end users)
CREATE POLICY "bookings: select" ON bookings FOR SELECT
  USING (homeowner_id = (SELECT auth.uid()) OR contractor_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "bookings: admin insert" ON bookings FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "bookings: admin update" ON bookings FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "bookings: admin delete" ON bookings FOR DELETE USING ((SELECT private.is_admin()));

-- milestones
CREATE POLICY "milestones: select" ON milestones FOR SELECT
  USING ((SELECT private.is_admin())
         OR booking_id IN (SELECT id FROM bookings
                           WHERE homeowner_id = (SELECT auth.uid()) OR contractor_id = (SELECT auth.uid())));
CREATE POLICY "milestones: admin insert" ON milestones FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "milestones: admin update" ON milestones FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "milestones: admin delete" ON milestones FOR DELETE USING ((SELECT private.is_admin()));

-- payments
CREATE POLICY "payments: select" ON payments FOR SELECT
  USING ((SELECT private.is_admin())
         OR booking_id IN (SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid())));
CREATE POLICY "payments: admin insert" ON payments FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "payments: admin update" ON payments FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "payments: admin delete" ON payments FOR DELETE USING ((SELECT private.is_admin()));

-- notification_logs
CREATE POLICY "notification_logs: select" ON notification_logs FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "notification_logs: admin insert" ON notification_logs FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "notification_logs: admin update" ON notification_logs FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "notification_logs: admin delete" ON notification_logs FOR DELETE USING ((SELECT private.is_admin()));

-- reviews (public read; writes go through the reviews API)
CREATE POLICY "reviews: public select" ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews: admin insert" ON reviews FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "reviews: admin update" ON reviews FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "reviews: admin delete" ON reviews FOR DELETE USING ((SELECT private.is_admin()));

-- renovation_requests (public lead form submits through the API route, service role)
CREATE POLICY "renovation_requests: select" ON renovation_requests FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "renovation_requests: admin insert" ON renovation_requests FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "renovation_requests: admin update" ON renovation_requests FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "renovation_requests: admin delete" ON renovation_requests FOR DELETE USING ((SELECT private.is_admin()));

-- site_visits
CREATE POLICY "site_visits: select" ON site_visits FOR SELECT
  USING ((SELECT private.is_admin())
         OR request_id IN (SELECT id FROM renovation_requests WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "site_visits: admin insert" ON site_visits FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "site_visits: admin update" ON site_visits FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "site_visits: admin delete" ON site_visits FOR DELETE USING ((SELECT private.is_admin()));

-- quotations (customers never see drafts; may only respond — see guard_quotations)
CREATE POLICY "quotations: select" ON quotations FOR SELECT
  USING ((SELECT private.is_admin())
         OR (status <> 'draft'
             AND request_id IN (SELECT id FROM renovation_requests WHERE user_id = (SELECT auth.uid()))));
CREATE POLICY "quotations: admin insert" ON quotations FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "quotations: update" ON quotations FOR UPDATE
  USING ((SELECT private.is_admin())
         OR (status IN ('sent', 'viewed')
             AND request_id IN (SELECT id FROM renovation_requests WHERE user_id = (SELECT auth.uid()))))
  WITH CHECK ((SELECT private.is_admin())
         OR request_id IN (SELECT id FROM renovation_requests WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "quotations: admin delete" ON quotations FOR DELETE USING ((SELECT private.is_admin()));

-- warranty_requests (customers create + read; admins resolve)
CREATE POLICY "warranty_requests: select" ON warranty_requests FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "warranty_requests: insert" ON warranty_requests FOR INSERT
  WITH CHECK ((SELECT private.is_admin())
              OR (user_id = (SELECT auth.uid())
                  AND status = 'new' AND admin_notes IS NULL
                  AND resolution_notes IS NULL AND resolved_at IS NULL
                  AND (booking_id IS NULL
                       OR booking_id IN (SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid())))));
CREATE POLICY "warranty_requests: admin update" ON warranty_requests FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "warranty_requests: admin delete" ON warranty_requests FOR DELETE USING ((SELECT private.is_admin()));

-- project_updates
CREATE POLICY "project_updates: select" ON project_updates FOR SELECT
  USING ((SELECT private.is_admin())
         OR (is_public AND booking_id IN (SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid()))));
CREATE POLICY "project_updates: admin insert" ON project_updates FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "project_updates: admin update" ON project_updates FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "project_updates: admin delete" ON project_updates FOR DELETE USING ((SELECT private.is_admin()));

-- project_messages
CREATE POLICY "project_messages: select" ON project_messages FOR SELECT
  USING ((SELECT private.is_admin())
         OR booking_id IN (SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid())));
CREATE POLICY "project_messages: insert" ON project_messages FOR INSERT
  WITH CHECK ((SELECT private.is_admin())
              OR (sender = 'homeowner' AND sender_id = (SELECT auth.uid())
                  AND booking_id IN (SELECT id FROM bookings WHERE homeowner_id = (SELECT auth.uid()))));
CREATE POLICY "project_messages: admin update" ON project_messages FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "project_messages: admin delete" ON project_messages FOR DELETE USING ((SELECT private.is_admin()));

-- ── Indexes: cover foreign keys, drop duplicates of UNIQUE constraints ──────

DROP INDEX IF EXISTS idx_user_profiles_user_id;
DROP INDEX IF EXISTS idx_contractor_profiles_user_id;
DROP INDEX IF EXISTS idx_bookings_number;
DROP INDEX IF EXISTS idx_payments_razorpay_order;

CREATE INDEX IF NOT EXISTS idx_bookings_service            ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_payments_milestone          ON payments(milestone_id);
CREATE INDEX IF NOT EXISTS idx_reviews_homeowner           ON reviews(homeowner_id);
CREATE INDEX IF NOT EXISTS idx_renovation_requests_assigned ON renovation_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_site_visits_assigned        ON site_visits(assigned_to);
CREATE INDEX IF NOT EXISTS idx_quotations_site_visit       ON quotations(site_visit_id);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by       ON quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_warranty_requests_user      ON warranty_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_warranty_requests_booking   ON warranty_requests(booking_id);
CREATE INDEX IF NOT EXISTS idx_warranty_requests_quotation ON warranty_requests(quotation_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_created_by  ON project_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_project_messages_sender     ON project_messages(sender_id);

-- ── Storage buckets + policies ──────────────────────────────────────────────
-- Path convention: avatars/{user_id}/…  project-media/{booking_id}/…

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('avatars',          'avatars',          true,  2097152,  ARRAY['image/jpeg','image/png','image/webp']),
  ('project-media',    'project-media',    false, 15728640, ARRAY['image/jpeg','image/png','image/webp','application/pdf']),
  ('lead-attachments', 'lead-attachments', false, 10485760, ARRAY['image/jpeg','image/png','image/webp','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars: own write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "avatars: own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "avatars: own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);

CREATE POLICY "project-media: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-media'
         AND ((SELECT private.is_admin())
              OR EXISTS (SELECT 1 FROM public.bookings b
                         WHERE b.id::text = (storage.foldername(name))[1]
                           AND b.homeowner_id = (SELECT auth.uid()))));
CREATE POLICY "project-media: homeowner upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-media'
              AND ((SELECT private.is_admin())
                   OR EXISTS (SELECT 1 FROM public.bookings b
                              WHERE b.id::text = (storage.foldername(name))[1]
                                AND b.homeowner_id = (SELECT auth.uid()))));
CREATE POLICY "project-media: admin manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'project-media' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'project-media' AND (SELECT private.is_admin()));

CREATE POLICY "lead-attachments: admin manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'lead-attachments' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'lead-attachments' AND (SELECT private.is_admin()));
