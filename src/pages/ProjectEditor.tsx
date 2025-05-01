
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ProjectPreview from "@/components/project-editor/ProjectPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import CodeGenerator from "@/components/project-editor/CodeGenerator";
import { supabase } from "@/integrations/supabase/client";
import ApiKeySetup from "@/components/project-editor/ApiKeySetup";

const ProjectEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if a Gemini API key is stored in the database
  useEffect(() => {
    const checkApiKey = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('service_name', 'gemini')
          .maybeSingle();
        
        if (error) {
          console.error("Error checking API key:", error);
          throw error;
        }
        
        setIsApiKeyConfigured(!!data?.key_value);
      } catch (error) {
        console.error("Failed to check API key configuration:", error);
        toast({
          title: "Configuration Error",
          description: "Could not verify API key configuration. Please try again later.",
          variant: "destructive"
        });
        setIsApiKeyConfigured(false);
      } finally {
        setIsLoading(false);
      }
    };
    
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

  const handleApiKeyConfigured = () => {
    setIsApiKeyConfigured(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900 text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-900">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-background dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-primary dark:text-white">Code Generator</h2>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-gray-500">Loading configuration...</p>
                </div>
              </div>
            ) : !isApiKeyConfigured ? (
              <div className="p-4 overflow-y-auto">
                <ApiKeySetup onKeyConfigured={handleApiKeyConfigured} />
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
