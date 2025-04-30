
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

// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Initial delay for retry in ms (will be increased exponentially)
const INITIAL_RETRY_DELAY = 500;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the request data
    const { action, messages, prompt } = await req.json()
    
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
    
    if (apiKeyError) {
      console.error('Error fetching Gemini API key:', apiKeyError)
      return new Response(
        JSON.stringify({ error: "Failed to access AI service database", details: apiKeyError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (!apiKeyData || !apiKeyData.key_value) {
      console.error('No Gemini API key found in the database')
      return new Response(
        JSON.stringify({ error: "AI service not configured. Please add a Gemini API key in the application settings." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      JSON.stringify({ error: "AI service error occurred", details: error.message || "Unknown error" }),
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
    
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      console.error("Gemini API error:", data.error)
      return new Response(
        JSON.stringify({ error: "AI service returned an error", details: data.error.message || "Unknown error" }),
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
        JSON.stringify({ text: "No response generated", details: "The AI model returned an empty response" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Chat generation error:', error)
    return new Response(
      JSON.stringify({ error: "Error generating response", details: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

async function handleCodeGeneration(prompt: string, apiKey: string, corsHeaders: any) {
  try {
    // Replace any {{USER_INPUT}} placeholder with the actual prompt
    const finalPrompt = prompt.replace(/{{USER_INPUT}}/g, prompt);
    
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
        parts: [{ text: finalPrompt }]
      }
    ]
    
    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }
    
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )
    
    const data = await response.json()
    
    if (data.error) {
      console.error("Code generation API error:", data.error)
      return new Response(
        JSON.stringify({ error: "AI service returned an error", details: data.error.message || "Unknown error" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      
      const responseText = data.candidates[0].content.parts[0].text
      
      try {
        // Try to parse as JSON to validate format
        const jsonResponse = JSON.parse(responseText)
        
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
            JSON.stringify({ error: "Generated code format is invalid", details: "The response did not include all required fields" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } catch (error) {
        console.error("Failed to parse JSON:", error, "Raw response:", responseText)
        return new Response(
          JSON.stringify({ error: "Failed to generate valid code", details: "The AI model returned a response that could not be parsed as JSON" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      return new Response(
        JSON.stringify({ error: "No code generated", details: "The AI model returned an empty response" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('Code generation error:', error)
    return new Response(
      JSON.stringify({ error: "Error generating code", details: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Helper function to retry API calls with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // If the response is a 503 (Service Unavailable) or 429 (Too Many Requests), retry
    if ((response.status === 503 || response.status === 429) && retries > 0) {
      console.log(`Received ${response.status} status, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2); // Exponential backoff
    }
    
    return response;
  } catch (error) {
    // Network errors are also retriable
    if (retries > 0) {
      console.log(`Network error, retrying in ${delay}ms... (${retries} retries left):`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2); // Exponential backoff
    }
    throw error;
  }
}
