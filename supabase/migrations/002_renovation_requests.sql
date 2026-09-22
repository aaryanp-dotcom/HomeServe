-- ============================================================
-- HomeServe — Renovation Request & Operations Schema
-- Migration: 002_renovation_requests.sql
-- ============================================================

-- ── Renovation Requests (lead capture) ──────────────────────────────────────

CREATE TYPE lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'site_visit_scheduled',
  'site_visit_completed',
  'quote_preparation',
  'quote_sent',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE property_type AS ENUM (
  '1BHK', '2BHK', '3BHK', '4BHK', 'Villa', 'Independent House', 'Other'
);

CREATE TYPE ncr_city AS ENUM (
  'Delhi', 'Noida', 'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad', 'Other'
);

CREATE TYPE renovation_scope AS ENUM (
  'full_home', 'kitchen', 'bathroom', 'living_room', 'bedroom',
  'painting', 'flooring', 'false_ceiling', 'electrical', 'plumbing',
  'carpentry', 'civil_work', 'other'
);

CREATE TYPE budget_range AS ENUM (
  'under_5L', '5_10L', '10_20L', '20_30L', '30L_plus', 'not_sure'
);

CREATE TYPE timeline_preference AS ENUM (
  'immediately', 'within_1_month', '1_3_months', '3_6_months', 'just_exploring'
);

CREATE TABLE renovation_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number        TEXT NOT NULL UNIQUE, -- HSR-YYYYMMDD-XXXX
  -- Property details
  city                  ncr_city NOT NULL,
  locality              TEXT NOT NULL,
  property_type         property_type NOT NULL,
  bhk                   TEXT,
  approximate_area      TEXT,
  is_new_property       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Scope
  scope                 renovation_scope[] NOT NULL DEFAULT '{}',
  scope_other           TEXT,
  -- Budget & timeline
  budget_range          budget_range,
  timeline_preference   timeline_preference,
  -- Contact
  full_name             TEXT NOT NULL,
  mobile                TEXT NOT NULL,
  email                 TEXT,
  preferred_contact_time TEXT,
  -- Additional
  notes                 TEXT,
  inspiration_theme     TEXT, -- slug from themes library
  -- Attachments (stored as Supabase storage paths)
  attachment_urls       TEXT[] NOT NULL DEFAULT '{}',
  -- Status & assignment
  status                lead_status NOT NULL DEFAULT 'new',
  assigned_to           UUID REFERENCES auth.users(id),
  admin_notes           TEXT,
  -- Auth link (if user was logged in when submitting)
  user_id               UUID REFERENCES auth.users(id),
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  contacted_at          TIMESTAMPTZ,
  won_at                TIMESTAMPTZ,
  lost_at               TIMESTAMPTZ,
  lost_reason           TEXT
);

CREATE SEQUENCE request_seq;

CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.request_number := 'HSR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('request_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_request_number
  BEFORE INSERT ON renovation_requests
  FOR EACH ROW
  WHEN (NEW.request_number IS NULL OR NEW.request_number = '')
  EXECUTE FUNCTION generate_request_number();

CREATE TRIGGER renovation_requests_updated_at
  BEFORE UPDATE ON renovation_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_renovation_requests_status    ON renovation_requests(status);
CREATE INDEX idx_renovation_requests_city      ON renovation_requests(city);
CREATE INDEX idx_renovation_requests_created   ON renovation_requests(created_at DESC);
CREATE INDEX idx_renovation_requests_user      ON renovation_requests(user_id);

-- ── Site Visits ──────────────────────────────────────────────────────────────

CREATE TYPE site_visit_status AS ENUM (
  'requested', 'scheduled', 'completed', 'rescheduled', 'cancelled'
);

CREATE TABLE site_visits (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id            UUID NOT NULL REFERENCES renovation_requests(id),
  -- Scheduling
  scheduled_date        DATE,
  scheduled_time        TIME,
  address               TEXT,
  -- Assignment
  assigned_to           UUID REFERENCES auth.users(id),
  status                site_visit_status NOT NULL DEFAULT 'requested',
  -- Findings (post-visit)
  measurements          JSONB,
  site_notes            TEXT,
  scope_confirmed       TEXT,
  estimated_duration    TEXT,
  photo_urls            TEXT[] NOT NULL DEFAULT '{}',
  -- Timestamps
  rescheduled_reason    TEXT,
  cancellation_reason   TEXT,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER site_visits_updated_at
  BEFORE UPDATE ON site_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_site_visits_request  ON site_visits(request_id);
CREATE INDEX idx_site_visits_status   ON site_visits(status);
CREATE INDEX idx_site_visits_date     ON site_visits(scheduled_date);

-- ── Quotations ───────────────────────────────────────────────────────────────

CREATE TYPE quotation_status AS ENUM (
  'draft', 'sent', 'viewed', 'accepted', 'rejected', 'revision_requested', 'expired'
);

CREATE TABLE quotations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_number      TEXT NOT NULL UNIQUE, -- QTN-YYYYMMDD-XXXX
  request_id            UUID NOT NULL REFERENCES renovation_requests(id),
  site_visit_id         UUID REFERENCES site_visits(id),
  -- Customer
  customer_name         TEXT NOT NULL,
  customer_mobile       TEXT NOT NULL,
  customer_email        TEXT,
  project_address       TEXT NOT NULL,
  -- Project
  project_title         TEXT NOT NULL,
  project_scope         TEXT,
  -- Line items stored as JSONB array: [{description, qty, unit, rate, amount, category}]
  line_items            JSONB NOT NULL DEFAULT '[]',
  -- Financials
  subtotal              NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate              NUMERIC(5,2) NOT NULL DEFAULT 18,
  gst_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Payment schedule: [{milestone, percentage, amount, description}]
  payment_schedule      JSONB NOT NULL DEFAULT '[]',
  -- Meta
  status                quotation_status NOT NULL DEFAULT 'draft',
  validity_days         INTEGER NOT NULL DEFAULT 30,
  terms_and_conditions  TEXT,
  notes                 TEXT,
  -- Acceptance
  accepted_at           TIMESTAMPTZ,
  rejected_at           TIMESTAMPTZ,
  rejection_reason      TEXT,
  -- Timestamps
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at               TIMESTAMPTZ,
  viewed_at             TIMESTAMPTZ
);

CREATE SEQUENCE quotation_seq;

CREATE OR REPLACE FUNCTION generate_quotation_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.quotation_number := 'QTN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('quotation_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_quotation_number
  BEFORE INSERT ON quotations
  FOR EACH ROW
  WHEN (NEW.quotation_number IS NULL OR NEW.quotation_number = '')
  EXECUTE FUNCTION generate_quotation_number();

CREATE TRIGGER quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_quotations_request  ON quotations(request_id);
CREATE INDEX idx_quotations_status   ON quotations(status);
CREATE INDEX idx_quotations_created  ON quotations(created_at DESC);

-- ── Warranty / Service Requests ───────────────────────────────────────────────

CREATE TYPE warranty_request_status AS ENUM (
  'new', 'under_review', 'site_visit_required', 'in_progress', 'resolved', 'closed'
);

CREATE TABLE warranty_requests (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID REFERENCES bookings(id),
  quotation_id          UUID REFERENCES quotations(id),
  user_id               UUID NOT NULL REFERENCES auth.users(id),
  issue_category        TEXT NOT NULL,
  description           TEXT NOT NULL,
  photo_urls            TEXT[] NOT NULL DEFAULT '{}',
  preferred_visit_time  TEXT,
  status                warranty_request_status NOT NULL DEFAULT 'new',
  admin_notes           TEXT,
  resolution_notes      TEXT,
  resolved_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER warranty_requests_updated_at
  BEFORE UPDATE ON warranty_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE renovation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits         ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_requests   ENABLE ROW LEVEL SECURITY;

-- renovation_requests: anyone can insert (public form), users see their own
CREATE POLICY "renovation_requests: public insert"
  ON renovation_requests FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "renovation_requests: own read"
  ON renovation_requests FOR SELECT
  USING (user_id = auth.uid() OR current_user_role() = 'admin');

CREATE POLICY "renovation_requests: admin all"
  ON renovation_requests FOR ALL
  USING (current_user_role() = 'admin');

-- site_visits: admin only for create/update
CREATE POLICY "site_visits: admin all"
  ON site_visits FOR ALL
  USING (current_user_role() = 'admin');

CREATE POLICY "site_visits: customer read own"
  ON site_visits FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM renovation_requests WHERE user_id = auth.uid()
    )
  );

-- quotations: admin manages, customers can view their own and accept/reject
CREATE POLICY "quotations: admin all"
  ON quotations FOR ALL
  USING (current_user_role() = 'admin');

CREATE POLICY "quotations: customer read own"
  ON quotations FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM renovation_requests WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "quotations: customer accept"
  ON quotations FOR UPDATE
  USING (
    request_id IN (
      SELECT id FROM renovation_requests WHERE user_id = auth.uid()
    )
    AND status IN ('sent', 'viewed')
  );

-- warranty_requests: users see their own
CREATE POLICY "warranty_requests: own"
  ON warranty_requests FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "warranty_requests: admin all"
  ON warranty_requests FOR ALL
  USING (current_user_role() = 'admin');
