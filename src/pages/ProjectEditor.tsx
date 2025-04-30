
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import ChatInterface from "@/components/project-editor/ChatInterface";
import ProjectPreview from "@/components/project-editor/ProjectPreview";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ProjectEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean | null>(null);

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
            .eq('user_id', user.id)
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
            toast({
              title: "AI Service Configuration",
              description: "Please configure the AI service to use all features.",
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

  return (
    <div className="flex h-screen overflow-hidden bg-background dark:bg-gray-900 text-text dark:text-white">
      <ResizablePanelGroup direction="horizontal" className="w-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={60}>
          <ChatInterface />
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
