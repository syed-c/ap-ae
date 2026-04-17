# Page Content Generator - Prompt Documentation

This document describes all prompts used in the `page-content-generator` Edge Function and how they map to different page types and tables.

---

## Overview

The generator creates content for different page types:

| Page Type | URL Pattern | Table(s) Used | Prompt Used |
|-----------|-------------|---------------|-------------|
| State/Emirate | `/dubai/` | `page_content` | USER_PROMPT_TEMPLATE |
| City/Area | `/dubai/al-barsha/` | `page_content` | USER_PROMPT_TEMPLATE |
| Service | `/services/invisalign/` | `seo_pages` (+ backup to `page_content`) | generateServiceContent |
| Service-Location | `/dubai/al-barsha/invisalign/` | `seo_pages` | generateServiceLocationContent |

---

## 1. SYSTEM_PROMPT (Base System Prompt)

**Location:** Lines 346-561  
**Purpose:** Base instructions for all AI content generation - enforces uniqueness, local expertise, and quality standards.

### Key Rules:
- **Content Uniqueness:** Each page must be completely different - not just swapped location names
- **Platform Identity:** Sound like a local expert, not a corporate template
- **Location Research:** Incorporate local character, demographics, landmarks
- **Anti-Generic:** Never use phrases like "finding the right dentist has never been easier"
- **Insight Depth:** Include specific, observable insights (not vague statements)
- **Grammar Rule:** Never use em-dashes (—)
- **FAQ Uniqueness:** 10 FAQs per location with local specifics
- **Keyword Research:** Uses SerpApi to research keywords for each location - generates unique primary/secondary keywords
- **Heading Uniqueness:** Section titles must be different for each page - no generic headings like "Dental Services in [Location]"

### Output Fields Required:
```json
{
  "page_type": "city",
  "page_slug": "/{emirate_slug}/{city_slug}",
  "meta_title": "string",
  "meta_description": "string",
  "keywords": [],
  "noindex": false,
  "h1": "string",
  "hero_subtitle": "string",
  "hero_intro": "string",
  "hero_stats": [],
  "section_1_title": "string",
  "section_1_content": "string",
  "section_2_title": "string",
  "section_2_content": "string",
  "section_3_title": "string",
  "section_3_content": "string",
  "body_content": "string",
  "cta_text": "string",
  "cta_button_text": "string",
  "cta_button_url": "string",
  "faqs": [{"question": "string", "answer": "string"}],
  "is_published": true
}
```

---

## 2. USER_PROMPT_TEMPLATE (City/State Pages)

**Location:** Lines 563-695  
**Purpose:** Generate content for emirate/state pages and city/area pages  
**Table:** `page_content`

### Variables Used:
- `{location_name}` - City or state name
- `{emirate_name}` - Full emirate name (e.g., "Dubai")
- `{emirate_slug}` - URL slug (e.g., "dubai")
- `{city_slug}` - City URL slug
- `{area_character}` - Area description from AREA_CHARACTERS
- `{demographics}` - Population info
- `{landmarks}` - Local landmarks
- `{narrative}` - Local insight/story

### Mandatory Rules (14 total):
1. Pick ONE real-life angle (busy professionals, families, expats, budget-conscious, premium)
2. Add real human insights (when people visit, what they care about, clinic types)
3. Do NOT explain the platform features
4. No generic marketing lines
5. Make it specific to location
6. Vary structure (4 different formats available)
7. Insight depth rule
8. Comparison rule (contrast with nearby areas)
9. Unique section rule
10. Anti-generic check
11. Landmark usage rule (connect to behavior)
12. Local opinion rule
13. Writing style variation
14. Grammar rule (no em-dashes)

### Content Angles (randomly selected):
- Busy professionals with no time
- Families with kids
- Expats needing language-friendly clinics
- Budget-conscious residents
- Premium/luxury lifestyle

---

## 3. AREA_CHARACTERS (Location Database)

**Location:** Lines 764-828  
**Purpose:** Provides local context data for each area in UAE

### Structure:
```typescript
AREA_CHARACTERS[emirate_slug][city_slug] = {
  character: "description of area",
  demographics: "who lives there",
  landmarks: "local landmarks",
  narrative: "local insight"
}
```

### Covered Areas:
- **Dubai:** 27 areas (Deira, Jumeirah, Marina, Business Bay, etc.)
- **Abu Dhabi:** 9 areas (Khalifa City, Corniche, Al Reem Island, etc.)
- **Sharjah:** 4 areas
- **Ajman:** 3 areas
- **Ras Al Khaimah:** 3 areas
- **Fujairah:** 2 areas
- **Umm Al Quwain:** 2 areas

---

## 4. SERVICE_PROMPTS (Service-Specific Data)

**Location:** Lines 711-762  
**Purpose:** Provides service-specific context for content generation

### Services Covered:
```typescript
{
  "invisalign": {
    angle: "invisible orthodontic solution for professionals",
    pain_points: "Adults don't want metal braces in business meetings...",
    why_unique: "Unlike braces, aligners are removable..."
  },
  "dental-implants": { ... },
  "veneers": { ... },
  "teeth-whitening": { ... },
  "root-canal": { ... },
  "dental-crowns": { ... },
  "braces": { ... },
  "tooth-extraction": { ... },
  "dental-check-up": { ... },
  "pediatric-dentistry": { ... }
}
```

---

## 5. generateServiceContent (Service Pages)

**Location:** Lines 880-1045  
**Purpose:** Generate content for `/services/{service}` pages  
**Table:** `seo_pages` (primary), `page_content` (backup)

### Prompt Structure:
```
Generate a service page for {service_name} in UAE.

SERVICE CONTEXT:
* Treatment type: {service_slug}
* Focus angle: {serviceData.angle}
* Patient pain points: {serviceData.pain_points}
* What makes UAE unique: {serviceData.why_unique}

AI-OPTIMIZED STRUCTURE (CRITICAL FOR AI OVERVIEW EXTRACTION):
1. AI_DEFINITION: 2-3 sentences directly answering "What is [treatment]?"
2. PROCESS_STEPS: Numbered step-by-step guide (6-8 steps)
3. COST_RANGE: AED price table with min/max
4. CHECKLIST: "Is it right for me?" - bullet points
5. COMPARISON: Optional - compare alternatives
```

### Additional Output Fields:
```json
{
  "ai_definition": "2-3 sentence direct answer",
  "ai_process_steps": [{"step": 1, "title": "", "description": ""}],
  "ai_cost_range": [{"treatment": "", "min_aed": 0, "max_aed": 0, "notes": ""}],
  "ai_checklist": [{"criteria": "", "applies": true/false, "description": ""}]
}
```

---

## 6. generateServiceLocationContent (Service-Location Pages)

**Location:** Lines 1047-1181  
**Purpose:** Generate content for `/emirate/city/service` pages  
**Table:** `seo_pages`

### Prompt Structure:
```
Generate a comprehensive service-location page for {service} in {city}, {emirate}.

LOCATION CONTEXT:
* City character: {areaData.character}
* Demographics: {areaData.demographics}
* What locals say: {areaData.narrative}

SERVICE CONTEXT:
* Treatment: {service}
* Patient concerns: {serviceData.pain_points}
* UAE perspective: {serviceData.why_unique}
```

### Comprehensive SEO Fields (17 additional fields):
- `price_min`, `price_max`, `price_note`, `price_last_updated`
- `process_steps`, `process_time_months`
- `treatment_options`, `comparison_table`
- `benefits`, `candidates`, `alternatives`
- `quick_answer`, `related_questions`
- `last_reviewed_by`, `last_reviewed_date`
- `medical_accuracy_verified`, `expert_credential`

---

## 7. generateServiceLocationContentWithAnalysis (With Competitor Research)

**Location:** Lines 1186-1367  
**Purpose:** Same as above but with SERP competitor analysis included  
**Table:** `seo_pages`

### Competitor Analysis Section (appended to prompt):
```
COMPETITOR ANALYSIS (from SERP research)

URLs Analyzed: {count}
FAQ QUESTIONS FOUND ON TOP RANKING PAGES: [...]
PRICE RANGES FOUND ON COMPETITORS: ...
COMMON SECTIONS ON TOP PAGES: [...]
MISSING SECTIONS (CONTENT GAPS): [...]
SCHEMA TYPES USED BY COMPETITORS: [...]

YOUR TASK: Create content that OUTPERFORMS these competitors
1. INCLUDE ALL FAQ QUESTIONS that competitors use
2. ADD these sections that competitors are MISSING
3. MENTION price range
4. USE these schema types
5. ADD unique value props AppointPanda offers
6. MAKE content MORE comprehensive (aim for 1500+ words)
```

### Competitor Analysis Functions:
- `searchGoogleWithSerpApi()` - Search Google via SerpApi
- `analyzeCompetitorPage()` - Extract H1, H2, FAQs, prices, schema
- `consolidateCompetitorInsights()` - Merge multiple competitor insights
- `buildCompetitorBasedPrompt()` - Build prompt with analysis data

---

## 8. Action Handlers (API Endpoints)

**Location:** Lines 1841-2901

| Action | Purpose |
|--------|---------|
| `generate_single` | Generate one city/state page |
| `generate_batch` | Batch generate multiple city/state pages |
| `generate_services` | Batch generate all service pages |
| `generate_single_service` | Generate one service page |
| `generate_service_locations` | Batch generate all service-location pages |
| `generate_service_locations_by_emirate` | Generate SL pages for one emirate |
| `generate_service_locations_by_city` | Generate SL pages for one city |
| `generate_single_service_location` | Generate one SL page |

---

## Usage Flow

### For State/City Pages (page_content table):
1. Call with `action: generate_batch` or `action: generate_single`
2. Uses `USER_PROMPT_TEMPLATE` with area data from `AREA_CHARACTERS`
3. Saves to `page_content` table

### For Service Pages (seo_pages table):
1. Call with `action: generate_services` or `action: generate_single_service`
2. Uses `generateServiceContent` with service data from `SERVICE_PROMPTS`
3. Saves to both `seo_pages` and `page_content` (backup)

### For Service-Location Pages (seo_pages table):
1. Call with `action: generate_service_locations` or similar
2. Uses `generateServiceLocationContent` combining area + service data
3. Saves to `seo_pages` table

---

## Environment Variables Required

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access
- `AIMLAPI_KEY` - AI API key for content generation

---

## Example API Calls

```bash
# Generate a single city page
curl -X POST https://project.supabase.co/functions/v1/page-content-generator \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_single",
    "page_type": "city",
    "page_slug": "/dubai/al-barsha",
    "location_name": "Al Barsha",
    "emirate_slug": "dubai",
    "emirate_name": "Dubai"
  }'

# Generate batch of service pages
curl -X POST https://project.supabase.co/functions/v1/page-content-generator \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_services",
    "batch_limit": 3
  }'
```