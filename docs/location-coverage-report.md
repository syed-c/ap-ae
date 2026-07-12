# Location Coverage Report

Generated: 2026-07-11T14:46:20.426Z

## Summary

- Active emirates: 7
- Active clinics: 1301
- clinic_treatments rows: 0
- Top Dubai areas audited: 14

## Key Findings

- 14 of the audited Dubai areas rely on address fallback recovery beyond direct city_id assignment.
- 13 of the audited Dubai areas have zero published service-location SEO pages in the database.
- 0 of the audited Dubai areas are missing published page_content rows.

## Top Dubai Areas

| Area | Direct Clinics | Recovered Clinics | Fallback Needed | Page Content | SEO Page | Hero Intro | Body Sections | Service SEO Pages | Address Terms |
| --- | ---: | ---: | --- | --- | --- | --- | ---: | ---: | --- |
| Jumeirah | 0 | 219 | Yes | Yes | No | Yes | 3 | 0 | Jumeirah |
| Deira | 2 | 76 | Yes | Yes | No | Yes | 3 | 0 | Deira |
| Al Barsha | 0 | 68 | Yes | Yes | No | Yes | 3 | 35 | Al Barsha |
| Healthcare City | 0 | 59 | Yes | Yes | No | Yes | 3 | 0 | Healthcare City, Dubai Healthcare City |
| JLT | 0 | 55 | Yes | Yes | No | Yes | 3 | 0 | JLT, Jumeirah Lakes Towers |
| Mirdif | 0 | 43 | Yes | Yes | No | Yes | 3 | 0 | Mirdif |
| Business Bay | 0 | 42 | Yes | Yes | No | Yes | 3 | 0 | Business Bay |
| Dubai Marina | 0 | 26 | Yes | Yes | No | Yes | 3 | 0 | Dubai Marina, Marina |
| Jumeirah Beach Residence | 0 | 17 | Yes | Yes | No | Yes | 3 | 0 | Jumeirah Beach Residence, JBR |
| DIFC | 0 | 15 | Yes | Yes | No | Yes | 3 | 0 | DIFC, Dubai International Financial Centre |
| Downtown Dubai | 0 | 11 | Yes | Yes | No | Yes | 3 | 0 | Downtown Dubai, Downtown |
| Jumeirah Village Circle | 0 | 11 | Yes | Yes | No | Yes | 3 | 0 | Jumeirah Village Circle, JVC |
| Palm Jumeirah | 0 | 9 | Yes | Yes | No | Yes | 3 | 0 | Palm Jumeirah, The Palm Jumeirah |
| Bur Dubai | 0 | 5 | Yes | Yes | No | Yes | 3 | 0 | Bur Dubai |

## Remaining True Gaps

- `clinic_treatments` is still effectively unavailable for real service-to-clinic accuracy in this environment.
- Most major Dubai area pages currently rely on page_content rather than dedicated seo_pages rows.
- Several high-value Dubai areas still have zero published service-location SEO pages, so city pages must fall back to generic treatment-link generation.
