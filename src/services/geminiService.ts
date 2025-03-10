
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
  if (!apiKey) {
    throw new Error("API key is required");
  }

  // Convert our message format to Gemini format
  const geminiMessages: GeminiMessage[] = messages.map((msg) => ({
    role: msg.type === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const requestBody: GeminiRequest = {
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  try {
    // Make API request with appropriate timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent?key=${apiKey}`,
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

    const data: GeminiResponse = await response.json();
    
    // Check if the response contains an error
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }
    
    // Check if the response was blocked
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${data.promptFeedback.blockReason}`);
    }

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    // Extract the response text
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "No response generated. Please try a different prompt.";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    }
    
    console.error("Error calling Gemini API:", error);
    
    if (error instanceof Error) {
      // Check for common API key issues
      if (error.message.includes('API key not valid')) {
        throw new Error("Invalid API key. Please check your Gemini API key and try again.");
      }
      throw error;
    }
    
    throw new Error("Unknown error occurred while processing your request.");
  }
};
