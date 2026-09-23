# HomeServe — Supabase Configuration Audit

**Status:** The previous audit could not verify Supabase configuration because the connected account pointed to a different project. This document lists every setting that MUST be verified manually in the Supabase dashboard.

The code-side RLS, function, and storage policies have been audited through the migration files and are documented below. The items requiring dashboard verification are clearly marked.

---

## What Was Audited in Code (Migration Files)

### ✅ RLS Enabled
All tables have `ENABLE ROW LEVEL SECURITY` confirmed in migrations:
- `user_profiles` — migration 005
- `contractor_profiles` — migration 005
- `services` — migration 005
- `bookings` — migration 005
- `milestones` — migration 005
- `payments` — migration 005
- `notification_logs` — migration 005
- `reviews` — migration 015
- `renovation_requests` — migration 005
- `site_visits` — migration 005
- `quotations` — migration 005
- `warranty_requests` — migration 005
- `project_updates` — migration 004 + 005
- `project_messages` — migration 004 + 005
- `customer_properties` — migration 012
- `maintenance_services` — migration 012
- `maintenance_plans` — migration 012
- `maintenance_subscriptions` — migration 012
- `maintenance_requests` — migration 012
- `maintenance_visits` — migration 012
- `maintenance_request_events` — migration 012
- `maintenance_request_media` — migration 012
- `subscription_usage` — migration 012
- `maintenance_payments` — migration 012
- `support_tickets` — migration 022
- `support_ticket_messages` — migration 022
- `erasure_requests` — migration 028 (new)
- `erasure_audit_log` — migration 028 (new)
- `project_photos` — migration 027 (new)
- `admin_audit_log` — migration 026 (new)

### ✅ Policy Design
- End users get SELECT on their own rows only
- All mutations (INSERT/UPDATE/DELETE) by end users go through API routes using the service-role key
- Admin policies use `private.is_admin()` (SECURITY DEFINER, schema-qualified — not exploitable via search-path injection)
- Signup trigger (`handle_new_user`) only creates `homeowner` role — migration 018
- Role elevation is blocked by `guard_user_profiles` trigger

### ✅ Storage Buckets
Confirmed in migrations:
- `avatars` — public (avatar images), 2 MB limit, JPG/PNG/WebP only
- `project-media` — **private**, 15 MB limit, JPG/PNG/WebP/PDF
- `lead-attachments` — **private**, 10 MB limit, JPG/PNG/WebP/PDF
- `maintenance-media` — **private**, 8 MB limit, JPG/PNG/WebP

### ✅ Function Search Paths
All SECURITY DEFINER functions have explicit `SET search_path = public` or `SET search_path = ''`:
- `private.current_user_role()` — migration 005
- `private.is_admin()` — migration 005
- `private.is_service_context()` — migrations 007
- `private.is_privileged()` — migration 007
- `public.handle_new_user()` — migration 018
- `public.guard_user_profiles()` — migration 018
- `public.guard_contractor_profiles()` — migration 005
- `public.guard_quotations()` — migration 005
- `public.create_project_milestones()` — migration 005
- `public.update_contractor_stats()` — migration 005
- `public.generate_erasure_number()` — migration 028
- `public.execute_erasure()` — migration 028
- `public.enforce_retention_schedule()` — migration 029

### ✅ REVOKE on Trigger Functions
Trigger functions are REVOKEd from PUBLIC/anon/authenticated in migration 005 and subsequent migrations.

### ✅ execute_erasure RLS
`execute_erasure()` has `REVOKE EXECUTE FROM PUBLIC, anon, authenticated; GRANT EXECUTE TO service_role` — cannot be called as an RPC from the browser.

---

## What MUST Be Verified in the Supabase Dashboard

### Authentication Settings

**Location:** Supabase Dashboard → Authentication → Settings

| Setting | Required Value | Status |
|---------|---------------|--------|
| Email confirmations required | Enabled | **Verify manually** |
| Secure email change | Enabled | **Verify manually** |
| Minimum password length | ≥ 8 characters | **Verify manually** |
| Allow sign-ups | Enabled (customers need to sign up) | **Verify manually** |
| OAuth: Google | Enabled (app uses Google sign-in) | **Verify manually** |
| JWT expiry | Confirm value (recommend 3600s = 1 hour) | **Verify manually** |

### Multi-Factor Authentication

**Location:** Supabase Dashboard → Authentication → Multi-Factor Authentication

| Setting | Required Value | Status |
|---------|---------------|--------|
| TOTP factor | Enabled | **MUST enable before launch** |
| Admin user → Require MFA | Enabled for admin accounts | **MUST configure per admin user** |

### Rate Limits

**Location:** Supabase Dashboard → Authentication → Rate Limits

| Endpoint | Current Limit | Recommendation |
|----------|--------------|----------------|
| Sign up | (check) | 5/hour per IP is reasonable |
| Sign in | (check) | 10/hour per IP is reasonable |
| Magic link / OTP | (check) | 5/hour per email |
| Password reset | (check) | 3/hour per email |

The application's middleware rate-limiter only covers API routes — it does NOT protect Supabase Auth endpoints that are called directly by the browser (login, signup, forgot-password). Supabase dashboard rate limits are the ONLY protection for these.

### Database Settings

**Location:** Supabase Dashboard → Database → Settings

| Setting | Recommendation | Status |
|---------|---------------|--------|
| Connection pooling | PgBouncer mode: Transaction | **Verify manually** |
| SSL enforced | Yes | **Verify manually** |
| IPv6 disabled | For security, restrict to IPv4 where possible | **Verify manually** |
| Database password | Rotated recently? | **Rotate if not done** |

### Storage Bucket Visibility

**Location:** Supabase Dashboard → Storage → Buckets

Verify that the following buckets are **NOT** public:
- `project-media` — should be **Private**
- `lead-attachments` — should be **Private**
- `maintenance-media` — should be **Private**

The `avatars` bucket is intentionally public (avatar images are not sensitive PII in the same category as property photos).

### Exposed Tables via PostgREST

**Location:** Supabase Dashboard → API → (auto-generated docs)

Every table in the `public` schema is auto-exposed by PostgREST unless explicitly blocked. Verify:

- `admin_audit_log` — RLS enforced (admin only) ✅
- `erasure_requests` — RLS enforced ✅
- `erasure_audit_log` — RLS enforced (admin only) ✅
- `private.*` functions — NOT exposed (private schema, REVOKE on PUBLIC) ✅
- `execute_erasure` function — NOT callable as RPC (REVOKE from anon/authenticated) ✅
- `enforce_retention_schedule` — NOT callable as RPC ✅

Check that no unexpected tables have been created without RLS.

### SECURITY DEFINER Functions in public Schema

**Location:** Supabase Dashboard → Database → Functions (or SQL editor: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'`)

All functions in `public` that are SECURITY DEFINER must have:
1. `SET search_path = public` (or explicit schema) to prevent search-path injection
2. Appropriate REVOKE on trigger functions

Run this to verify:
```sql
SELECT p.proname, p.prosecdef,
       array_to_string(p.proconfig, ',') AS config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = TRUE
ORDER BY p.proname;
```

Expected result: Every row should have `search_path=public` (or `search_path=`) in its config.

### Service-Role Key Usage

**Location:** Supabase Dashboard → Settings → API

- The service-role key (SUPABASE_SERVICE_ROLE_KEY) is NEVER exposed to the browser
- It is only used in server-side API routes and server actions
- Verify the key has not been accidentally exposed in the Vercel deployment (check Vercel env vars — it should not be prefixed with NEXT_PUBLIC_)
- ✅ Confirmed in code: `src/lib/supabase/admin.ts` uses `SUPABASE_SERVICE_ROLE_KEY` (no NEXT_PUBLIC_ prefix)

---

## Settings That CANNOT Be Verified Without Dashboard Access

The following require direct Supabase dashboard access and **cannot be confirmed from code**:

1. Auth rate limits (actual configured values)
2. MFA enabled globally
3. Per-user MFA enforcement
4. JWT expiry value
5. Email confirmation enforcement
6. Google OAuth configuration (client ID / secret)
7. Database SSL enforcement
8. Connection pooling mode
9. Actual data region (AWS region)
10. Whether pg_audit is enabled
11. Current database password last-changed date
12. Whether any database extensions have been added that could expose data

---

## Manual Checklist for Owner

**Complete these before HomeServe processes customer data in production:**

- [ ] Enable TOTP MFA in Supabase Authentication settings
- [ ] For each admin account: Authentication → Users → Enable "Require MFA"
- [ ] Verify project-media, lead-attachments, maintenance-media buckets are Private
- [ ] Confirm Auth rate limits are configured
- [ ] Confirm email confirmations are required
- [ ] Confirm JWT expiry (recommend 3600 seconds)
- [ ] Confirm the data region (project is in which AWS region?)
- [ ] Rotate the database password if not recently rotated
- [ ] Verify no tables have been added outside migrations without RLS

---

*This document reflects the state of code-audited migrations. Dashboard settings require manual verification as documented above.*
