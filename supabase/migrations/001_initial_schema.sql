-- ============================================================
-- HomeServe AI — Complete Database Schema
-- Migration: 001_initial_schema.sql
-- Run in Supabase SQL Editor or via supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- for fuzzy search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('homeowner', 'contractor', 'admin');

CREATE TYPE contractor_type AS ENUM ('employed', 'marketplace');

CREATE TYPE booking_type AS ENUM ('instant', 'project');

CREATE TYPE booking_status AS ENUM (
  'pending',
  'payment_pending',
  'confirmed',
  'assigned',
  'in_progress',
  'milestone_1_done',
  'milestone_2_done',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE milestone_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'approved'
);

CREATE TYPE payment_status AS ENUM (
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded'
);

CREATE TYPE payment_type AS ENUM (
  'booking_full',
  'milestone_1',
  'milestone_2',
  'milestone_3'
);

CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp');

CREATE TYPE notification_event AS ENUM (
  'booking_created',
  'booking_confirmed',
  'booking_assigned',
  'booking_started',
  'milestone_completed',
  'milestone_payment_due',
  'booking_completed',
  'booking_cancelled',
  'payment_received',
  'payment_failed'
);

CREATE TYPE service_category AS ENUM (
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Painting',
  'Civil Work',
  'Interior Design',
  'Modular Kitchen',
  'Home Cleaning',
  'Pest Control',
  'False Ceiling',
  'Flooring',
  'Waterproofing',
  'AC Repair',
  'Appliance Repair',
  'Deep Cleaning',
  'Bathroom Remodeling',
  'Kitchen Remodeling',
  'CCTV Installation',
  'Solar Installation',
  'Smart Home',
  'Gardening & Landscaping',
  'Custom Furniture'
);

CREATE TYPE price_unit AS ENUM ('fixed', 'per_sqft', 'per_hour', 'per_unit');

-- ============================================================
-- TABLE: user_profiles
-- One row per authenticated Supabase user
-- ============================================================

CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'homeowner',
  full_name     TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  city          TEXT,
  state         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id  ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_role     ON user_profiles(role);

-- ============================================================
-- TABLE: contractor_profiles
-- Extended profile for users with role = 'contractor'
-- ============================================================

CREATE TABLE contractor_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  contractor_type     contractor_type NOT NULL DEFAULT 'marketplace',
  specializations     service_category[] NOT NULL DEFAULT '{}',
  experience_years    INTEGER NOT NULL DEFAULT 0,
  bio                 TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  is_available        BOOLEAN NOT NULL DEFAULT TRUE,
  rating              NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_jobs          INTEGER NOT NULL DEFAULT 0,
  city                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractor_profiles_user_id    ON contractor_profiles(user_id);
CREATE INDEX idx_contractor_profiles_available  ON contractor_profiles(is_available);
CREATE INDEX idx_contractor_profiles_city       ON contractor_profiles(city);

-- ============================================================
-- TABLE: services
-- The 22 service types with pricing info
-- ============================================================

CREATE TABLE services (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category              service_category NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT NOT NULL,
  base_price            NUMERIC(12,2) NOT NULL DEFAULT 0,
  price_unit            price_unit NOT NULL DEFAULT 'fixed',
  min_duration_hours    NUMERIC(5,2) NOT NULL DEFAULT 1,
  max_duration_hours    NUMERIC(5,2) NOT NULL DEFAULT 8,
  image_url             TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order            INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_category  ON services(category);
CREATE INDEX idx_services_active    ON services(is_active);

-- ============================================================
-- TABLE: bookings
-- Core booking record — supports both instant and project types
-- ============================================================

CREATE TABLE bookings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number        TEXT NOT NULL UNIQUE,  -- HSA-YYYYMMDD-XXXX
  homeowner_id          UUID NOT NULL REFERENCES auth.users(id),
  contractor_id         UUID REFERENCES auth.users(id),
  service_id            UUID NOT NULL REFERENCES services(id),
  service_category      service_category NOT NULL,
  booking_type          booking_type NOT NULL DEFAULT 'instant',
  status                booking_status NOT NULL DEFAULT 'pending',
  description           TEXT NOT NULL,
  address               TEXT NOT NULL,
  city                  TEXT NOT NULL,
  scheduled_date        DATE NOT NULL,
  scheduled_time        TIME NOT NULL,
  total_amount          NUMERIC(12,2) NOT NULL,
  paid_amount           NUMERIC(12,2) NOT NULL DEFAULT 0,
  razorpay_order_id     TEXT,
  razorpay_payment_id   TEXT,
  admin_notes           TEXT,
  cancellation_reason   TEXT,
  cancelled_at          TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bookings_homeowner    ON bookings(homeowner_id);
CREATE INDEX idx_bookings_contractor   ON bookings(contractor_id);
CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_bookings_number       ON bookings(booking_number);
CREATE INDEX idx_bookings_created      ON bookings(created_at DESC);
CREATE INDEX idx_bookings_scheduled    ON bookings(scheduled_date);

-- Auto-generate booking number: HSA-YYYYMMDD-0001
CREATE SEQUENCE booking_seq;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'HSA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('booking_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.booking_number IS NULL OR NEW.booking_number = '')
  EXECUTE FUNCTION generate_booking_number();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER contractor_profiles_updated_at
  BEFORE UPDATE ON contractor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: milestones
-- Only created for booking_type = 'project'
-- 3 milestones: 20% / 40% / 40%
-- ============================================================

CREATE TABLE milestones (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id        UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  milestone_number  SMALLINT NOT NULL CHECK (milestone_number IN (1, 2, 3)),
  title             TEXT NOT NULL,
  description       TEXT,
  percentage        SMALLINT NOT NULL CHECK (percentage IN (20, 40)),
  amount            NUMERIC(12,2) NOT NULL,
  status            milestone_status NOT NULL DEFAULT 'pending',
  completed_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  notes             TEXT,
  UNIQUE(booking_id, milestone_number)
);

CREATE INDEX idx_milestones_booking ON milestones(booking_id);
CREATE INDEX idx_milestones_status  ON milestones(status);

-- ============================================================
-- TABLE: payments
-- One row per Razorpay order / payment attempt
-- ============================================================

CREATE TABLE payments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id            UUID NOT NULL REFERENCES bookings(id),
  milestone_id          UUID REFERENCES milestones(id),
  razorpay_order_id     TEXT NOT NULL UNIQUE,
  razorpay_payment_id   TEXT,
  amount                NUMERIC(12,2) NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'INR',
  status                payment_status NOT NULL DEFAULT 'created',
  payment_type          payment_type NOT NULL,
  razorpay_signature    TEXT,
  raw_webhook_payload   JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_booking           ON payments(booking_id);
CREATE INDEX idx_payments_razorpay_order    ON payments(razorpay_order_id);
CREATE INDEX idx_payments_razorpay_payment  ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status            ON payments(status);

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TABLE: notification_logs
-- Audit trail for every notification sent
-- ============================================================

CREATE TABLE notification_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id),
  booking_id    UUID REFERENCES bookings(id),
  event         notification_event NOT NULL,
  channel       notification_channel NOT NULL,
  recipient     TEXT NOT NULL,  -- email address, phone number
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  provider_id   TEXT,           -- Resend ID or Twilio SID
  error         TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_user     ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_booking  ON notification_logs(booking_id);
CREATE INDEX idx_notification_logs_event    ON notification_logs(event);

-- ============================================================
-- TABLE: reviews
-- Post-completion review by homeowner for a booking
-- ============================================================

CREATE TABLE reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL UNIQUE REFERENCES bookings(id),
  homeowner_id  UUID NOT NULL REFERENCES auth.users(id),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_contractor ON reviews(contractor_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services            ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews             ENABLE ROW LEVEL SECURITY;

-- Helper: get the current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- user_profiles ----

-- Users can read their own profile
CREATE POLICY "user_profiles: own read"
  ON user_profiles FOR SELECT
  USING (user_id = auth.uid());

-- Users can update their own profile
CREATE POLICY "user_profiles: own update"
  ON user_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Users can insert their own profile (once, via trigger or onboarding)
CREATE POLICY "user_profiles: own insert"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "user_profiles: admin read all"
  ON user_profiles FOR SELECT
  USING (current_user_role() = 'admin');

-- Homeowners and admins can read contractor profiles (for booking)
CREATE POLICY "user_profiles: homeowner read contractors"
  ON user_profiles FOR SELECT
  USING (
    role = 'contractor'
    AND (auth.uid() IS NOT NULL)
  );

-- ---- contractor_profiles ----

CREATE POLICY "contractor_profiles: own read/update"
  ON contractor_profiles FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "contractor_profiles: admin all"
  ON contractor_profiles FOR ALL
  USING (current_user_role() = 'admin');

CREATE POLICY "contractor_profiles: public read active"
  ON contractor_profiles FOR SELECT
  USING (is_verified = TRUE);

-- ---- services ----

-- Everyone can read active services
CREATE POLICY "services: public read active"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- Admin can manage all
CREATE POLICY "services: admin all"
  ON services FOR ALL
  USING (current_user_role() = 'admin');

-- ---- bookings ----

-- Homeowners see their own bookings
CREATE POLICY "bookings: homeowner own"
  ON bookings FOR ALL
  USING (homeowner_id = auth.uid());

-- Contractors see bookings assigned to them
CREATE POLICY "bookings: contractor assigned"
  ON bookings FOR SELECT
  USING (contractor_id = auth.uid());

-- Contractors can update status on their bookings
CREATE POLICY "bookings: contractor update status"
  ON bookings FOR UPDATE
  USING (contractor_id = auth.uid());

-- Admin sees all
CREATE POLICY "bookings: admin all"
  ON bookings FOR ALL
  USING (current_user_role() = 'admin');

-- ---- milestones ----

-- Booking participants see milestones
CREATE POLICY "milestones: booking participant"
  ON milestones FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings
      WHERE homeowner_id = auth.uid() OR contractor_id = auth.uid()
    )
  );

CREATE POLICY "milestones: contractor update"
  ON milestones FOR UPDATE
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE contractor_id = auth.uid()
    )
  );

CREATE POLICY "milestones: admin all"
  ON milestones FOR ALL
  USING (current_user_role() = 'admin');

-- ---- payments ----

-- Homeowners see their own payments
CREATE POLICY "payments: homeowner read own"
  ON payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE homeowner_id = auth.uid()
    )
  );

-- Admin sees all
CREATE POLICY "payments: admin all"
  ON payments FOR ALL
  USING (current_user_role() = 'admin');

-- ---- notification_logs ----

CREATE POLICY "notification_logs: own read"
  ON notification_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notification_logs: admin all"
  ON notification_logs FOR ALL
  USING (current_user_role() = 'admin');

-- ---- reviews ----

CREATE POLICY "reviews: homeowner own"
  ON reviews FOR ALL
  USING (homeowner_id = auth.uid());

CREATE POLICY "reviews: public read"
  ON reviews FOR SELECT
  USING (TRUE);

CREATE POLICY "reviews: admin all"
  ON reviews FOR ALL
  USING (current_user_role() = 'admin');

-- ============================================================
-- FUNCTION: auto-create user_profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'homeowner'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: auto-create milestones for project bookings
-- 20% (booking) / 40% (midpoint) / 40% (completion)
-- ============================================================

CREATE OR REPLACE FUNCTION create_project_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_type = 'project' AND (OLD IS NULL OR OLD.booking_type != 'project') THEN
    INSERT INTO milestones (booking_id, milestone_number, title, percentage, amount) VALUES
      (NEW.id, 1, 'Project Start / Mobilisation', 20, ROUND(NEW.total_amount * 0.20, 2)),
      (NEW.id, 2, 'Work in Progress / Mid Review', 40, ROUND(NEW.total_amount * 0.40, 2)),
      (NEW.id, 3, 'Completion & Handover',         40, ROUND(NEW.total_amount * 0.40, 2));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_milestones
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_project_milestones();

-- ============================================================
-- FUNCTION: update contractor stats after review
-- ============================================================

CREATE OR REPLACE FUNCTION update_contractor_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating NUMERIC;
  job_count  INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO avg_rating, job_count
  FROM reviews WHERE contractor_id = NEW.contractor_id;

  UPDATE contractor_profiles
  SET rating = ROUND(avg_rating, 2), total_jobs = job_count
  WHERE user_id = NEW.contractor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_stats();
