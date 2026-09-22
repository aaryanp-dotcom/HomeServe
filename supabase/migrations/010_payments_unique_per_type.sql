-- ============================================================
-- HomeServe — one payment row per (booking, payment type)
-- Migration: 010_payments_unique_per_type.sql
--
-- /api/payments/milestone upserts with ON CONFLICT (booking_id, payment_type), which
-- Postgres rejects unless a matching unique index exists. Retrying a failed milestone
-- payment replaces the previous attempt's row (new Razorpay order id).
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS payments_booking_payment_type_key
  ON payments (booking_id, payment_type);
