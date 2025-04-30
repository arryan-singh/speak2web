import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Code } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import MessageList from "./MessageList";
import InputArea from "./InputArea";
import ApiKeyInput from "./ApiKeyInput";
import CodeGenerator from "./CodeGenerator";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Generate a session ID for this chat session if we don't have one
    if (!chatSessionId) {
      setChatSessionId(uuidv4());
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
      // Get 5 most recent messages for context
      const recentMessages = [...messages.slice(-5), { type: 'user' as const, content }];
      
      // Call our new AI service edge function
      const { data, error } = await supabase.functions.invoke('ai-service', {
        body: {
          action: 'generateChat',
          messages: recentMessages
        }
      });

      if (error) {
        throw new Error(error.message || 'Error calling AI service');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const aiMessage: Message = {
        type: 'ai',
        content: data.text
      };
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        newMessages[lastIndex] = aiMessage;
        return newMessages;
      });
      
      // Save AI response to database
      await saveChatMessage(aiMessage);
    } catch (error) {
      console.error("Error processing message:", error);
      
      toast({
        title: "AI Response Error",
        description: error instanceof Error 
          ? error.message
          : "Failed to process your message. Please try again.",
        variant: "destructive"
      });
      
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        const errorMessage = error instanceof Error 
          ? error.message
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

  const toggleCodeGenerator = () => {
    setShowCodeGenerator(prev => !prev);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className={`border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 ${showCodeGenerator ? 'bg-primary/10' : ''}`}
            onClick={toggleCodeGenerator}
            title="Code Generator"
          >
            <Code size={18} className="text-primary dark:text-white" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
      
      {showCodeGenerator ? (
        <CodeGenerator />
      ) : (
        <>
          <div className="px-4 pt-4">
            {/* API Key input removed - no longer needed as we're using backend */}
            <p className="text-sm text-gray-500 mb-4 px-1">
              Chat with our AI assistant to get help with your project.
            </p>
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
        </>
      )}
    </div>
  );
};

export default ChatInterface;
