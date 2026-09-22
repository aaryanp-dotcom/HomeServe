-- ============================================================
-- HomeServe — Pin search_path on remaining functions, move pg_trgm
-- Migration: 007_function_search_paths.sql
-- Clears the Supabase security advisor warnings left after 005.
-- ============================================================

ALTER FUNCTION private.is_service_context()      SET search_path = '';
ALTER FUNCTION private.is_privileged()           SET search_path = '';
ALTER FUNCTION public.generate_booking_number()   SET search_path = public;
ALTER FUNCTION public.generate_request_number()   SET search_path = public;
ALTER FUNCTION public.generate_quotation_number() SET search_path = public;
ALTER FUNCTION public.update_updated_at()         SET search_path = public;

-- private.is_privileged() calls private.is_service_context()/is_admin() by
-- schema-qualified name, so an empty search_path is safe.

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
