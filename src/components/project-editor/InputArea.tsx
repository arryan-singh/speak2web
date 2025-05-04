
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isListening: boolean;
  toggleListening: () => void;
  handleSend: () => void;
  isProcessing?: boolean;
  activateVoiceInput?: boolean;
  onVoiceInputComplete?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  setInputValue,
  isListening,
  toggleListening,
  handleSend,
  isProcessing = false,
  activateVoiceInput = false,
  onVoiceInputComplete
}) => {
  const [voiceActivated, setVoiceActivated] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (activateVoiceInput && !voiceActivated && !isProcessing && !isListening) {
      setVoiceActivated(true);
      startVoiceInput();
    }
  }, [activateVoiceInput, isProcessing, isListening]);
  
  const startVoiceInput = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      let finalTranscript = '';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript = transcript;
          }
        }
        
        setInputValue(finalTranscript + interimTranscript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setVoiceActivated(false);
        toast({
          title: "Speech Recognition Error",
          description: `Error: ${event.error}. Please try again.`,
          variant: "destructive"
        });
        if (onVoiceInputComplete) onVoiceInputComplete();
      };
      
      recognition.onend = () => {
        setVoiceActivated(false);
        if (onVoiceInputComplete) onVoiceInputComplete();
        
        // If we got a meaningful transcript, focus the textarea for editing
        if (finalTranscript.trim()) {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
          
          toast({
            title: "Voice Input Complete",
            description: "You can now edit or send your message."
          });
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
      toast({
        title: "Voice Input Activated",
        description: "Speak now to create your prompt..."
      });
    } else {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive"
      });
      setVoiceActivated(false);
      if (onVoiceInputComplete) onVoiceInputComplete();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="p-5 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
      <div className="relative">
        <textarea 
          ref={textareaRef}
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onKeyDown={handleKeyPress} 
          className="w-full p-4 pr-28 border border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
          placeholder={voiceActivated ? "Listening..." : isProcessing ? "Waiting for response..." : "Type your message..."} 
          rows={3}
          disabled={isProcessing || voiceActivated}
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button 
            onClick={toggleListening} 
            size="icon" 
            variant="outline" 
            className={`${isListening ? 'bg-red-600 text-white border-0 dark:bg-red-500' : 'bg-white text-gray-700 border border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500'} hover:bg-opacity-90 rounded-xl h-10 w-10`}
            disabled={isProcessing || voiceActivated}
          >
            {isListening || voiceActivated ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={(!inputValue.trim() && !isListening) || isProcessing || voiceActivated}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white rounded-xl h-10 w-10 transition-colors border dark:border-gray-300"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
      {voiceActivated && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center justify-center p-1 animate-pulse">
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full animate-bounce delay-150"></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Listening for your voice prompt...</p>
        </div>
      )}
    </div>
  );
};

export default InputArea;
