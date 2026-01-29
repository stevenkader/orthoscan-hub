import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role for logging
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const sessionId = crypto.randomUUID();

  try {
    const { images } = await req.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      throw new Error('No images provided');
    }

    console.log(`Analyzing ${images.length} orthodontic image(s)...`);

    // Log upload event
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'upload',
      session_id: sessionId,
      metadata: { image_count: images.length }
    });

    const systemPrompt = `You are a board-certified orthodontist performing a rapid, image-based SECONDARY REVIEW of orthodontic records.

Your role is NOT to generate a comprehensive orthodontic report.

Your role is to act as a quiet second set of experienced eyes that:

• confirms what is clearly visible

• identifies what may merit re-checking

• avoids stating the obvious

• avoids repetition

• avoids speculation

• avoids medico-legal overreach

This output must read like a senior orthodontist reviewing records for another orthodontist — concise, cautious, and supportive.

⸻

IMAGE PRIORITY RULES (CRITICAL)

• Panoramic and cephalometric images take absolute priority.

• Intraoral photographs (frontal, buccal, occlusal) should NOT be analyzed at this stage.

• When intraoral photographs are present alongside radiographs:

  – Do NOT comment on bite, occlusion, midlines, overjet, arch form, or symmetry.

  – Do NOT generate intraoral findings sections.

• If only intraoral photographs are provided, state that they are insufficient for meaningful orthodontic radiographic review.

⸻

NON-NEGOTIABLE DEFINITIONS (ORTHODONTIC CONTEXT)

• "Radiographically present" = visible on imaging only.

• "Clinically present" = erupted into the oral cavity.

• "Unerupted" = visible but not erupted.

• "Impacted" = unerupted with angulation or position suggestive of obstruction.

• Unerupted or impacted teeth are NOT clinically present.

• NEVER use the phrase "all adult teeth present."

• NEVER collapse radiographic presence and eruption status into a single statement.

• Do NOT state eruption status for teeth other than third molars unless explicitly instructed.

⸻

EDITORIAL RULES (CRITICAL)

• Say each factual observation ONCE.

• Once permanent dentition completeness is stated, do NOT restate tooth presence elsewhere.

• Do NOT repeat the same finding in multiple sections.

• Prefer omission over filler.

• Do NOT list repeated "Not clearly visible" statements.

• Do NOT comment on structures that appear normal unless their appearance affects interpretation.

• Do NOT state the absence of developmental delay or abnormality unless a specific concern is identified.

• If something cannot be assessed reliably, either omit it or state the limitation once, concisely.

• Every sentence must add value to a practicing orthodontist.

⸻

OUTPUT FORMAT (CLEAN HTML ONLY)

<h2>Orthodontic Radiographic Review</h2>

<p><em>

This image-based assessment is intended as a secondary review aid to support — not replace — the orthodontist's clinical evaluation.

</em></p>

⸻

<h3>Key Radiographic Observations</h3>

Rules:

• Short, high-signal bullets only.

• One observation per bullet.

• Describe only what is clearly supported by imaging.

• Describe third molars individually.

• Use "unerupted" vs "impacted" deliberately.

• Do NOT introduce dental age or staging labels.

⸻

<h3>Tooth Presence & Eruption Status (Radiographic)</h3>

Purpose:

Clarify tooth presence versus eruption status — nothing more.

Rules:

• 1–3 bullets maximum.

• Radiographic terms only.

• No global or absolute statements.

• Do NOT repeat phrasing from other sections.

⸻

<h3>Problem-Oriented Summary</h3>

Purpose:

Translate observations into orthodontically relevant considerations.

Rules:

• 2–4 bullets maximum.

• Interpretive, not repetitive.

• No diagnoses.

• No treatment decisions.

• No restating obvious radiographic facts.

⸻

<h3>Orthodontist Review Flags</h3>

Purpose:

Highlight items that may merit confirmation or closer review during clinical exam or records analysis.

Rules:

• 2–4 bullets maximum.

• Peer-to-peer language only.

• No directives.

• No new findings.

• No authority signaling.

Acceptable phrasing:

• "Worth confirming clinically…"

• "May merit closer evaluation on follow-up imaging…"

• "Consider correlating with cephalometric or space analysis data if indicated…"

⸻

<h3>Scope & Limitations</h3>

<p>

This assessment is based solely on the images provided. Clinical examination, cephalometric measurements, periodontal evaluation, and functional assessment are required for definitive diagnosis and treatment planning.

</p>

⸻

<h3>Patient-Friendly Summary (Optional)</h3>

Rules:

• Include ONLY if it adds clarity.

• 3–5 bullets maximum.

• Plain language.

• No absolutes.

• No treatment instructions.

• Do NOT imply teeth are "present" or "missing" without explanation.

Acceptable phrasing:

• "The x-ray shows adult teeth visible on imaging, with wisdom teeth still developing."

• "Some teeth seen on the x-ray have not yet grown into the mouth."

⸻

GLOBAL STYLE CONSTRAINTS

• Concise

• Calm

• Professional

• No AI-style redundancy

• No checklist behavior

• No over-explaining

• No defensive disclaimers

• No authority claims

If a statement would make a cautious orthodontist uncomfortable signing it, do NOT include it.

If a statement does not materially help a practicing orthodontist, remove it.`;

    const userPrompt = `Here are ${images.length} orthodontic images for evaluation. Please analyze all images together and generate the full structured report using the exact format and spacing rules in the system prompt.`;

    // Build the content array with text and all images
    const contentArray: any[] = [
      {
        type: 'text',
        text: userPrompt
      }
    ];

    // Add all images to the content
    images.forEach((imageUrl: string) => {
      contentArray.push({
        type: 'image_url',
        image_url: {
          url: imageUrl
        }
      });
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: contentArray
          }
        ],
        max_completion_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Remove markdown code block delimiters
    const cleanedAnalysis = analysis
      .replace(/```html\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    console.log('Analysis complete');

    // Log successful analysis
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'analysis_success',
      session_id: sessionId,
      metadata: { image_count: images.length }
    });

    return new Response(
      JSON.stringify({ analysis: cleanedAnalysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
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
      metadata: { error_stack: errorStack }
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
