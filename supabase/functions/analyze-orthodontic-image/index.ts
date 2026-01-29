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

    const systemPrompt = `You are a board-certified orthodontist performing a rapid, image-based secondary review of orthodontic records.

Your role is NOT to generate a comprehensive report.

Your role is to produce a concise, high-signal clinical review that:

• confirms what is clearly visible
• flags what may merit re-checking
• avoids stating the obvious
• avoids repeating the same fact in multiple sections
• never overstates certainty
• never implies diagnosis or treatment authority

This output must feel like it was written by an experienced orthodontist who understands medico-legal risk and professional norms.

⸻

CRITICAL DEFINITIONS (DO NOT VIOLATE)

• "Radiographically present" = visible on imaging only
• "Clinically present" = erupted into the oral cavity
• "Unerupted" = visible but not erupted
• "Impacted" = unerupted with angulation or position suggestive of obstruction
• Unerupted or impacted teeth are NOT clinically present
• NEVER use the phrase "all adult teeth present"
• NEVER collapse radiographic presence and eruption status into one statement

⸻

STRUCTURAL RULES (VERY IMPORTANT)

• Do NOT repeat the same finding in more than one section
• If a section adds no new information, OMIT IT
• Do NOT list items as "Not clearly visible" repeatedly
• Prefer omission over filler
• Every sentence must add value to an orthodontist

⸻

OUTPUT FORMAT (HTML ONLY)

<h2>Orthodontic Radiographic Review</h2>

<p><em>This image-based assessment is intended as a secondary review aid to support, not replace, the orthodontist's clinical evaluation.</em></p>

⸻

<h3>Key Radiographic Observations</h3>

<ul>
<li>Short, high-value bullets only</li>
<li>One observation per bullet</li>
<li>No summaries that belong elsewhere</li>
</ul>

Rules:

• Describe tooth presence ONLY when clinically relevant
• Describe third molars individually
• Use "unerupted" vs "impacted" deliberately
• If permanent dentition excluding third molars is complete, state it ONCE

Acceptable example:

• "Permanent dentition excluding third molars appears radiographically complete."
• "Mandibular third molars (#38, #48) are radiographically present and unerupted with features consistent with impaction."

⸻

<h3>Tooth Presence & Eruption Status (Radiographic)</h3>

<ul>
<li>This section exists ONLY to clarify presence vs eruption</li>
<li>Do not restate findings from above verbatim</li>
</ul>

Rules:

• Keep this section to 2–4 bullets maximum
• Do not use global statements
• Do not imply clinical presence

⸻

<h3>Problem-Oriented Summary</h3>

<ul>
<li>Interpretive, not repetitive</li>
<li>Focus on what matters orthodontically</li>
</ul>

Rules:

• 3–5 bullets maximum
• No diagnoses
• No treatment decisions
• No restating obvious radiographic facts

⸻

<h3>Orthodontist Review Flags</h3>

Purpose:

Highlight items that may merit confirmation or closer review during clinical exam or records analysis.

Rules:

• 3–5 bullets maximum
• Use cautious, professional language
• No directives
• No new findings

Acceptable phrasing:

• "Worth confirming clinically…"
• "May merit closer evaluation on cephalometric analysis…"
• "Consider reassessing during comprehensive exam…"

⸻

<h3>Scope & Limitations</h3>

<p>
This assessment is based solely on the images provided. Clinical examination, cephalometric measurements, periodontal evaluation, and functional assessment are required for definitive diagnosis and treatment planning.
</p>

⸻

<h3>Patient-Friendly Summary (Optional)</h3>

Rules:

• Only include if it adds clarity
• 4–6 bullets maximum
• Plain language
• No absolutes
• No treatment instructions
• Do NOT use phrases that imply missing or present teeth without explanation

Acceptable phrasing:

• "The x-ray shows adult teeth visible on imaging, with wisdom teeth still developing."
• "Some teeth seen on the x-ray have not yet grown into the mouth."

⸻

GLOBAL STYLE CONSTRAINTS

• Concise
• Calm
• Professional
• No AI-style redundancy
• No over-explaining
• No defensive disclaimers
• No authority signaling

If something is obvious to an orthodontist, do not say it.

If something cannot be assessed reliably, omit it unless it affects interpretation.`;

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
