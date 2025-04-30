
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request data
    const { action, messages, prompt, formatAsJson } = await req.json()
    
    // Create a Supabase client with the project details and admin key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get the Gemini API key from Supabase secrets
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('service_name', 'gemini')
      .maybeSingle()
    
    if (apiKeyError || !apiKeyData) {
      console.error('Error fetching Gemini API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: "Failed to access AI service" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const apiKey = apiKeyData.key_value
    
    // Handle different AI actions
    if (action === 'generateChat') {
      return await handleChatGeneration(messages, apiKey, corsHeaders)
    } else if (action === 'generateCode') {
      return await handleCodeGeneration(prompt, apiKey, corsHeaders)
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action specified" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('AI service error:', error)
    return new Response(
      JSON.stringify({ error: "AI service error occurred" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleChatGeneration(messages: any[], apiKey: string, corsHeaders: any) {
  try {
    // Convert to Gemini format
    const geminiMessages: GeminiMessage[] = messages
      .filter(msg => msg.content && msg.content.trim() !== '')
      .map((msg) => ({
        role: (msg.type === "user" ? "user" : "model") as "user" | "model",
        parts: [{ text: msg.content }],
      }))
    
    if (geminiMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No valid messages to process" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("API HTTP error:", response.status, errorText)
      return new Response(
        JSON.stringify({ error: `AI service unavailable (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const data = await response.json()
    
    if (data.error) {
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const text = data.candidates[0].content.parts[0].text
      return new Response(
        JSON.stringify({ text }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ text: "No response generated" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Chat generation error:', error)
    return new Response(
      JSON.stringify({ error: "Error generating response" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCodeGeneration(prompt: string, apiKey: string, corsHeaders: any) {
  try {
    // System prompt for JSON code formatting
    const systemPrompt = `You are a code generation assistant that helps users build frontend UI components and pages. 
When the user asks for UI components, respond ONLY with clean, executable frontend code in JSON format, containing three fields: html, css, and js.
- Do not include any explanations, comments, or markdown formatting in your response.
- Each field should contain raw code as a string.
- Ensure the code works together when rendered in a single browser HTML page.
- Keep the design responsive and minimal.
Your response must be in this exact format:
{
  "html": "<!DOCTYPE html>\\n<html>...</html>",
  "css": "body { ... }",
  "js": "document.addEventListener(...);"
}`

    // Prepare messages for the code generation
    const geminiMessages: GeminiMessage[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "I'll format my responses as JSON with html, css, and js fields." }]
      },
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ]
    
    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error("Code generation API error:", response.status, errorText)
      return new Response(
        JSON.stringify({ error: `AI service unavailable (${response.status})` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const data = await response.json()
    
    if (data.error) {
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const response = data.candidates[0].content.parts[0].text
      
      try {
        // Try to parse as JSON to validate format
        const jsonResponse = JSON.parse(response)
        
        // Validate expected structure
        if (typeof jsonResponse.html === 'string' &&
            typeof jsonResponse.css === 'string' &&
            typeof jsonResponse.js === 'string') {
          
          return new Response(
            JSON.stringify(jsonResponse),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          console.error("Invalid JSON structure:", jsonResponse)
          return new Response(
            JSON.stringify({ error: "Generated code format is invalid" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (error) {
        console.error("Failed to parse JSON:", error)
        return new Response(
          JSON.stringify({ error: "Failed to generate valid code" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: "No code generated" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Code generation error:', error)
    return new Response(
      JSON.stringify({ error: "Error generating code" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
