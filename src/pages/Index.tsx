
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current][0].transcript.toLowerCase();
        setTranscript(result);
        
        // Process commands
        if (result.includes("create new") || result.includes("create project")) {
          handleCommand("create");
        } else if (result.includes("edit project") || result.includes("edit")) {
          handleCommand("edit");
        }
      };
      
      recognitionInstance.onerror = (event) => {
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
    
    // Cleanup
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
      toast({
        title: "Voice Recognition Stopped",
        description: "No longer listening for voice commands."
      });
    } else {
      recognition.start();
      setIsListening(true);
      toast({
        title: "Voice Recognition Active",
        description: "Try saying 'Create new' or 'Edit project' to navigate."
      });
    }
  };

  const handleCommand = (command: string) => {
    if (command === "create") {
      toast({
        title: "Command Recognized",
        description: "Creating new project..."
      });
      // Add navigation or action logic here
    } else if (command === "edit") {
      toast({
        title: "Command Recognized",
        description: "Editing project..."
      });
      // Add navigation or action logic here
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF0D5] p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Brand section */}
        <div className="space-y-6 animate-slide-in">
          <h1 className="text-4xl md:text-6xl font-bold text-[#780000]">
            Speak2web
          </h1>
          <p className="text-xl md:text-2xl text-[#C1121F] opacity-90">
            Voice-Powered Web Creation
          </p>
          <p className="text-lg text-[#780000] opacity-80">
            Create stunning websites using the power of your voice. Transform your ideas into beautiful, functional web experiences.
          </p>
          <div className="mt-6">
            <Button 
              onClick={toggleListening} 
              className={`flex items-center gap-2 ${isListening ? 'bg-[#C1121F]' : 'bg-[#780000]'} hover:bg-opacity-90`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-5 w-5" /> Stop Listening
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" /> Start Voice Commands
                </>
              )}
            </Button>
            {isListening && (
              <div className="mt-4 p-3 bg-white/30 backdrop-blur rounded-md border border-[#780000]/20">
                <p className="text-sm text-[#780000] font-medium">I heard: {transcript}</p>
                <p className="text-xs text-[#C1121F] mt-1">Try saying "Create New" or "Edit Project"</p>
              </div>
            )}
          </div>
        </div>

        {/* Right side - Action cards */}
        <div className="space-y-6">
          <Card 
            className="p-6 hover-scale bg-white/80 backdrop-blur border-[#780000]/20 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.2s" }}
            onClick={() => handleCommand("create")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#780000]">Create New</h2>
                <p className="text-[#C1121F] mt-2">Start a fresh project with voice commands</p>
              </div>
              <ArrowRight className="h-6 w-6 text-[#780000]" />
            </div>
          </Card>

          <Card 
            className="p-6 hover-scale bg-white/80 backdrop-blur border-[#780000]/20 cursor-pointer animate-fade-in"
            style={{ animationDelay: "0.4s" }}
            onClick={() => handleCommand("edit")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#780000]">Edit Project</h2>
                <p className="text-[#C1121F] mt-2">Continue working on existing projects</p>
              </div>
              <ArrowRight className="h-6 w-6 text-[#780000]" />
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-[#780000]/60 animate-fade-in" style={{ animationDelay: "0.6s" }}>
        <p>Powered by voice recognition technology. <span className="text-[#C1121F]">Speak</span> to create.</p>
      </footer>
    </div>
  );
};

export default Index;
