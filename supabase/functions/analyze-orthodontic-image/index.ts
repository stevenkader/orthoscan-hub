import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Use Lovable AI Gateway with Gemini Pro for multimodal analysis
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role for logging
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ═══════════════════════════════════════════════════════════════════════════════
// Call Lovable AI Gateway with Gemini Pro for multimodal analysis
// ═══════════════════════════════════════════════════════════════════════════════
async function callGeminiVision(
  systemPrompt: string,
  userContent: Array<{ type: string; text?: string; image_url?: { url: string } }>,
  maxRetries = 3
): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY is not configured');
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Gemini API call attempt ${attempt + 1}/${maxRetries}...`);
      
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText.substring(0, 300));
        
        // Handle rate limits
        if (response.status === 429) {
          if (attempt < maxRetries - 1) {
            const delay = 2000 * Math.pow(2, attempt) + Math.random() * 1000;
            console.log(`Rate limited, waiting ${Math.round(delay)}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw new Error('Rate limits exceeded, please try again later.');
        }
        
        if (response.status === 402) {
          throw new Error('AI service credits exhausted. Please add funds to continue.');
        }
        
        throw new Error(`AI service error (${response.status}). Please try again.`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from AI');
      }
      
      return content;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      console.log(`Attempt ${attempt + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CALL 1 PROMPT: Panoramic Radiograph Analysis (OST v5.0)
// ═══════════════════════════════════════════════════════════════════════════════
const call1PanoPrompt = `You are analyzing a panoramic radiograph for an orthodontic screening tool targeting adolescent patients (ages 10-18). Your structured text output will be passed to a second AI call that cross-validates against intraoral photographs.

PATIENT CONTEXT
Age: {{PATIENT_AGE}}
Dentition stage: {{DENTITION_STAGE}}
Known history: {{KNOWN_HISTORY}}

═══════════════════════════════════════
ORIENTATION
═══════════════════════════════════════

Standard panoramic display — you are FACING the patient:

Patient's RIGHT = LEFT side of image (Quadrant 1 upper, Quadrant 4 lower)

Patient's LEFT = RIGHT side of image (Quadrant 2 upper, Quadrant 3 lower)

MAXILLA = upper jaw (roots point UP toward sinuses)

MANDIBLE = lower jaw (roots point DOWN toward chin)

FDI Notation:

Q1 (Upper Right, viewer's left): 11-18

Q2 (Upper Left, viewer's right): 21-28

Q3 (Lower Left, viewer's right): 31-38

Q4 (Lower Right, viewer's left): 41-48

Confirm orientation using ANATOMICAL LANDMARKS only (sinuses, condyles, mandibular border, nasal septum). Never rely on R/L markers.

═══════════════════════════════════════
FUNDAMENTAL RULES
═══════════════════════════════════════

RULE 0 — ABSENT UNLESS PROVEN PRESENT
Every tooth position defaults to ABSENT. You must cite specific crown AND root evidence to mark present or developing. Fight the "default to present" bias actively.

RULE 1 — NO SYMMETRY ASSUMPTIONS
Each quadrant is independent. Finding on one side ≠ finding on the other.

RULE 2 — DECIDUOUS-PERMANENT CONSISTENCY
If a deciduous tooth is present → its permanent successor CANNOT be "erupted." If a deciduous tooth is absent and its successor is not yet erupted → consider premature loss.

RULE 3 — THIRD MOLAR SKEPTICISM
Default = Absent. "Developing" requires visible follicular sac + crown calcification + exact location described. Upper 3rds absent while lower 3rds developing is NORMAL for adolescents.

RULE 4 — RESTORATION JAW ERRORS ARE THE #1 FAILURE MODE
AI models consistently misplace restorations in the wrong jaw. The 4-check protocol below is mandatory but NOT infallible. Photos will be the final arbiter of restoration location in Call 2.

═══════════════════════════════════════
ANALYSIS — Follow these steps in order
═══════════════════════════════════════

STEP 1: ORIENTATION CONFIRMATION

State which anatomical landmarks you can identify and confirm the orientation. Do not proceed until orientation is established.

STEP 2: COUNT-FIRST PROTOCOL

Before identifying individual teeth, COUNT what you see in each quadrant.

Molar count per quadrant:
| Quadrant | Erupted Molars | Developing Molars | Total | Expected for Age | Discrepancy? |

Gap assessment — actively search for gaps, healed ridges, or spacing anomalies. For each quadrant state either "No gaps identified" or describe what you see.

STEP 3: RESTORATION INVENTORY WITH 4-CHECK JAW VERIFICATION

For EACH radiopaque restoration, complete ALL FOUR checks BEFORE assigning a tooth number:

CHECK 1 — Occlusal Plane: Is this restoration ABOVE (maxilla) or BELOW (mandible) the occlusal plane?
CHECK 2 — Root Direction: Do roots extend UP (maxilla) or DOWN (mandible)?
CHECK 3 — What's Above: Sinus/nasal cavity (maxilla) or another row of teeth (mandible)?
CHECK 4 — What's Below: Another row of teeth (maxilla) or mandibular border (mandible)?

All 4 must agree. State your verified jaw, then determine side (viewer's left/right → patient's right/left), then assign the FDI number.

IMPORTANT: Even with this protocol, pano-based jaw determination can be wrong. Flag restoration locations as "PANO ASSESSMENT — requires photo verification" rather than stating them as certain.

STEP 4: TOOTH-BY-TOOTH ANALYSIS

For each quadrant, complete this table. For mixed dentition, include both deciduous and permanent teeth at each position.

| FDI | Status | Crown Evidence | Root Evidence | Confidence |

Status options: Present/Erupted, Present/Erupted with Restoration, Developing/Unerupted [stage], Absent—No Development, Absent—Possible Extraction [evidence], Deciduous—Present [root status], Uncertain [explain]

STEP 5: DECIDUOUS INVENTORY & CONSISTENCY CHECK

| Deciduous | Present? | Root Status | Permanent Successor | Successor Status | Consistent? |

Check all 12 possible deciduous teeth (55,54,53,65,64,63,75,74,73,85,84,83). Flag any where the deciduous tooth is ABSENT but the successor is NOT yet erupted — this suggests premature loss with potential space implications.

STEP 6: FIRST MOLAR STATUS

For 16, 26, 36, 46 — state Present or Extracted with evidence. Include jaw verification.

STEP 7: THIRD MOLAR ASSESSMENT

For 18, 28, 38, 48 — state Absent/Developing/Present with evidence. If developing, describe follicle location and estimated Nolla stage.

STEP 8: APPLIANCES & PATHOLOGY

Describe any orthodontic appliances (expanders, TPAs, bands, wires, space maintainers). Describe any pathological findings. If none, state "None identified."

STEP 9: SELF-VERIFICATION

Before finalizing, confirm:

[ ] Molar count matches tooth-by-tooth findings?
[ ] All restorations passed 4-check jaw verification?
[ ] Deciduous-permanent pairs are consistent?
[ ] Any absent deciduous teeth flagged for premature loss?
[ ] Third molars only marked "Developing" with follicle evidence?
[ ] No symmetry assumptions made?

If any check fails, revise before proceeding.

═══════════════════════════════════════
OUTPUT: PANO SUMMARY
═══════════════════════════════════════

After completing all steps, compile this structured summary. This is what gets passed to Call 2.

PANO_SUMMARY_START

ORIENTATION CONFIRMED: [Yes/No + method]

TEETH PRESENT & ERUPTED:
Maxilla: [FDI numbers]
Mandible: [FDI numbers]

TEETH DEVELOPING/UNERUPTED:
Maxilla: [FDI numbers with brief stage notes]
Mandible: [FDI numbers with brief stage notes]

TEETH ABSENT:
[FDI numbers with reason: no development / possible premature loss / extraction signs]

DECIDUOUS TEETH RETAINED:
Upper: [list with root status notes]
Lower: [list with root status notes]

PREMATURE DECIDUOUS LOSS:
[List any deciduous teeth that appear absent while successor is still unerupted, or "None identified"]

RESTORATIONS (PANO ASSESSMENT — requires photo verification):
[Tooth FDI]: [type] — 4-check result: [jaw], [confidence]

THIRD MOLARS:
18: [status + evidence]
28: [status + evidence]
38: [status + evidence]
48: [status + evidence]

FIRST MOLARS:
16: [status]
26: [status]
36: [status]
46: [status]

APPLIANCES:
[description or "None identified"]

PATHOLOGY:
[description or "None identified"]

KEY CLINICAL CONCERNS:
- [concern]
- [concern]

ITEMS NEEDING PHOTO VERIFICATION:
- Restoration location — pano says [tooth/jaw], needs photo confirmation
- [any other uncertain findings]

PANO_SUMMARY_END`;

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
  const startMarker = 'PANO_SUMMARY_START';
  const endMarker = 'PANO_SUMMARY_END';
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
    console.log('Starting Call 1: Panoramic analysis with Gemini Pro...');
    
    const call1PromptFilled = fillTemplate(call1PanoPrompt, templateVars);
    
    console.log(`Pano image - Size: ${panoImage.length} chars`);

    // Call 1: Pano analysis using Gemini Pro vision
    const call1Text = await callGeminiVision(
      'You are an expert orthodontic radiograph analyst. Analyze the provided panoramic X-ray image following the structured protocol exactly.',
      [
        { type: 'image_url', image_url: { url: panoImage } },
        { type: 'text', text: call1PromptFilled }
      ]
    );
    
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
    
    console.log(`Starting Call 2: Photo analysis with ${photoImages.length} photos using Gemini Pro...`);
    
    // Add CALL_1_OUTPUT to template vars
    templateVars.CALL_1_OUTPUT = panoSummary;
    
    const call2PromptFilled = fillTemplate(call2PhotosPrompt, templateVars);
    
    // Prepare photo content for Gemini (OpenAI-compatible format)
    const geminiContent: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    
    photoImages.forEach((photoUrl: string, index: number) => {
      console.log(`Photo ${index + 1} - Size: ${photoUrl.length} chars`);
      geminiContent.push({
        type: 'image_url',
        image_url: { url: photoUrl }
      });
    });
    
    // Add the prompt text
    geminiContent.push({
      type: 'text',
      text: call2PromptFilled
    });

    // Call 2: Photo analysis + cross-validation using Gemini Pro vision
    const call2Text = await callGeminiVision(
      'You are an expert orthodontic analyst. Analyze the provided intraoral photographs and cross-validate with the panoramic analysis summary, following the structured protocol exactly.',
      geminiContent
    );
    
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
