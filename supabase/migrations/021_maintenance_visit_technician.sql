-- ============================================================
-- HomeServe — Assign maintenance visits to the site contractor
-- Migration: 021_maintenance_visit_technician.sql
--
-- Dashboard audit finding: maintenance_visits had no way to record who is actually going out to do
-- the work. The contractor's portal showed renovation jobs only — a maintenance visit the admin
-- scheduled was invisible to them anywhere in the app. This adds the missing link and lets the
-- contractor read (but not yet edit) the maintenance jobs assigned to them, the same way they can
-- already read their assigned renovation bookings.
-- ============================================================

ALTER TABLE public.maintenance_visits ADD COLUMN technician_id UUID REFERENCES auth.users(id);
CREATE INDEX idx_mvisit_technician ON public.maintenance_visits(technician_id);

CREATE POLICY "maintenance_visits: technician select" ON public.maintenance_visits FOR SELECT
  USING (technician_id = (SELECT auth.uid()));

CREATE POLICY "maintenance_requests: technician select" ON public.maintenance_requests FOR SELECT
  USING (id IN (SELECT request_id FROM public.maintenance_visits WHERE technician_id = (SELECT auth.uid())));

CREATE POLICY "maintenance_request_media: technician select" ON public.maintenance_request_media FOR SELECT
  USING (request_id IN (SELECT request_id FROM public.maintenance_visits WHERE technician_id = (SELECT auth.uid())));
