
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { ExternalLink } from "lucide-react";
import { saveGeminiApiKey, getGeminiApiKey } from "@/services/geminiService";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  initialApiKey?: string;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, initialApiKey = "" }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [savedKey, setSavedKey] = useState<string | null>(initialApiKey || null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  // Check if API key is stored in database or localStorage on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      setIsLoading(true);
      
      // Try to get API key from database first if user is logged in
      if (user) {
        try {
          const dbKey = await getGeminiApiKey();
          if (dbKey) {
            setSavedKey(dbKey);
            onApiKeySet(dbKey);
            setIsVisible(false);
            // Also store in localStorage for quick access
            localStorage.setItem("gemini_api_key", dbKey);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error fetching API key from database:", error);
        }
      }
      
      // Fallback to localStorage
      const storedKey = localStorage.getItem("gemini_api_key");
      if (storedKey) {
        setSavedKey(storedKey);
        onApiKeySet(storedKey);
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setIsLoading(false);
    };

    checkApiKey();
  }, [user, onApiKeySet]);

  // Also update if initialApiKey changes
  useEffect(() => {
    if (initialApiKey && !savedKey) {
      setSavedKey(initialApiKey);
      setIsVisible(false);
    }
  }, [initialApiKey, savedKey]);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    const success = await saveGeminiApiKey(apiKey);
    if (success) {
      setSavedKey(apiKey);
      onApiKeySet(apiKey);
      setIsVisible(false); // Auto-hide the form after successful submission
      setApiKey("");
      
      // Store in localStorage for non-authenticated users or quicker access
      localStorage.setItem("gemini_api_key", apiKey);
    }
  };

  const handleClearApiKey = async () => {
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

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-white dark:bg-gray-800">
        <div className="text-center text-sm">Loading API configuration...</div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 bg-white dark:bg-gray-800">
      {savedKey && !isVisible ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-primary dark:text-white">Gemini API Configuration</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleVisibility}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
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
                className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:border-gray-600"
              >
                {isVisible ? "Hide" : "Configure"}
              </Button>
            )}
          </div>
          
          {isVisible && (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {savedKey 
                  ? "Manage your Gemini API key" 
                  : "Please enter your Gemini API key to enable AI responses"}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md mb-3">
                <p className="mb-2">
                  <strong>Getting a Gemini API key:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Visit <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center">
                    Google AI Studio <ExternalLink className="ml-1 h-3 w-3" />
                  </a></li>
                  <li>Sign in with your Google account</li>
                  <li>Create a new API key or use an existing one</li>
                  <li>Copy the API key and paste it below</li>
                </ol>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="flex-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <Button 
                  onClick={handleSaveApiKey}
                  className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                >
                  Save
                </Button>
              </div>
              {savedKey && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleClearApiKey}
                  className="mt-2 dark:bg-red-900 dark:hover:bg-red-800"
                >
                  Clear API Key
                </Button>
              )}
            </>
          )}
        </div>
      )}
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {user ? "Your API key is stored securely in your account." : "Your API key is stored in your browser's local storage."}
      </p>
    </div>
  );
};

export default ApiKeyInput;
