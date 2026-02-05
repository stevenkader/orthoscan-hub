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
 // CALL 2 PROMPT: Photo Analysis + Cross-Validation + Report (OST v5.1)
 // ═══════════════════════════════════════════════════════════════════════════════
 const call2PhotosPrompt = `You are completing an orthodontic screening analysis. You will:
 
 FIRST answer mandatory verification questions about the photos (Step A1)
 THEN complete the full photo analysis (Step A2)
 THEN cross-validate against panoramic results (Step B)
 THEN generate the clinical report (Step C)
 
 CRITICAL: Steps A1 and A2 must be completed FULLY before reading pano results in Step B.
 
 PATIENT CONTEXT
 Age: {{PATIENT_AGE}}
 Name: {{PATIENT_NAME}}
 Dentition stage: {{DENTITION_STAGE}}
 Known history: {{KNOWN_HISTORY}}
 
 ═══════════════════════════════════════
 STEP A1: PHOTO VERIFICATION PROTOCOL
 ═══════════════════════════════════════
 
 Answer every question below by looking at the photos. These commit you to observable facts BEFORE you assign any tooth identities. Inconsistencies between answers mean something is wrong — resolve before proceeding.
 
 COUNTING (from occlusal views)
 
 Q1. Upper arch total teeth visible: ___
 Q2. Upper arch, patient's RIGHT side (count from midline outward): ___
 Q3. Upper arch, patient's LEFT side (count from midline outward): ___
 Cross-check: Q1 must equal Q2 + Q3.
 
 Q4. Lower arch total teeth visible: ___
 Q5. Lower arch, patient's RIGHT side: ___
 Q6. Lower arch, patient's LEFT side: ___
 Cross-check: Q4 must equal Q5 + Q6.
 
 ANTERIOR SEGMENT (from frontal view)
 
 Q7. How many UPPER teeth are visible between the canine positions (the pointy teeth or where canines would be)? ___
 
 Q8. Describe their relative WIDTHS from patient's right to left using W (wider) and N (narrower). Example: "N-W-W-N" ___
 
 Q9. Midline diastema present? Yes/No. If yes, between which two teeth (counting from right)? ___
 
 Interpretation: If you see 4 teeth in an N-W-W-N pattern, those are 12-11-21-22 (laterals and centrals all erupted). If you see only 2 wide teeth with gaps lateral to them, those are 11-21 with laterals unerupted. Centrals are WIDER than laterals — this is the key differentiator.
 
 Q10. How many LOWER teeth between the canine positions? ___
 
 POSTERIOR SEGMENTS (from occlusal views, back to front)
 
 For each quadrant, describe every tooth from MOST POSTERIOR moving toward the midline. For each tooth state its size (Large/Medium/Small) and appearance (Natural/SSC/Other restoration).
 
 Q11. Upper RIGHT (back to front):
 Tooth 1 (most posterior): ___
 Tooth 2: ___
 Tooth 3: ___
 Tooth 4: ___ (continue if more)
 
 Q12. Upper LEFT (back to front):
 Tooth 1 (most posterior): ___
 Tooth 2: ___
 Tooth 3: ___
 Tooth 4: ___ (continue if more)
 
 Q13. Lower RIGHT (back to front):
 Tooth 1: ___
 Tooth 2: ___
 Tooth 3: ___
 Tooth 4: ___
 
 Q14. Lower LEFT (back to front):
 Tooth 1: ___
 Tooth 2: ___
 Tooth 3: ___
 Tooth 4: ___
 
 RESTORATION LOCATOR
 
 Q15. How many metallic restorations (SSCs/amalgams) do you see total? ___
 
 Q16. For each restoration:
 a) UPPER or LOWER arch? ___
 b) Patient's RIGHT or LEFT? ___
 c) How many teeth are between this restoration and the MOST POSTERIOR tooth on that side? ___ (0 = it IS the most posterior tooth; 1 = one tooth behind it; etc.)
 d) Is there a natural tooth between the restoration and the first permanent molar? Yes/No ___
 
 Interpretation: If the answer to (d) is NO, the SSC is directly adjacent to the first molar = deciduous second molar (x5 position). If YES, there is at least one natural tooth between the SSC and the first molar = the SSC is on the deciduous first molar (x4) or further forward.
 
 Q17. Is the restored tooth LARGER, SMALLER, or SIMILAR SIZE compared to the most posterior tooth? ___ (Smaller = deciduous; Similar = possibly permanent)
 
 APPLIANCE CHECK
 
 Q18. Any metal framework crossing the palate in the upper occlusal view? Yes/No ___
 Q19. Metal bands around any first molars? Yes/No ___
 Q20. Expansion screw visible in the palate? Yes/No ___
 Q21. Any brackets, wires, buttons, or elastics on any teeth? Yes/No ___
 
 SYMMETRY
 
 Q22. Same number of teeth on upper right vs upper left? Yes/No If no, which side has more and how many more? ___
 
 Q23. Same number of teeth on lower right vs lower left? Yes/No ___
 
 LATERAL VIEW CROSS-CHECK
 
 Q24. LEFT LATERAL — Can you see the metallic restoration? Yes/No If yes, is it in the UPPER or LOWER arch? ___ How many teeth behind it (toward back) are visible? ___
 
 Q25. RIGHT LATERAL — Any metallic restoration visible? Yes/No ___
 
 IDENTITY ASSIGNMENT
 
 Now assign tooth identities based on your answers above. Work back-to-front in each quadrant. The most posterior erupted tooth in each quadrant is the first permanent molar (16/26/36/46).
 
 Q26. Upper RIGHT (back to front):
 Tooth 1 = 16 (permanent first molar)
 Tooth 2 = ___ [FDI number and deciduous/permanent]
 Tooth 3 = ___ (continue to midline, connecting with your anterior teeth from Q7-Q8)
 
 Q27. Upper LEFT (back to front):
 Tooth 1 = 26
 Tooth 2 = ___ [Is this the SSC tooth?]
 Tooth 3 = ___ (continue to midline)
 
 Q28. Lower RIGHT (back to front):
 Tooth 1 = 46
 Tooth 2 = ___ (continue)
 
 Q29. Lower LEFT (back to front):
 Tooth 1 = 36
 Tooth 2 = ___ (continue)
 
 CONSISTENCY CHECK
 
 Q30. Do your assignments match:
 - Total counts from Q1-Q6? ___
 - Anterior count from Q7? ___
 - Restoration position from Q16? ___
 - Symmetry from Q22-Q23? ___
 If any inconsistency, STOP and resolve before continuing.
 
 FINAL VERIFIED POSITION STATEMENT
 
 State your locked findings:
 - Total visible: Upper ___, Lower ___
 - SSC location: tooth ___ in [upper/lower] [right/left]
 - Appliances: ___
 - Upper anterior erupted (FDI): ___
 - All permanent teeth erupted (FDI): ___
 - All deciduous teeth present (FDI): ___
 
 These are now LOCKED. They take priority over pano findings for eruption status and restoration location.
 
 ═══════════════════════════════════════
 STEP A2: FULL PHOTO ANALYSIS
 ═══════════════════════════════════════
 
 Using your verified findings from A1, complete these assessments.
 
 OCCLUSION (from lateral + frontal views)
 
 | | Right Side | Left Side |
 | Molar relationship | Class I / II / III | Class I / II / III |
 | Canine relationship | | |
 | Posterior crossbite | Yes/No | Yes/No |
 
 Overjet: ___
 Overbite: ___
 Midlines: Upper to face ___, Lower to upper ___
 Anterior crowding/spacing: Upper ___, Lower ___
 
 ARCH FORM
 Upper: shape, symmetry, expansion appliance (use Q18-Q21 answers)
 Lower: shape, symmetry, crowding location
 
 SOFT TISSUE & HYGIENE
 Gingival health, oral hygiene, plaque, recession, frenum, lesions
 
 PHOTO SUMMARY
 
 Erupted permanent teeth: [FDI list from Q26-Q29]
 Deciduous teeth: [FDI list from Q26-Q29]
 Restorations: [from Q15-Q17]
 Appliances: [from Q18-Q21]
 Occlusion: [summary]
 Arch form: [summary]
 Hygiene: [summary]
 
 ═══════════════════════════════════════
 STEP B: CROSS-VALIDATION
 ═══════════════════════════════════════
 
 NOW read the panoramic analysis results and compare.
 
 PANORAMIC ANALYSIS RESULTS:
 {{CALL_1_OUTPUT}}
 
 CROSS-VALIDATION TABLE
 
 | Finding | Pano Says | Photos Say (LOCKED) | Match? | Final | Confidence |
 
 Compare: restoration location, first molar status, deciduous canines, deciduous molars, erupted permanent teeth, unerupted teeth, appliances, premature loss, any uncertain findings.
 
 DISCREPANCY RESOLUTION
 
 For each disagreement:
 PHOTOS WIN for: eruption status, restoration location/type, occlusion, arch form, appliance identification
 PANO WINS for: developing/unerupted teeth, root development, pathology, third molar status, bone levels
 USE BOTH for: posterior tooth count, premature loss assessment
 
 CONFIDENCE LEVELS
 VERIFIED = Both agree | HIGH = One clear, other compatible | MEDIUM = One shows, other can't confirm | LOW = Ambiguous | CONFLICTED = Disagree, flag
 
 ═══════════════════════════════════════
 STEP C: CLINICAL SCREENING REPORT
 ═══════════════════════════════════════
 
 ---
 
 ## ORTHODONTIC SCREENING REPORT
 ### AI-Assisted Multi-Modal Analysis
 
 **Patient:** {{PATIENT_NAME}}
 **Age:** {{PATIENT_AGE}} years
 **Date:** {{DATE}}
 **Dentition Stage:**{{DENTITION_STAGE}}
 **Images Analyzed:** 1 panoramic radiograph + {{NUM_PHOTOS}} intraoral photographs
 
 *This AI-assisted evaluation is based solely on the uploaded images and is not a substitute for an in-person orthodontic examination, diagnosis, or treatment plan.*
 
 ---
 
 ### 🚨 RED FLAGS — Review Immediately
 
 [Only if findings exist. Otherwise: "None identified."]
 | Finding | Location | Source | Urgency | Recommended Action |
 
 ---
 
 ### ⏱️ TREATMENT TIMING ASSESSMENT
 
 **Dental Age:** [Early mixed / Late mixed / Early permanent / Full permanent]
 
 | Factor | Status | Source | Ready? |
 | First molars erupted? | | | |
 | Permanent incisors erupted? | | | |
 | Canine position | | Pano + Photo | |
 | Second molars | | Pano | |
 | Premolars / deciduous molars | | Both | |
 
 **Recommendation:**
 ☐ Ready for comprehensive treatment now
 ☐ Early/interceptive treatment indicated (Phase 1)
 ☐ Monitor and recall in [X] months
 ☐ Urgent intervention needed
 
 **Rationale:** [1-2 sentences]
 
 ---
 
 ### 📊 CASE COMPLEXITY
 
 **Level:** [Low / Moderate / High]
 
 **Skeletal & Dental:**
 | Factor | Finding | Source | Impact |
 
 **Occlusion (from photos):**
 | Factor | Finding | Impact |
 
 **Space Analysis:**
 - Upper arch: [Crowded / Adequate / Spaced]
 - Lower arch: [Crowded / Adequate / Spaced]
 - Leeway space: [Available / Compromised / Not available]
 
 ---
 
 ### 📷 ADDITIONAL IMAGING
 
 | Imaging | Indicated? | Reason |
 | CBCT | Now / Conditional / No | |
 | Cephalometric | Recommended / Not needed | |
 | Periapical | Yes [teeth] / No | |
 | Repeat pano | In [X] months / Not needed | |
 
 ---
 
 ### 👨‍👩‍👧 PARENT COMMUNICATION
 
 Write in plain language. No FDI notation. No jargon.
 
 **Development Status:**
 "Your child is in [stage] with [X] baby teeth remaining..."
 
 **Treatment Timing:**
 "[We recommend... because...]"
 
 **Things We're Monitoring:**
 "[parent-friendly terms]"
 
 **Treatment Preview:**
 "Treatment would likely involve [description] lasting [duration]."
 
 **Next Steps:**
 "[specific actions]"
 
 **Common Questions:**
 | Question | Response |
 | Will they need teeth pulled? | |
 | Jaw surgery? | |
 | Wisdom teeth? | |
 | How long will braces take? | |
 | When should we start? | |
 
 ---
 
 ### 📋 DETAILED FINDINGS (Technical Reference)
 
 **Verified Tooth Inventory:**
 | Category | Teeth (FDI) | Confidence |
 | Present & Erupted | | VERIFIED |
 | Developing/Unerupted | | HIGH (Pano) |
 | Absent (no development) | | HIGH (Pano) |
 | Deciduous Retained | | VERIFIED |
 
 **Restorations:**
 | Tooth | Type | Pano Said | Photos Said (LOCKED) | Final | Confidence |
 
 **Third Molars:**
 | Tooth | Status | Source |
 
 **Occlusion (Photos):**
 | Measurement | Finding |
 
 ---
 
 ### ⚠️ LIMITATIONS & VERIFICATION NEEDED
 
 [ ] [Clinical checks needed]
 
 **Pano-only findings (not photo-verifiable):** [list]
 **Photo-only findings (not pano-verifiable):** [list]
 **Cross-validation:** [X] of [Y] verified. [Z] discrepancies. Reliability: [level].
 
 **Analysis:** OST v5.1 | **Images:** 1 pano + {{NUM_PHOTOS}} photos | **Generated:** {{TIMESTAMP}}
 **Verified by:**_______________________ (Clinician Signature)
 *This report is an AI-assisted screening aid and does not replace clinical judgment.*`;
 
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
       metadata: { image_count: images.length, pipeline: '2-call-v5.1' }
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
         pipeline: '2-call-v5.1',
         calls_made: 2,
         pano_count: 1,
         photo_count: photoImages.length
       }
     });
 
     return new Response(
       JSON.stringify({ 
         analysis: cleanedAnalysis,
         panoAnalysis: call1Text,
         pipeline: '2-call-v5.1'
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
       metadata: { error_stack: errorStack, pipeline: '2-call-v5.1' }
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