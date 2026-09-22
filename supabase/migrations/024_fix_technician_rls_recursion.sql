-- ============================================================
-- HomeServe — Fix infinite RLS recursion between maintenance_requests and maintenance_visits
-- Migration: 024_fix_technician_rls_recursion.sql
--
-- 021 added a "technician select" policy on maintenance_requests that subqueries
-- maintenance_visits. maintenance_visits' own SELECT policy (012) subqueries maintenance_requests
-- to check ownership. Postgres RLS re-evaluates every policy in a chain: reading a request now
-- evaluates the visits policy, which re-evaluates the requests policy, forever — Postgres error
-- 42P17 "infinite recursion detected in policy for relation maintenance_requests". This surfaced as
-- every homeowner's own /homeowner/maintenance/[id] page 404ing (the page's session-scoped read
-- returned nothing once the query itself started erroring), caught by a full-platform smoke test.
--
-- Fix: route the technician check through a SECURITY DEFINER function, the same pattern
-- private.is_admin() already uses everywhere else in this schema. A SECURITY DEFINER function runs
-- as its owner (the migration role), which isn't subject to maintenance_visits' RLS, so the lookup
-- never re-enters that table's policy and the cycle is broken.
-- ============================================================

CREATE OR REPLACE FUNCTION private.is_assigned_technician(p_request_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.maintenance_visits
    WHERE request_id = p_request_id AND technician_id = (SELECT auth.uid())
  )
$$;

REVOKE ALL ON FUNCTION private.is_assigned_technician(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_assigned_technician(UUID) TO anon, authenticated;

DROP POLICY "maintenance_requests: technician select" ON public.maintenance_requests;
CREATE POLICY "maintenance_requests: technician select" ON public.maintenance_requests FOR SELECT
  USING (private.is_assigned_technician(id));
