
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Send, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";

const ProjectEditor = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'ai', content: string, isProcessing?: boolean}>>([
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-text">
      {/* Left Section - Chat Interface (1/4 width) */}
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
        
        {/* Messages container */}
        <div className="flex-grow overflow-y-auto p-4 mb-2 bg-background-darker dark:bg-gray-800">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`${
                  message.type === 'user' 
                    ? 'ml-auto bg-primary text-white dark:bg-blue-600' 
                    : 'bg-white text-primary border border-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600'
                } p-4 rounded-xl max-w-[85%] shadow-sm animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.isProcessing ? (
                  <div className="flex items-center gap-2 p-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Voice transcript display */}
        {isListening && transcript && (
          <div className="mx-4 mb-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-primary/20 dark:border-gray-600 text-sm text-primary dark:text-white shadow-sm">
            {transcript}
          </div>
        )}
        
        {/* Input area */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-background">
          <div className="relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-4 pr-24 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              placeholder="Type your message..."
              rows={3}
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button 
                onClick={toggleListening} 
                size="icon"
                variant="outline"
                className={`${
                  isListening 
                    ? 'bg-primary-dark text-white border-0 dark:bg-blue-600' 
                    : 'bg-white text-primary border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600'
                } hover:bg-opacity-90 rounded-xl h-10 w-10`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
              <Button
                onClick={() => handleSend()}
                size="icon"
                disabled={!inputValue.trim()}
                className="bg-primary hover:bg-primary-dark text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl h-10 w-10 transition-colors"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Project Preview (3/4 width) */}
      <div className="w-3/4 bg-background-darker dark:bg-gray-900 p-8 overflow-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary dark:text-white mb-2">Project Preview</h1>
          <p className="text-accent dark:text-gray-400">Real-time preview of your project</p>
        </div>
        
        {/* Preview area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-[calc(100%-100px)] overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Preview header */}
            <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 p-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-500"></div>
                <div className="flex-1 text-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-300">Preview</span>
                </div>
              </div>
            </div>
            
            {/* Preview content */}
            <div className="flex-1 p-8 overflow-auto">
              <div className="text-center max-w-2xl mx-auto">
                <h3 className="text-2xl font-semibold text-primary dark:text-white mb-4">Project Structure</h3>
                <p className="text-accent dark:text-gray-400 mb-8">Your project changes will appear here in real-time</p>
                
                <div className="grid grid-cols-2 gap-6 mt-8">
                  <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Components</h4>
                    <p className="text-sm text-accent dark:text-gray-400">Core building blocks</p>
                  </Card>
                  <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Assets</h4>
                    <p className="text-sm text-accent dark:text-gray-400">Media & resources</p>
                  </Card>
                  <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Styling</h4>
                    <p className="text-sm text-accent dark:text-gray-400">Design elements</p>
                  </Card>
                  <Card className="p-6 hover-scale border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="font-medium text-primary dark:text-white text-lg mb-2">Logic</h4>
                    <p className="text-sm text-accent dark:text-gray-400">Functional code</p>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
