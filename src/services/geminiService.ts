import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const getGeminiApiKey = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

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
};

export const saveGeminiApiKey = async (apiKey: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please log in to save your API key.",
      variant: "destructive"
    });
    return false;
  }

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
    description: "Gemini API key saved successfully."
  });
  return true;
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

export const sendMessageToGemini = async (
  apiKey: string,
  messages: { type: "user" | "ai"; content: string }[]
): Promise<string> => {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API key is required");
  }

  // Convert our message format to Gemini format
  const geminiMessages: GeminiMessage[] = messages
    .filter(msg => msg.content.trim() !== '') // Filter out empty messages
    .map((msg) => ({
      role: msg.type === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

  // Make sure there's at least one message
  if (geminiMessages.length === 0) {
    throw new Error("No valid messages to send");
  }

  const requestBody: GeminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  console.log("Request to Gemini:", JSON.stringify(requestBody, null, 2));

  try {
    // Make API request with appropriate timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    // Updated to use gemini-2.0-flash model
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

    // Check HTTP status before parsing JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API HTTP error:", response.status, errorText);
      
      // Handle specific HTTP errors
      if (response.status === 400) {
        throw new Error("Invalid request format. Please check your message and try again.");
      } else if (response.status === 401 || response.status === 403) {
        throw new Error("API key is invalid or unauthorized. Please check your Gemini API key.");
      } else if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
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
