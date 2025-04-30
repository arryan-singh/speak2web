
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ProjectPreview from "@/components/project-editor/ProjectPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CodeGenerator from "@/components/project-editor/CodeGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ApiKeyInput from "@/components/project-editor/ApiKeyInput";

const ProjectEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Check if a Gemini API key is stored in the database
  useEffect(() => {
    async function checkApiKey() {
      if (user) {
        try {
          // Check if there's a Gemini API key in the database
          const { data, error } = await supabase
            .from('api_keys')
            .select('key_value')
            .eq('service_name', 'gemini')
            .maybeSingle();
            
          if (error) {
            console.error("Error checking API key:", error);
            setIsApiKeyConfigured(false);
            toast({
              title: "Error Checking Configuration",
              description: "Could not verify AI service configuration. Some features may be limited.",
              variant: "destructive"
            });
            return;
          }
          
          const hasApiKey = !!data?.key_value;
          setIsApiKeyConfigured(hasApiKey);
          
          if (!hasApiKey) {
            setShowApiKeyInput(true);
            toast({
              title: "API Key Required",
              description: "Please configure your Gemini API key to use the Code Generator",
              variant: "default"
            });
          }
        } catch (error) {
          console.error("Exception checking API key:", error);
          setIsApiKeyConfigured(false);
        }
      }
    }
    
    checkApiKey();
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to access the project editor",
        variant: "destructive"
      });
      navigate("/login");
    }
  }, [user, navigate]);

  // If not authenticated, don't render the editor
  if (!user) {
    return null;
  }

  const handleApiKeyChange = (isValid: boolean) => {
    setIsApiKeyConfigured(isValid);
    if (isValid) {
      setShowApiKeyInput(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900 text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-primary dark:text-white">Code Generator</h2>
            </div>
            
            {showApiKeyInput ? (
              <div className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Setup API Key</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-gray-500">
                      To use the Code Generator, you need to provide a valid Gemini API key.
                      Your key will be stored securely in the backend.
                    </p>
                    <ApiKeyInput 
                      label="Gemini API Key" 
                      placeholder="Enter your Gemini API key"
                      onApiKeyChange={handleApiKeyChange}
                    />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <CodeGenerator />
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <ProjectPreview />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ProjectEditor;
