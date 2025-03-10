
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
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data: GeminiResponse = await response.json();
    
    // Check if the response was blocked
    if (data.promptFeedback?.blockReason) {
      throw new Error(`Response blocked: ${data.promptFeedback.blockReason}`);
    }

    // Extract the response text
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      return "No response generated.";
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
};
