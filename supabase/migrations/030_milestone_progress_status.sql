-- ============================================================
-- HomeServe — settle_payment() now sets milestone_1_done / milestone_2_done
-- Migration: 030_milestone_progress_status.sql
--
-- Problem (found in a full-app audit): the homeowner/admin project pages, their 7-step
-- timeline, and several dashboard filters all display and query for booking status
-- 'milestone_1_done' / 'milestone_2_done' — but settle_payment() (009) only ever wrote
-- 'confirmed' or 'completed'. Nothing ever produced these two enum values, so a project's
-- timeline always skipped 2 of its own 7 steps, jumping straight to 'completed' the moment
-- the last milestone was paid.
--
-- Fix: after milestone 1 or 2's payment settles on a project booking, advance the booking to
-- the matching 'milestone_N_done' status — but never regress a status an admin already moved
-- further along (e.g. manually into 'assigned'/'in_progress' ahead of payment, or past this
-- point already), and never touch a cancelled/refunded booking.
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
  v_target public.booking_status;
  step_of  CONSTANT JSONB := '{
    "payment_pending":0,"confirmed":1,"assigned":2,"in_progress":3,
    "milestone_1_done":4,"milestone_2_done":5,"completed":6,
    "cancelled":-1,"refunded":-1
  }'::JSONB;
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
  -- Either way we also need its milestone_number now, to know which 'milestone_N_done' (if any)
  -- this payment might advance the booking to.
  IF pay.milestone_id IS NOT NULL THEN
    UPDATE public.milestones SET status = 'approved', approved_at = NOW() WHERE id = pay.milestone_id;
    SELECT milestone_number INTO mnum FROM public.milestones WHERE id = pay.milestone_id;
  ELSIF pay.payment_type <> 'booking_full' THEN
    mnum := substring(pay.payment_type::TEXT FROM 'milestone_(\d+)')::INT;
    UPDATE public.milestones SET status = 'approved', approved_at = NOW()
     WHERE booking_id = bk.id AND milestone_number = mnum;
  END IF;

  v_status := bk.status;
  IF bk.status IN ('pending', 'payment_pending') THEN
    v_status := 'confirmed';
  END IF;

  -- Advance to milestone_1_done / milestone_2_done — forward-only, and never for a
  -- cancelled/refunded booking.
  IF bk.booking_type = 'project' AND mnum IN (1, 2) AND bk.status NOT IN ('cancelled', 'refunded') THEN
    v_target := (CASE mnum WHEN 1 THEN 'milestone_1_done' ELSE 'milestone_2_done' END)::public.booking_status;
    IF (step_of ->> v_status::TEXT)::INT < (step_of ->> v_target::TEXT)::INT THEN
      v_status := v_target;
    END IF;
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

-- Service role only: unchanged from 009, restated for clarity since CREATE OR REPLACE keeps
-- existing grants anyway.
REVOKE EXECUTE ON FUNCTION public.settle_payment(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.settle_payment(TEXT, TEXT, TEXT, JSONB) TO service_role;
