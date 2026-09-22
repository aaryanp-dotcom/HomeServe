-- ============================================================
-- HomeServe — Maintenance RLS + storage
-- Migration: 012_maintenance_rls.sql
--
-- Same convention as 005: end users get SELECT on their own rows, admins get
-- everything, and mutations the customer triggers go through API routes that verify
-- ownership and write with the service role. The one exception is customer_properties,
-- which is plain per-user CRUD and safe to allow directly.
-- ============================================================

ALTER TABLE customer_properties         ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_services        ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_visits          ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_request_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_request_media   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage          ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_payments        ENABLE ROW LEVEL SECURITY;

-- customer_properties ------------------------------------------------------
CREATE POLICY "customer_properties: select" ON customer_properties FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "customer_properties: insert own" ON customer_properties FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "customer_properties: update own" ON customer_properties FOR UPDATE
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "customer_properties: delete own" ON customer_properties FOR DELETE
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));

-- maintenance_services / maintenance_plans (public catalogue, active rows only) --
CREATE POLICY "maintenance_services: select" ON maintenance_services FOR SELECT
  USING (is_active OR (SELECT private.is_admin()));
CREATE POLICY "maintenance_services: admin insert" ON maintenance_services FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_services: admin update" ON maintenance_services FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_services: admin delete" ON maintenance_services FOR DELETE USING ((SELECT private.is_admin()));

CREATE POLICY "maintenance_plans: select" ON maintenance_plans FOR SELECT
  USING (is_active OR (SELECT private.is_admin()));
CREATE POLICY "maintenance_plans: admin insert" ON maintenance_plans FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_plans: admin update" ON maintenance_plans FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_plans: admin delete" ON maintenance_plans FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_subscriptions (read-only for members; the API + settle function write) --
CREATE POLICY "maintenance_subscriptions: select" ON maintenance_subscriptions FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "maintenance_subscriptions: admin insert" ON maintenance_subscriptions FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_subscriptions: admin update" ON maintenance_subscriptions FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_subscriptions: admin delete" ON maintenance_subscriptions FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_requests -------------------------------------------------------
CREATE POLICY "maintenance_requests: select" ON maintenance_requests FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "maintenance_requests: admin insert" ON maintenance_requests FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_requests: admin update" ON maintenance_requests FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_requests: admin delete" ON maintenance_requests FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_visits ---------------------------------------------------------
CREATE POLICY "maintenance_visits: select" ON maintenance_visits FOR SELECT
  USING ((SELECT private.is_admin())
         OR request_id IN (SELECT id FROM maintenance_requests WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "maintenance_visits: admin insert" ON maintenance_visits FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_visits: admin update" ON maintenance_visits FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_visits: admin delete" ON maintenance_visits FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_request_events: customers only see customer-visible rows -------
CREATE POLICY "maintenance_request_events: select" ON maintenance_request_events FOR SELECT
  USING ((SELECT private.is_admin())
         OR (visible_to_customer
             AND request_id IN (SELECT id FROM maintenance_requests WHERE user_id = (SELECT auth.uid()))));
CREATE POLICY "maintenance_request_events: admin insert" ON maintenance_request_events FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_request_events: admin update" ON maintenance_request_events FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_request_events: admin delete" ON maintenance_request_events FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_request_media ---------------------------------------------------
CREATE POLICY "maintenance_request_media: select" ON maintenance_request_media FOR SELECT
  USING ((SELECT private.is_admin())
         OR (visible_to_customer
             AND request_id IN (SELECT id FROM maintenance_requests WHERE user_id = (SELECT auth.uid()))));
CREATE POLICY "maintenance_request_media: admin insert" ON maintenance_request_media FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_request_media: admin update" ON maintenance_request_media FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_request_media: admin delete" ON maintenance_request_media FOR DELETE USING ((SELECT private.is_admin()));

-- subscription_usage ----------------------------------------------------------
CREATE POLICY "subscription_usage: select" ON subscription_usage FOR SELECT
  USING ((SELECT private.is_admin())
         OR subscription_id IN (SELECT id FROM maintenance_subscriptions WHERE user_id = (SELECT auth.uid())));
CREATE POLICY "subscription_usage: admin insert" ON subscription_usage FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "subscription_usage: admin update" ON subscription_usage FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "subscription_usage: admin delete" ON subscription_usage FOR DELETE USING ((SELECT private.is_admin()));

-- maintenance_payments --------------------------------------------------------
CREATE POLICY "maintenance_payments: select" ON maintenance_payments FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "maintenance_payments: admin insert" ON maintenance_payments FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_payments: admin update" ON maintenance_payments FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "maintenance_payments: admin delete" ON maintenance_payments FOR DELETE USING ((SELECT private.is_admin()));

-- ── Storage: maintenance-media (path: {request_id}/{file}) ──────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('maintenance-media', 'maintenance-media', false, 8388608, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "maintenance-media: read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'maintenance-media'
         AND ((SELECT private.is_admin())
              OR EXISTS (SELECT 1 FROM public.maintenance_request_media m
                         JOIN public.maintenance_requests r ON r.id = m.request_id
                         WHERE m.storage_path = storage.objects.name
                           AND m.visible_to_customer
                           AND r.user_id = (SELECT auth.uid()))));
CREATE POLICY "maintenance-media: admin manage" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'maintenance-media' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'maintenance-media' AND (SELECT private.is_admin()));
