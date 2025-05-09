
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Mic, MicOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import { isSpeechRecognitionSupported } from "@/utils/speechRecognition";

const Index = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase();
        setTranscript(transcriptText);
        
        // Debug the transcript to see exactly what's being recognized
        console.log("Speech recognized:", transcriptText);
        
        // More explicit command detection
        if (transcriptText.includes("create new") || transcriptText.includes("create project")) {
          console.log("Create command detected!");
          handleCommand("create");
        } else if (transcriptText.includes("edit project") || transcriptText.includes("edit")) {
          console.log("Edit command detected!");
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
    console.log(`Handling command: ${command}, User authenticated: ${!!user}`);
    
    if (command === "create" || command === "edit") {
      if (user) {
        // User is authenticated, navigate directly to editor
        toast({
          title: "Command Recognized",
          description: `${command === "create" ? "Creating" : "Editing"} project...`
        });
        // Force stop listening before navigation to prevent memory leaks
        if (recognition && isListening) {
          recognition.stop();
          setIsListening(false);
        }
        console.log("Navigating to /editor");
        navigate("/editor");
      } else {
        // Only redirect to login if user is not authenticated
        toast({
          title: "Authentication Required",
          description: `You need to login before you can ${command === "create" ? "create" : "edit"} a project.`,
          variant: "destructive"
        });
        navigate("/login");
      }
    }
  };
  
  return <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black p-6 md:p-10 transition-colors duration-300">
      <div className="absolute top-6 right-6 flex items-center gap-8">
        <ThemeToggle />
        <UserMenu />
      </div>
      
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-center pt-10 md:pt-12">
        <div className="space-y-6 animate-slide-in">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 tracking-tight dark:text-white">
            Speak2web
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 opacity-90 font-light dark:text-gray-200">
            Voice-Powered Web Creation
          </p>
          <p className="text-lg text-gray-700 opacity-80 max-w-xl dark:text-gray-300">
            Create stunning websites using the power of your voice. Transform your ideas into beautiful, functional web experiences.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button onClick={toggleListening} className={`flex items-center gap-3 px-6 py-6 text-base rounded-xl shadow-md transition-all duration-300 ${isListening ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600' : 'bg-white text-gray-800 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700'}`}>
              {isListening ? <>
                  <MicOff className="h-5 w-5" /> Stop Listening
                </> : <>
                  <Mic className="h-5 w-5" /> Start Voice Commands
                </>}
            </Button>
          </div>
          {isListening && <div className="mt-5 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-300 dark:border-gray-700 shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">I heard: <span className="text-gray-900 dark:text-white font-semibold">{transcript}</span></p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 font-medium">Try saying "Create New" or "Edit Project"</p>
            </div>}
        </div>

        <div className="space-y-6 mt-8 md:mt-10">
          <Card style={{
          animationDelay: "0.2s"
        }} onClick={() => handleCommand("create")} className="p-6 hover-scale bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer animate-fade-in shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">Create New</h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Start a fresh project with voice commands</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <ArrowRight className="h-6 w-6 text-gray-800 dark:text-white" />
              </div>
            </div>
          </Card>

          <Card className={`p-6 hover-scale bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer animate-fade-in shadow-sm ${!user ? 'opacity-70' : ''}`} style={{
          animationDelay: "0.4s"
        }} onClick={() => handleCommand("edit")}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                  Edit Project
                  {!user && <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">(Login required)</span>}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Continue working on existing projects</p>
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                <ArrowRight className="h-6 w-6 text-gray-800 dark:text-white" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <footer className="mt-10 text-center text-gray-500 dark:text-gray-400 animate-fade-in py-4" style={{
      animationDelay: "0.6s"
    }}>
        <p>Powered by voice recognition technology. <span className="text-gray-600 dark:text-gray-300 font-medium">Speak</span> to create.</p>
        {isSpeechRecognitionSupported() && (
          <p className="mt-2 text-xs">Use voice commands to navigate and create content</p>
        )}
      </footer>
    </div>;
};

export default Index;
