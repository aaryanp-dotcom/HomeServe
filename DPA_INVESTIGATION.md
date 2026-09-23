# HomeServe — Third-Party Data Processing Agreements (DPA) Investigation

**Date checked:** June 2025  
**Status:** Investigation only — no DPAs have been executed or verified as executed.

---

## Overview

HomeServe processes customer personal data using five external vendors. Under the Digital Personal Data Protection Act (DPDP) 2023, HomeServe as Data Fiduciary is responsible for ensuring that Data Processors handle personal data in compliance with the Act and under binding contractual terms.

This document inventories each vendor's data processing, applicable terms, and the actions required.

---

## Vendor Matrix

| Vendor | Data Processed | Purpose | DPA/Terms | Data Region | Sub-processors | Action Required | Status |
|--------|---------------|---------|-----------|-------------|----------------|-----------------|--------|
| **Supabase** | Names, emails, phones, addresses, project data, payment references, auth tokens, IP addresses | Database, authentication, storage | Supabase DPA available at supabase.com/privacy (requires acceptance) | US (AWS us-east-1 by default) | AWS | Accept Supabase DPA; confirm data region | **Requires business/legal action** |
| **Razorpay** | Payment amounts, order IDs, customer names (for payment) | Payment processing | Razorpay ToS includes data processing terms; separate DPA may be available via account manager | India (compliant with RBI) | Banks, payment networks | Confirm data processing terms with Razorpay account manager | **Requires business/legal action** |
| **Resend** | Customer email addresses, names, project notification content | Transactional email delivery | Resend Privacy Policy at resend.com/privacy; DPA available upon request | US (AWS) | AWS SES | Request and sign Resend DPA | **Requires business/legal action** |
| **Twilio** | Customer phone numbers, message content | SMS/WhatsApp notifications | Twilio DPA available at twilio.com/legal/data-protection-addendum | US (configurable) | Carrier networks | Accept Twilio DPA | **Requires business/legal action** |
| **Vercel** | All data transiting the application, env variables holding secrets | Hosting, serverless functions, CDN | Vercel DPA available at vercel.com/legal/dpa | US (configurable) | AWS, Cloudflare | Accept Vercel DPA | **Requires business/legal action** |

---

## Detailed Vendor Analysis

### 1. Supabase

**Data processed:**
- User accounts: email, password (hashed), Google OAuth tokens
- Profile data: full name, phone number, city, state
- Project data: renovation requests, bookings, milestones, quotations
- Financial references: Razorpay order IDs, payment IDs (not card data)
- Communications: project messages, support tickets, notification logs
- Storage: project photos (project-media), maintenance photos, avatars
- Auth events: sign-in timestamps, IP addresses (Supabase Auth logs)

**Why processed:** Core application database and authentication platform

**Data stored:** All of the above, indefinitely unless deleted

**Applicable terms:**
- Supabase Terms of Service: https://supabase.com/terms
- Supabase Privacy Policy: https://supabase.com/privacy
- Supabase DPA: Available at https://supabase.com/legal/dpa (must be accepted/signed)

**Data region:**
- Default: AWS us-east-1 (Northern Virginia, USA)
- International transfer: Yes — data leaves India by default
- Configurable: Supabase supports EU region; India region not confirmed as of June 2025
- Action: Confirm data region; consider EU region to reduce international transfer scope

**Sub-processors:** AWS (listed in Supabase's sub-processor list at supabase.com/legal/subprocessors)

**Security commitments:** SOC 2 Type II (confirm current certification), encryption at rest and in transit

**Breach obligations:** Supabase commits to notifying customers of security incidents per their DPA

**Action required:**
- [ ] Accept the Supabase DPA at https://supabase.com/legal/dpa (organisation-level acceptance)
- [ ] Confirm which AWS region the project uses (Supabase dashboard → Project Settings → Infrastructure)
- [ ] Review and enable any available data residency options
- [ ] Add Supabase as a sub-processor in HomeServe's privacy policy (done — listed in privacy policy)

**Status: REQUIRES BUSINESS/LEGAL ACTION — DPA not yet accepted**

---

### 2. Razorpay

**Data processed:**
- Payment amounts (INR)
- Razorpay order IDs and payment IDs
- Customer name/email sent in order notes (optional — check what HomeServe sends)
- Payment method metadata (Razorpay-side only — HomeServe never sees card/UPI details)

**Why processed:** Online payment processing for renovation projects, milestone payments, maintenance memberships

**Data stored (Razorpay side):** Transaction records for RBI-mandated periods

**Applicable terms:**
- Razorpay Terms of Service: https://razorpay.com/terms/
- Razorpay Privacy Policy: https://razorpay.com/privacy/
- Razorpay Data Processing terms are generally included in the merchant agreement
- A formal DPA addendum may be requested via your Razorpay account manager

**Data region:** India (Razorpay is an Indian company, PCI DSS compliant, RBI regulated)

**Sub-processors:** Banks, payment networks, UPI providers (listed in Razorpay's privacy policy)

**Security commitments:** PCI DSS Level 1 certified; RBI compliance

**International transfers:** Limited — primarily India-based

**Action required:**
- [ ] Contact Razorpay account manager to confirm data processing terms and request any available DPA
- [ ] Review what customer data (name/email) is included in Razorpay order `notes` fields and minimise it
- [ ] Confirm PCI DSS certification status

**Status: REQUIRES BUSINESS/LEGAL ACTION — confirm processing agreement with Razorpay**

---

### 3. Resend

**Data processed:**
- Customer email addresses
- Customer names (in email content)
- Project/booking details (in notification emails)
- IP addresses and device info (email open/click tracking, if enabled)

**Why processed:** Sending transactional emails (booking confirmations, payment confirmations, project updates, notifications)

**Data stored:** Resend stores email logs and metadata; check Resend dashboard for retention period

**Applicable terms:**
- Resend Privacy Policy: https://resend.com/privacy
- Resend Terms: https://resend.com/terms
- Resend DPA: Available upon request (email privacy@resend.com)

**Data region:**
- Infrastructure: AWS (US-based by default)
- International transfer: Yes — customer email addresses transit to Resend's US infrastructure

**Sub-processors:** AWS SES (email delivery)

**Security commitments:** SOC 2 Type II (confirm current status at resend.com/security)

**Action required:**
- [ ] Request and sign a DPA with Resend (email privacy@resend.com or use their contact form)
- [ ] Confirm email tracking settings (open/click tracking) and disclose in privacy policy if enabled
- [ ] Add Resend to HomeServe's privacy policy sub-processor disclosure (done — listed in privacy policy)

**Status: REQUIRES BUSINESS/LEGAL ACTION — DPA not yet executed**

---

### 4. Twilio

**Data processed:**
- Customer phone numbers
- SMS/WhatsApp message content (booking confirmations, payment alerts, OTPs if used)

**Why processed:** SMS and WhatsApp notifications for project/booking updates

**Data stored:** Twilio stores message logs and metadata per their retention policy

**Applicable terms:**
- Twilio Privacy Statement: https://www.twilio.com/en-us/legal/privacy
- Twilio DPA: https://www.twilio.com/en-us/legal/data-protection-addendum (must be signed/accepted)
- Twilio Terms: https://www.twilio.com/en-us/legal/tos

**Data region:**
- Configurable per Twilio product; default routing may involve non-India nodes
- International transfer: Possible — phone numbers may route through US/EU infrastructure

**Sub-processors:** Carrier networks, AWS (Twilio infrastructure)

**Security commitments:** ISO 27001, SOC 2 Type II (confirm current certifications)

**Action required:**
- [ ] Accept/sign Twilio DPA at https://www.twilio.com/en-us/legal/data-protection-addendum
- [ ] Confirm data routing/region for the specific Twilio products used (Messaging, WhatsApp Business API)
- [ ] Add Twilio to HomeServe's privacy policy disclosure (done — listed in privacy policy, "if enabled")

**Current status:** Twilio integration is configured but may not be actively sending. Confirm whether Twilio is live in production.

**Status: REQUIRES BUSINESS/LEGAL ACTION — DPA not yet accepted**

---

### 5. Vercel

**Data processed:**
- All HTTP request data including IP addresses, request headers, cookies
- Environment variables (contain all secrets: Supabase keys, Razorpay keys, etc.)
- Application logs (may contain customer data depending on what is logged)
- Serverless function execution context

**Why processed:** Application hosting, serverless function execution, CDN delivery, CI/CD

**Data stored:** Vercel stores deployment logs, function logs, and access logs

**Applicable terms:**
- Vercel Privacy Policy: https://vercel.com/legal/privacy-policy
- Vercel DPA: https://vercel.com/legal/dpa (available for Enterprise customers)
- Vercel Terms: https://vercel.com/legal/terms

**Data region:**
- Serverless functions: Deploy to AWS/GCP based on the configured region (default: US East)
- CDN: Global edge network
- International transfer: Yes — all requests transit through Vercel's global infrastructure

**Sub-processors:** AWS, GCP, Cloudflare (listed in Vercel's DPA)

**Security commitments:** SOC 2 Type II (confirm current certification)

**Action required:**
- [ ] Review whether Vercel's standard DPA is available without Enterprise plan
- [ ] Confirm function deployment region (Project Settings → Regions in Vercel dashboard)
- [ ] Consider configuring functions to a non-US region if data localisation is required
- [ ] Confirm what data is in Vercel logs; ensure PII is not logged unnecessarily (code already avoids logging full PII in API routes)

**Status: REQUIRES BUSINESS/LEGAL ACTION — confirm DPA availability and sign if possible**

---

## Summary of Actions Required

| # | Action | Owner | Urgency |
|---|--------|-------|---------|
| 1 | Accept Supabase DPA (supabase.com/legal/dpa) | Business/Legal | High |
| 2 | Confirm Supabase data region; consider non-US region | Technical | Medium |
| 3 | Contact Razorpay account manager re: data processing terms | Business | High |
| 4 | Minimise customer PII in Razorpay order notes | Technical | Medium |
| 5 | Request and sign Resend DPA | Business/Legal | High |
| 6 | Accept Twilio DPA | Business/Legal | High |
| 7 | Confirm Twilio is live in production; if not, it can be disabled | Technical | Low |
| 8 | Review Vercel DPA availability; sign if possible | Business/Legal | Medium |
| 9 | Confirm Vercel function deployment region | Technical | Medium |
| 10 | Update privacy policy once all DPAs are confirmed | Legal | High |

---

## What Is NOT a DPA Issue (Already Technically Handled)

- **Razorpay payment data:** HomeServe never stores card/UPI/net-banking credentials. Only Razorpay order IDs and payment IDs are stored. This is correct.
- **Service-role key exposure:** The Supabase service-role key is stored only in Vercel environment variables and is never sent to the browser. This is correct.
- **Customer data in API responses:** Error responses do not echo back PII (validated in code). This is correct.

---

*This document must be reviewed by legal counsel before HomeServe processes personal data of customers in production. No DPAs are confirmed as executed as of the date of this document.*
