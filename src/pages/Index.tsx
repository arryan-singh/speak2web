
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const navigate = useNavigate();

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
        const result = event.results[current][0].transcript.toLowerCase();
        setTranscript(result);
        
        if (result.includes("create new") || result.includes("create project")) {
          handleCommand("create");
        } else if (result.includes("edit project") || result.includes("edit")) {
          handleCommand("edit");
        }
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
    if (command === "create" || command === "edit") {
      toast({
        title: "Command Recognized",
        description: `${command === "create" ? "Creating" : "Editing"} project...`
      });
      navigate("/editor");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 p-6 md:p-12">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-slide-in">
          <h1 className="text-5xl md:text-7xl font-bold text-primary tracking-tight">
            Speak2web
          </h1>
          <p className="text-xl md:text-2xl text-accent opacity-90 font-light">
            Voice-Powered Web Creation
          </p>
          <p className="text-lg text-text opacity-80 max-w-xl">
            Create stunning websites using the power of your voice. Transform your ideas into beautiful, functional web experiences.
          </p>
          <div className="mt-8">
            <Button 
              onClick={toggleListening} 
              className={`flex items-center gap-3 px-6 py-6 text-base rounded-xl shadow-md transition-all duration-300 ${
                isListening 
                  ? 'bg-error hover:bg-error/90 text-white' 
                  : 'bg-cream text-primary border-2 border-primary/20 hover:bg-cream/90 hover:border-primary/40'
              }`}
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
              <div className="mt-5 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-primary/10 shadow-sm">
                <p className="text-sm font-medium text-text">I heard: <span className="text-primary font-semibold">{transcript}</span></p>
                <p className="text-xs text-accent mt-2 font-medium">Try saying "Create New" or "Edit Project"</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 mt-8 md:mt-0">
          <Card 
            className="p-8 hover-scale bg-white/90 backdrop-blur border border-primary/10 rounded-xl cursor-pointer animate-fade-in shadow-sm"
            style={{ animationDelay: "0.2s" }}
            onClick={() => handleCommand("create")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-primary mb-2">Create New</h2>
                <p className="text-accent mt-2">Start a fresh project with voice commands</p>
              </div>
              <div className="bg-lavender p-3 rounded-full">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card 
            className="p-8 hover-scale bg-white/90 backdrop-blur border border-primary/10 rounded-xl cursor-pointer animate-fade-in shadow-sm"
            style={{ animationDelay: "0.4s" }}
            onClick={() => handleCommand("edit")}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-primary mb-2">Edit Project</h2>
                <p className="text-accent mt-2">Continue working on existing projects</p>
              </div>
              <div className="bg-lavender p-3 rounded-full">
                <ArrowRight className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <footer className="mt-16 text-center text-text/60 animate-fade-in py-6" style={{ animationDelay: "0.6s" }}>
        <p>Powered by voice recognition technology. <span className="text-accent font-medium">Speak</span> to create.</p>
      </footer>
    </div>
  );
};

export default Index;
