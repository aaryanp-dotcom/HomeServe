-- ============================================================
-- HomeServe — Refunds addressed by the unique order id
-- Migration: 017_refund_by_order.sql
--
-- Bug found in regression testing: offline payments stored their free-text reference
-- (UPI id / cheque no.) in razorpay_payment_id, and refunds looked payments up by that
-- column. References are not unique (two customers can both pay "cash"), so a refund could
-- have hit the wrong payment. Now:
--   * offline rows never carry a razorpay_payment_id (the reference lives in `reference`)
--   * the Razorpay webhook refund only matches Razorpay payments
--   * admin refunds go through razorpay_order_id, which is unique for every row
-- ============================================================

UPDATE maintenance_payments SET razorpay_payment_id = NULL WHERE method = 'offline';

CREATE OR REPLACE FUNCTION public.refund_maintenance_payment_by_order(p_order_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE pay public.maintenance_payments%ROWTYPE;
BEGIN
  SELECT * INTO pay FROM public.maintenance_payments WHERE razorpay_order_id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  IF pay.status = 'refunded' THEN RETURN jsonb_build_object('ok', true, 'already_refunded', true); END IF;
  IF pay.status <> 'captured' THEN RETURN jsonb_build_object('ok', false, 'error', 'not_captured'); END IF;

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
    VALUES (pay.request_id, 'system', 'payment', 'Payment refunded', jsonb_build_object('amount', pay.amount, 'method', pay.method));
  END IF;

  RETURN jsonb_build_object('ok', true, 'already_refunded', false, 'kind', pay.kind, 'user_id', pay.user_id, 'amount', pay.amount);
END;
$$;

-- Webhook path: Razorpay payment ids are unique per Razorpay payment; delegate to the order-based function.
CREATE OR REPLACE FUNCTION public.refund_maintenance_payment(p_payment_id TEXT, p_payload JSONB DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_order TEXT;
BEGIN
  SELECT razorpay_order_id INTO v_order FROM public.maintenance_payments
   WHERE razorpay_payment_id = p_payment_id AND method = 'razorpay' LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'error', 'payment_not_found'); END IF;
  RETURN public.refund_maintenance_payment_by_order(v_order, p_payload);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_maintenance_payment_by_order(TEXT, JSONB), public.refund_maintenance_payment(TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.refund_maintenance_payment_by_order(TEXT, JSONB), public.refund_maintenance_payment(TEXT, JSONB) TO service_role;
