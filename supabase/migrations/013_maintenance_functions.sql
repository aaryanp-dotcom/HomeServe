-- ============================================================
-- HomeServe — Maintenance payment settlement + membership benefit engine
-- Migration: 013_maintenance_functions.sql
--
-- All service-role only (bypass RLS by design), atomic and idempotent — the same
-- contract as settle_payment() in 009, for the maintenance_payments ledger.
-- ============================================================

-- ── Settle a captured payment ───────────────────────────────

CREATE OR REPLACE FUNCTION public.settle_maintenance_payment(
  p_order_id TEXT, p_payment_id TEXT, p_signature TEXT DEFAULT NULL, p_payload JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pay      public.maintenance_payments%ROWTYPE;
  sub      public.maintenance_subscriptions%ROWTYPE;
  old_sub  public.maintenance_subscriptions%ROWTYPE;
  v_term   INT;
  v_start  DATE;
  v_end    DATE;
  v_status public.membership_status;
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
      -- Early renewal: the new term begins when the current one ends.
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

  -- request_charge
  UPDATE public.maintenance_requests
     SET payment_status = 'paid', paid_at = NOW()
   WHERE id = pay.request_id;
  INSERT INTO public.maintenance_request_events (request_id, actor_role, event_type, body, metadata)
  VALUES (pay.request_id, 'system', 'payment', 'Payment received', jsonb_build_object('amount', pay.amount));

  RETURN jsonb_build_object('ok', true, 'already_settled', false, 'kind', 'request_charge', 'user_id', pay.user_id,
    'request_id', pay.request_id, 'amount', pay.amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_maintenance_payment(p_order_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pay public.maintenance_payments%ROWTYPE;
BEGIN
  SELECT * INTO pay FROM public.maintenance_payments WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF pay.status IN ('captured', 'refunded') THEN
    RETURN jsonb_build_object('ok', true, 'ignored', true, 'reason', 'already_' || pay.status);
  END IF;
  UPDATE public.maintenance_payments
     SET status = 'failed', raw_webhook_payload = COALESCE(p_payload, raw_webhook_payload)
   WHERE id = pay.id;
  RETURN jsonb_build_object('ok', true, 'ignored', false, 'kind', pay.kind, 'user_id', pay.user_id,
    'subscription_id', pay.subscription_id, 'request_id', pay.request_id, 'amount', pay.amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_maintenance_payment(p_payment_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pay public.maintenance_payments%ROWTYPE;
BEGIN
  SELECT * INTO pay FROM public.maintenance_payments WHERE razorpay_payment_id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF pay.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already_refunded', true); END IF;

  UPDATE public.maintenance_payments
     SET status = 'refunded', raw_webhook_payload = COALESCE(p_payload, raw_webhook_payload)
   WHERE id = pay.id;

  IF pay.kind = 'membership' THEN
    UPDATE public.maintenance_subscriptions
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = 'Payment refunded'
     WHERE id = pay.subscription_id AND status IN ('active', 'upcoming');
  ELSE
    UPDATE public.maintenance_requests
       SET payment_status = 'pending', paid_at = NULL
     WHERE id = pay.request_id AND payment_status = 'paid';
    INSERT INTO public.maintenance_request_events (request_id, actor_role, event_type, body, metadata)
    VALUES (pay.request_id, 'system', 'payment', 'Payment refunded', jsonb_build_object('amount', pay.amount));
  END IF;

  RETURN jsonb_build_object('ok', true, 'already_refunded', false, 'kind', pay.kind, 'user_id', pay.user_id, 'amount', pay.amount);
END;
$$;

-- ── Membership term rollover (called daily by the cron route) ───────────────

CREATE OR REPLACE FUNCTION public.roll_memberships()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE n_expired INT; n_started INT;
BEGIN
  UPDATE public.maintenance_subscriptions SET status = 'expired'
   WHERE status = 'active' AND end_date <= CURRENT_DATE;
  GET DIAGNOSTICS n_expired = ROW_COUNT;

  UPDATE public.maintenance_subscriptions SET status = 'active'
   WHERE status = 'upcoming' AND start_date <= CURRENT_DATE;
  GET DIAGNOSTICS n_started = ROW_COUNT;

  RETURN jsonb_build_object('expired', n_expired, 'started', n_started);
END;
$$;

-- ── Charge + membership benefit engine ──────────────────────
-- Single calculation path for a request's amount due. Idempotent: it clears this
-- request's previous benefit rows and recomputes from the plan snapshot, so admin can
-- edit charges and re-run it freely. Every limit comes from the plan snapshot — no
-- business assumption is hardcoded here.
--
-- Order of application, each step bounded by the remaining per-service and annual caps:
--   1. an included visit (if any left) covers the visit fee (+ labour if the plan says so)
--   2. the plan's % discount on what is still payable (materials only if parts_included)
--   3. service credits on what is still payable
-- Materials are never covered unless parts_included, and even then the caps apply.

CREATE OR REPLACE FUNCTION public.recalculate_request_charges(p_request_id UUID, p_actor UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r            public.maintenance_requests%ROWTYPE;
  sub          public.maintenance_subscriptions%ROWTYPE;
  svc_elig     BOOLEAN;
  snap         JSONB;
  big          CONSTANT NUMERIC := 1000000000000;
  annual_cap   NUMERIC;  per_cap NUMERIC;  used_annual NUMERIC;
  req_left     NUMERIC;  visits_left INT;  credits_left NUMERIC;
  v_fee        NUMERIC;  v_lab NUMERIC;  v_mat NUMERIC;
  labour_incl  BOOLEAN;  parts_incl BOOLEAN;
  cov          NUMERIC := 0;  disc NUMERIC := 0;  cred NUMERIC := 0;
  cov_fee      NUMERIC := 0;  cov_lab NUMERIC := 0;
  base         NUMERIC;  remaining NUMERIC;
  v_total      NUMERIC;  v_due NUMERIC;
  v_applied    BOOLEAN := FALSE;  v_reason TEXT := 'no_active_membership';
  v_visit_used BOOLEAN := FALSE;
  v_found      BOOLEAN;
BEGIN
  SELECT * INTO r FROM public.maintenance_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'request_not_found'); END IF;
  IF r.payment_status = 'paid' THEN RETURN jsonb_build_object('ok', false, 'error', 'already_paid'); END IF;

  DELETE FROM public.subscription_usage
   WHERE request_id = p_request_id AND usage_type IN ('visit', 'visit_coverage', 'discount', 'credit');

  v_fee := r.visit_fee;  v_lab := r.labour_charge;  v_mat := r.materials_cost;

  -- membership in force on the day the request was raised
  SELECT * INTO sub FROM public.maintenance_subscriptions
   WHERE property_id = r.property_id AND user_id = r.user_id
     AND status IN ('active', 'expired')
     AND start_date <= r.created_at::DATE AND r.created_at::DATE < end_date
   ORDER BY start_date DESC LIMIT 1
   FOR UPDATE;
  v_found := FOUND;

  IF v_found THEN
    snap := sub.plan_snapshot;
    SELECT membership_eligible INTO svc_elig FROM public.maintenance_services WHERE id = r.service_id;
    IF NOT (snap->'eligible_categories' ? r.category::TEXT) THEN
      v_reason := 'category_not_covered';
    ELSIF NOT COALESCE(svc_elig, TRUE) THEN
      v_reason := 'service_not_membership_eligible';
    ELSE
      v_applied   := TRUE;  v_reason := 'applied';
      labour_incl := COALESCE((snap->>'labour_included')::BOOLEAN, FALSE);
      parts_incl  := COALESCE((snap->>'parts_included')::BOOLEAN, FALSE);
      annual_cap  := (snap->>'max_annual_benefit')::NUMERIC;
      per_cap     := (snap->>'max_benefit_per_service')::NUMERIC;

      SELECT COALESCE(SUM(amount), 0) INTO used_annual FROM public.subscription_usage
       WHERE subscription_id = sub.id AND usage_type IN ('visit_coverage', 'discount', 'credit');
      req_left := LEAST(CASE WHEN annual_cap IS NULL THEN big ELSE GREATEST(0, annual_cap - used_annual) END,
                        COALESCE(per_cap, big));

      SELECT COALESCE((snap->>'included_visits')::INT, 0) - COALESCE(SUM(quantity), 0) INTO visits_left
        FROM public.subscription_usage WHERE subscription_id = sub.id AND usage_type = 'visit';
      SELECT COALESCE((snap->>'service_credit_amount')::NUMERIC, 0) - COALESCE(SUM(amount), 0) INTO credits_left
        FROM public.subscription_usage WHERE subscription_id = sub.id AND usage_type = 'credit';

      -- 1. included visit
      IF visits_left > 0 THEN
        v_visit_used := TRUE;
        cov := LEAST(req_left, v_fee + CASE WHEN labour_incl THEN v_lab ELSE 0 END);
        cov_fee := LEAST(cov, v_fee);
        cov_lab := cov - cov_fee;
        req_left := req_left - cov;
      END IF;

      -- 2. percentage discount on the still-payable eligible base
      base := (v_fee - cov_fee) + (v_lab - cov_lab) + CASE WHEN parts_incl THEN v_mat ELSE 0 END;
      disc := LEAST(req_left, ROUND(base * COALESCE((snap->>'discount_percent')::NUMERIC, 0) / 100, 2));
      req_left := req_left - disc;

      -- 3. service credits
      remaining := GREATEST(0, base - disc);
      cred := GREATEST(0, LEAST(req_left, credits_left, remaining));

      IF v_visit_used THEN
        INSERT INTO public.subscription_usage (subscription_id, request_id, usage_type, category, quantity, amount, created_by)
        VALUES (sub.id, r.id, 'visit', r.category, 1, 0, p_actor);
        IF cov > 0 THEN
          INSERT INTO public.subscription_usage (subscription_id, request_id, usage_type, category, quantity, amount, created_by)
          VALUES (sub.id, r.id, 'visit_coverage', r.category, 0, cov, p_actor);
        END IF;
      END IF;
      IF disc > 0 THEN
        INSERT INTO public.subscription_usage (subscription_id, request_id, usage_type, category, quantity, amount, created_by)
        VALUES (sub.id, r.id, 'discount', r.category, 0, disc, p_actor);
      END IF;
      IF cred > 0 THEN
        INSERT INTO public.subscription_usage (subscription_id, request_id, usage_type, category, quantity, amount, created_by)
        VALUES (sub.id, r.id, 'credit', r.category, 0, cred, p_actor);
      END IF;
    END IF;
  END IF;

  v_total := v_fee + v_lab + v_mat;
  v_due   := GREATEST(0, v_total - (cov + disc) - cred);

  UPDATE public.maintenance_requests
     SET subscription_id = CASE WHEN v_applied THEN sub.id ELSE NULL END,
         membership_discount = cov + disc,
         membership_credit_used = cred,
         amount_due = v_due,
         payment_status = CASE WHEN v_due = 0 THEN 'not_required'
                               WHEN payment_status = 'waived' THEN 'waived'
                               ELSE 'pending' END
   WHERE id = r.id;

  INSERT INTO public.maintenance_request_events (request_id, actor_id, actor_role, event_type, body, metadata)
  VALUES (r.id, p_actor, 'homeserve', 'charges', 'Charges updated',
          jsonb_build_object('total', v_total, 'membership_discount', cov + disc, 'credit', cred,
                             'amount_due', v_due, 'membership', v_reason));

  RETURN jsonb_build_object('ok', true, 'membership', v_reason, 'applied', v_applied,
    'subscription_id', CASE WHEN v_applied THEN sub.id ELSE NULL END,
    'total', v_total, 'visit_coverage', cov, 'discount', disc, 'credit', cred, 'amount_due', v_due);
END;
$$;

-- Service role only.
REVOKE EXECUTE ON FUNCTION
  public.settle_maintenance_payment(TEXT, TEXT, TEXT, JSONB),
  public.fail_maintenance_payment(TEXT, JSONB),
  public.refund_maintenance_payment(TEXT, JSONB),
  public.roll_memberships(),
  public.recalculate_request_charges(UUID, UUID)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION
  public.settle_maintenance_payment(TEXT, TEXT, TEXT, JSONB),
  public.fail_maintenance_payment(TEXT, JSONB),
  public.refund_maintenance_payment(TEXT, JSONB),
  public.roll_memberships(),
  public.recalculate_request_charges(UUID, UUID)
TO service_role;
