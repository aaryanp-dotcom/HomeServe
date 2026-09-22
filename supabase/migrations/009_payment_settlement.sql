-- ============================================================
-- HomeServe — Atomic payment settlement
-- Migration: 009_payment_settlement.sql
--
-- Problem: /api/payments/verify and the Razorpay webhook updated payments, bookings
-- and milestones in separate, non-transactional calls, so a double click / retried
-- webhook double-counted paid_amount, and the webhook never advanced the booking.
-- These functions do the whole job in one transaction, take a row lock and are
-- idempotent. Callable only with the service role.
-- ============================================================

CREATE OR REPLACE FUNCTION public.settle_payment(
  p_order_id   TEXT,
  p_payment_id TEXT,
  p_signature  TEXT DEFAULT NULL,
  p_payload    JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  pay      public.payments%ROWTYPE;
  bk       public.bookings%ROWTYPE;
  mnum     INT;
  n_total  INT;
  n_done   INT;
  v_status public.booking_status;
  v_paid   NUMERIC;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found');
  END IF;

  SELECT * INTO bk FROM public.bookings WHERE id = pay.booking_id FOR UPDATE;

  IF pay.status = 'captured' THEN
    RETURN jsonb_build_object(
      'ok', true, 'already_settled', true, 'booking_id', bk.id, 'homeowner_id', bk.homeowner_id,
      'booking_number', bk.booking_number, 'amount', pay.amount, 'booking_status', bk.status);
  END IF;

  UPDATE public.payments
     SET status = 'captured',
         razorpay_payment_id = COALESCE(p_payment_id, razorpay_payment_id),
         razorpay_signature  = COALESCE(p_signature,  razorpay_signature),
         raw_webhook_payload = COALESCE(p_payload,    raw_webhook_payload)
   WHERE id = pay.id;

  v_paid := LEAST(bk.total_amount, bk.paid_amount + pay.amount);

  -- Milestone this payment settles: explicit link first, else derived from the payment type.
  IF pay.milestone_id IS NOT NULL THEN
    UPDATE public.milestones SET status = 'approved', approved_at = NOW() WHERE id = pay.milestone_id;
  ELSIF pay.payment_type <> 'booking_full' THEN
    mnum := substring(pay.payment_type::TEXT FROM 'milestone_(\d+)')::INT;
    UPDATE public.milestones SET status = 'approved', approved_at = NOW()
     WHERE booking_id = bk.id AND milestone_number = mnum;
  END IF;

  v_status := bk.status;
  IF bk.status IN ('pending', 'payment_pending') THEN
    v_status := 'confirmed';
  END IF;

  -- Fully paid project → completed
  IF bk.booking_type = 'project' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'approved') INTO n_total, n_done
      FROM public.milestones WHERE booking_id = bk.id;
    IF n_total > 0 AND n_total = n_done AND bk.status NOT IN ('cancelled', 'refunded') THEN
      v_status := 'completed';
    END IF;
  END IF;

  UPDATE public.bookings
     SET paid_amount = v_paid,
         status = v_status,
         razorpay_payment_id = COALESCE(p_payment_id, razorpay_payment_id),
         completed_at = CASE WHEN v_status = 'completed' AND completed_at IS NULL THEN NOW() ELSE completed_at END
   WHERE id = bk.id;

  RETURN jsonb_build_object(
    'ok', true, 'already_settled', false, 'booking_id', bk.id, 'homeowner_id', bk.homeowner_id,
    'booking_number', bk.booking_number, 'amount', pay.amount, 'booking_status', v_status, 'paid_amount', v_paid);
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_payment(p_order_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pay public.payments%ROWTYPE; bk public.bookings%ROWTYPE;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  SELECT * INTO bk FROM public.bookings WHERE id = pay.booking_id;
  -- Never downgrade a payment that already succeeded (a later failed attempt on the same order).
  IF pay.status IN ('captured', 'refunded') THEN
    RETURN jsonb_build_object('ok', true, 'ignored', true, 'reason', 'already_' || pay.status);
  END IF;
  UPDATE public.payments SET status = 'failed', raw_webhook_payload = COALESCE(p_payload, raw_webhook_payload) WHERE id = pay.id;
  RETURN jsonb_build_object('ok', true, 'ignored', false, 'booking_id', bk.id, 'homeowner_id', bk.homeowner_id,
                            'booking_number', bk.booking_number, 'amount', pay.amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_payment(p_payment_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pay public.payments%ROWTYPE; bk public.bookings%ROWTYPE; v_paid NUMERIC; v_status public.booking_status;
BEGIN
  SELECT * INTO pay FROM public.payments WHERE razorpay_payment_id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF pay.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already_refunded', true); END IF;
  SELECT * INTO bk FROM public.bookings WHERE id = pay.booking_id FOR UPDATE;

  UPDATE public.payments SET status = 'refunded', raw_webhook_payload = COALESCE(p_payload, raw_webhook_payload) WHERE id = pay.id;

  v_paid := GREATEST(0, bk.paid_amount - CASE WHEN pay.status = 'captured' THEN pay.amount ELSE 0 END);
  v_status := CASE WHEN v_paid = 0 AND pay.payment_type = 'booking_full' THEN 'refunded'::public.booking_status ELSE bk.status END;

  IF pay.milestone_id IS NOT NULL THEN
    UPDATE public.milestones SET status = 'pending', approved_at = NULL WHERE id = pay.milestone_id;
  END IF;
  UPDATE public.bookings SET paid_amount = v_paid, status = v_status WHERE id = bk.id;

  RETURN jsonb_build_object('ok', true, 'already_refunded', false, 'booking_id', bk.id, 'homeowner_id', bk.homeowner_id,
                            'booking_number', bk.booking_number, 'amount', pay.amount, 'paid_amount', v_paid);
END;
$$;

-- Service role only: these bypass RLS by design.
REVOKE EXECUTE ON FUNCTION public.settle_payment(TEXT, TEXT, TEXT, JSONB),
                           public.fail_payment(TEXT, JSONB),
                           public.refund_payment(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.settle_payment(TEXT, TEXT, TEXT, JSONB),
                           public.fail_payment(TEXT, JSONB),
                           public.refund_payment(TEXT, JSONB) TO service_role;
