# HomeServe AI

**An AI-powered home renovation marketplace connecting homeowners with verified professionals across Delhi NCR.**

HomeServe AI is a full-stack, production-ready Next.js platform that manages the complete renovation lifecycle — from initial enquiry and site visit through quotation, project execution, milestone payments, and post-handover warranty support — for homeowners, contractors, and an admin operations team.

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution](#solution)
3. [Key Features](#key-features)
4. [User Roles & Portals](#user-roles--portals)
5. [Use Cases](#use-cases)
6. [Tech Stack](#tech-stack)
7. [Architecture Overview](#architecture-overview)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Getting Started](#getting-started)
11. [Environment Variables](#environment-variables)
12. [Deployment](#deployment)

---

## Problem Statement

The home renovation market in India is a ₹2,95,000 crore industry where the vast majority of transactions still happen offline, with no quality assurance, no payment protection, and no centralised coordination.

### Homeowner pain points

- **Trust deficit** — no standardised verification of professionals; fraud and overcharging are common.
- **Information asymmetry** — opaque, inconsistent pricing; 30%+ hidden costs discovered only after work begins; no reliable way to compare vendors.
- **Fragmented discovery** — renovation needs require coordinating 3–5 different vendors across 50+ platforms and offline channels; finding a reliable team takes 3–5 days.
- **Coordination complexity** — no centralised communication or project management tool; 40% of renovation projects are delayed.
- **Payment insecurity** — cash-dominated transactions with no escrow, no milestone protection, and no standardised invoicing.

### Contractor / professional pain points

- **Lead quality** — 15–25% of revenue spent on lead generation with only 10–15% lead-to-booking conversion.
- **Business management** — paper-based quotations, invoices, and contracts; 20+ hours per week on administration.
- **Payment delays** — average 30–45 day payment delay; high-risk cash collections.
- **No business tools** — no CRM, scheduling, analytics, or digital invoicing out of the box.

### The market gap

No single platform exists that covers the full spectrum — from inspiration and discovery to booking, project execution, milestone-based payments, and post-completion warranty — with verified professionals and real operational oversight.

HomeServe AI fills that gap.

---

## Solution

HomeServe AI is a **two-sided marketplace** with an internal operations layer, built around the complete renovation workflow:

```
Homeowner submits request
        ↓
Admin qualifies lead → schedules site visit
        ↓
Site visit completed → scope confirmed
        ↓
Admin builds and sends quotation
        ↓
Homeowner reviews and accepts quotation
        ↓
Advance payment collected → project starts
        ↓
Project tracked via milestone updates and photo logs
        ↓
Homeowner approves milestones → payments released
        ↓
Project completed → review submitted
        ↓
Post-handover warranty support
```

---

## Key Features

### Public / Marketing

| Feature | Details |
|---------|---------|
| Landing page | Hero section, service grid, before/after gallery, how-it-works, NCR location pages |
| Design inspiration library | 35+ curated interior design themes (Scandinavian, Japandi, Luxury Modern, Contemporary Indian, etc.) with room-by-room galleries, colour palettes, material guides, and budget tiers |
| Cost estimator | Interactive calculator giving indicative renovation cost ranges by property type, scope, and finish quality |
| Service pages | Dedicated SEO-optimised pages for each renovation service (kitchen, bathroom, flooring, painting, etc.) |
| Location pages | City-specific pages for Delhi, Noida, Gurugram, Ghaziabad, Greater Noida, Faridabad |
| FAQs | Structured FAQ with accordion UI |

### Authentication

| Feature | Details |
|---------|---------|
| Email + password signup / login | Via Supabase Auth. Public sign-up creates homeowners only — there is no role choice, and the database ignores any role sent by the browser |
| Role-based access control | `homeowner`, `contractor`, `admin` — enforced in Next.js middleware and Supabase RLS. HomeServe has a single contractor and an admin team; both accounts are set up with `scripts/set-role.mjs` |
| Email verification | Supabase magic link verification flow |
| Password reset | Forgot-password → email link → reset form |
| Auto profile creation | Database trigger creates `user_profiles` row on auth signup, always as `homeowner` |
| Role-based redirects | Middleware redirects users to their correct portal if they hit the wrong one |

### Homeowner Portal (`/homeowner`)

| Feature | Details |
|---------|---------|
| Dashboard | Overview of active projects, open requests, pending quotations, recent bookings |
| Renovation requests | Submit a new renovation request (property type, scope, budget range, timeline, city, contact details, optional inspiration theme) |
| My requests | Track all submitted requests with lead status pipeline |
| Quotations | View detailed quotations sent by admin; line-item breakdown with GST; accept or reject |
| Projects | Full project view: milestone timeline, project updates feed with photos, in-app messaging with HomeServe team |
| Milestone payments | Pay each milestone via Razorpay; advance payment, mid-project, and completion payments |
| Bookings | View all instant service bookings; booking detail with status history |
| Payments | Payment history across all projects and bookings |
| Warranty requests | Submit post-handover warranty / snag issues with photo uploads |
| Notifications | In-app notification centre (booking events, milestone updates, quotation activity) |
| Profile | Edit name, phone, city/state, avatar |
| Reviews | Submit and view star ratings and text reviews for completed bookings |

### Contractor Portal (`/contractor`)

| Feature | Details |
|---------|---------|
| Dashboard | Active jobs, upcoming schedule, recent activity |
| Jobs | Jobs HomeServe assigned to the contractor, with status; job detail with description, address, scheduled date |
| Job actions | Accept job, mark in-progress, mark complete |
| Profile | Name, contact details, specialisations, experience, availability |

### Admin Operations Panel (`/admin`)

| Feature | Details |
|---------|---------|
| Dashboard | Key metrics: open leads, active projects, pending quotations, revenue, bookings by status |
| Lead management | Full lead pipeline — new → contacted → qualified → site visit scheduled → quote sent → won/lost; assign leads; add admin notes; track lost reasons |
| Customer management | Browse all homeowner accounts; view individual customer detail with their full request and project history |
| Site visits | Schedule site visits against leads; record measurements, scope notes, photos, estimated duration |
| Quotation builder | Create and send itemised quotations — line items with qty/unit/rate, GST, discount, total, payment schedule milestones; manage quotation lifecycle (draft → sent → accepted/rejected) |
| Projects | Full project management: view all active and completed projects; post project updates with photos; send and read messages to/from homeowners |
| Bookings | View and manage all bookings; assign the site contractor; override booking status; add admin notes |
| Payments | Financial overview across all transactions; milestone payment approval |
| Services | Manage the service catalogue — add/edit/deactivate service categories |
| Users | View all users by role |

### Payments (Razorpay)

| Feature | Details |
|---------|---------|
| Razorpay Orders API | Creates a Razorpay order before initiating any payment |
| Milestone payments | Separate payment flows for advance (20%), mid-project (40%), and completion (40%) milestones |
| Booking payments | Full payment for instant service bookings |
| Webhook handler | Verified webhook endpoint processes `payment.captured` and `payment.failed` events; updates booking/payment status; triggers notifications |
| Payment records | Every transaction logged in `payments` table with Razorpay order ID, payment ID, amount, status, and raw webhook payload |
| Advance payment flow | Dedicated advance payment page for project bookings |

### Notifications

| Channel | Events |
|---------|--------|
| Email (Resend) | Booking created, confirmed, assigned, completed, cancelled; payment received/failed; milestone due |
| SMS | Critical events (booking confirmed, payment received) |
| In-app | All events surfaced in the notification centre |
| Audit log | Every notification attempt logged to `notification_logs` with status and provider ID |

### Design Inspiration Themes

35+ fully built-out interior design theme profiles including:
- Scandinavian, Japandi, Minimalist, Warm Minimalism
- Modern, Contemporary, Mid-Century Modern
- Luxury Modern, Nordic Luxury, Dark Luxury, Soft Luxury
- Industrial, Urban Loft, California Modern
- Traditional Indian, Contemporary Indian
- Bohemian, Moroccan, Mediterranean, Coastal, Tropical
- Art Deco, Neo Classical, French Country, Rustic, Farmhouse
- Wabi Sabi, Zen, Earthy Organic, Sustainable, Smart Home
- Monochrome, Vintage, Cottage

Each theme includes: cover image, gallery, colour palette with paint codes, materials list, furniture recommendations, lighting guide, room-by-room galleries (Living Room, Bedroom, Kitchen, Bathroom, Dining, Home Office), budget tiers (basic → ultra-luxury), philosophy, history, key characteristics, best-for guide, pros/cons, and similar themes.

---

## User Roles & Portals

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│  HOMEOWNER   │     │  CONTRACTOR    │     │     ADMIN        │
│  /homeowner  │     │  /contractor   │     │  /admin          │
│              │     │                │     │                  │
│ - Requests   │     │ - Dashboard    │     │ - Leads          │
│ - Quotations │     │ - Jobs         │     │ - Site visits    │
│ - Projects   │     │ - Profile      │     │ - Quotations     │
│ - Payments   │     │                │     │ - Projects       │
│ - Warranty   │     │                │     │ - Bookings       │
│ - Reviews    │     │                │     │ - Maintenance    │
│ - Membership │     │                │     │ - Payments       │
│ - History    │     │                │     │ - Services       │
└──────────────┘     └────────────────┘     └──────────────────┘
```

Role assignment happens at signup via `raw_user_meta_data.role` and is stored in `user_profiles.role`. Supabase Row Level Security policies enforce data isolation between roles on every table. Next.js middleware enforces route-level access and redirects users to their correct portal.

---

## Use Cases

### UC-1: Homeowner submits a renovation request

1. Homeowner visits `/get-started`
2. Fills the `RenovationRequestForm` — property type, city, locality, renovation scope (checkboxes), budget range, preferred timeline, contact details, optional design inspiration theme
3. Request is saved to `renovation_requests` with status `new` and a generated reference number (`HSR-YYYYMMDD-XXXX`)
4. Admin sees the new lead on `/admin/leads`

### UC-2: Admin qualifies a lead and schedules a site visit

1. Admin opens the lead detail on `/admin/leads/[id]`
2. Changes status to `contacted` → `qualified` → `site_visit_scheduled`
3. Creates a site visit record on `/admin/site-visits/new` — assigns a team member, sets date/time and address
4. After the visit, admin updates the record with measurements, scope notes, and photos via the `SiteVisitForm`
5. Lead status advances to `site_visit_completed`

### UC-3: Admin creates and sends a quotation

1. Admin navigates to `/admin/quotations/new`
2. Uses the `QuotationBuilder` to add line items (description, qty, unit, rate) grouped by category
3. System calculates subtotal, 18% GST, and total
4. Admin adds a payment schedule (advance %, mid-project %, completion %)
5. Sets validity and terms; sends quotation — status changes from `draft` to `sent`
6. Homeowner receives notification

### UC-4: Homeowner accepts a quotation and makes the advance payment

1. Homeowner opens `/homeowner/quotations/[id]`
2. Reviews line items, payment schedule, and terms
3. Clicks "Accept Quotation" via `QuotationAccept` component — quotation status becomes `accepted`
4. Homeowner is directed to `/homeowner/projects/advance-payment`
5. `AdvancePaymentButton` calls `/api/payments` to create a Razorpay order for the advance amount
6. Razorpay checkout opens; on success, webhook fires and updates the booking/payment status
7. Project status advances to `confirmed`

### UC-5: Project execution with milestone tracking

1. Admin posts project updates (progress photos, milestone notes) via `/admin/projects/[id]`
2. Updates are visible to the homeowner at `/homeowner/projects/[id]` via `ProjectUpdatesSection`
3. Homeowner and HomeServe team exchange messages via the `ProjectMessagesSection` (in-app chat with file attachments)
4. When a milestone is reached, the contractor marks it complete; admin approves
5. Homeowner receives a payment notification for the next milestone amount
6. `MilestonePaymentPanel` shows the current milestone and payment CTA; Razorpay payment is initiated

### UC-6: Instant service booking (plumbing, electrical, etc.)

1. Homeowner browses `/maintenance` → selects a service
2. Fills the request form — preferred date and time, address, description
3. Legacy bookings made earlier remain visible under `/homeowner/bookings`
4. Makes full payment via Razorpay
5. Admin assigns the site contractor on `/admin/bookings/[id]` using `AssignContractorForm`
6. Contractor sees the job on `/contractor/jobs`; accepts and marks complete via `JobActions`
7. On completion, homeowner is prompted to leave a review via `ReviewForm`

### UC-7: Contractor account

1. There is no contractor sign-up. An admin runs `node scripts/set-role.mjs <email> contractor` for HomeServe's own contractor
2. The contractor signs in and lands on `/contractor/dashboard`
3. Only jobs HomeServe assigns appear on `/contractor/jobs`

### UC-8: Warranty claim submission

1. Homeowner navigates to `/homeowner/warranty/new`
2. Fills the `WarrantyForm` — issue category, description, photo uploads, preferred visit time
3. Record saved to `warranty_requests` with status `new`
4. Admin reviews and resolves via the admin panel

### UC-9: Design theme browsing and renovation inspiration

1. User browses `/themes` — grid of 35+ themes with cover images, tags, and saved counts
2. Opens a theme (e.g., `/themes/japandi`) — full detail with gallery carousel, colour palette, materials, furniture, lighting, room-by-room inspiration
3. Each theme displays budget tiers and estimated timeline
4. CTA links to `/get-started` with the chosen theme pre-filled in the renovation request

### UC-10: Cost estimation

1. User visits `/estimate`
2. `EstimateCalculator` collects property type, BHK size, renovation scope, and finish quality
3. Returns an indicative cost range
4. CTA nudges user toward a formal site visit and quotation

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS with custom design tokens (cobalt, stone palette) |
| Auth | Supabase Auth (email/password, magic links, JWT sessions) |
| Database | Supabase (PostgreSQL) with Row Level Security |
| File storage | Supabase Storage (project photos, warranty images, site visit photos) |
| Payments | Razorpay (Orders API, Checkout SDK, Webhooks) |
| Notifications | Resend (email) + SMS provider (MSG91 / Twilio) |
| Deployment | Vercel |
| CI | GitHub Actions |

---

## Architecture Overview

```
Browser / Client
       │
       ▼
Next.js App Router (Vercel Edge)
  ├── Middleware (auth check + role-based routing)
  ├── Server Components (data fetching via Supabase server client)
  ├── Client Components (interactive UI, Razorpay checkout)
  └── Route Handlers (/api/*)
           │
           ├── Supabase (PostgreSQL + Auth + Storage)
           │     ├── Row Level Security per role
           │     ├── Database functions + triggers
           │     └── Realtime (optional)
           │
           ├── Razorpay
           │     ├── Orders API (server-side)
           │     ├── Checkout JS (client-side)
           │     └── Webhook → /api/payments/razorpay/webhook
           │
           └── Notification providers
                 ├── Resend (email)
                 └── SMS gateway
```

**Supabase client pattern:**
- [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts) — server-side client using SSR cookies (for Server Components and Route Handlers)
- [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts) — browser client (for Client Components)
- [`src/lib/supabase/admin.ts`](src/lib/supabase/admin.ts) — service-role client (for privileged server operations, bypasses RLS)

---

## Database Schema

Four migration files define the complete schema:

### Core tables (`001_initial_schema.sql`)

| Table | Purpose |
|-------|---------|
| `user_profiles` | One row per auth user; stores role, name, phone, city |
| `contractor_profiles` | Extended profile for contractor users; specialisations, experience, rating, verification status |
| `services` | Service catalogue — 22 categories with base pricing and duration |
| `bookings` | Core booking record (instant and project types); status machine from `pending` → `completed` |
| `milestones` | 3 milestones per project booking (20% / 40% / 40%); auto-created by trigger on project booking insert |
| `payments` | Razorpay transaction records; one per payment attempt |
| `reviews` | Post-completion ratings (1–5 stars + comment); triggers rating recalculation on contractor profile |
| `notification_logs` | Audit log of every notification sent |

### Renovation operations (`002_renovation_requests.sql`)

| Table | Purpose |
|-------|---------|
| `renovation_requests` | Lead capture form — property details, scope, budget, timeline, contact, lead status pipeline |
| `site_visits` | Site visit records linked to requests — scheduling, measurements, photos |
| `quotations` | Detailed quotations — line items (JSONB), GST, payment schedule (JSONB), lifecycle status |
| `warranty_requests` | Post-handover warranty / snag claims |

### Booking-request bridge (`003_renovation_booking_bridge.sql`)

Links confirmed quotations to the booking system so project bookings can reference their originating request and quotation.

### Project communication (`004_project_updates.sql`)

| Table | Purpose |
|-------|---------|
| `project_updates` | Progress photos and notes posted by HomeServe team; categorised as before/progress/milestone/completion |
| `project_messages` | Bidirectional in-app messaging between homeowner and HomeServe operations team |

### Key database features

- **Auto-generated reference numbers** — triggers generate `HSA-YYYYMMDD-XXXX` (bookings), `HSR-YYYYMMDD-XXXX` (renovation requests), `QTN-YYYYMMDD-XXXX` (quotations)
- **Auto-create milestones** — trigger fires on project booking insert to create the three standard milestones
- **Auto-update contractor stats** — trigger on review insert recalculates average rating and total job count on contractor profile
- **Row Level Security** — every table has RLS enabled with role-specific policies so homeowners see only their own data, contractors see only their assigned jobs, and admins see everything
- **`pg_trgm` extension** — enabled for fuzzy text search on vendor/service queries

---

## API Reference

All route handlers live under `src/app/api/`.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET/POST | `/api/services` | List active services / admin create | Public / Admin |
| GET/PUT/DELETE | `/api/services/[id]` | Service detail operations | Admin |
| GET/POST | `/api/bookings` | List homeowner bookings / create booking | Homeowner |
| GET/PUT | `/api/bookings/[id]` | Booking detail / update | Role-gated |
| PATCH | `/api/bookings/[id]/status` | Update booking status | Contractor / Admin |
| GET | `/api/admin` | Admin metrics / user management | Admin |
| GET/POST | `/api/payments` | Create Razorpay order | Auth |
| POST | `/api/payments/milestone` | Create milestone payment order | Homeowner |
| POST | `/api/payments/razorpay/webhook` | Razorpay webhook handler | HMAC signed |
| GET/POST | `/api/reviews` | List / create reviews | Homeowner |
| GET | `/api/notifications` | List notifications for current user | Auth |
| GET/POST | `/api/renovation-requests` | Create request (public) / list (admin) | Public / Admin |
| GET/PATCH | `/api/renovation-requests/[id]` | Get / update request status | Auth |
| GET/POST | `/api/quotations` | List quotations / admin create | Auth |
| GET/PATCH | `/api/quotations/[id]` | Quotation detail / update | Auth |
| POST | `/api/quotations/[id]/accept` | Accept a quotation | Homeowner |
| GET/POST | `/api/site-visits` | List / create site visits | Admin |
| GET/POST | `/api/project-updates` | List / post project updates | Auth |
| GET/POST | `/api/project-messages` | List / send project messages | Auth |
| POST | `/api/warranty-requests` | Submit warranty claim | Homeowner |
| POST | `/api/auth/signout` | Sign out and clear session | Auth |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode is fine for development)

### 1. Clone and install

```bash
git clone <repo-url>
cd homeserve-ai
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in all values — see [Environment Variables](#environment-variables) below.

### 3. Run database migrations

Open your Supabase project's SQL editor and run the migration files in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_renovation_requests.sql
supabase/migrations/003_renovation_booking_bridge.sql
supabase/migrations/004_project_updates.sql
```

Then seed the services catalogue:

```
supabase/seeds/001_services.sql
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

# Notifications
RESEND_API_KEY=re_...
SMS_API_KEY=...
SMS_SENDER_ID=HOMESR

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

See [`.env.local.example`](.env.local.example) for the full list.

---

## Deployment

The project is configured for zero-config deployment on Vercel. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full step-by-step guide including:

- Vercel project setup and environment variable configuration
- Supabase production configuration (Auth redirect URLs, storage bucket policies)
- Razorpay webhook URL registration
- Custom domain setup
- CI/CD via GitHub Actions (`.github/workflows/ci.yml`)

---

## Project Structure

```
src/
├── app/
│   ├── (marketing)       — /, /services, /themes, /estimate, /how-it-works, etc.
│   ├── admin/            — Admin operations portal
│   ├── contractor/       — Contractor portal
│   ├── homeowner/        — Homeowner portal
│   ├── api/              — Route handlers
│   └── auth/             — Auth callbacks, email verification, password reset
├── components/
│   ├── admin/            — Admin-specific components
│   ├── contractor/       — Contractor-specific components
│   ├── homeowner/        — Homeowner-specific components
│   ├── shared/           — Navigation, layout
│   ├── themes/           — Design theme carousel and cards
│   ├── services/         — Service page component
│   └── ui/               — Base UI primitives (button, card, input, badge, etc.)
├── lib/
│   ├── supabase/         — Supabase client factories (server, client, admin)
│   ├── razorpay/         — Razorpay order creation and webhook verification
│   ├── notifications/    — Email and SMS notification helpers
│   ├── themes/           — Theme data and types
│   ├── services/         — Service data
│   ├── mock/             — Mock data for development
│   └── validations/      — Zod validation schemas
├── types/
│   ├── index.ts          — All shared TypeScript types and enums
│   └── razorpay.d.ts     — Razorpay SDK type declarations
└── middleware.ts          — Auth + role-based route protection
supabase/
├── migrations/           — SQL migration files
└── seeds/                — Seed data for services
```

---

## Booking Status Machine

```
pending
  └─► payment_pending
        └─► confirmed
              └─► assigned
                    └─► in_progress
                          ├─► milestone_1_done  (project only)
                          │     └─► milestone_2_done
                          │           └─► completed
                          └─► completed          (instant)
                                └─► [reviewed]

Any status → cancelled
Any status → refunded
```

---

## Quotation Lifecycle

```
draft → sent → viewed → accepted ──► [project created]
                       └─► rejected
                       └─► revision_requested → draft
           └─► expired
```

---

## Lead Pipeline

```
new → contacted → qualified → site_visit_scheduled
                                    └─► site_visit_completed
                                              └─► quote_preparation
                                                        └─► quote_sent
                                                                └─► negotiation
                                                                        ├─► won
                                                                        └─► lost
```

---

## Payment Structure

For project bookings, payments are split into three milestones:

| Milestone | Trigger | Percentage |
|-----------|---------|-----------|
| Advance / Mobilisation | Quotation accepted | 20% |
| Mid-project / Work in Progress | Milestone 2 approved | 40% |
| Completion / Handover | Final milestone approved | 40% |

Instant bookings are paid in full at the time of booking.

All payments flow through Razorpay. Webhooks update `payments` and `bookings` tables in real time and trigger notifications to both the homeowner and admin team.

---

## Home maintenance

HomeServe also sells one-off home-maintenance services and an optional membership to homes in Delhi NCR
(`/maintenance`, customer area under `/homeowner/maintenance`, `/homeowner/membership`, `/homeowner/history`;
admin under `/admin/maintenance`). Service and plan prices, visits, discounts, credits and caps are configured in
the database from the admin screens — nothing is hard-coded. Warranty (renovation agreement) and maintenance
(paid upkeep) are kept separate throughout. See `DEPLOYMENT.md` §12 for launch configuration.

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a pull request

Please follow the existing code style — TypeScript strict mode, named exports, Server Components by default (Client Components only when interactivity is required).

---

## Licence

Private — all rights reserved. Not licensed for redistribution or commercial use without explicit written permission.
