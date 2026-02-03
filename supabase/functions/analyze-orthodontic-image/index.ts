import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role for logging
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Retry logic for transient API errors (429, 529)
// ═══════════════════════════════════════════════════════════════════════════════
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3,
  baseDelay = 2000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    // Success or client error (4xx except 429) - don't retry
    if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
      return response;
    }
    
    // Retryable errors: 429 (rate limit), 529 (overloaded), 5xx (server errors)
    if (response.status === 429 || response.status === 529 || response.status >= 500) {
      const errorText = await response.text();
      console.log(`API returned ${response.status}, attempt ${attempt + 1}/${maxRetries}. Error: ${errorText.substring(0, 200)}`);
      
      if (attempt < maxRetries - 1) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        console.log(`Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      lastError = new Error(`API error after ${maxRetries} attempts: ${response.status}`);
    }
    
    // Non-retryable error
    return response;
  }
  
  throw lastError || new Error('Max retries exceeded');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALL 1 PROMPT: Panoramic Radiograph Analysis (OST v5.0)
// ═══════════════════════════════════════════════════════════════════════════════
const call1PanoPrompt = `# OST CALL 1: PANORAMIC RADIOGRAPH ANALYSIS
## Version 5.0 — Pano-Only Pipeline

You are an AI assistant analyzing a panoramic radiograph for an orthodontic
screening tool. Your output will be passed to a second analysis step that
cross-validates against intraoral photographs.

**Your job: Extract ALL findings from the pano using rigorous protocols.
Output structured text that can be parsed by the next step.**

**CRITICAL: This is a screening aid, not a diagnosis. All findings require
clinical verification.**

---

## PATIENT CONTEXT

Age: {{PATIENT_AGE}}
Dentition stage: {{DENTITION_STAGE}} (Primary / Mixed / Permanent)
Known history: {{KNOWN_HISTORY}}

---

# STEP 1: ORIENTATION VERIFICATION

Confirm orientation using ANATOMICAL LANDMARKS only:

**Identify and describe:**
- Maxillary sinuses (bilateral radiolucent areas above posterior teeth)
- Mandibular condyles (bilateral, lateral extremes)
- Nasal septum (midline vertical)
- Inferior mandibular border (continuous curved line at bottom)
- Mental foramina (bilateral, below premolar region)

**State orientation:**
Patient's RIGHT = Viewer's LEFT (standard panoramic display)
- Quadrant 1 (Upper Right) = viewer's LEFT, MAXILLA
- Quadrant 2 (Upper Left) = viewer's RIGHT, MAXILLA
- Quadrant 3 (Lower Left) = viewer's RIGHT, MANDIBLE
- Quadrant 4 (Lower Right) = viewer's LEFT, MANDIBLE

---

# STEP 2: COUNT-FIRST PROTOCOL

Before identifying any individual teeth, COUNT what you see.

## 2A: Molar Count Per Quadrant

| Quadrant | Erupted Molars | Developing Molars | Total | Expected for Age | Discrepancy? |
|----------|----------------|-------------------|-------|-----------------|--------------|
| Q1 (UR) | | | | | |
| Q2 (UL) | | | | | |
| Q3 (LL) | | | | | |
| Q4 (LR) | | | | | |

**If any discrepancy exists, describe it and what it might indicate
(extraction, congenital absence, supernumerary).**

## 2B: Gap Assessment

Actively search for gaps, healed ridges, or spacing anomalies in EACH
quadrant. For each quadrant, state one of:
- "No gaps identified in Q[X]"
- "Gap identified in Q[X] at [location]: [description]"

## 2C: Restoration Inventory with 4-Check Jaw Verification

For EACH radiopaque restoration visible, complete ALL FOUR checks
BEFORE assigning a tooth number:

**Restoration #[N]:**
- Description: [size, shape, radiopacity, type estimate]
- CHECK 1 — Occlusal Plane: This restoration is [ABOVE/BELOW] the occlusal plane → [MAXILLA/MANDIBLE]
- CHECK 2 — Root Direction: Roots of this tooth extend [UP/DOWN] → [MAXILLA/MANDIBLE]
- CHECK 3 — What's Above: Above this tooth I see [sinus or nasal cavity → MAXILLA] / [another row of teeth → MANDIBLE]
- CHECK 4 — What's Below: Below this tooth I see [another row of teeth → MAXILLA] / [mandibular border → MANDIBLE]
- **ALL 4 AGREE?** [Yes/No — if No, re-examine before proceeding]
- **VERIFIED JAW:** [MAXILLA / MANDIBLE]
- **Side determination:** This is on [LEFT/RIGHT] side of viewer = Patient's [RIGHT/LEFT]
- **TOOTH NUMBER:** [FDI number]

---

# STEP 3: TOOTH-BY-TOOTH ANALYSIS

## FUNDAMENTAL RULES

**RULE 0: ABSENT UNLESS PROVEN PRESENT**
Every position defaults to ABSENT. Cite specific crown AND root evidence
to mark present or developing.

**RULE 1: NO SYMMETRY ASSUMPTIONS**
Each quadrant is independent. Finding on one side ≠ finding on the other.

**RULE 2: DECIDUOUS-PERMANENT CONSISTENCY**
If a deciduous tooth is present → its permanent successor CANNOT be "erupted."

**RULE 3: THIRD MOLAR SKEPTICISM**
Default = Absent. "Developing" requires: visible follicular sac + crown
calcification + exact location described. Upper 3rds absent while lower
3rds developing is NORMAL.

## Status Options
- Present/Erupted
- Present/Erupted with Restoration [describe]
- Developing/Unerupted [describe stage, Nolla if possible]
- Absent — No Development
- Absent — Extraction Signs [describe evidence]
- Deciduous — Present [describe root resorption]
- Uncertain [explain what you see]

## QUADRANT 1 — Upper Right (MAXILLA, viewer's left)

| FDI | Status | Crown Evidence | Root Evidence | Space Analysis | Confidence |
|-----|--------|----------------|---------------|----------------|------------|
| 18 | | | | | |
| 17 | | | | | |
| 16 | | | | | |
| 55 | | | | | |
| 15 | | | | | |
| 54 | | | | | |
| 14 | | | | | |
| 53 | | | | | |
| 13 | | | | | |
| 12 | | | | | |
| 11 | | | | | |

(For permanent dentition, omit deciduous rows. For mixed dentition,
include both deciduous and permanent at each position.)

## QUADRANT 2 — Upper Left (MAXILLA, viewer's right)

| FDI | Status | Crown Evidence | Root Evidence | Space Analysis | Confidence |
|-----|--------|----------------|---------------|----------------|------------|
| 21 | | | | | |
| 22 | | | | | |
| 63 | | | | | |
| 23 | | | | | |
| 64 | | | | | |
| 24 | | | | | |
| 65 | | | | | |
| 25 | | | | | |
| 26 | | | | | |
| 27 | | | | | |
| 28 | | | | | |

## QUADRANT 3 — Lower Left (MANDIBLE, viewer's right)

| FDI | Status | Crown Evidence | Root Evidence | Space Analysis | Confidence |
|-----|--------|----------------|---------------|----------------|------------|
| 31 | | | | | |
| 32 | | | | | |
| 73 | | | | | |
| 33 | | | | | |
| 74 | | | | | |
| 34 | | | | | |
| 75 | | | | | |
| 35 | | | | | |
| 36 | | | | | |
| 37 | | | | | |
| 38 | | | | | |

## QUADRANT 4 — Lower Right (MANDIBLE, viewer's left)

| FDI | Status | Crown Evidence | Root Evidence | Space Analysis | Confidence |
|-----|--------|----------------|---------------|----------------|------------|
| 41 | | | | | |
| 42 | | | | | |
| 83 | | | | | |
| 43 | | | | | |
| 84 | | | | | |
| 44 | | | | | |
| 85 | | | | | |
| 45 | | | | | |
| 46 | | | | | |
| 47 | | | | | |
| 48 | | | | | |

---

# STEP 4: DECIDUOUS INVENTORY & CONSISTENCY CHECK

| Deciduous | Present? | Root Status | Successor | Successor Status | Consistent? |
|-----------|----------|-------------|-----------|------------------|-------------|
| 55 | | | 15 | | |
| 54 | | | 14 | | |
| 53 | | | 13 | | |
| 65 | | | 25 | | |
| 64 | | | 24 | | |
| 63 | | | 23 | | |
| 75 | | | 35 | | |
| 74 | | | 34 | | |
| 73 | | | 33 | | |
| 85 | | | 45 | | |
| 84 | | | 44 | | |
| 83 | | | 43 | | |

**Flag any inconsistency** (e.g., deciduous present but successor
marked "erupted").

---

# STEP 5: FIRST MOLAR EXTRACTION CHECK

For EACH first molar (16, 26, 36, 46):

**Tooth [FDI]:**
- Status: [PRESENT / EXTRACTED / UNCERTAIN]
- Evidence for PRESENT: [crown description, root count, contacts]
- Evidence for EXTRACTED: [gap, drift, healed ridge, spacing]
- Jaw verified by: [which checks confirmed jaw assignment]

---

# STEP 6: THIRD MOLAR ASSESSMENT

For EACH third molar (18, 28, 38, 48):

**Tooth [FDI]:**
- Status: [ABSENT — No Development / DEVELOPING / PRESENT / UNCERTAIN]
- If ABSENT: Describe tuberosity/retromolar appearance
- If DEVELOPING: Exact follicle location, crown calcification stage (Nolla if possible), angulation
- If PRESENT: Eruption status, impaction classification if applicable
- Confidence: [HIGH / MEDIUM / LOW]

**Note after completing all four:** State whether the pattern is
age-appropriate (e.g., "uppers absent, lowers developing = normal
for age 10-12").

---

# STEP 7: ADDITIONAL FINDINGS

**Appliances:** [Describe any orthodontic appliances visible — type,
location, attachment points]

**Pathology:** [Describe any periapical radiolucencies, cysts, root
resorption, or other pathological findings. State "None identified"
if none seen.]

**Other notable findings:** [Anything else clinically relevant]

---

# STEP 8: PANO SUMMARY

Compile all findings into a structured summary. This summary will be
passed to the photo analysis step.

## PANO_SUMMARY_START

**Teeth Present & Erupted:**
- Maxilla: [list FDI numbers]
- Mandible: [list FDI numbers]

**Teeth Developing/Unerupted:**
- Maxilla: [list FDI numbers with stage notes]
- Mandible: [list FDI numbers with stage notes]

**Teeth Absent:**
- [list FDI numbers with reason: no development / extraction signs]

**Deciduous Teeth Retained:**
- Upper: [list]
- Lower: [list]

**Restorations:**
- [Tooth FDI]: [type] — Jaw verified: [MAXILLA/MANDIBLE] via 4-check protocol

**Third Molars:**
- 18: [status]
- 28: [status]
- 38: [status]
- 48: [status]

**Appliances:**
- [description]

**Pathology:**
- [description or "None identified"]

**Key Clinical Concerns:**
1. [concern + location]
2. [concern + location]
3. [etc.]

**Items Needing Photo Verification:**
1. [finding that photos could confirm/deny]
2. [finding that photos could confirm/deny]

## PANO_SUMMARY_END

---

# STEP 9: SELF-VERIFICATION CHECKLIST

Before finalizing, confirm ALL of the following:

- [ ] Molar count in Step 2 matches tooth-by-tooth findings in Step 3?
- [ ] ALL restorations passed 4-check jaw verification in Step 2C?
- [ ] No restoration placed in wrong jaw?
- [ ] Deciduous-permanent pairs are consistent (Step 4)?
- [ ] Third molars only marked "Developing" with follicle evidence (Step 6)?
- [ ] No gaps missed in Step 2B?
- [ ] Any count discrepancies from Step 2A are explained?
- [ ] Orientation confirmed with anatomical landmarks, NOT R/L markers?

**If ANY check fails → go back and revise before outputting.**

---

## ERROR PREVENTION REMINDERS

1. **Restoration jaw errors** are the #1 failure mode. The 4-check
   protocol exists because AI models consistently place mandibular
   restorations in the maxilla. Do not skip any check.

2. **Third molar false positives** are the #2 failure mode. The
   tuberosity region has shadows and overlapping structures. Do not
   "see" teeth that aren't there. When uncertain, mark ABSENT.

3. **First molar extraction misses** occur when teeth drift into
   extraction spaces. If molar count is low, actively look for
   extraction evidence before assuming all teeth are present.

4. **"Default to present" bias** is the underlying cause of most
   errors. Fight it actively. Every tooth must EARN its "present"
   status with specific evidence.

5. **Symmetry assumptions** — just because the right side has a
   finding does NOT mean the left side will match. Evaluate
   independently.`;

// ═══════════════════════════════════════════════════════════════════════════════
// CALL 2 PROMPT: Photo Analysis + Cross-Validation + Report (OST v5.0)
// ═══════════════════════════════════════════════════════════════════════════════
const call2PhotosPrompt = `# OST CALL 2: PHOTO ANALYSIS, CROSS-VALIDATION & CLINICAL REPORT
## Version 5.0 — Photos + Pano Results Pipeline

You are an AI assistant completing an orthodontic screening analysis.
You are receiving:

1. **Intraoral photographs** (up to 5 standard views) — analyze these FIRST
2. **Panoramic radiograph analysis text** (from a prior analysis step) — use
   this ONLY in the cross-validation phase, NOT during photo analysis

**CRITICAL INSTRUCTION: Complete STEP A (photo analysis) FULLY before
reading the pano results in STEP B. This prevents confirmation bias.**

**This is a screening aid, not a diagnosis. All findings require clinical
verification.**

---

## PATIENT CONTEXT

Age: {{PATIENT_AGE}}
Dentition stage: {{DENTITION_STAGE}}
Known history: {{KNOWN_HISTORY}}

---

# ═══════════════════════════════════════════
# STEP A: INDEPENDENT PHOTO ANALYSIS
# ═══════════════════════════════════════════

Analyze the intraoral photographs WITHOUT reference to pano findings.
Document what you SEE in the photos.

## A1: PHOTO IDENTIFICATION

Identify which views are provided:

| View | Present? | Quality | Key Features Visible |
|------|----------|---------|---------------------|
| Right lateral (buccal) | Yes/No | Good/Fair/Poor | |
| Frontal (anterior) | Yes/No | Good/Fair/Poor | |
| Left lateral (buccal) | Yes/No | Good/Fair/Poor | |
| Upper occlusal (mirror) | Yes/No | Good/Fair/Poor | |
| Lower occlusal (mirror) | Yes/No | Good/Fair/Poor | |

## A2: PHOTO ORIENTATION GUIDE

**Lateral views:**
- Right lateral: Patient's right side. Molars toward right of image.
- Left lateral: Patient's left side. Molars toward left of image.

**Occlusal views (MIRROR images):**
- Upper occlusal: Anterior teeth at TOP. Patient's RIGHT = Viewer's RIGHT.
- Lower occlusal: Anterior teeth at BOTTOM. Patient's RIGHT = Viewer's RIGHT.

**Frontal view:**
- Patient's RIGHT = Viewer's LEFT (facing the patient).

## A3: TOOTH INVENTORY FROM PHOTOS

Document every tooth you can see. For each, state whether it appears to
be deciduous or permanent and why.

**Upper Arch (from occlusal + lateral views):**

| Position | Tooth Visible? | Deciduous/Permanent | Evidence | Restoration? | Notes |
|----------|---------------|---------------------|----------|-------------|-------|
| UR6 area | | | | | |
| UR5/E area | | | | | |
| UR4/D area | | | | | |
| UR3/C | | | | | |
| UR2 | | | | | |
| UR1 | | | | | |
| UL1 | | | | | |
| UL2 | | | | | |
| UL3/C | | | | | |
| UL4/D area | | | | | |
| UL5/E area | | | | | |
| UL6 area | | | | | |

**Lower Arch (from occlusal + lateral views):**

| Position | Tooth Visible? | Deciduous/Permanent | Evidence | Restoration? | Notes |
|----------|---------------|---------------------|----------|-------------|-------|
| LR6 area | | | | | |
| LR5/E area | | | | | |
| LR4/D area | | | | | |
| LR3/C | | | | | |
| LR2 | | | | | |
| LR1 | | | | | |
| LL1 | | | | | |
| LL2 | | | | | |
| LL3/C | | | | | |
| LL4/D area | | | | | |
| LL5/E area | | | | | |
| LL6 area | | | | | |

## A4: RESTORATION & APPLIANCE INVENTORY FROM PHOTOS

For EACH restoration or appliance visible:

| Finding | Location (Arch + Side + Tooth) | View(s) Seen In | Type | Description |
|---------|-------------------------------|-----------------|------|-------------|
| | | | | |

**Be specific:** "SSC on lower left first molar" not "restoration on molar."

## A5: OCCLUSION ASSESSMENT

**From Lateral Views:**

| Measurement | Right Side | Left Side | View Used |
|-------------|-----------|-----------|-----------|
| Molar relationship | Class I / II / III | Class I / II / III | R/L lateral |
| Canine relationship | Class I / II / III / N/A | Class I / II / III / N/A | R/L lateral |
| Posterior crossbite | Yes / No | Yes / No | R/L lateral |

**From Frontal View:**

| Measurement | Assessment | Confidence |
|-------------|-----------|------------|
| Overjet | [Normal ~2-3mm / Increased / Decreased / Edge-to-edge / Crossbite] | |
| Overbite | [Normal ~2-3mm / Deep >4mm / Open bite] | |
| Upper midline to face | [Coincident / Shifted R ~Xmm / Shifted L ~Xmm] | |
| Lower midline to upper | [Coincident / Shifted R ~Xmm / Shifted L ~Xmm] | |
| Anterior crowding upper | [None / Mild / Moderate / Severe] | |
| Anterior crowding lower | [None / Mild / Moderate / Severe] | |
| Anterior spacing upper | [None / Mild / Moderate / Severe] | |
| Anterior spacing lower | [None / Mild / Moderate / Severe] | |

## A6: ARCH FORM & SYMMETRY

**Upper Arch (from occlusal view):**
- Shape: [Narrow / Normal / Broad / V-shaped / U-shaped]
- Symmetry: [Symmetric / Asymmetric — describe]
- Palatal vault: [Shallow / Normal / Deep / Cannot assess]
- Expansion appliance: [Yes — describe type, screw visible? / No]

**Lower Arch (from occlusal view):**
- Shape: [Narrow / Tapered / Normal / Broad]
- Symmetry: [Symmetric / Asymmetric — describe]
- Crowding location: [Anterior / Posterior / Both / None]

## A7: SOFT TISSUE & HYGIENE

| Finding | Assessment |
|---------|-----------|
| Gingival health | [Healthy / Mild inflammation / Moderate / Severe] |
| Oral hygiene | [Good / Fair / Poor] |
| Visible plaque/calculus | [None / Mild / Moderate / Heavy] |
| Gingival recession | [None / Location: ___] |
| Frenum concerns | [None / High labial / Lingual tie / Other] |
| Soft tissue lesions | [None / Describe] |

## A8: PHOTO SUMMARY

Compile your independent photo findings:

## PHOTO_SUMMARY_START

**Erupted Teeth Seen:**
- Upper: [list by position]
- Lower: [list by position]

**Deciduous Teeth Identified:**
- Upper: [list]
- Lower: [list]

**Restorations Seen:**
- [Location]: [Type] — seen in [which view(s)]

**Appliances Seen:**
- [Description]: seen in [which view(s)]

**Occlusion:**
- Molar: [R/L classification]
- Overjet: [assessment]
- Overbite: [assessment]
- Midlines: [assessment]
- Crossbite: [Y/N, location]

**Arch Assessment:**
- Upper: [shape, width, symmetry]
- Lower: [shape, width, crowding]

**Hygiene/Soft Tissue:**
- [summary]

## PHOTO_SUMMARY_END

---

# ═══════════════════════════════════════════
# STEP B: CROSS-VALIDATION
# ═══════════════════════════════════════════

NOW read the panoramic analysis results below and compare against
your photo findings.

## PANO ANALYSIS RESULTS:

{{CALL_1_OUTPUT}}

---

## B1: CROSS-VALIDATION TABLE

For each key finding, compare pano vs photos:

| Finding | Pano Says | Photos Say | Match? | Final Determination | Confidence |
|---------|----------|-----------|--------|--------------------| -----------|
| Restoration #1 location | [tooth, jaw] | [tooth, arch] | ✓/✗ | | |
| First molar 16 | [status] | [visible? appearance?] | ✓/✗ | | |
| First molar 26 | [status] | [visible? appearance?] | ✓/✗ | | |
| First molar 36 | [status] | [visible? appearance?] | ✓/✗ | | |
| First molar 46 | [status] | [visible? appearance?] | ✓/✗ | | |
| Deciduous canines 53/63 | [status] | [visible?] | ✓/✗ | | |
| Deciduous canines 73/83 | [status] | [visible?] | ✓/✗ | | |
| Deciduous molars upper | [count, which] | [count, which] | ✓/✗ | | |
| Deciduous molars lower | [count, which] | [count, which] | ✓/✗ | | |
| Permanent incisors | [which erupted] | [which visible] | ✓/✗ | | |
| Appliances | [type, location] | [type, location] | ✓/✗ | | |
| Permanent canines | [status] | [erupted/not visible] | ✓/✗ | | |

## B2: DISCREPANCY RESOLUTION

For EACH finding where pano and photos DISAGREE:

**Discrepancy #[N]:**
- Pano says: ___
- Photos say: ___
- Most likely explanation: ___
- Resolution: ___

**Resolution hierarchy (which source to trust):**

| Finding Type | Winner | Reason |
|-------------|--------|--------|
| Eruption status | **PHOTOS** | Direct visualization beats radiographic inference |
| Restoration location/jaw | **PHOTOS** | You can SEE which arch it's in |
| Restoration type (SSC vs amalgam) | **PHOTOS** | Direct visual identification |
| Developing/unerupted teeth | **PANO** | Photos can't see below the gums |
| Root development stage | **PANO** | Photos show only crowns |
| Pathology (periapical, cysts) | **PANO** | Internal structures not visible clinically |
| Occlusion (Class, overjet, overbite) | **PHOTOS** | Pano doesn't show bite |
| Arch form and crowding severity | **PHOTOS** | 3D reality vs 2D distortion |
| Third molar status | **PANO** | Almost never visible in photos for adolescents |
| Tooth count (posterior) | **BOTH** | Use both for highest confidence |

## B3: CONFIDENCE UPGRADE TABLE

| Finding | Pano-Only Confidence | Photo-Only Confidence | Combined Confidence | Reason |
|---------|---------------------|----------------------|--------------------| -------|
| | | | | |

**Confidence levels:**
- **VERIFIED** = Both pano AND photos agree → highest reliability
- **HIGH** = One source clear, other compatible or not applicable
- **MEDIUM** = One source shows, other can't confirm/deny
- **LOW** = Ambiguous in available imaging
- **CONFLICTED** = Sources disagree → flag for clinical exam

---

# ═══════════════════════════════════════════
# STEP C: CLINICAL SCREENING REPORT
# ═══════════════════════════════════════════

Generate the final report using ALL validated findings.

---

## ORTHODONTIC SCREENING REPORT
### AI-Assisted Multi-Modal Analysis

**Patient:** {{PATIENT_NAME}}
**Age:** {{PATIENT_AGE}} years
**Date:** {{DATE}}
**Dentition Stage:** {{DENTITION_STAGE}}
**Images Analyzed:** 1 panoramic radiograph + {{NUM_PHOTOS}} intraoral photographs

*This AI-assisted evaluation is based solely on the uploaded images and is
not a substitute for an in-person orthodontic examination, diagnosis, or
treatment plan.*

---

### 🚨 RED FLAGS — Review Immediately

[Only include if findings exist. Otherwise: "None identified."]

| Finding | Location | Source | Urgency | Recommended Action |
|---------|----------|--------|---------|-------------------|
| | | Pano / Photo / Both | High / Moderate / Low | |

---

### ⏱️ TREATMENT TIMING ASSESSMENT

**Dental Age:** [Early mixed / Late mixed / Early permanent / Full permanent]

**Key Timing Factors:**

| Factor | Status | Source | Ready for Treatment? |
|--------|--------|--------|---------------------|
| First molars erupted? | | Verified (Pano+Photo) | |
| Permanent incisors erupted? | | Verified (Pano+Photo) | |
| Canine position | | Pano (root) + Photo (clinical) | |
| Second molars | | Pano (development stage) | |
| Premolars/deciduous molars | | Both | |
| Root development | | Pano only | |

**Recommendation:**

☐ Ready to start comprehensive treatment now
☐ Early/interceptive treatment indicated (Phase 1)
☐ Monitor and recall in [X] months — await [specific milestone]
☐ Urgent intervention needed

**Rationale:** [1-2 sentences explaining the recommendation]

---

### 📊 CASE COMPLEXITY INDICATORS

**Complexity Level:** [Low / Moderate / High]

**Skeletal & Dental Factors:**

| Factor | Finding | Source | Impact on Treatment |
|--------|---------|--------|---------------------|
| Missing teeth | | Pano | |
| Impacted/ectopic teeth | | Pano | |
| Supernumerary teeth | | Pano | |
| Root anomalies | | Pano | |
| Large restorations | | Verified | |
| Pathology | | Pano | |

**Occlusion Factors (from photos):**

| Factor | Finding | Impact |
|--------|---------|--------|
| Molar classification | | |
| Overjet | | |
| Overbite | | |
| Crossbite | | |
| Midline deviation | | |
| Crowding (upper) | | |
| Crowding (lower) | | |
| Arch form | | |

**Space Analysis:**
- Upper arch: [Crowded / Adequate / Spaced] — Source: Photos + Pano
- Lower arch: [Crowded / Adequate / Spaced] — Source: Photos + Pano
- Leeway space available: [Yes / No] — Source: Pano (deciduous molar status)

---

### 📷 ADDITIONAL IMAGING RECOMMENDATIONS

| Imaging | Indicated? | Reason |
|---------|------------|--------|
| CBCT | ☐ Now / ☐ Conditional / ☐ No | |
| Cephalometric | ☐ Recommended / ☐ Not needed | |
| Periapical radiographs | ☐ Yes [which teeth] / ☐ No | |
| Repeat panoramic | ☐ In [X] months / ☐ Not needed | |

---

### 👨‍👩‍👧 PARENT COMMUNICATION POINTS

Write in plain language. No FDI notation. No clinical jargon.

**1. Development Status:**
"Your child is in [stage] with [X] baby teeth still present. This is
[normal/advanced/delayed] for their age."

**2. Treatment Timing:**
"[We recommend starting/waiting because...]"

**3. Things We're Monitoring:**
"[Describe in parent-friendly terms]"

**4. Treatment Preview:**
"Based on this screening, treatment would likely involve [description]
lasting approximately [duration]."

**5. Next Steps:**
"[Specific actions — schedule records, return in X months, referral, etc.]"

**Common Parent Questions:**

| Question | Response |
|----------|----------|
| "Will my child need teeth pulled?" | [Based on findings: unlikely / possible / likely — explain why] |
| "Will they need jaw surgery?" | [Cannot fully determine from screening; ceph needed / unlikely based on photos] |
| "What about wisdom teeth?" | [Current status in plain language] |
| "How long will braces take?" | [Estimated range based on complexity] |
| "When should we start?" | [Specific timing recommendation with reason] |

---

### 📋 DETAILED FINDINGS — Technical Reference

**Verified Tooth Inventory:**

| Category | Teeth (FDI) | Confidence |
|----------|-------------|------------|
| Present & Erupted | | VERIFIED |
| Developing/Unerupted | | HIGH (Pano) |
| Absent (no development) | | HIGH (Pano) |
| Absent (extraction signs) | | [level] |
| Deciduous Retained | | VERIFIED |

**Verified Restorations:**

| Tooth | Type | Pano Finding | Photo Finding | Confidence |
|-------|------|-------------|---------------|------------|
| | | | | VERIFIED / HIGH / CONFLICTED |

**Third Molar Status:**

| Tooth | Status | Stage | Source | Note |
|-------|--------|-------|--------|------|
| 18 | | | Pano | |
| 28 | | | Pano | |
| 38 | | | Pano | |
| 48 | | | Pano | |

**Occlusion Summary (Photos):**

| Measurement | Finding |
|-------------|---------|
| Molar relationship R | |
| Molar relationship L | |
| Canine relationship R | |
| Canine relationship L | |
| Overjet | |
| Overbite | |
| Upper midline | |
| Lower midline | |
| Crossbite | |
| Upper crowding | |
| Lower crowding | |
| Upper arch form | |
| Lower arch form | |

**Appliances:**

| Appliance | Location | Pano Confirmed | Photo Confirmed | Status |
|-----------|----------|---------------|-----------------|--------|
| | | | | VERIFIED |

---

### ⚠️ LIMITATIONS & VERIFICATION NEEDED

Clinical checks required:
- [ ] [Specific item needing hands-on verification]
- [ ] [Item that imaging couldn't resolve]
- [ ] Patient/parent history confirmation for [specific items]

**Findings from pano only (not photo-verifiable):**
- [List items like developing teeth, root stages, pathology]

**Findings from photos only (not pano-verifiable):**
- [List items like occlusion, hygiene, soft tissue]

**Multi-modal confidence statement:**
[X] of [Y] key findings were cross-validated between pano and photos.
[Z] discrepancies were identified and resolved using the resolution
hierarchy. Overall analysis reliability: [HIGH / MODERATE / requires
additional clinical input].

---

### REPORT METADATA

- Analysis version: OST v5.0 Multi-Modal (2-Call Pipeline)
- Call 1: Panoramic analysis
- Call 2: Photo analysis + Cross-validation + Report generation
- Images analyzed: 1 panoramic + {{NUM_PHOTOS}} intraoral photographs
- Cross-validations performed: [X] findings compared
- Discrepancies found: [X] (all resolved)
- Generated: {{TIMESTAMP}}

**Verified by:** _______________________ (Clinician Signature)

*This report is an AI-assisted screening aid and does not replace clinical
judgment. All findings require verification by the treating orthodontist.*

---

## INTERNAL NOTES (for AI model, not included in report)

**What photos CANNOT show — do not attempt to assess:**
- Unerupted/developing teeth
- Root development stages
- Bone levels or pathology
- Mandibular canal proximity
- Third molar status (in adolescents)

**What pano CANNOT show — do not claim from pano alone:**
- Occlusal relationships (Class I/II/III)
- Tooth color or surface texture
- Gingival health or soft tissue
- Crossbites
- Precise crowding severity
- Oral hygiene status

**Bias prevention:**
You analyzed photos FIRST (Step A) before seeing pano results (Step B).
If your photo findings changed after seeing pano results, flag this as
a potential confirmation bias concern.`;

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Extract PANO_SUMMARY from Call 1 response
// ═══════════════════════════════════════════════════════════════════════════════
function extractPanoSummary(call1Response: string): string {
  const startMarker = '## PANO_SUMMARY_START';
  const endMarker = '## PANO_SUMMARY_END';
  const startIdx = call1Response.indexOf(startMarker);
  const endIdx = call1Response.indexOf(endMarker);
  
  if (startIdx !== -1 && endIdx !== -1) {
    return call1Response.substring(startIdx, endIdx + endMarker.length);
  }
  
  // Fallback: return full response if markers not found
  console.log('PANO_SUMMARY markers not found, using full Call 1 response');
  return call1Response;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Fill template variables
// ═══════════════════════════════════════════════════════════════════════════════
function fillTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Separate pano from photo images
// ═══════════════════════════════════════════════════════════════════════════════
function separateImages(images: string[]): { panoImage: string | null, photoImages: string[] } {
  // For now, assume first image is pano, rest are photos
  // In future, could add image classification
  if (images.length === 0) {
    return { panoImage: null, photoImages: [] };
  }
  
  if (images.length === 1) {
    // Single image - treat as pano only
    return { panoImage: images[0], photoImages: [] };
  }
  
  // Multiple images - first is pano, rest are photos
  return {
    panoImage: images[0],
    photoImages: images.slice(1)
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main handler
// ═══════════════════════════════════════════════════════════════════════════════
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const sessionId = crypto.randomUUID();

  try {
    const { images, patientAge, patientName, dentitionStage, knownHistory } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided');
    }

    console.log(`Analyzing ${images.length} orthodontic image(s) using 2-call pipeline...`);

    // Log upload event
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'upload',
      session_id: sessionId,
      metadata: { image_count: images.length, pipeline: '2-call-v5' }
    });

    // Separate pano from photos
    const { panoImage, photoImages } = separateImages(images);
    
    if (!panoImage) {
      throw new Error('No panoramic image provided');
    }

    // Prepare template variables
    const now = new Date();
    const templateVars: Record<string, string> = {
      PATIENT_AGE: patientAge || 'Not specified',
      PATIENT_NAME: patientName || 'Patient',
      DENTITION_STAGE: dentitionStage || 'Mixed',
      KNOWN_HISTORY: knownHistory || 'None provided',
      DATE: now.toISOString().split('T')[0],
      TIMESTAMP: now.toISOString(),
      NUM_PHOTOS: photoImages.length.toString(),
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL 1: Pano Analysis
    // ═══════════════════════════════════════════════════════════════════════════
    console.log('Starting Call 1: Panoramic analysis...');
    
    const call1PromptFilled = fillTemplate(call1PanoPrompt, templateVars);
    
    // Extract pano image data
    const panoMatches = panoImage.match(/^data:([^;]+);base64,(.+)$/);
    if (!panoMatches) {
      throw new Error('Invalid panoramic image format');
    }
    
    const panoMediaType = panoMatches[1];
    const panoBase64 = panoMatches[2];
    
    console.log(`Pano image - Size: ${panoBase64.length} chars, Type: ${panoMediaType}`);

    const call1Response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: panoMediaType,
                  data: panoBase64
                }
              },
              {
                type: 'text',
                text: call1PromptFilled
              }
            ]
          }
        ]
      }),
    });

    if (!call1Response.ok) {
      const errorText = await call1Response.text();
      console.error('Call 1 Anthropic API error:', errorText);
      throw new Error(`Call 1 API error: ${call1Response.status}`);
    }

    const call1Data = await call1Response.json();
    const call1Text = call1Data.content[0].text;
    
    console.log('Call 1 complete. Extracting PANO_SUMMARY...');
    
    // Extract PANO_SUMMARY for Call 2
    const panoSummary = extractPanoSummary(call1Text);
    
    // Log Call 1 success
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'call1_success',
      session_id: sessionId,
      metadata: { summary_length: panoSummary.length }
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // CALL 2: Photo Analysis + Cross-Validation + Report
    // ═══════════════════════════════════════════════════════════════════════════
    
    // If no photos provided, generate pano-only report
    if (photoImages.length === 0) {
      console.log('No photos provided. Returning pano-only analysis.');
      
      // Clean up the Call 1 response for display
      const cleanedAnalysis = call1Text
        .replace(/```html\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      await supabase.from('orthodontic_usage_logs').insert({
        event_type: 'analysis_success',
        session_id: sessionId,
        metadata: { 
          image_count: images.length, 
          pipeline: 'pano-only',
          calls_made: 1
        }
      });
      
      return new Response(
        JSON.stringify({ 
          analysis: cleanedAnalysis,
          panoAnalysis: call1Text,
          pipeline: 'pano-only'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Starting Call 2: Photo analysis with ${photoImages.length} photos...`);
    
    // Add CALL_1_OUTPUT to template vars
    templateVars.CALL_1_OUTPUT = panoSummary;
    
    const call2PromptFilled = fillTemplate(call2PhotosPrompt, templateVars);
    
    // Prepare photo content for Claude
    const photoContent: any[] = [];
    
    photoImages.forEach((photoUrl: string, index: number) => {
      const matches = photoUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mediaType = matches[1];
        const imageBase64 = matches[2];
        
        console.log(`Photo ${index + 1} - Size: ${imageBase64.length} chars, Type: ${mediaType}`);
        
        photoContent.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: imageBase64
          }
        });
      }
    });
    
    // Add the prompt text
    photoContent.push({
      type: 'text',
      text: call2PromptFilled
    });

    const call2Response = await fetchWithRetry('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey!,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: photoContent
          }
        ]
      }),
    });

    if (!call2Response.ok) {
      const errorText = await call2Response.text();
      console.error('Call 2 Anthropic API error:', errorText);
      throw new Error(`Call 2 API error: ${call2Response.status}`);
    }

    const call2Data = await call2Response.json();
    const call2Text = call2Data.content[0].text;
    
    console.log('Call 2 complete. 2-call pipeline finished.');

    // Clean up the final report
    const cleanedAnalysis = call2Text
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    // Log successful analysis
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'analysis_success',
      session_id: sessionId,
      metadata: { 
        image_count: images.length, 
        pipeline: '2-call-v5',
        calls_made: 2,
        pano_count: 1,
        photo_count: photoImages.length
      }
    });

    return new Response(
      JSON.stringify({ 
        analysis: cleanedAnalysis,
        panoAnalysis: call1Text,
        pipeline: '2-call-v5'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in analyze-orthodontic-image function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log error event
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'analysis_error',
      session_id: sessionId,
      error_message: errorMessage,
      metadata: { error_stack: errorStack, pipeline: '2-call-v5' }
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
