
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const getGeminiApiKey = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('service_name', 'gemini')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching Gemini API key:', error);
      return null;
    }

    return apiKey?.key_value;
  } catch (error) {
    console.error('Exception fetching Gemini API key:', error);
    return null;
  }
};

export const saveGeminiApiKey = async (apiKey: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please log in to save your API key securely.",
      variant: "destructive"
    });
    // Still save to localStorage so it can be used in the current session
    localStorage.setItem("gemini_api_key", apiKey);
    return true;
  }

  try {
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: user.id,
        service_name: 'gemini',
        key_value: apiKey
      }, {
        onConflict: 'user_id,service_name'
      });

    if (error) {
      console.error('Error saving Gemini API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Gemini API key saved successfully to your account."
    });
    return true;
  } catch (error) {
    console.error('Exception saving Gemini API key:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};

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

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

// System prompt for JSON code formatting
const JSON_FORMAT_SYSTEM_PROMPT = `You are a code generation assistant that helps users build frontend UI components and pages. 
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
}`;

export const sendMessageToGemini = async (
  apiKey: string,
  messages: { type: "user" | "ai"; content: string }[],
  formatAsJson: boolean = false,
  retryCount: number = 0
): Promise<string> => {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }

  // Convert our message format to Gemini format
  let geminiMessages: GeminiMessage[] = [];
  
  // Add system prompt for JSON formatting if requested
  if (formatAsJson) {
    geminiMessages.push({
      role: "user",
      parts: [{ text: JSON_FORMAT_SYSTEM_PROMPT }]
    });
    // Add a separator to clearly indicate the system prompt is done
    geminiMessages.push({
      role: "model",
      parts: [{ text: "I'll format my responses as JSON with html, css, and js fields." }]
    });
  }
  
  // Add user messages - convert from our internal format to Gemini format
  const userMessages: GeminiMessage[] = messages
    .filter(msg => msg.content.trim() !== '') // Filter out empty messages
    .map((msg) => ({
      // Use a type assertion to ensure role is correctly typed as "user" | "model"
      role: (msg.type === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: msg.content }],
    }));
  
  geminiMessages = [...geminiMessages, ...userMessages];

  // Make sure there's at least one message
  if (geminiMessages.length === 0) {
    throw new Error("No valid messages to send");
  }

  const requestBody: GeminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature: formatAsJson ? 0.2 : 0.7, // Lower temperature for more predictable code generation
      maxOutputTokens: formatAsJson ? 4096 : 2048, // Higher token limit for code generation
    },
  };

  console.log("Request to Gemini:", JSON.stringify(requestBody, null, 2));

  try {
    // Make API request with appropriate timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Use gemini-2.0-flash model
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      }
    );
    
    clearTimeout(timeoutId);

    // Enhanced error handling for 503 and other errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API HTTP error:", response.status, errorText);
      
      // Handle Service Unavailable (503) with retry
      if (response.status === 503 && retryCount < 3) {
        console.log(`Retrying request (attempt ${retryCount + 1}/3) after 503 error`);
        // Exponential backoff: wait longer between each retry
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendMessageToGemini(apiKey, messages, formatAsJson, retryCount + 1);
      }
      
      // Handle specific HTTP errors
      if (response.status === 400) {
        throw new Error("Invalid request format. Please check your message and try again.");
      } else if (response.status === 401 || response.status === 403) {
        throw new Error("API key is invalid or unauthorized. Please check your Gemini API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      } else if (response.status === 503) {
        throw new Error("Gemini API service is temporarily unavailable. Please try again later.");
      } else {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    const data: GeminiResponse = await response.json();
    console.log("Gemini response data:", JSON.stringify(data, null, 2));
    
    // Check if the response contains an error
    if (data.error) {
      console.error("Gemini API response error:", data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }
    
    // Check if the response was blocked
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${data.promptFeedback.blockReason}`);
    }

    // Extract the response text
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && 
        data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected Gemini response format:", data);
      return "No response generated. Please try a different prompt.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    
    if (error instanceof Error) {
      // Check for common API key issues
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('api key') || 
          errorMsg.includes('key') && (errorMsg.includes('invalid') || errorMsg.includes('unauthorized'))) {
        throw new Error("Invalid API key. Please check your Gemini API key and try again.");
      }
      
      // Return the original error
      throw error;
    }
    
    throw new Error("Unknown error occurred while processing your request.");
  }
};

// Helper function for generating code in JSON format
export const generateCodeAsJson = async (
  apiKey: string,
  prompt: string
): Promise<{ html: string; css: string; js: string } | null> => {
  try {
    // Replace {{USER_INPUT}} with the actual prompt if present
    const formattedPrompt = JSON_FORMAT_SYSTEM_PROMPT.includes("{{USER_INPUT}}") 
      ? JSON_FORMAT_SYSTEM_PROMPT.replace(/{{USER_INPUT}}/g, prompt)
      : prompt;
    
    const response = await sendMessageToGemini(
      apiKey, 
      [{ type: "user", content: formattedPrompt }],
      true // Format as JSON
    );
    
    try {
      const jsonResponse = JSON.parse(response);
      
      // Validate that the response has the expected structure
      if (
        typeof jsonResponse.html === 'string' &&
        typeof jsonResponse.css === 'string' &&
        typeof jsonResponse.js === 'string'
      ) {
        return jsonResponse;
      } else {
        console.error("Invalid JSON structure from Gemini:", jsonResponse);
        return null;
      }
    } catch (e) {
      console.error("Failed to parse JSON from Gemini response:", e);
      return null;
    }
  } catch (error) {
    console.error("Error generating code as JSON:", error);
    toast({
      title: "Code Generation Error",
      description: error instanceof Error ? error.message : "Failed to generate code",
      variant: "destructive"
    });
    return null;
  }
};
