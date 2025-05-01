
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Key } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKeySetupProps {
  onKeyConfigured: () => void;
}

const ApiKeySetup: React.FC<ApiKeySetupProps> = ({ onKeyConfigured }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Check if the key already exists
      const { data: existingKey, error: checkError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('service_name', 'gemini')
        .maybeSingle();
        
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      let result;
      
      if (existingKey) {
        // Update existing key
        result = await supabase
          .from('api_keys')
          .update({ key_value: apiKey })
          .eq('id', existingKey.id)
          .eq('service_name', 'gemini');
      } else {
        // Insert new key
        result = await supabase
          .from('api_keys')
          .insert({
            service_name: 'gemini',
            key_value: apiKey,
            user_id: user?.id || ''
          });
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      toast({
        title: "API Key Saved",
        description: "Your Gemini API key has been securely stored"
      });
      
      onKeyConfigured();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error Saving API Key",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-primary" />
          <CardTitle>Gemini API Key Setup</CardTitle>
        </div>
        <CardDescription>
          Configure your Gemini API key to enable AI-powered code generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You need a valid Gemini API key to use the Code Generator feature. 
              Your key will be stored securely and used only for code generation requests.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You can get a free API key from the{" "}
              <a 
                href="https://makersuite.google.com/app/apikey"
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>.
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type="password"
              placeholder="Enter your Gemini API key"
              className="flex-grow"
            />
            <Button 
              onClick={handleSaveApiKey} 
              disabled={isSaving || !apiKey.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : 'Save Key'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeySetup;
