-- ============================================================
-- HomeServe — Support tickets (public contact form + homeowner "raise a ticket")
-- Migration: 022_support_tickets.sql
--
-- One system serves both entry points: the public /contact form (no login — user_id is null,
-- name/email/phone are taken as given) and a signed-in homeowner raising a ticket from their
-- dashboard (user_id set, contact details default from their profile). Everything the customer sees
-- lives in support_ticket_messages, the same "thread" shape used elsewhere in the app (maintenance
-- request messages, project messages) rather than inventing a new mental model.
--
-- Same convention as every other customer table here: the customer gets SELECT on their own rows
-- directly; every write goes through an API route that validates input and writes with the service
-- role, so RLS grants INSERT/UPDATE only to admin.
-- ============================================================

CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE support_ticket_category AS ENUM ('general', 'renovation', 'maintenance', 'billing', 'account', 'other');

CREATE TABLE support_tickets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number  TEXT NOT NULL UNIQUE,
  user_id        UUID REFERENCES auth.users(id),   -- null for an anonymous contact-form submission
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  subject        TEXT NOT NULL,
  category       support_ticket_category NOT NULL DEFAULT 'general',
  status         support_ticket_status NOT NULL DEFAULT 'open',
  source         TEXT NOT NULL DEFAULT 'contact_form' CHECK (source IN ('contact_form', 'dashboard')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ
);

CREATE TABLE support_ticket_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id    UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_role  TEXT NOT NULL CHECK (sender_role IN ('customer', 'homeserve')),
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user      ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status    ON support_tickets(status);
CREATE INDEX idx_support_ticket_msgs_tkt   ON support_ticket_messages(ticket_id);

CREATE SEQUENCE support_ticket_seq;

CREATE OR REPLACE FUNCTION generate_support_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.ticket_number := 'TCK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('support_ticket_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER support_tickets_number
  BEFORE INSERT ON support_tickets FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_support_ticket_number();

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE support_tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "support_tickets: select own or admin" ON support_tickets FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
CREATE POLICY "support_tickets: admin insert" ON support_tickets FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "support_tickets: admin update" ON support_tickets FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "support_tickets: admin delete" ON support_tickets FOR DELETE USING ((SELECT private.is_admin()));

CREATE POLICY "support_ticket_messages: select own or admin" ON support_ticket_messages FOR SELECT
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = (SELECT auth.uid())) OR (SELECT private.is_admin()));
CREATE POLICY "support_ticket_messages: admin insert" ON support_ticket_messages FOR INSERT WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "support_ticket_messages: admin update" ON support_ticket_messages FOR UPDATE USING ((SELECT private.is_admin())) WITH CHECK ((SELECT private.is_admin()));
CREATE POLICY "support_ticket_messages: admin delete" ON support_ticket_messages FOR DELETE USING ((SELECT private.is_admin()));
