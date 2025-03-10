
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send } from "lucide-react";

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
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
      <div className="relative">
        <textarea 
          value={inputValue} 
          onChange={e => setInputValue(e.target.value)} 
          onKeyDown={handleKeyPress} 
          className="w-full p-4 pr-24 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all" 
          placeholder="Type your message..." 
          rows={3}
          disabled={isProcessing}
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button 
            onClick={toggleListening} 
            size="icon" 
            variant="outline" 
            className={`${isListening ? 'bg-primary-dark text-white border-0 dark:bg-blue-600' : 'bg-white text-primary border border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600'} hover:bg-opacity-90 rounded-xl h-10 w-10`}
            disabled={isProcessing}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!inputValue.trim() || isProcessing}
            className="bg-primary hover:bg-primary-dark text-white dark:bg-blue-600 dark:hover:bg-blue-700 rounded-xl h-10 w-10 transition-colors"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
