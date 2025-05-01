
import React, { useState, useEffect } from 'react';
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
  const [apiKey, setApiKey] = useState('AIzaSyCp6rsTfqntYzJXMWx4D0c47jo-OyWv4ew');
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Auto-save the API key when the component mounts
  useEffect(() => {
    handleSaveApiKey();
  }, []);

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
        title: "API Key Configured",
        description: "The Gemini API key has been securely stored"
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
          Configuring API key for AI-powered code generation...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          {isSaving ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-gray-500">Setting up the API key...</p>
            </div>
          ) : (
            <Button onClick={handleSaveApiKey}>Retry Configuration</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeySetup;
