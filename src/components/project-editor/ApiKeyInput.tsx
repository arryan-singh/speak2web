
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  initialApiKey?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, initialApiKey = "" }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [savedKey, setSavedKey] = useState<string | null>(initialApiKey || null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // Check if API key is stored in localStorage on component mount
  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_api_key");
    if (storedKey) {
      setSavedKey(storedKey);
      onApiKeySet(storedKey);
    } else {
      setIsVisible(true); // Only show the form if there's no saved key
    }
  }, [onApiKeySet]);

  // Also update if initialApiKey changes
  useEffect(() => {
    if (initialApiKey && !savedKey) {
      setSavedKey(initialApiKey);
      setIsVisible(false);
    }
  }, [initialApiKey, savedKey]);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      // Store API key in localStorage
      localStorage.setItem("gemini_api_key", apiKey);
      setSavedKey(apiKey);
      onApiKeySet(apiKey);
      setIsVisible(false); // Hide the form after saving
      
      toast({
        title: "Success",
        description: "Gemini API key saved",
      });

      // Clear input field after saving
      setApiKey("");
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearApiKey = () => {
    try {
      localStorage.removeItem("gemini_api_key");
      setSavedKey(null);
      onApiKeySet("");
      setIsVisible(true); // Show the form again after clearing
      
      toast({
        title: "Success",
        description: "Gemini API key removed",
      });
    } catch (error) {
      console.error("Error clearing API key:", error);
      toast({
        title: "Error",
        description: "Failed to clear API key. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-white dark:bg-gray-800">
      {savedKey && !isVisible ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-primary dark:text-white">Gemini API Configuration</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleVisibility}
            >
              {isVisible ? "Hide" : "Configure"}
            </Button>
          </div>
          {!isVisible && (
            <p className="text-sm text-green-600 dark:text-green-400">
              API key is configured and ready to use ✓
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-primary dark:text-white">Gemini API Configuration</h3>
            {savedKey && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleVisibility}
              >
                {isVisible ? "Hide" : "Configure"}
              </Button>
            )}
          </div>
          
          {isVisible && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {savedKey ? "Manage your Gemini API key" : "Please enter your Gemini API key to enable AI responses"}
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
              {savedKey && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleClearApiKey}
                  className="mt-2"
                >
                  Clear API Key
                </Button>
              )}
            </>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Note: Your API key is stored in your browser's local storage.
      </p>
    </div>
  );
};

export default ApiKeyInput;
