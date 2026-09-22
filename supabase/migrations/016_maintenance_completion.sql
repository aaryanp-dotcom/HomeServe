-- ============================================================
-- HomeServe — Maintenance backend completion
-- Migration: 016_maintenance_completion.sql
--
--  * offline payments (UPI / cash / cheque recorded by admin) share the same ledger
--  * admin_audit_log: who changed what (plans, prices, warranty, payments, refunds)
--  * settle_maintenance_payment: never marks a request paid on a short payment
--  * one missing foreign-key index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_msub_created_by ON maintenance_subscriptions(created_by);

ALTER TABLE maintenance_payments
  ADD COLUMN IF NOT EXISTS method      TEXT NOT NULL DEFAULT 'razorpay' CHECK (method IN ('razorpay', 'offline')),
  ADD COLUMN IF NOT EXISTS reference   TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_mpay_recorded_by ON maintenance_payments(recorded_by);

-- ── Admin audit trail ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id    UUID REFERENCES auth.users(id),
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  summary     TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity  ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor   ON admin_audit_log(actor_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_log: admin select" ON admin_audit_log FOR SELECT USING ((SELECT private.is_admin()));
-- Writes come from server routes using the service role; nobody edits history.

-- ── Settlement: honour the amount actually paid ─────────────

CREATE OR REPLACE FUNCTION public.settle_maintenance_payment(
  p_order_id TEXT, p_payment_id TEXT, p_signature TEXT DEFAULT NULL, p_payload JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pay      public.maintenance_payments%ROWTYPE;
  sub      public.maintenance_subscriptions%ROWTYPE;
  old_sub  public.maintenance_subscriptions%ROWTYPE;
  req      public.maintenance_requests%ROWTYPE;
  v_term   INT;
  v_start  DATE;
  v_end    DATE;
  v_status public.membership_status;
  v_review BOOLEAN := FALSE;
  v_note   TEXT;
BEGIN
  SELECT * INTO pay FROM public.maintenance_payments WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;

  IF pay.status = 'captured' THEN
    RETURN jsonb_build_object('ok', true, 'already_settled', true, 'kind', pay.kind, 'user_id', pay.user_id,
      'subscription_id', pay.subscription_id, 'request_id', pay.request_id, 'amount', pay.amount);
  END IF;

  UPDATE public.maintenance_payments
     SET status = 'captured',
         razorpay_payment_id = COALESCE(p_payment_id, razorpay_payment_id),
         razorpay_signature  = COALESCE(p_signature,  razorpay_signature),
         raw_webhook_payload = COALESCE(p_payload,    raw_webhook_payload)
   WHERE id = pay.id;

  IF pay.kind = 'membership' THEN
    SELECT * INTO sub FROM public.maintenance_subscriptions WHERE id = pay.subscription_id FOR UPDATE;
    IF sub.status = 'pending_payment' THEN
      v_term   := COALESCE((sub.plan_snapshot->>'term_months')::INT, 12);
      v_start  := CURRENT_DATE;
      v_status := 'active';
      IF sub.renewed_from_id IS NOT NULL THEN
        SELECT * INTO old_sub FROM public.maintenance_subscriptions WHERE id = sub.renewed_from_id;
        IF FOUND AND old_sub.status = 'active' AND old_sub.end_date > CURRENT_DATE THEN
          v_start  := old_sub.end_date;
          v_status := 'upcoming';
        END IF;
      END IF;
      v_end := (v_start + make_interval(months => v_term))::DATE;
      UPDATE public.maintenance_subscriptions
         SET status = v_status, start_date = v_start, end_date = v_end, price_paid = pay.amount
       WHERE id = sub.id;
    END IF;
    RETURN jsonb_build_object('ok', true, 'already_settled', false, 'kind', 'membership', 'user_id', pay.user_id,
      'subscription_id', pay.subscription_id, 'amount', pay.amount,
      'plan_name', sub.plan_snapshot->>'name', 'start_date', v_start, 'end_date', v_end, 'status', v_status);
  END IF;

  -- request_charge: the request is only "paid" when the money received covers what was due
  SELECT * INTO req FROM public.maintenance_requests WHERE id = pay.request_id FOR UPDATE;
  IF req.payment_status = 'pending' AND pay.amount >= req.amount_due THEN
    UPDATE public.maintenance_requests SET payment_status = 'paid', paid_at = NOW() WHERE id = req.id;
    v_note := CASE WHEN pay.amount > req.amount_due THEN 'Payment received (more than the amount due — needs review)' ELSE 'Payment received' END;
    v_review := pay.amount > req.amount_due;
  ELSIF req.payment_status = 'pending' THEN
    v_note := 'Partial payment received — the balance is still due';
    v_review := TRUE;
  ELSE
    v_note := 'Payment received but nothing was due — needs review';
    v_review := TRUE;
  END IF;
  INSERT INTO public.maintenance_request_events (request_id, actor_role, event_type, body, visible_to_customer, metadata)
  VALUES (pay.request_id, 'system', 'payment', v_note, NOT v_review OR req.payment_status = 'pending',
          jsonb_build_object('amount', pay.amount, 'amount_due', req.amount_due, 'needs_review', v_review, 'method', pay.method));

  RETURN jsonb_build_object('ok', true, 'already_settled', false, 'kind', 'request_charge', 'user_id', pay.user_id,
    'request_id', pay.request_id, 'amount', pay.amount, 'needs_review', v_review);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.settle_maintenance_payment(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.settle_maintenance_payment(TEXT, TEXT, TEXT, JSONB) TO service_role;
