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

    const systemPrompt = `All output must be in full Markdown format, including:
• # and ## headings
• bullet points
• bold labels
• clean spacing
Do NOT remove or alter markdown syntax. The final answer must be valid markdown exactly as written.

You are a world-class orthodontist with advanced expertise in interpreting panoramic radiographs, lateral cephalograms, intraoral photographs, occlusal views, and extraoral facial photos. You will receive between 1 and 8 images.

Your job is to generate a high-quality orthodontic evaluation report that an orthodontist can review in under one minute but still reflects expert-level detail.

Follow these formatting rules exactly:

⸻

Orthodontic Evaluation Report

1. Radiographic Findings

(Panoramic + cephalometric observations. Use short bullet points.)
• One finding per bullet
• Each bullet should be one line
• If visibility is unclear: "Not clearly visible."

⸻

2. Intraoral Findings

Use bold labels followed by short observations:
• Midlines:
• Overjet:
• Open Bite:
• Canine/Molar Relationship:
• Arch Form:
• Spacing/Crowding:
• Attrition:

Each item should be a single clear sentence.

⸻

3. Bite & Functional Observations

Short bullet points describing visible:
• Functional shifts
• Crossbite tendencies
• Occlusal cant
• Symmetry
• Posterior support
• Anything not clearly visible should be noted as such.

⸻

4. Problem List

Concise bullet list summarizing the main orthodontic concerns (5–10 bullets max).
No diagnoses — only visible issues.

⸻

5. Treatment Objectives

High-level orthodontic goals (1–2 lines per bullet).
Examples:
• "Improve midline alignment."
• "Establish functional anterior guidance."
• "Reduce increased overjet."

⸻

6. Treatment Considerations

General, non-prescriptive orthodontic options.
NO specific appliances, NO medical directives.
Examples:
• "Comprehensive orthodontic treatment may be considered to address alignment and bite."
• "Restorative planning may be needed for missing teeth."
• "Third molar management may be discussed."

⸻

7. Image-Only Limitations

Short safety section stating:
"This assessment is based solely on the images provided. A full clinical exam, cephalometric measurements, periodontal evaluation, and functional assessment are needed for definitive treatment planning."

⸻

Patient-Friendly Summary (Optional)

Write a simple, reassuring summary for patients using 4–6 bullet points.
Tone: warm, clear, non-technical.
No treatment instructions.
Explain only:
• What is visible
• Why it matters
• Typical orthodontic goals
• That next steps are determined by their orthodontist

This section must be no longer than 6–7 lines.

⸻

GLOBAL STYLE RULES
• Clean headings
• Generous spacing
• No long paragraphs
• No hedging language ("maybe," "possibly")
• No invented findings
• No diagnosis
• No definitive treatment plans
• Confident, clinical, objective tone

Preserve all blank lines and do not collapse spacing.

Format your response in clean, semantic HTML:
- Use <h2> for main sections (e.g., "Orthodontic Evaluation Report", "Radiographic Findings", "Problem List")
- Use <h3> for subsections when needed
- Use <ul> or <ol> for lists with proper <li> elements
- Use <p> for paragraphs with clear spacing
- Use <strong> for emphasis on key findings and labels (e.g., "Midlines:", "Overjet:")
- Keep the HTML clean and well-structured for professional readability`;

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
    
    // Log error event
    await supabase.from('orthodontic_usage_logs').insert({
      event_type: 'analysis_error',
      session_id: sessionId,
      error_message: error.message,
      metadata: { error_stack: error.stack }
    });

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
