
import { useState, useRef, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import ApiKeyInput from "./ApiKeyInput";
import { sendMessageToGemini } from "@/services/geminiService";

export type Message = {
  type: 'user' | 'ai';
  content: string;
  isProcessing?: boolean;
};

const ChatInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([{
    type: 'ai',
    content: 'Hi! I\'m your AI assistant. How can I help with your project today?'
  }]);
  const [inputValue, setInputValue] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle scrolling to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript;
        setTranscript(result);
      };
      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
      };
      setRecognition(recognitionInstance);
    } else {
      toast({
        title: "Browser Not Supported",
        description: "Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.",
        variant: "destructive"
      });
    }
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);

      // If transcript has content, send it as a message
      if (transcript.trim()) {
        handleSend(transcript);
        setTranscript("");
      }
      toast({
        title: "Voice Recognition Stopped",
        description: "Voice input has been processed."
      });
    } else {
      setTranscript("");
      recognition.start();
      setIsListening(true);
      toast({
        title: "Voice Recognition Active",
        description: "Speak clearly into your microphone."
      });
    }
  };

  const handleSend = async (content = inputValue) => {
    if (!content.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      type: 'user',
      content
    }]);
    setInputValue("");

    // Add processing message for AI
    setMessages(prev => [...prev, {
      type: 'ai',
      content: '',
      isProcessing: true
    }]);

    try {
      // If Gemini API key is set, use Gemini API
      if (geminiApiKey) {
        // Only send the last few messages to avoid token limits
        const recentMessages = [...messages.slice(-5), { type: 'user' as const, content }];
        
        const response = await sendMessageToGemini(geminiApiKey, recentMessages);
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          
          // Replace processing message with actual response
          newMessages[lastIndex] = {
            type: 'ai',
            content: response
          };
          return newMessages;
        });
      } else {
        // Fallback to default response if no API key
        setTimeout(() => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            // Replace processing message with default response
            newMessages[lastIndex] = {
              type: 'ai',
              content: `I'm processing your request: "${content}". To enable AI responses, please set up your Gemini API key.`
            };
            return newMessages;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      // Show error toast
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your message",
        variant: "destructive"
      });
      
      // Update the processing message to show error
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        newMessages[lastIndex] = {
          type: 'ai',
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}`
        };
        return newMessages;
      });
    }
  };

  const handleApiKeySet = (apiKey: string) => {
    setGeminiApiKey(apiKey);
  };

  return (
    <div className="w-1/4 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-background-darker">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="icon" className="border-gray-200 dark:border-gray-700 text-primary hover:bg-gray-50 dark:hover:bg-gray-700">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-primary dark:text-white">Project Assistant</h2>
        </div>
        <ThemeToggle />
      </div>
      
      {/* API Key Input Section */}
      <div className="px-4 pt-4">
        <ApiKeyInput onApiKeySet={handleApiKeySet} />
      </div>
      
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      
      {/* Voice transcript display */}
      {isListening && transcript && (
        <div className="mx-4 mb-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-primary/20 dark:border-gray-600 text-sm text-primary dark:text-white shadow-sm">
          {transcript}
        </div>
      )}
      
      <InputArea 
        inputValue={inputValue} 
        setInputValue={setInputValue} 
        isListening={isListening} 
        toggleListening={toggleListening} 
        handleSend={() => handleSend()} 
      />
    </div>
  );
};

export default ChatInterface;
