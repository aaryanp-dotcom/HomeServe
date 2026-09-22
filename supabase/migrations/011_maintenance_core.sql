-- ============================================================
-- HomeServe — Home maintenance: catalogue, requests, memberships
-- Migration: 011_maintenance_core.sql
--
-- Reuses: auth.users, user_profiles, bookings (renovation projects),
--         payment_status enum, update_updated_at(), private.is_admin().
-- New:    customer_properties, maintenance_services, maintenance_plans,
--         maintenance_subscriptions, maintenance_requests, maintenance_visits,
--         maintenance_request_events, maintenance_request_media,
--         subscription_usage, maintenance_payments.
--
-- Deliberately NOT generalising `payments`: it is bound to bookings and to the
-- milestone flow (settle_payment). Maintenance gets its own ledger that shares the
-- same Razorpay client, signature verification and webhook endpoint.
-- ============================================================

-- ── Enums ───────────────────────────────────────────────────

CREATE TYPE maintenance_category AS ENUM (
  'plumbing', 'electrical', 'carpentry', 'ac_servicing', 'appliance_servicing',
  'pest_control', 'deep_cleaning', 'painting_touchups', 'waterproofing_inspection',
  'bathroom_maintenance', 'kitchen_maintenance', 'home_inspection'
);

CREATE TYPE maintenance_request_status AS ENUM (
  'requested', 'confirmed', 'scheduled', 'visit_underway', 'in_progress',
  'completed', 'customer_confirmed', 'closed', 'cancelled'
);

CREATE TYPE maintenance_visit_status AS ENUM ('scheduled', 'completed', 'missed', 'rescheduled', 'cancelled');

-- 'upcoming' = a paid renewal that starts when the current term ends.
CREATE TYPE membership_status AS ENUM ('pending_payment', 'active', 'upcoming', 'expired', 'cancelled');

CREATE TYPE maintenance_emergency_support AS ENUM ('none', 'guidance_only', 'priority_response');

-- ── customer_properties ─────────────────────────────────────
-- A customer's home(s). Maintenance requests and memberships attach to a property.

CREATE TABLE customer_properties (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label          TEXT NOT NULL DEFAULT 'My home',
  address_line   TEXT NOT NULL,
  locality       TEXT,
  city           TEXT NOT NULL CHECK (city IN ('Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad')),
  pincode        TEXT CHECK (pincode IS NULL OR pincode ~ '^[0-9]{6}$'),
  property_type  TEXT,
  area_sqft      NUMERIC(10,2) CHECK (area_sqft IS NULL OR (area_sqft > 0 AND area_sqft <= 100000)),
  booking_id     UUID REFERENCES bookings(id) ON DELETE SET NULL,   -- renovation project that produced it, if any
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_customer_properties_user ON customer_properties(user_id);
CREATE INDEX idx_customer_properties_booking ON customer_properties(booking_id);
CREATE TRIGGER customer_properties_updated_at BEFORE UPDATE ON customer_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── maintenance_services (the catalogue) ────────────────────
-- Indicative prices are nullable on purpose: nothing is invented. NULL renders as
-- "Quoted after inspection". Admin edits prices; no redeploy needed.

CREATE TABLE maintenance_services (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug                  TEXT NOT NULL UNIQUE,
  category              maintenance_category NOT NULL,
  name                  TEXT NOT NULL,
  summary               TEXT NOT NULL,
  description           TEXT NOT NULL,
  inclusions            TEXT[] NOT NULL DEFAULT '{}',
  exclusions            TEXT[] NOT NULL DEFAULT '{}',
  indicative_price_from NUMERIC(12,2) CHECK (indicative_price_from IS NULL OR indicative_price_from >= 0),
  indicative_price_to   NUMERIC(12,2) CHECK (indicative_price_to IS NULL OR indicative_price_to >= 0),
  price_unit            TEXT NOT NULL DEFAULT 'per_visit' CHECK (price_unit IN ('per_visit', 'per_unit', 'per_sqft', 'on_inspection')),
  price_note            TEXT,
  photos_helpful        BOOLEAN NOT NULL DEFAULT TRUE,
  membership_eligible   BOOLEAN NOT NULL DEFAULT TRUE,     -- may a membership benefit apply to this service at all
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (indicative_price_to IS NULL OR indicative_price_from IS NULL OR indicative_price_to >= indicative_price_from)
);
CREATE INDEX idx_maintenance_services_category ON maintenance_services(category);
CREATE INDEX idx_maintenance_services_active ON maintenance_services(is_active, sort_order);
CREATE TRIGGER maintenance_services_updated_at BEFORE UPDATE ON maintenance_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── maintenance_plans (membership configuration) ────────────
-- Every commercial lever is a column so the UI never hardcodes a business assumption.
-- NULL price ⇒ plan cannot be purchased. is_active defaults FALSE.

CREATE TABLE maintenance_plans (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                          TEXT NOT NULL UNIQUE,
  name                          TEXT NOT NULL,
  tagline                       TEXT,
  description                   TEXT NOT NULL DEFAULT '',
  annual_price                  NUMERIC(12,2) CHECK (annual_price IS NULL OR annual_price >= 0),
  monthly_price                 NUMERIC(12,2) CHECK (monthly_price IS NULL OR monthly_price >= 0),
  term_months                   INTEGER NOT NULL DEFAULT 12 CHECK (term_months BETWEEN 1 AND 36),
  included_visits               INTEGER NOT NULL DEFAULT 0 CHECK (included_visits >= 0),
  inspection_frequency_per_year INTEGER NOT NULL DEFAULT 0 CHECK (inspection_frequency_per_year BETWEEN 0 AND 12),
  discount_percent              NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  service_credit_amount         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (service_credit_amount >= 0),
  max_benefit_per_service       NUMERIC(12,2) CHECK (max_benefit_per_service IS NULL OR max_benefit_per_service >= 0),
  max_annual_benefit            NUMERIC(12,2) CHECK (max_annual_benefit IS NULL OR max_annual_benefit >= 0),
  eligible_categories           maintenance_category[] NOT NULL DEFAULT '{}',
  labour_included               BOOLEAN NOT NULL DEFAULT FALSE,   -- included visits also cover labour charges
  parts_included                BOOLEAN NOT NULL DEFAULT FALSE,   -- benefits may also apply to materials/parts (still capped)
  priority_booking              BOOLEAN NOT NULL DEFAULT FALSE,
  priority_support              BOOLEAN NOT NULL DEFAULT FALSE,
  emergency_support             maintenance_emergency_support NOT NULL DEFAULT 'none',
  emergency_notes               TEXT,
  benefits                      TEXT[] NOT NULL DEFAULT '{}',     -- plain-language bullets shown to customers
  exclusions                    TEXT[] NOT NULL DEFAULT '{}',
  eligibility_notes             TEXT,
  requires_homeserve_project    BOOLEAN NOT NULL DEFAULT FALSE,
  is_active                     BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order                    INTEGER NOT NULL DEFAULT 0,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER maintenance_plans_updated_at BEFORE UPDATE ON maintenance_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── maintenance_subscriptions ───────────────────────────────
-- plan_snapshot freezes the plan terms at purchase: later edits to maintenance_plans
-- never change what an existing member bought.

CREATE TABLE maintenance_subscriptions (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id),
  plan_id                  UUID NOT NULL REFERENCES maintenance_plans(id),
  property_id              UUID NOT NULL REFERENCES customer_properties(id),
  status                   membership_status NOT NULL DEFAULT 'pending_payment',
  plan_snapshot            JSONB NOT NULL,
  price_paid               NUMERIC(12,2) NOT NULL CHECK (price_paid >= 0),
  start_date               DATE,
  end_date                 DATE,
  renewed_from_id          UUID REFERENCES maintenance_subscriptions(id),
  cancel_at_period_end     BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at             TIMESTAMPTZ,
  cancellation_reason      TEXT,
  renewal_reminder_sent_at TIMESTAMPTZ,
  expiry_notice_sent_at    TIMESTAMPTZ,
  razorpay_subscription_id TEXT,        -- reserved for Razorpay Subscriptions (auto-debit); unused today
  created_by               UUID REFERENCES auth.users(id),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_msub_user ON maintenance_subscriptions(user_id);
CREATE INDEX idx_msub_plan ON maintenance_subscriptions(plan_id);
CREATE INDEX idx_msub_property ON maintenance_subscriptions(property_id);
CREATE INDEX idx_msub_status_end ON maintenance_subscriptions(status, end_date);
CREATE INDEX idx_msub_renewed_from ON maintenance_subscriptions(renewed_from_id);
-- At most one membership per property in each live state.
CREATE UNIQUE INDEX uq_msub_active_per_property   ON maintenance_subscriptions(property_id) WHERE status = 'active';
CREATE UNIQUE INDEX uq_msub_pending_per_property  ON maintenance_subscriptions(property_id) WHERE status = 'pending_payment';
CREATE UNIQUE INDEX uq_msub_upcoming_per_property ON maintenance_subscriptions(property_id) WHERE status = 'upcoming';
CREATE TRIGGER maintenance_subscriptions_updated_at BEFORE UPDATE ON maintenance_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── maintenance_requests ────────────────────────────────────

CREATE SEQUENCE maintenance_request_seq;

CREATE OR REPLACE FUNCTION generate_maintenance_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'MNT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('maintenance_request_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE maintenance_requests (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number         TEXT NOT NULL UNIQUE,
  user_id                UUID NOT NULL REFERENCES auth.users(id),
  service_id             UUID NOT NULL REFERENCES maintenance_services(id),
  category               maintenance_category NOT NULL,
  property_id            UUID NOT NULL REFERENCES customer_properties(id),
  address_snapshot       TEXT NOT NULL,
  city                   TEXT NOT NULL,
  booking_id             UUID REFERENCES bookings(id) ON DELETE SET NULL,   -- related renovation project
  subscription_id        UUID REFERENCES maintenance_subscriptions(id),     -- membership in force when raised
  status                 maintenance_request_status NOT NULL DEFAULT 'requested',
  urgency                TEXT NOT NULL DEFAULT 'routine' CHECK (urgency IN ('routine', 'urgent')),
  description            TEXT NOT NULL,
  preferred_date         DATE,
  preferred_slot         TEXT CHECK (preferred_slot IS NULL OR preferred_slot IN ('morning', 'afternoon', 'evening', 'any')),
  -- internal responsibility (no external assignment)
  assigned_to            UUID REFERENCES auth.users(id),
  team_label             TEXT,
  -- charges (all admin-entered; ₹)
  visit_fee              NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (visit_fee >= 0),
  labour_charge          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (labour_charge >= 0),
  materials_cost         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (materials_cost >= 0),
  materials              JSONB NOT NULL DEFAULT '[]',                        -- [{item, qty, unit_price, amount}]
  membership_discount    NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (membership_discount >= 0),
  membership_credit_used NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (membership_credit_used >= 0),
  amount_due             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount_due >= 0),
  payment_status         TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'waived')),
  paid_at                TIMESTAMPTZ,
  -- notes
  -- Internal notes are NOT a column here: customers can SELECT their own request row, so
  -- internal notes live in maintenance_request_events with visible_to_customer = FALSE.
  completion_summary     TEXT,                -- shown to the customer
  -- lifecycle timestamps
  confirmed_at           TIMESTAMPTZ,
  completed_at           TIMESTAMPTZ,
  customer_confirmed_at  TIMESTAMPTZ,
  closed_at              TIMESTAMPTZ,
  cancelled_at           TIMESTAMPTZ,
  cancellation_reason    TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER set_maintenance_request_number
  BEFORE INSERT ON maintenance_requests
  FOR EACH ROW WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_maintenance_request_number();
CREATE TRIGGER maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX idx_mreq_user ON maintenance_requests(user_id, created_at DESC);
CREATE INDEX idx_mreq_status ON maintenance_requests(status, created_at DESC);
CREATE INDEX idx_mreq_service ON maintenance_requests(service_id);
CREATE INDEX idx_mreq_property ON maintenance_requests(property_id);
CREATE INDEX idx_mreq_booking ON maintenance_requests(booking_id);
CREATE INDEX idx_mreq_subscription ON maintenance_requests(subscription_id);
CREATE INDEX idx_mreq_assigned ON maintenance_requests(assigned_to);

-- ── maintenance_visits ──────────────────────────────────────

CREATE TABLE maintenance_visits (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id       UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  scheduled_date   DATE NOT NULL,
  time_window      TEXT NOT NULL DEFAULT 'any' CHECK (time_window IN ('morning', 'afternoon', 'evening', 'any')),
  status           maintenance_visit_status NOT NULL DEFAULT 'scheduled',
  notes            TEXT,                     -- shown to the customer (internal notes go in events)
  completed_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mvisit_request ON maintenance_visits(request_id);
CREATE INDEX idx_mvisit_date ON maintenance_visits(scheduled_date, status);
CREATE INDEX idx_mvisit_created_by ON maintenance_visits(created_by);
CREATE TRIGGER maintenance_visits_updated_at BEFORE UPDATE ON maintenance_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── maintenance_request_events (audit trail + customer communication) ──

CREATE TABLE maintenance_request_events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id           UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  actor_id             UUID REFERENCES auth.users(id),
  actor_role           TEXT NOT NULL CHECK (actor_role IN ('customer', 'homeserve', 'system')),
  event_type           TEXT NOT NULL CHECK (event_type IN (
                         'created', 'status_change', 'message', 'note', 'assignment',
                         'visit', 'charges', 'materials', 'benefit', 'payment', 'media')),
  from_status          maintenance_request_status,
  to_status            maintenance_request_status,
  body                 TEXT,
  visible_to_customer  BOOLEAN NOT NULL DEFAULT TRUE,
  metadata             JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mevent_request ON maintenance_request_events(request_id, created_at);
CREATE INDEX idx_mevent_actor ON maintenance_request_events(actor_id);

-- ── maintenance_request_media ───────────────────────────────

CREATE TABLE maintenance_request_media (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id           UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  storage_path         TEXT NOT NULL UNIQUE,
  kind                 TEXT NOT NULL DEFAULT 'customer_photo' CHECK (kind IN ('customer_photo', 'before', 'after', 'completion')),
  caption              TEXT,
  visible_to_customer  BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by          UUID REFERENCES auth.users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mmedia_request ON maintenance_request_media(request_id);
CREATE INDEX idx_mmedia_uploader ON maintenance_request_media(uploaded_by);

-- ── subscription_usage (benefit ledger) ─────────────────────

CREATE TABLE subscription_usage (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id  UUID NOT NULL REFERENCES maintenance_subscriptions(id) ON DELETE CASCADE,
  request_id       UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  usage_type       TEXT NOT NULL CHECK (usage_type IN ('visit', 'inspection', 'discount', 'credit', 'visit_coverage')),
  category         maintenance_category,
  quantity         INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  amount           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  note             TEXT,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_susage_subscription ON subscription_usage(subscription_id, usage_type);
CREATE INDEX idx_susage_request ON subscription_usage(request_id);
CREATE INDEX idx_susage_created_by ON subscription_usage(created_by);

-- ── maintenance_payments (one ledger for membership + request charges) ──

CREATE TABLE maintenance_payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  kind                  TEXT NOT NULL CHECK (kind IN ('membership', 'request_charge')),
  subscription_id       UUID REFERENCES maintenance_subscriptions(id),
  request_id            UUID REFERENCES maintenance_requests(id),
  razorpay_order_id     TEXT NOT NULL UNIQUE,
  razorpay_payment_id   TEXT,
  razorpay_signature    TEXT,
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL DEFAULT 'INR',
  status                payment_status NOT NULL DEFAULT 'created',
  description           TEXT,
  raw_webhook_payload   JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK ((kind = 'membership' AND subscription_id IS NOT NULL AND request_id IS NULL)
      OR (kind = 'request_charge' AND request_id IS NOT NULL AND subscription_id IS NULL))
);
CREATE INDEX idx_mpay_user ON maintenance_payments(user_id, created_at DESC);
CREATE INDEX idx_mpay_subscription ON maintenance_payments(subscription_id);
CREATE INDEX idx_mpay_request ON maintenance_payments(request_id);
CREATE INDEX idx_mpay_payment_id ON maintenance_payments(razorpay_payment_id);
CREATE TRIGGER maintenance_payments_updated_at BEFORE UPDATE ON maintenance_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
