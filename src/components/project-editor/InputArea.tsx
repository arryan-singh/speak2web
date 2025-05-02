
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";

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
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onKeyDown={handleKeyPress} 
          className="w-full p-4 pr-28 border border-gray-300 dark:border-gray-500 rounded-xl bg-white dark:bg-gray-700 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all" 
          placeholder={isProcessing ? "Waiting for response..." : "Type your message..."} 
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
            disabled={!inputValue.trim() || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl h-10 w-10 transition-colors border dark:border-blue-400"
          >
            {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
