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
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Generate a session ID for this chat session if we don't have one
    if (!chatSessionId) {
      setChatSessionId(uuidv4());
    }

    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
      setGeminiApiKey(storedKey);
    }

    // If user is authenticated, load their chat history
    if (user && chatSessionId) {
      loadChatHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [user, chatSessionId]);

  // Load chat history from the database
  const loadChatHistory = async () => {
    if (!user || !chatSessionId) {
      setIsLoadingHistory(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', chatSessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading chat history:', error);
        setIsLoadingHistory(false);
        return;
      }

      if (data && data.length > 0) {
        // Convert database records to Message objects
        const loadedMessages = data.map(record => ({
          type: record.message_type as 'user' | 'ai',
          content: record.content
        }));
        
        // Only replace messages if we have history and this is the initial load
        if (messages.length === 1 && messages[0].type === 'ai') {
          setMessages(loadedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Save a message to the database
  const saveChatMessage = async (message: Message) => {
    if (!user || !chatSessionId) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          project_id: chatSessionId,
          message_type: message.type,
          content: message.content
        });

      if (error) {
        console.error('Error saving chat message:', error);
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

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
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
      setIsListening(false);

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
      try {
        recognition.start();
        setIsListening(true);
        toast({
          title: "Voice Recognition Active",
          description: "Speak clearly into your microphone."
        });
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        toast({
          title: "Speech Recognition Error",
          description: "Failed to start speech recognition. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleSend = async (content = inputValue) => {
    if (!content.trim() || isProcessing) return;

    const userMessage: Message = {
      type: 'user',
      content
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsProcessing(true);

    // Save user message to database
    await saveChatMessage(userMessage);

    // Show processing message
    setMessages(prev => [...prev, {
      type: 'ai',
      content: '',
      isProcessing: true
    }]);

    try {
      if (geminiApiKey) {
        console.log("Sending message to Gemini with API key:", geminiApiKey ? "API key exists" : "No API key");
        
        const recentMessages = [...messages.slice(-5), { type: 'user' as const, content }];
        
        const response = await sendMessageToGemini(geminiApiKey, recentMessages);
        console.log("Received response:", response);
        
        const aiMessage: Message = {
          type: 'ai',
          content: response
        };
        
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          
          newMessages[lastIndex] = aiMessage;
          return newMessages;
        });
        
        // Save AI response to database
        await saveChatMessage(aiMessage);
      } else {
        console.warn("No API key available for Gemini");
        setTimeout(() => {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            newMessages[lastIndex] = {
              type: 'ai',
              content: `Please set up your Gemini API key in the configuration panel above to enable AI responses.`
            };
            return newMessages;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      
      toast({
        title: "AI Response Error",
        description: error instanceof Error 
          ? (error.message.includes("404") 
              ? "There seems to be an issue with the Gemini API. Please check your API key and try again later." 
              : error.message)
          : "Failed to process your message. Please try again.",
        variant: "destructive"
      });
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        const errorMessage = error instanceof Error 
          ? (error.message.includes("404") 
              ? "I'm having trouble connecting to the AI service right now. This could be due to:\n\n1. An incorrect API key\n2. A temporary service disruption\n\nPlease verify your API key and try again later." 
              : error.message)
          : "I encountered an error processing your request. Please try again.";
          
        newMessages[lastIndex] = {
          type: 'ai',
          content: errorMessage
        };
        return newMessages;
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApiKeySet = (apiKey: string) => {
    setGeminiApiKey(apiKey);
    console.log("API key set:", apiKey ? "API key exists" : "No API key");
    
    if (apiKey && messages.length === 1) {
      setTimeout(() => {
        const welcomeMessage: Message = {
          type: 'ai',
          content: 'Thanks for setting up your API key! I can now provide intelligent responses to help with your project. What would you like assistance with today?'
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
        
        // Save this welcome message to the database
        saveChatMessage(welcomeMessage);
      }, 500);
    }
  };

  if (isLoadingHistory) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-primary dark:text-white">
        <p>Loading your chat history...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="icon" className="border-gray-200 dark:border-gray-700 text-primary dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-primary dark:text-white">Project Assistant</h2>
        </div>
        <ThemeToggle />
      </div>
      
      <div className="px-4 pt-4">
        <ApiKeyInput onApiKeySet={handleApiKeySet} initialApiKey={geminiApiKey} />
      </div>
      
      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      
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
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default ChatInterface;
