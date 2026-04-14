# User Flow Audit Report - AppointPanda

**Date:** April 14, 2026  
**Auditor:** Problem Detective  
**Scope:** Forms, Edge Functions, Dentist Profile Pages, Dentist Admin Dashboard

---

## Executive Summary

This audit covers 4 major user flow areas across a Next.js 14 + Supabase codebase:

1. **Forms** - All user-facing forms (booking, auth, contact, signup, dentist admin)
2. **Edge Functions** - Supabase edge functions triggered by user actions
3. **Dentist Profile Pages** - Public pages showing dentist info
4. **Dentist Admin Dashboard** - Full-featured admin panel for dentists

---

## Section 1: Forms

### 1.1 Form Components Found

| File | Description |
|------|------------|
| `src/components/ui/form.tsx` | Core shadcn/ui form components - Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage |
| `src/components/ui/input.tsx` | Base Input component |
| `src/components/ui/input-otp.tsx` | OTP Input with slots |
| `src/components/ui/textarea.tsx` | Textarea component |

### 1.2 Booking Forms (4 Variants)

| File | Description |
|------|------------|
| `src/components/BookingModal.tsx` | Multi-field booking with patient name, phone, email, treatment, date/time, notes |
| `src/components/booking/InlineBookingCalendar.tsx` | Inline booking with calendar |
| `src/components/booking/CalendarBookingForm.tsx` | Full calendar booking |
| `src/components/booking/ZocdocBookingForm.tsx` | Zocdoc-style booking |

**Schema (shared):**
```typescript
{
  patient_name: string (min 2, max 100, sanitized)
  patient_phone: string (min 9, regex validated)
  patient_email: string (optional, email format)
  treatment_id: string (required)
  preferred_date: string (required)
  preferred_time: string (required)
  notes: string (max 500, sanitized)
}
```

### 1.3 Pages with Forms

| Page | File | Form Type |
|------|------|----------|
| Auth | `src/pages/Auth.tsx` | Login/Signup - Manual zod validation |
| Contact | `src/pages/ContactPage.tsx` | Contact + Report forms |
| List Your Practice | `src/pages/ListYourPracticePage.tsx` | 3-step dentist signup wizard |
| Patient Form | `src/pages/PatientFormPage.tsx` | Patient intake |

### 1.4 Dentist Dashboard Forms

| File | Description |
|------|------------|
| `src/components/dentist/AddPracticeModal.tsx` | 4-step practice creation |
| `src/components/dentist/SendFormModal.tsx` | Send intake forms to patients |
| `src/components/dentist/FormBuilderModal.tsx` | Form builder |
| `src/components/dentist/TeamMemberFormDialog.tsx` | Team member dialog |

### 1.5 Issues Found

| # | Severity | Location | Issue |
|---|---------|----------|-------|
| 1 | 🔴 CRITICAL | `src/pages/DentistPage.tsx:157,160,164,172` | LocalStorage stores liked dentists without validation - JSON.parse can throw |
| 2 | 🟡 WARNING | Multiple booking forms | Code duplication - 4 variants not abstracted |
| 3 | 🟡 WARNING | `src/pages/Auth.tsx` | Manual validation instead of react-hook-form |
| 4 | 🔵 SUGGESTION | All forms | Some use XSS sanitization but loose typing |

---

## Section 2: Edge Functions (User-Facing)

### 2.1 User-Facing Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `verify-claim-otp` | `/claim` flow | Verifies 6-digit OTP |
| `send-claim-otp` | `/claim` flow | Sends OTP via email |
| `create-listing-user` | Dentist onboarding | Creates auth user |
| `create-checkout-session` | Subscribe to plan | Stripe checkout |
| `send-booking-email` | Appointment created | Confirmation email |
| `send-whatsapp` | Clinic sends message | WhatsApp messaging |
| `send-sms` | Clinic sends SMS | SMS messaging |
| `track-visitor` | Page visits | Analytics |
| `track-profile-view` | Profile views | Analytics |
| `stripe-webhook` | Stripe events | Subscription lifecycle |

### 2.2 Database Triggers

| Trigger | Table | Function | Action |
|---------|-------|----------|--------|
| `on_new_booking` | `appointments` | `notify_new_booking()` | INSERT notification |
| `set_audit_log_user_role` | `audit_logs` | `set_audit_log_user_role()` | Audit entries |
| `create_dentist_settings_trigger` | `clinics` | `create_dentist_settings_on_claim()` | AFTER claimed |
| `update_*_updated_at` | Many tables | `update_updated_at_column()` | Row changes |

### 2.3 Issues Found

| # | Severity | Location | Issue |
|---|---------|----------|-------|
| 1 | 🔴 CRITICAL | 242 instances | `.single()` without error handling |
| 2 | 🟡 WARNING | 82 instances | `select('*')` over-fetching |
| 3 | 🟡 WARNING | Multiple edges | Missing `.eq('is_active', true)` filter |
| 4 | 🔵 SUGGESTION | send-whatsapp, send-sms | No rate limiting |

### 2.4 Single() Locations (Sample)

```
supabase/functions/verify-claim-otp/index.ts:72,132
supabase/functions/send-sms/index.ts:96,156,228,281
supabase/functions/send-whatsapp/index.ts:97,156,269,339
supabase/functions/gmb-import/index.ts:314,689,699,930
supabase/functions/send-booking-email/index.ts:35,463
supabase/functions/send-claim-otp/index.ts:34,144
```

### 2.5 Select('*') Locations (Sample)

```
src/hooks/useTreatments.ts:24,42
src/hooks/useSlotGeneration.ts:47
src/hooks/useServicePriceRanges.ts:75
src/hooks/useReviewSystem.ts:211,364
src/hooks/useProviderVerification.ts:32
src/hooks/useBookingSettings.ts:31
src/hooks/useClinics.ts:123
```

---

## Section 3: Dentist Profile Pages (Public)

### 3.1 Pages Found

| Page | File |
|------|------|
| Dentist Profile | `pages/dentist/[dentistSlug].tsx` + `src/pages/DentistPage.tsx` |
| Clinic Profile | `pages/clinic/[clinicSlug].tsx` + `src/pages/ClinicPage.tsx` |
| Search/Browse | `pages/search.tsx` + `src/pages/SearchPage.tsx` |
| City Page | `pages/[stateSlug]/[citySlug]/index.tsx` + `src/pages/CityPage.tsx` |
| Emirate Page | `pages/[stateSlug]/index.tsx` + `src/pages/StatePage.tsx` |

### 3.2 Data Displayed on Dentist Profile

- Name, title, credentials
- Photo/image
- Rating (from reviews)
- Review count
- Years of experience
- Clinic association
- Location (city, emirate)
- Bio/about
- Services/treatments offered
- Accepted insurances
- Team members
- Availability
- Contact info

### 3.3 Data Fetching Strategy

```typescript
// Server-side (getStaticProps) - pages/dentist/[dentistSlug].tsx
- dentist basic info
- clinic info with city/state
- SEO content from seo_pages

// Client-side (useQuery) - src/pages/DentistPage.tsx
- treatments (clinic_treatments junction)
- reviews (review_funnel_events)
```

### 3.4 Issues Found

| # | Severity | Location | Issue |
|---|---------|----------|-------|
| 1 | 🟡 WARNING | `src/pages/DentistPage.tsx:98-118` | Reviews fetched client-side - SEO invisible |
| 2 | 🟡 WARNING | `src/pages/DentistPage.tsx:84-95` | Treatments fetched client-side - SEO invisible |
| 3 | 🟡 WARNING | `pages/dentist/[dentistSlug].tsx:79,83,96` | dangerouslySetInnerHTML with JSON.stringify |
| 4 | 🔵 SUGGESTION | `pages/dentist/[dentistSlug].tsx` | Missing Review schema for patient reviews |

---

## Section 4: Dentist Admin Dashboard

### 4.1 Dashboard Structure

**Main Entry:** `pages/dashboard.tsx` → `pages/admin/AdminDashboard`  
**V2 Entry:** `pages/dashboard-v2.tsx` → `src/components/dashboard-v2/DentistDashboardV2`

### 4.2 Layout Component

**File:** `src/components/dentist/DentistDashboardLayout.tsx`

**Navigation Sections:**
| Section | Tabs |
|---------|------|
| Dashboard | Overview |
| Operations | Appointments, Availability, Services, Patients, Messages, Intake Forms, Automation |
| Profile | Edit Profile, Team, Treatments, Insurance, Templates |
| Reputation | Reputation Suite |
| Settings | Settings, Support |

### 4.3 Admin Tabs Found (50+ components)

| Tab Component | Function |
|-------------|----------|
| `DashboardOverview.tsx` | Main dashboard view |
| `AppointmentsTabRedesign.tsx` | Appointment management |
| `AvailabilityManagementTab.tsx` | Schedule/availability |
| `AppointmentTypesTab.tsx` | Service types |
| `PatientsTab.tsx` | Patient list |
| `MessagesTab.tsx` | Messaging |
| `IntakeFormsTab.tsx` | Form management |
| `OperationsTab.tsx` | Automation |
| `ProfileEditorTab.tsx` | Clinic profile (1066 lines!) |
| `TeamManagementTab.tsx` | Team members |
| `ServicesTab.tsx` | Treatment services |
| `InsuranceManagementTab.tsx` | Insurance accepted |
| `TemplatesTab.tsx` | Message templates |
| `ReputationSuite.tsx` | Reputation management |
| `DentistReviewsTab.tsx` | Reviews |
| `ReviewRequestsTab.tsx` | Review requests |
| `NotificationPreferencesTab.tsx` | Notifications |
| `SupportTicketsTab.tsx` | Support |
| `BookingSettingsCard.tsx` | Booking config |
| `DentistSettingsTab.tsx` | General settings |

### 4.4 Issues Found

| # | Severity | Location | Issue |
|---|---------|----------|-------|
| 1 | 🟡 WARNING | `src/components/dentist/ServicesTab.tsx:74-78` | `.single()` without error handling |
| 2 | 🟡 WARNING | `src/components/dentist/ProfileEditorTab.tsx` | 1066 lines - too large |
| 3 | 🟡 WARNING | `src/components/dentist/ProfileEditorTab.tsx:437-463` | localStorage for GMB tokens |
| 4 | 🟡 WARNING | `src/components/dentist/DentistDashboardLayout.tsx:110-123` | Clinic fetched on every route |

---

## Summary Statistics

| Category | Count | Severity |
|----------|-------|----------|
| `.single()` without error handling | 242 | 🔴 Critical |
| `select('*')` over-fetching | 82 | 🟡 Warning |
| `dangerouslySetInnerHTML` usage | 37 | 🟡 Warning |
| LocalStorage usage | 69 | 🟡 Warning |
| Console.log statements | 394 | 🔵 Suggestion |
| Forms without react-hook-form | 5+ | 🔵 Suggestion |
| Client-side fetches in SSG pages | 2+ | 🟡 Warning |
| Admin tab components | 50+ | Info |

---

## Recommended Fix Priority

### Priority 1: Critical (Fix Immediately)
1. **Client-side fetches → Server-side** - Move reviews/treatments to getStaticProps for SEO
2. **Handle `.single()` errors** - Add `.maybeSingle()` or try-catch for all 242 instances
3. **LocalStorage validation** - Add try-catch around JSON.parse

### Priority 2: High (Fix Soon)
4. **Sanitize dangerouslySetInnerHTML** - Validate inputs or add CSP
5. **Split ProfileEditorTab** - Break into smaller components
6. **Convert localStorage to session** - Use HTTP-only cookies for tokens

### Priority 3: Medium (Plan Later)
7. **Abstract booking forms** - Single hook for all 4 variants
8. **Add rate limiting** - WhatsApp/SMS edges
9. **Add column selection** - Replace 82 `select('*')` with specific columns
10. **Add loading states** - Skeleton UI where missing

---

## File Reference

### Key Source Files

```
/pages/dentist/[dentistSlug]     - Dentist profile page
/pages/clinic/[clinicSlug]      - Clinic profile page  
/pages/search                   - Search/browse
/pages/dashboard               - Dentist admin
/pages/dashboard-v2           - Dentist admin v2

/src/pages/DentistPage.tsx       - Dentist page component (543 lines)
/src/pages/ClinicPage.tsx       - Clinic page component
/src/pages/SearchPage.tsx       - Search component

/src/components/dentist/*      - 50+ admin components

/src/components/booking/*       - Booking forms

/supabase/functions/*         - Edge functions (85+)
```

---

*Report generated by Problem Detective skill*
*Last updated: April 14, 2026*