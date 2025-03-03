
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Send, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

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
    <div className="flex h-screen bg-[#FDF0D5] overflow-hidden">
      {/* Left Section - Chat Interface (1/4 width) */}
      <div className="w-1/4 flex flex-col border-r border-[#780000]/20 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/">
            <Button variant="outline" size="icon" className="border-[#780000] text-[#780000]">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <h2 className="text-xl font-bold text-[#780000]">Project Assistant</h2>
        </div>
        
        {/* Messages container */}
        <div className="flex-grow overflow-y-auto pr-2 mb-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`${message.type === 'user' ? 'ml-auto bg-[#780000] text-white' : 'bg-white text-[#780000]'} p-3 rounded-lg max-w-[85%] shadow-sm`}>
                {message.isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#C1121F] rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-[#C1121F] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-[#C1121F] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
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
          <div className="mb-2 p-2 bg-white/70 rounded-md border border-[#780000]/30 text-sm text-[#C1121F]">
            {transcript}
          </div>
        )}
        
        {/* Input area */}
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-3 pr-20 border border-[#780000]/30 rounded-md bg-white/90 resize-none focus:outline-none focus:ring-1 focus:ring-[#780000]"
            placeholder="Type your message..."
            rows={3}
          />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <Button 
              onClick={toggleListening} 
              size="icon"
              className={`${isListening ? 'bg-[#C1121F]' : 'bg-[#FDF0D5] text-[#780000] border border-[#780000]'} hover:bg-opacity-90`}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
            <Button
              onClick={() => handleSend()}
              size="icon"
              disabled={!inputValue.trim()}
              className="bg-[#780000] hover:bg-opacity-90"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Right Section - Project Preview (3/4 width) */}
      <div className="w-3/4 bg-white p-6 overflow-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#780000]">Project Preview</h1>
          <p className="text-[#C1121F]">Real-time preview of your project</p>
        </div>
        
        {/* Preview area */}
        <div className="bg-gray-100 rounded-lg border border-gray-200 h-[calc(100%-80px)] flex items-center justify-center">
          <div className="text-center p-8">
            <h3 className="text-xl font-medium text-[#780000] mb-2">Preview Area</h3>
            <p className="text-gray-600 mb-4">Your project changes will appear here in real-time</p>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <Card className="p-4 hover-scale">
                <h4 className="font-medium text-[#780000]">Project Structure</h4>
                <p className="text-sm text-[#C1121F] mt-1">Core components</p>
              </Card>
              <Card className="p-4 hover-scale">
                <h4 className="font-medium text-[#780000]">Assets</h4>
                <p className="text-sm text-[#C1121F] mt-1">Media files</p>
              </Card>
              <Card className="p-4 hover-scale">
                <h4 className="font-medium text-[#780000]">Styling</h4>
                <p className="text-sm text-[#C1121F] mt-1">CSS & themes</p>
              </Card>
              <Card className="p-4 hover-scale">
                <h4 className="font-medium text-[#780000]">Logic</h4>
                <p className="text-sm text-[#C1121F] mt-1">Code & functions</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectEditor;
