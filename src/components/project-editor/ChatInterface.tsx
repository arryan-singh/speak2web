
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import MessageList from "./MessageList";
import InputArea from "./InputArea";

export type Message = {
  type: 'user' | 'ai';
  content: string;
  isProcessing?: boolean;
};

const ChatInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { type: 'ai', content: 'Hi! I\'m your AI assistant. How can I help with your project today?' }
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle scrolling to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSend = (content = inputValue) => {
    if (!content.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { type: 'user', content }]);
    setInputValue("");
    
    // Simulate AI processing
    setMessages(prev => [...prev, { type: 'ai', content: '', isProcessing: true }]);
    
    // Simulate AI response (in real app, this would be an API call)
    setTimeout(() => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        // Replace processing message with actual response
        newMessages[lastIndex] = { 
          type: 'ai', 
          content: `I'm processing your request: "${content}". This is a placeholder response that would normally come from your AI backend.`
        };
        
        return newMessages;
      });
    }, 1500);
  };

  return (
    <div className="w-1/4 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-background">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="icon" className="border-gray-200 dark:border-gray-700 text-primary hover:bg-gray-50 dark:hover:bg-gray-800">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h2 className="text-xl font-semibold text-primary dark:text-white">Project Assistant</h2>
        </div>
        <ThemeToggle />
      </div>
      
      <MessageList 
        messages={messages} 
        messagesEndRef={messagesEndRef} 
      />
      
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
        handleSend={handleSend}
      />
    </div>
  );
};

export default ChatInterface;
