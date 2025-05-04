
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { ContinuousVoiceRecognition, isSpeechRecognitionSupported } from "@/utils/speechRecognition";

interface InputAreaProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  isListening: boolean;
  toggleListening: () => void;
  handleSend: () => void;
  isProcessing?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({
  inputValue,
  setInputValue,
  isListening,
  toggleListening,
  handleSend,
  isProcessing = false
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<ContinuousVoiceRecognition | null>(null);
  
  useEffect(() => {
    // Initialize the continuous voice recognition
    if (isSpeechRecognitionSupported() && !recognitionRef.current) {
      recognitionRef.current = new ContinuousVoiceRecognition((transcript) => {
        setInputValue(transcript);
      });
    }
    
    return () => {
      // Clean up on component unmount
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [setInputValue]);
  
  // Effect to start/stop voice recognition based on isListening state
  useEffect(() => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.start();
    } else {
      recognitionRef.current.pause();
    }
  }, [isListening]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      
      // Clear transcript after sending
      if (recognitionRef.current) {
        recognitionRef.current.clearTranscript();
      }
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
          placeholder={isListening ? "Voice recognition active - speak your prompt..." : isProcessing ? "Waiting for response..." : "Type your message..."} 
          rows={3}
          disabled={isProcessing}
        />
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button 
            onClick={toggleListening} 
            size="icon" 
            variant="outline" 
            className={`${isListening ? 'bg-red-600 text-white border-0 dark:bg-red-500' : 'bg-white text-gray-700 border border-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500'} hover:bg-opacity-90 rounded-xl h-10 w-10`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={(!inputValue.trim() && !isListening) || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white rounded-xl h-10 w-10 transition-colors border dark:border-gray-300"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
      {isListening && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center justify-center p-1 animate-pulse">
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full"></div>
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full animate-bounce delay-75"></div>
            <div className="w-2 h-2 mx-1 bg-red-500 rounded-full animate-bounce delay-150"></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Voice recognition active - speak your prompt...</p>
        </div>
      )}
    </div>
  );
};

export default InputArea;
