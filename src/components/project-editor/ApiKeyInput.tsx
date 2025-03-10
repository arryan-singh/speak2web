
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Check if API key is stored in localStorage on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
      setSavedKey(storedKey);
      onApiKeySet(storedKey);
    }
  }, [onApiKeySet]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    // Store API key in localStorage
    localStorage.setItem("gemini_api_key", apiKey);
    setSavedKey(apiKey);
    onApiKeySet(apiKey);
    
    toast({
      title: "Success",
      description: "Gemini API key saved",
    });

    // Clear input field after saving
    setApiKey("");
  };

  const handleClearApiKey = () => {
    localStorage.removeItem("gemini_api_key");
    setSavedKey(null);
    onApiKeySet("");
    
    toast({
      title: "Success",
      description: "Gemini API key removed",
    });
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-medium mb-2 text-primary dark:text-white">Gemini API Configuration</h3>
      
      {savedKey ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            API key is configured
          </p>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleClearApiKey}
          >
            Clear API Key
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Please enter your Gemini API key to enable AI responses
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="flex-1"
            />
            <Button onClick={handleSaveApiKey}>Save</Button>
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Note: Your API key is stored in your browser's local storage.
        For better security, we recommend connecting to Supabase.
      </p>
    </div>
  );
};

export default ApiKeyInput;
