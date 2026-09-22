# HomeServe AI — Deployment Guide

## Prerequisites

- Supabase project created at https://supabase.com
- Razorpay account at https://razorpay.com (test keys for dev)
- Resend account at https://resend.com (free tier ≥ 100 emails/day)
- Twilio account at https://twilio.com (SMS + WhatsApp)
- Vercel account at https://vercel.com

---

## 1. Supabase Setup

1. Create a new Supabase project
2. Go to **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql` — full schema, RLS, triggers
   - `supabase/seeds/001_services.sql` — seed 70+ services

3. Enable Email Auth:
   - Dashboard → Authentication → Providers → Email → Enable

4. Collect these values from **Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← keep secret, server-side only
   ```

5. To create your first **admin** user:
   - Sign up normally via `/signup`
   - In Supabase SQL Editor, run:
     ```sql
     UPDATE user_profiles SET role = 'admin' WHERE user_id = '<your-user-id>';
     ```

---

## 2. Razorpay Setup

1. Log into Razorpay Dashboard → Settings → API Keys → Generate Test Keys
2. Collect:
   ```
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
   RAZORPAY_KEY_SECRET=xxxx              ← server-side only
   RAZORPAY_WEBHOOK_SECRET=xxxx          ← from Webhooks section
   ```

3. Configure webhook in Razorpay Dashboard:
   - URL: `https://your-domain.vercel.app/api/payments/razorpay/webhook`
   - Events to subscribe: `payment.captured`, `payment.failed`

---

## 3. Resend Setup

1. Sign up at resend.com → Add Domain (or use sandbox domain for testing)
2. Create an API key
3. Collect:
   ```
   RESEND_API_KEY=re_xxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

---

## 4. Twilio Setup

1. Sign up at twilio.com → Get a phone number
2. For WhatsApp: use Twilio Sandbox (WhatsApp → Sandbox)
3. Collect:
   ```
   TWILIO_ACCOUNT_SID=ACxxxx
   TWILIO_AUTH_TOKEN=xxxx
   TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   ← sandbox number
   ```

---

## 5. Vercel Deployment

### Option A: Deploy from GitHub (recommended)

1. Push repo to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Set **Root Directory** to `homeserve-ai`
4. Framework preset: **Next.js** (auto-detected)
5. Add all environment variables (see section 6)
6. Deploy

### Option B: Vercel CLI

```bash
cd homeserve-ai
npx vercel --prod
```

Follow prompts to link project and set env vars.

---

## 6. Environment Variables

Set all of these in Vercel Project Settings → Environment Variables:

| Variable | Description | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Server |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay publishable key | Public |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Server |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret | Server |
| `RESEND_API_KEY` | Resend API key | Server |
| `RESEND_FROM_EMAIL` | Sender email address | Server |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | Server |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Server |
| `TWILIO_PHONE_NUMBER` | Twilio SMS number (E.164) | Server |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp number | Server |
| `NEXT_PUBLIC_APP_URL` | Your production URL | Public |

---

## 7. Post-Deployment Checklist

- [ ] Visit `/` — landing page loads
- [ ] Visit `/signup` — create a homeowner account (public sign-up never offers a role)
- [ ] Promote one account to admin and one to contractor with `scripts/set-role.mjs` (see §12, item 7)
- [ ] Visit `/maintenance` — the service catalogue shows
- [ ] Create a test instant booking — Razorpay modal opens
- [ ] Admin assigns contractor from `/admin/bookings/[id]`
- [ ] Contractor marks job in-progress from `/contractor/jobs/[id]`
- [ ] Verify email notification sent via Resend
- [ ] Verify SMS sent via Twilio (if phone number set)
- [ ] Confirm Razorpay webhook delivers to `/api/payments/razorpay/webhook`

---

## 12. Home maintenance & memberships (launch configuration)

Migrations `011`–`015` add the maintenance catalogue, requests, memberships and payments.
Nothing is priced or switched on by default:

1. **Services** – `/admin/maintenance/services`: review the included / not-included wording and set
   indicative prices (blank shows "Quoted after inspection").
2. **Plans** – `/admin/maintenance/plans`: the Essential / Plus / Complete plans are inactive drafts with no
   price. Enter real prices and benefits, then switch a plan on. A plan cannot be activated without an annual price.
3. **Env** – set `CRON_SECRET` (any long random string) in Vercel. `vercel.json` schedules
   `/api/cron/memberships` daily (03:30 UTC) for term rollover and renewal/expiry emails.
4. **Payments** – memberships and request charges use the same Razorpay keys and webhook
   (`/api/payments/razorpay/webhook`) as renovation payments. Memberships are one-time annual orders; monthly /
   auto-debit billing needs Razorpay Subscriptions and is intentionally not enabled.
5. **Warranty** – on each project (`/admin/projects/[id]`) record the handover date and warranty period from the
   project agreement. Until then customers are told the terms are in their agreement.
6. **Email** – verify a Resend sending domain; with the sandbox sender, mail only reaches the Resend account owner.
7. **Admin and contractor accounts** – public sign-up only creates homeowners (the database ignores any role sent by the browser). HomeServe has one contractor, whose portal is `/contractor`. Set roles with the service-role key from `.env.local`:
   `node scripts/set-role.mjs you@example.com admin` (existing account), or add `"Full Name" "InitialPassword"` to create it;
   `node scripts/set-role.mjs site@example.com contractor "Full Name" "InitialPassword"` for the contractor.
8. **Offline payments** – `/admin/maintenance/[id]` records money received outside Razorpay (UPI, cash, cheque) with a
   reference, and `/admin/maintenance/memberships` can sell or grant a membership directly. Refunds: online payments are
   refunded through Razorpay (needs live keys); offline refunds are recorded in the system, and returning the money is done by HomeServe.
9. **Audit log** – `/admin/maintenance/audit` lists who changed prices, plans, warranty, payments and refunds. Entries are append-only.

## 8. Git Branching Strategy

```
main          ← production, auto-deploys to Vercel
develop       ← integration branch
feature/*     ← feature branches merged to develop
hotfix/*      ← critical fixes branched from main, merged to main + develop
```

### Workflow

```bash
# Start a feature
git checkout develop
git checkout -b feature/booking-reviews

# Merge when done
git checkout develop
git merge feature/booking-reviews

# Release to production
git checkout main
git merge develop
git tag v1.x.x
git push origin main --tags
```

---

## 9. Local Development

```bash
cd homeserve-ai
cp .env.local.example .env.local
# Fill in your dev credentials

npm install
npm run dev
# → http://localhost:3000
```

---

## 10. Running TypeScript Check

```bash
cd homeserve-ai
npx tsc --noEmit
```

---

## 11. Folder Structure

```
homeserve-ai/
├── src/
│   ├── app/                    # Next.js App Router pages + API routes
│   │   ├── page.tsx            # Landing page
│   │   ├── login/
│   │   ├── signup/
│   │   ├── homeowner/          # Homeowner portal
│   │   ├── admin/              # Admin portal
│   │   ├── contractor/         # Contractor portal
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # Shared primitives (Button, Card, Badge, Input)
│   │   ├── admin/              # Admin-specific components
│   │   ├── contractor/         # Contractor-specific components
│   │   └── homeowner/          # Homeowner-specific components
│   ├── lib/
│   │   ├── supabase/           # Client, server, admin Supabase clients
│   │   ├── razorpay/           # Razorpay order creation + verification
│   │   ├── notifications/      # Resend + Twilio notification dispatcher
│   │   ├── utils.ts            # Formatters, cn(), status helpers
│   │   └── validations/        # Zod schemas
│   ├── types/
│   │   ├── index.ts            # Shared TypeScript types
│   │   └── razorpay.d.ts       # Global Razorpay Window declaration
│   └── middleware.ts           # Role-based route guard
├── supabase/
│   ├── migrations/             # Full DB schema with RLS + triggers
│   └── seeds/                  # Service catalog seed data
├── .github/workflows/ci.yml    # GitHub Actions CI
├── .env.local.example
├── next.config.js
└── vercel.json
```
