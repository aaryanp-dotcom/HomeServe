-- ============================================================
-- HomeServe — Fix mutable search_path on the ticket-number trigger
-- Migration: 023_fix_ticket_number_search_path.sql
--
-- Every other function in this schema pins search_path = public; generate_support_ticket_number()
-- (022) was missed, which Supabase's own security linter flags (a function with a mutable search_path
-- can be tricked into resolving an unqualified name — here NEXTVAL('support_ticket_seq') — against a
-- schema the caller controls). No functional change, just closing that gap.
-- ============================================================

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.ticket_number := 'TCK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('support_ticket_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
