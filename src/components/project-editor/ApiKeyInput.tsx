
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ApiKeyInputProps {
  label: string;
  placeholder: string;
  onApiKeyChange?: (isValid: boolean) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  label,
  placeholder,
  onApiKeyChange
}) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to save your API key",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Store the API key in the database
      const { error } = await supabase
        .from('api_keys')
        .upsert({
          user_id: user.id,
          service_name: 'gemini',
          key_value: apiKey
        });
      
      if (error) throw error;
      
      toast({
        title: "API Key Saved",
        description: "Your API key has been securely stored"
      });
      
      // Notify parent component that API key is valid
      if (onApiKeyChange) {
        onApiKeyChange(true);
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save your API key",
        variant: "destructive"
      });
      
      // Notify parent component that API key is invalid
      if (onApiKeyChange) {
        onApiKeyChange(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>
        <Input
          type="password"
          placeholder={placeholder}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save API Key"}
      </Button>
    </form>
  );
};

export default ApiKeyInput;
