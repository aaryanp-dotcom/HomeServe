# HomeServe — Data Breach Incident Response Procedure

**Document version:** 1.0  
**Last updated:** (fill in date when reviewed by business/legal)  
**Owner:** HomeServe Data Fiduciary (Grievance Officer / Founder)  

---

## 1. Purpose and Scope

This procedure applies to any event that may involve unauthorised access to, disclosure of, loss of, or corruption of HomeServe customer personal data or system credentials. It covers HomeServe's application, infrastructure, third-party integrations (Supabase, Razorpay, Resend, Twilio, Vercel), and any connected services.

---

## 2. Severity Classification

| Severity | Description | Examples |
|----------|-------------|---------|
| **P0 — Critical** | Active breach, RCE, leaked service credentials, customer payment exposure | Service-role key leaked, database accessible from internet, RCE exploited |
| **P1 — High** | Confirmed unauthorised data access, admin account compromised, mass data exposure | Admin account without MFA compromised, customer PII bulk-accessed |
| **P2 — Medium** | Suspected breach, single-customer IDOR, credential rotation required | Single customer accessed another's data, API key discovered in logs |
| **P3 — Low** | Security misconfiguration without confirmed exploitation | Public URL to a project photo, misconfigured CSP |

---

## 3. Immediate Contacts (fill in before launch)

| Role | Name | Contact |
|------|------|---------|
| Incident Owner (primary) | [Founder/Director name] | [Phone / Signal] |
| Technical responder | [Developer name] | [Phone / Signal] |
| Legal/compliance | [Lawyer name] | [Phone / Signal] |
| Grievance Officer | [Name] | privacy@homeserve.in |

---

## 4. Phase 1 — Detection

**Sources to monitor:**
- Supabase Auth logs and anomaly alerts
- Vercel function error logs
- `admin_audit_log` table (admin actions)
- `erasure_audit_log` table
- Razorpay dashboard for payment anomalies
- Customer support tickets referencing data access issues
- Security researcher disclosure via privacy@homeserve.in

**Upon suspicion:**
1. Log the time of detection, who detected it, and what was observed.
2. Do NOT attempt to silently fix it without escalating.
3. Page the Incident Owner immediately.

---

## 5. Phase 2 — Triage (first 30 minutes)

1. **Is the incident active or historical?** (Is an attacker still connected? Was it in the past?)
2. **What systems are affected?** (Supabase, Vercel, Razorpay, Resend, Twilio, admin account, customer account)
3. **What data categories are involved?** (Names, phone numbers, addresses, payment references, project photos, admin credentials)
4. **How many customers are affected?**
5. **Is there evidence of exploitation or only exposure?**
6. **Is the vulnerability still open?**

---

## 6. Phase 3 — Severity Assessment

Assign a severity level (P0–P3) based on the classification table above. **P0 and P1 require the Incident Owner to be involved within 30 minutes.**

---

## 7. Phase 4 — Containment

### For every incident:
- [ ] Disable/block the attack vector (e.g. rate-limit IP, revoke credential, remove exposed file)
- [ ] Preserve logs BEFORE rotating credentials or restarting services

### Supabase compromise / service-role key leaked:
- [ ] Immediately rotate the service-role key in Supabase dashboard
- [ ] Rotate `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment
- [ ] Redeploy Vercel functions to pick up the new key
- [ ] Review Supabase Auth logs for suspicious sign-ins and unusual API calls
- [ ] Temporarily disable the project if active exploitation is confirmed (Supabase → Project Settings → Pause)

### Leaked Razorpay API key:
- [ ] Immediately regenerate keys in Razorpay dashboard (Test → Live → Keys)
- [ ] Update `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` in Vercel
- [ ] Review Razorpay payment dashboard for unauthorised orders/refunds
- [ ] Contact Razorpay support if any unauthorised transactions are found

### Leaked Resend API key:
- [ ] Regenerate the key in Resend dashboard
- [ ] Update `RESEND_API_KEY` in Vercel
- [ ] Review Resend logs for unauthorised email sends

### Leaked Twilio credentials:
- [ ] Rotate auth token in Twilio console
- [ ] Update `TWILIO_AUTH_TOKEN` in Vercel
- [ ] Review Twilio usage logs for unexpected SMS/WhatsApp messages

### Compromised admin account:
- [ ] Revoke the admin's active Supabase session (Supabase → Authentication → Users → delete sessions)
- [ ] Change the admin password
- [ ] Verify the admin account's MFA TOTP factor is intact (or re-enroll)
- [ ] Review `admin_audit_log` for all actions taken during the compromised period
- [ ] Review Supabase Auth logs for all API calls made with this session

### Unauthorised customer data access (IDOR):
- [ ] Identify the affected customers
- [ ] Identify the attack vector and fix it
- [ ] Check `admin_audit_log` and Supabase logs for the scope of access
- [ ] Preserve logs before deployment

### Project-photo exposure (public URL discovered):
- [ ] Identify which storage objects were exposed
- [ ] If objects are in the `project-media` bucket, verify the bucket is private (it should be)
- [ ] If objects are in `project_updates.photo_urls` (legacy plain-text URLs), audit and remove

### Vercel compromise:
- [ ] Change Vercel account password and enable Vercel 2FA if not already enabled
- [ ] Review Vercel deployment logs and environment variable access logs
- [ ] Rotate ALL secrets in Vercel environment variables
- [ ] Check git history for any accidental environment variable commits

### Database breach (direct Supabase DB access):
- [ ] Rotate the Supabase database password (Settings → Database → Reset password)
- [ ] Rotate all API keys that have DB access
- [ ] Review pg_audit logs if enabled
- [ ] Identify any exported data

---

## 8. Phase 5 — Evidence Preservation

**PRESERVE before rotating, deleting or patching:**
- Supabase Auth logs (export to file)
- Vercel function logs (export to file)
- `admin_audit_log` table snapshot
- Razorpay payment logs for the incident window
- Any HTTP access logs from Vercel/Supabase

**Do not:**
- Delete attacker accounts before logging their user_id and activity
- Wipe database tables before forensic review
- Rotate credentials without documenting the old key's last access time

---

## 9. Phase 6 — Investigation

1. Reconstruct the timeline of access using Supabase logs and `admin_audit_log`.
2. Identify the first point of compromise.
3. Identify all data accessed, modified, or exfiltrated.
4. Determine whether customer payment data was involved (see Razorpay scope below).
5. Identify all affected customer accounts.

---

## 10. Phase 7 — Scope Assessment

Answer these questions before moving to notification:

| Question | Answer |
|----------|--------|
| How many customers are affected? | |
| What categories of personal data? | |
| Was payment data involved? | |
| Were project photos accessed? | |
| Was admin data (internal notes, all leads) accessed? | |
| Is the breach still ongoing? | |
| Has the vulnerability been fixed? | |

---

## 11. Phase 8 — Vendor Escalation

| Vendor | When to escalate | How |
|--------|-----------------|-----|
| **Supabase** | DB breach, Auth compromise, storage policy failure | support@supabase.io / security@supabase.io |
| **Razorpay** | Unauthorised payment orders, refund manipulation | support@razorpay.com / security@razorpay.com; also contact your Razorpay account manager |
| **Resend** | Unauthorised email sends, account compromise | hello@resend.com |
| **Twilio** | Unauthorised SMS/WhatsApp, account compromise | support@twilio.com / security@twilio.com |
| **Vercel** | Account compromise, leaked env vars, deployment manipulation | support@vercel.com / security@vercel.com |

---

## 12. Phase 9 — Legal and Regulatory Assessment

> **IMPORTANT: Do not invent legal notification timelines. Get legal advice before notifying regulators.**

Points to confirm with your lawyer:

- Whether the incident triggers notification under DPDP Act 2023 (once the Rules are notified and reporting obligations are in force).
- Whether Razorpay's PCI DSS obligations require any specific notification.
- Whether any contractual obligations to customers require notification.
- Whether any standard template for customer notification is required.

---

## 13. Phase 10 — Customer Communication

> **Do not send customer notifications without legal review for P0/P1 incidents.**

For confirmed incidents where customer data was accessed:

1. Draft a clear, non-technical explanation of what happened.
2. Include: what data was involved, what you have done to fix it, what customers should do (if anything).
3. Send via email (Resend) to affected customers' registered email addresses.
4. Update the privacy@homeserve.in mailbox for any customer queries.
5. Prepare a brief FAQ for support staff.

---

## 14. Phase 11 — Recovery

1. Deploy the fixed code to Vercel.
2. Verify all rotated credentials are working correctly.
3. Test the affected feature end-to-end.
4. Restore any incorrectly deleted or modified data (from Supabase point-in-time recovery if needed).
5. Monitor for 24–48 hours post-recovery for recurrence.

---

## 15. Phase 12 — Post-Incident Review

Within 7 days of resolution:

1. Write a post-mortem document covering: what happened, root cause, timeline, impact, what was done, what should change.
2. Identify preventive controls that would have stopped this.
3. Create actionable tasks from the preventive controls.
4. Update this document with any new scenarios or lessons.

---

## 16. Scenario-Specific Quick References

### Supabase service-role key leaked
**Impact:** Full database read/write, Auth admin, Storage access  
**Rotate:** `SUPABASE_SERVICE_ROLE_KEY` in Supabase + Vercel  
**Evidence:** Supabase API logs, admin_audit_log  
**Legal:** Likely a notifiable breach if customer data was accessed

### Razorpay webhook secret leaked
**Impact:** Attacker could send fake webhook events to capture/fake payments  
**Rotate:** `RAZORPAY_WEBHOOK_SECRET` in Razorpay + Vercel  
**Evidence:** Review all payments created/settled since the suspected leak date  
**Action:** Verify all captured payments via Razorpay dashboard independently

### Compromised admin account (no MFA)
**Impact:** Full admin access to all leads, projects, customers, payments  
**Rotate:** Admin password, MFA factor re-enrollment  
**Evidence:** admin_audit_log, Supabase Auth session logs  
**Action:** Review every admin action during the compromised period

### IDOR (customer A accessed customer B's data)
**Impact:** Depends on data type — quotation/project/payment data  
**Fix:** Patch the API route; add server-side ownership check  
**Evidence:** Supabase Realtime logs, server function logs  
**Notify:** Legal review for whether notification is required

---

## 17. Credentials to Rotate in an Incident

| Credential | Location | How to rotate |
|------------|----------|---------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel env | Supabase → Settings → API → Service role → Reveal → Reset |
| `SUPABASE_ANON_KEY` | Vercel env | Supabase → Settings → API → Anon key → Reset |
| `RAZORPAY_KEY_SECRET` | Vercel env | Razorpay dashboard → Settings → API Keys → Regenerate |
| `RAZORPAY_WEBHOOK_SECRET` | Vercel env | Razorpay → Webhooks → edit → Regenerate secret |
| `RESEND_API_KEY` | Vercel env | Resend → API Keys → Create new → Delete old |
| `TWILIO_AUTH_TOKEN` | Vercel env | Twilio → Account → Auth Tokens → Rotate |
| `CRON_SECRET` | Vercel env | Generate new random string → update Vercel |
| `AUTH_SECRET` | Vercel env | Generate new random string → update Vercel |
| Admin password | Supabase Auth | Supabase → Authentication → Users → Update password |
| Admin TOTP factor | Supabase Auth + Admin device | Supabase → Users → Delete factor → Re-enroll on /admin/mfa/setup |

---

*This document must be reviewed and approved by HomeServe's Grievance Officer before going live. Legal notification timelines are marked throughout as requiring legal confirmation.*
